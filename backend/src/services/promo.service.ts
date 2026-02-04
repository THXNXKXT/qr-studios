import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, lt, or } from 'drizzle-orm';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { trackedQuery, logger as baseLogger } from '../utils';

const logger = baseLogger.child('[PromoService]');

class PromoService {
  private logger = logger;

  async validatePromoCode(code: string, cartTotal: number, userId?: string) {
    const promo = await trackedQuery(async () => {
      return await db.query.promoCodes.findFirst({
        where: eq(schema.promoCodes.code, code.toUpperCase()),
      });
    }, 'promo.validatePromoCode.findPromo');

    if (!promo) {
      throw new NotFoundError('Promo code not found');
    }

    if (!promo.isActive) {
      throw new BadRequestError('Promo code is not active');
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestError('Promo code has expired');
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestError('Promo code usage limit reached');
    }

    // Check if user has already used this promo code
    if (userId) {
      const usage = await trackedQuery(async () => {
        return await db.query.promoCodeUsages.findFirst({
          where: and(
            eq(schema.promoCodeUsages.userId, userId),
            eq(schema.promoCodeUsages.promoCodeId, promo.id)
          ),
        });
      }, 'promo.validatePromoCode.checkUsage');

      if (usage) {
        throw new BadRequestError('You have already used this promo code');
      }
    }

    if (promo.minPurchase && cartTotal < promo.minPurchase) {
      throw new BadRequestError(
        `Minimum purchase amount is ฿${promo.minPurchase}`
      );
    }

    let discount = 0;
    if (promo.type === 'PERCENTAGE') {
      discount = Math.round((cartTotal * promo.discount) / 100 * 100) / 100;
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      discount = promo.discount;
    }

    return {
      valid: true,
      id: promo.id,
      code: promo.code,
      discount: promo.discount,
      type: promo.type.toLowerCase(),
      maxDiscount: promo.maxDiscount,
      minPurchase: promo.minPurchase,
      message: `Promo code ${promo.code} applied successfully`,
    };
  }

  async applyPromoCode(code: string, orderId: string, userId: string) {
    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
        with: {
          items: {
            with: {
              product: {
                columns: {
                  id: true,
                  price: true,
                }
              }
            }
          }
        }
      });

      if (!order || order.userId !== userId) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new BadRequestError('Cannot apply promo code to a non-pending order');
      }

      if (order.promoCode) {
        throw new BadRequestError('Promo code already applied to this order');
      }

      // Calculate subtotal from items
      const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      // Use the transaction client for validation too
      const promo = await tx.query.promoCodes.findFirst({
        where: eq(schema.promoCodes.code, code.toUpperCase()),
      });

      if (!promo) throw new NotFoundError('Promo code not found');
      if (!promo.isActive) throw new BadRequestError('Promo code is not active');
      if (promo.expiresAt && promo.expiresAt < new Date()) throw new BadRequestError('Promo code has expired');
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit) throw new BadRequestError('Promo code usage limit reached');

      // Check usage for this specific user
      const usage = await tx.query.promoCodeUsages.findFirst({
        where: and(
          eq(schema.promoCodeUsages.userId, order.userId),
          eq(schema.promoCodeUsages.promoCodeId, promo.id)
        )
      });
      if (usage) throw new BadRequestError('You have already used this promo code');

      if (promo.minPurchase && subtotal < promo.minPurchase) {
        throw new BadRequestError(`Minimum purchase amount is ฿${promo.minPurchase}`);
      }

      // Calculate actual discount amount
      let discountAmount = 0;
      if (promo.type === 'PERCENTAGE') {
        discountAmount = Math.round((subtotal * promo.discount) / 100 * 100) / 100;
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
          discountAmount = promo.maxDiscount;
        }
      } else {
        discountAmount = promo.discount;
      }

      // 1. Update Order
      await tx.update(schema.orders)
        .set({
          promoCode: code.toUpperCase(),
          discount: discountAmount,
          total: subtotal - discountAmount,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId));

      // 2. Increment usage count atomically
      const updatedPromo = await tx.update(schema.promoCodes)
        .set({ usedCount: sql`${schema.promoCodes.usedCount} + 1` })
        .where(
          and(
            eq(schema.promoCodes.id, promo.id),
            or(
              sql`${schema.promoCodes.usageLimit} IS NULL`,
              lt(schema.promoCodes.usedCount, schema.promoCodes.usageLimit)
            )
          )
        )
        .returning();

      if (updatedPromo.length === 0) {
        throw new BadRequestError('Promo code usage limit reached');
      }

      // 3. Record usage
      await tx.insert(schema.promoCodeUsages).values({
        userId: order.userId,
        promoCodeId: promo.id,
        orderId: order.id,
      });

      return {
        valid: true,
        code: promo.code,
        discount: promo.discount,
        type: promo.type.toLowerCase(),
        absoluteDiscount: discountAmount
      };
    });
  }
}

export const promoService = new PromoService();
