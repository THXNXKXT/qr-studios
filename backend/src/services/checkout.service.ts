import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import stripe from '../config/stripe';
import { env } from '../config/env';
import { ordersService } from './orders.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { trackedQuery, logger as baseLogger } from '../utils';

const logger = baseLogger.child('[CheckoutService]');

class CheckoutService {
  private logger = logger;

  async createStripeCheckoutSession(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    promoCode?: string
  ) {
    try {
      this.logger.info('Creating Stripe session', { userId });
      this.logger.debug('Checkout items', { items, promoCode });
      
      const order = await ordersService.createOrder(
        userId,
        items,
        'STRIPE',
        promoCode
      );
      
      if (!order) {
        throw new Error('Failed to create order');
      }
      
      this.logger.info('Order created successfully', { orderId: order.id });
      
      // Stripe line items
      const lineItems = [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `Order #${order.id.substring(0, 8)}`,
              description: order.items.map(item => `${item.product.name} x${item.quantity}`).join(', '),
            },
            unit_amount: Math.round(order.total * 100),
          },
          quantity: 1,
        },
      ];

      this.logger.debug('Stripe line items', { lineItems });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'promptpay'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
        metadata: {
          orderId: order.id,
          userId,
        },
      });

      this.logger.info('Stripe session created', { sessionId: session.id });

      await trackedQuery(async () => {
        return await db.update(schema.orders)
          .set({ paymentIntent: session.id, updatedAt: new Date() })
          .where(eq(schema.orders.id, order.id));
      }, 'checkout.createStripeSession.updateOrder');

      return {
        orderId: order.id,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error('Error in createStripeCheckoutSession', error as Error);
      if (error instanceof Error) {
        throw new BadRequestError(`Stripe checkout error: ${error.message}`);
      }
      throw error;
    }
  }

  async payWithBalance(userId: string, orderId: string) {
    return await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
        with: { 
          items: {
            with: {
              product: true
            }
          } 
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.userId !== userId) {
        throw new BadRequestError('Unauthorized access to order');
      }

      if (order.paymentMethod !== 'BALANCE') {
        throw new BadRequestError('Order payment method is not balance');
      }

      // Atomic status update to prevent double-charging in race conditions
      const updateResult = await tx.update(schema.orders)
        .set({ status: 'PROCESSING', updatedAt: new Date() })
        .where(
          and(
            eq(schema.orders.id, orderId),
            eq(schema.orders.status, 'PENDING')
          )
        )
        .returning();

      if (updateResult.length === 0) {
        throw new BadRequestError('Order is already being processed or completed');
      }

      const user = await tx.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { balance: true, email: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.balance < order.total) {
        throw new BadRequestError('Insufficient balance');
      }

      // Check stock before proceeding
      for (const item of order.items) {
        if (item.product.stock !== -1 && item.product.stock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
        }
      }

      // Atomic subtract balance with check
      const updatedUserResult = await tx.update(schema.users)
        .set({ 
          balance: sql`${schema.users.balance} - ${order.total}`,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(schema.users.id, userId),
            sql`${schema.users.balance} >= ${order.total}`
          )
        )
        .returning();

      if (updatedUserResult.length === 0) {
        throw new BadRequestError('Insufficient balance');
      }

      await tx.insert(schema.transactions).values({
        userId,
        type: 'PURCHASE',
        amount: order.total,
        status: 'COMPLETED',
        paymentMethod: 'balance',
        paymentRef: orderId,
      });

      // Delegate the rest of the completion logic (points, licenses, notifications, etc.) to ordersService
      // We pass the transaction client to ensure everything is atomic
      const completedOrder = await ordersService.completeOrder(orderId, tx);

      return { success: true, orderId, order: completedOrder };
    });
  }

  async verifyPayment(orderId: string) {
    const order = await trackedQuery(async () => {
      return await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
      });
    }, 'checkout.verifyPayment.findOrder');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (!order.paymentIntent) {
      // For balance payments, they are completed immediately
      if (order.paymentMethod === 'BALANCE' && order.status === 'COMPLETED') {
        return { success: true, status: 'completed' };
      }
      throw new BadRequestError('No payment intent found');
    }

    const session = await stripe.checkout.sessions.retrieve(order.paymentIntent);

    if (session.payment_status === 'paid' && order.status === 'PENDING') {
      await ordersService.completeOrder(orderId);
      return { success: true, status: 'completed' };
    }

    return { success: false, status: session.payment_status };
  }

  async verifyStripePayment(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' && session.metadata?.orderId) {
      const orderId = session.metadata.orderId;
      const order = await trackedQuery(async () => {
        return await db.query.orders.findFirst({
          where: eq(schema.orders.id, orderId),
        });
      }, 'checkout.verifyStripePayment.findOrder');

      if (order && order.status === 'PENDING') {
        await ordersService.completeOrder(orderId);
        return { success: true, status: 'completed', orderId };
      }
      return { success: true, status: order?.status || 'unknown', orderId };
    }

    return { success: false, status: session.payment_status };
  }

  async validateCart(items: Array<{ productId: string; quantity: number }>) {
    const productIds = items.map(item => item.productId);
    const productsResult = await trackedQuery(async () => {
      return await db.query.products.findMany({
        where: sql`${schema.products.id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`,
      });
    }, 'checkout.validateCart');

    const results = items.map(item => {
      const product = productsResult.find(p => p.id === item.productId);
      if (!product) {
        return {
          productId: item.productId,
          valid: false,
          error: 'Product not found',
        };
      }

      const now = new Date();
      const currentPrice = product.isFlashSale && product.flashSalePrice && product.flashSaleEnds && product.flashSaleEnds > now
        ? product.flashSalePrice
        : product.price;

      const hasStock = product.stock === -1 || product.stock >= item.quantity;

      return {
        productId: item.productId,
        name: product.name,
        valid: hasStock,
        price: currentPrice,
        stock: product.stock,
        error: hasStock ? null : 'Insufficient stock',
      };
    });

    const total = results.reduce((sum, item) => {
      return sum + (Number(item.price) || 0) * (items.find(i => i.productId === item.productId)?.quantity || 0);
    }, 0);

    return {
      items: results,
      total,
      isValid: results.every(item => item.valid),
    };
  }
}

export const checkoutService = new CheckoutService();
