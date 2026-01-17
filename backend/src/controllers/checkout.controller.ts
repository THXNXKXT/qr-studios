import type { Context } from 'hono';
import { checkoutService } from '../services/checkout.service';
import { success } from '../utils/response';
import { 
  orderIdParamSchema, 
  sessionIdParamSchema, 
  createStripeSessionSchema, 
  payWithBalanceSchema 
} from '../schemas';

export const checkoutController = {
  async createStripeSession(c: Context) {
    const user = c.get('user');
    const { items, promoCode } = c.req.valid('json' as never) as any;

    const session = await checkoutService.createStripeCheckoutSession(
      user.id,
      items,
      promoCode
    );

    return success(c, session, 'Checkout session created');
  },

  async payWithBalance(c: Context) {
    const user = c.get('user');
    const { orderId } = c.req.valid('json' as never) as any;

    const result = await checkoutService.payWithBalance(user.id, orderId);
    return success(c, result, 'Payment successful');
  },

  async verifyPayment(c: Context) {
    const { orderId } = orderIdParamSchema.parse(c.req.param());
    
    const result = await checkoutService.verifyPayment(orderId);
    return success(c, result);
  },

  async verifyStripePayment(c: Context) {
    const { sessionId } = sessionIdParamSchema.parse(c.req.param());
    
    const result = await checkoutService.verifyStripePayment(sessionId);
    return success(c, result);
  },

  async validateCart(c: Context) {
    const { items } = createStripeSessionSchema.parse(await c.req.json());
    const result = await checkoutService.validateCart(items);
    return success(c, result);
  },
};
