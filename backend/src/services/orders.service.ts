import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, inArray, count, lte, lt } from 'drizzle-orm';
import { env } from '../config/env';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { emailService } from './email.service';
import { getTierInfo } from '../utils/tiers';

import { discordService } from './discord.service';

export const ordersService = {
  async calculateFinalDiscount(userId: string, total: number, promoCodeData?: any | null, tx?: any) {
    const dbClient = tx || db;
    // Calculate total spent for tier
    const [totalSpentResult] = await dbClient.select({
      total: sql<number>`sum(${schema.orders.total})`
    })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orders.status, 'COMPLETED')
      )
    );
    const totalSpent = Number(totalSpentResult?.total || 0);

    const tier = getTierInfo(totalSpent);
    const tierDiscount = Math.round((total * tier.discount) / 100);

    let promoDiscount = 0;
    if (promoCodeData) {
      if (promoCodeData.minPurchase && total < promoCodeData.minPurchase) {
        throw new BadRequestError(
          `Minimum purchase amount is ${promoCodeData.minPurchase}`
        );
      }

      if (promoCodeData.type === 'PERCENTAGE') {
        promoDiscount = Math.round((total * promoCodeData.discount) / 100 * 100) / 100;
        if (promoCodeData.maxDiscount && promoDiscount > promoCodeData.maxDiscount) {
          promoDiscount = promoCodeData.maxDiscount;
        }
      } else {
        promoDiscount = promoCodeData.discount;
      }
    }

    return {
      tierDiscount,
      promoDiscount,
      totalDiscount: tierDiscount + promoDiscount,
      tier
    };
  },

  async createOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    paymentMethod: any,
    promoCode?: string
  ) {
    let promoCodeData = null;

    if (promoCode) {
      promoCodeData = await db.query.promoCodes.findFirst({
        where: eq(schema.promoCodes.code, promoCode),
      });

      if (!promoCodeData || !promoCodeData.isActive) {
        throw new BadRequestError('Invalid promo code');
      }

      if (promoCodeData.expiresAt && promoCodeData.expiresAt < new Date()) {
        throw new BadRequestError('Promo code has expired');
      }

      if (
        promoCodeData.usageLimit &&
        promoCodeData.usedCount >= promoCodeData.usageLimit
      ) {
        throw new BadRequestError('Promo code usage limit reached');
      }

      // Check if user has already used this promo code
      const usage = await db.query.promoCodeUsages.findFirst({
        where: and(
          eq(schema.promoCodeUsages.userId, userId),
          eq(schema.promoCodeUsages.promoCodeId, promoCodeData.id)
        ),
      });

      if (usage) {
        throw new BadRequestError('คุณได้ใช้คูปองนี้ไปแล้ว');
      }
    }

    const productIdStrings = [...new Set(items.map((item) => item.productId || (item as any).id).filter((id): id is string => !!id && id !== 'undefined'))];
    
    console.log('[OrdersService] Items payload:', JSON.stringify(items, null, 2));
    console.log('[OrdersService] Unique Product IDs to find:', productIdStrings);

    if (productIdStrings.length === 0) {
      throw new BadRequestError('No valid products in order');
    }

    const productsResult = await db.query.products.findMany({
      where: inArray(schema.products.id, productIdStrings),
    });

    console.log('[OrdersService] Products found in DB:', productsResult.length);
    console.log('[OrdersService] Products details:', JSON.stringify(productsResult.map(p => ({ id: p.id, name: p.name })), null, 2));

    // CRITICAL: Compare products found with UNIQUE IDs requested
    if (productsResult.length !== productIdStrings.length) {
      const foundIds = productsResult.map(p => p.id);
      const missingIds = productIdStrings.filter(id => !foundIds.includes(id));
      console.error('[OrdersService] Missing Product IDs:', missingIds);
      throw new BadRequestError(`Some products not found: ${missingIds.join(', ')}`);
    }

    const orderItemsData = items.map((item) => {
      const productId = item.productId || (item as any).id;
      const product = productsResult.find((p) => p.id === productId);
      if (!product) {
        throw new BadRequestError(`Product ${productId} not found`);
      }

      if (product.stock !== -1 && product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.name}`);
      }

      const now = new Date();
      const isFlashSaleActive = product.isFlashSale && 
                                product.flashSalePrice && 
                                product.flashSaleEnds && 
                                product.flashSaleEnds > now;

      const price = isFlashSaleActive
        ? product.flashSalePrice as number
        : product.price;

      return {
        productId: product.id,
        quantity: item.quantity,
        price,
      };
    });

    const totalAmount = orderItemsData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return await db.transaction(async (tx) => {
      const { totalDiscount } = await this.calculateFinalDiscount(userId, totalAmount, promoCodeData, tx);

      // Re-validate Promo Code inside transaction to prevent race conditions
      if (promoCode) {
        const promo = await tx.query.promoCodes.findFirst({
          where: eq(schema.promoCodes.code, promoCode),
        });

        if (!promo || !promo.isActive) {
          throw new BadRequestError('Invalid promo code');
        }

        if (promo.expiresAt && promo.expiresAt < new Date()) {
          throw new BadRequestError('Promo code has expired');
        }

        // Check user usage
        const usage = await tx.query.promoCodeUsages.findFirst({
          where: and(
            eq(schema.promoCodeUsages.userId, userId),
            eq(schema.promoCodeUsages.promoCodeId, promo.id)
          )
        });

        if (usage) {
          throw new BadRequestError('คุณได้ใช้คูปองนี้ไปแล้ว');
        }

        // Atomic usage limit check
        if (promo.usageLimit) {
          const updateResult = await tx.update(schema.promoCodes)
            .set({ usedCount: sql`${schema.promoCodes.usedCount} + 1` })
            .where(
              and(
                eq(schema.promoCodes.id, promo.id),
                lt(schema.promoCodes.usedCount, promo.usageLimit)
              )
            )
            .returning();

          if (updateResult.length === 0) {
            throw new BadRequestError('Promo code usage limit reached');
          }
        } else {
          await tx.update(schema.promoCodes)
            .set({ usedCount: sql`${schema.promoCodes.usedCount} + 1` })
            .where(eq(schema.promoCodes.id, promo.id));
        }
      }

      const [order] = await tx.insert(schema.orders)
        .values({
          userId,
          total: totalAmount - totalDiscount,
          discount: totalDiscount,
          promoCode: promoCode || null,
          status: 'PENDING',
          paymentMethod,
        })
        .returning();

      if (!order) throw new Error('Failed to create order');

      // Insert order items
      await tx.insert(schema.orderItems)
        .values(orderItemsData.map(item => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })));

      // Return order with items and products for response
      const finalOrder = await tx.query.orders.findFirst({
        where: eq(schema.orders.id, order.id),
        with: {
          items: {
            with: {
              product: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                  category: true,
                  images: true,
                  version: true,
                },
              },
            },
          },
        },
      });

      return finalOrder;
    });
  },

  async getOrderById(orderId: string, userId?: string) {
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: {
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                images: true,
                category: true,
                version: true,
              },
            },
          },
        },
        licenses: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                category: true,
                version: true,
              }
            }
          }
        },
        user: {
          columns: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (userId && order.userId !== userId) {
      throw new BadRequestError('Unauthorized access to order');
    }

    return order;
  },

  async getUserOrders(userId: string) {
    const ordersData = await db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      with: {
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                images: true,
                category: true,
                version: true,
              },
            },
          },
        },
      },
      orderBy: [desc(schema.orders.createdAt)],
    });

    return ordersData;
  },

  async cancelOrder(orderId: string, userId: string) {
    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.userId !== userId) {
        throw new BadRequestError('Unauthorized');
      }

      if (order.status !== 'PENDING') {
        throw new BadRequestError('Cannot cancel order with status: ' + order.status);
      }

      // Use update with status check for atomic status change
      const updateResult = await tx.update(schema.orders)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(
          and(
            eq(schema.orders.id, orderId),
            eq(schema.orders.status, 'PENDING')
          )
        )
        .returning();

      if (updateResult.length === 0) {
        throw new BadRequestError('Order was already processed or cancelled');
      }

      const updatedOrder = updateResult[0];

      if (order.paymentMethod === 'BALANCE') {
        await tx.update(schema.users)
          .set({ 
            balance: sql`${schema.users.balance} + ${order.total}`,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, userId));

        await tx.insert(schema.transactions).values({
          userId,
          type: 'REFUND',
          amount: order.total,
          status: 'COMPLETED',
          paymentRef: orderId,
        });
      }

      return updatedOrder;
    });
  },

  async payWithBalance(userId: string, orderId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get order and user balance with lock
      const order = await tx.query.orders.findFirst({
        where: and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.userId, userId)
        ),
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new BadRequestError('Order is already processed');
      }

      const user = await tx.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.balance < order.total) {
        throw new BadRequestError('Insufficient balance');
      }

      // 2. Deduct balance
      await tx.update(schema.users)
        .set({ 
          balance: sql`${schema.users.balance} - ${order.total}`,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, userId));

      // 3. Update order status to PROCESSING
      await tx.update(schema.orders)
        .set({ 
          status: 'PROCESSING',
          paymentMethod: 'BALANCE',
          updatedAt: new Date()
        })
        .where(eq(schema.orders.id, orderId));

      // 4. Record transaction
      await tx.insert(schema.transactions).values({
        userId,
        type: 'PURCHASE',
        amount: -order.total,
        status: 'COMPLETED',
        paymentRef: orderId,
        paymentMethod: 'BALANCE',
      });

      // 5. Complete the order (grant licenses, etc.)
      return await this.completeOrder(orderId, tx);
    });
  },

  async completeOrder(orderId: string, transactionClient?: any) {
    const executeLogic = async (tx: any) => {
      const order = await tx.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
        with: {
          items: {
            with: {
              product: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                  category: true,
                  images: true,
                  version: true,
                  downloadFileKey: true,
                  downloadKey: true, // Fallback for email delivery
                  rewardPoints: true,
                  stock: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
        // Remove downloadKey before returning if already completed
        const safeOrder = {
          ...order,
          items: order.items.map((item: any) => ({
            ...item,
            product: { ...item.product, downloadKey: undefined }
          }))
        };
        return { order: safeOrder, alreadyCompleted: true };
      }

      // Atomic status update to prevent double-processing
      const updateResult = await tx.update(schema.orders)
        .set({ status: 'COMPLETED', updatedAt: new Date() })
        .where(
          and(
            eq(schema.orders.id, orderId),
            inArray(schema.orders.status, ['PENDING', 'PROCESSING'])
          )
        )
        .returning();

      if (updateResult.length === 0) {
        // Someone else got there first
        const freshOrder = await tx.query.orders.findFirst({
          where: eq(schema.orders.id, orderId),
          with: { items: { with: { product: true } } }
        });
        return { 
          order: {
            ...freshOrder,
            items: freshOrder?.items.map((item: any) => ({
              ...item,
              product: { ...item.product, downloadKey: undefined }
            }))
          }, 
          alreadyCompleted: true 
        };
      }

      // Update the local order object for logic below, but keep downloadKey for email
      order.status = 'COMPLETED';

      // Record promo code usage if a promo code was used
      if (order.promoCode) {
        const promo = await tx.query.promoCodes.findFirst({
          where: eq(schema.promoCodes.code, order.promoCode),
        });

        if (promo) {
          await tx.insert(schema.promoCodeUsages).values({
            userId: order.userId,
            promoCodeId: promo.id,
            orderId: order.id,
          });
        }
      }

      // Calculate earned points based on per-product rewardPoints only
      let pointsEarned = 0;
      console.log(`[OrdersService] Calculating points for order ${order.id}. Items count: ${order.items.length}`);
      
      for (const item of order.items) {
        if (item.product.rewardPoints !== null && item.product.rewardPoints !== undefined && item.product.rewardPoints > 0) {
          const itemPoints = item.product.rewardPoints * item.quantity;
          console.log(`[OrdersService] Item ${item.product.name}: Using fixed rewardPoints ${item.product.rewardPoints} x ${item.quantity} = ${itemPoints}`);
          pointsEarned += itemPoints;
        }
      }

      console.log(`[OrdersService] Total points to award: ${pointsEarned}`);
      
      if (pointsEarned > 0) {
        console.log(`[OrdersService] Awarding ${pointsEarned} points to user ${order.userId}`);
        await tx.update(schema.users)
          .set({ 
            points: sql`${schema.users.points} + ${pointsEarned}`,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, order.userId));

        // Record point earning transaction
        await tx.insert(schema.transactions).values({
          userId: order.userId,
          type: 'POINTS_EARNED',
          amount: 0,
          bonus: 0,
          points: pointsEarned,
          status: 'COMPLETED',
          paymentRef: order.id,
          paymentMethod: order.paymentMethod,
        });

        // Add a notification for points earned
        await tx.insert(schema.notifications).values({
          userId: order.userId,
          title: 'ได้รับแต้มสะสมใหม่!',
          message: `คุณได้รับแต้มสะสมจำนวน ${pointsEarned.toLocaleString()} แต้ม จากคำสั่งซื้อ #${order.id.substring(0, 8)}`,
          type: 'SYSTEM',
        });
      } else {
        console.log(`[OrdersService] No points to award for order ${order.id}`);
      }

      const { generateLicenseKey } = await import('../utils/license-generator');
      const createdLicenses = [];

      for (const item of order.items) {
        // Atomic stock decrement with check
        if (item.product.stock !== -1) {
          const updatedProduct = await tx.update(schema.products)
            .set({ 
              stock: sql`${schema.products.stock} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(schema.products.id, item.productId),
                sql`${schema.products.stock} >= ${item.quantity}`
              )
            )
            .returning();

          if (updatedProduct.length === 0) {
            throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
          }
        }

        // Generate multiple licenses if quantity > 1
        for (let i = 0; i < item.quantity; i++) {
          const licenseKey = generateLicenseKey();

          const [license] = await tx.insert(schema.licenses)
            .values({
              userId: order.userId,
              productId: item.productId,
              orderId,
              licenseKey,
              status: 'ACTIVE',
            })
            .returning();

          createdLicenses.push({
            ...license,
            productName: item.product.name,
            downloadKey: item.product.downloadFileKey || item.product.downloadKey
          });

          await tx.insert(schema.notifications).values({
            userId: order.userId,
            title: 'Order Completed',
            message: `Your order for ${item.product.name} has been completed.`,
            type: 'ORDER',
          });
        }
      }

      // Final order object for returning (with download keys removed)
      const safeOrder = {
        ...order,
        items: order.items.map((item: any) => ({
          ...item,
          product: { 
            ...item.product, 
            downloadKey: undefined,
            downloadFileKey: undefined
          }
        }))
      };

      return { order: safeOrder, emailOrder: order, createdLicenses, alreadyCompleted: false };
    };

    const result = transactionClient 
      ? await executeLogic(transactionClient)
      : await db.transaction(executeLogic);

    if (result.alreadyCompleted || !result.order) return result.order;

    // Notify via Discord
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, result.order.userId) });
    if (user) {
      discordService.notifyNewOrder(result.emailOrder, user).catch(err => console.error('[DISCORD] Failed to send order notification:', err));
    }

    // Send emails outside of transaction
    if (user && user.email) {
      // 1. Send order confirmation
      emailService.sendOrderConfirmation(user.email, {
        orderId: result.order.id,
        total: result.order.total,
        items: result.emailOrder.items.map((item: any) => ({
          name: item.product.name,
          price: item.price,
          quantity: item.quantity
        })),
      }).catch(err => console.error('[EMAIL] Failed to send order confirmation:', err));

      // 2. Send individual license keys
      const createdLicenses = result.createdLicenses || [];
      for (const license of createdLicenses) {
        emailService.sendLicenseKey(user.email, {
          productName: license.productName,
          licenseKey: license.licenseKey,
          downloadUrl: license.downloadKey ? `${env.API_URL}/api/licenses/${license.id}/download` : undefined
        }).catch(err => console.error('[EMAIL] Failed to send license key:', err));
      }
    }

    return result.order;
  },
};
