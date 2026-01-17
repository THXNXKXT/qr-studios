import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { checkoutController } from '../controllers/checkout.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { 
  createStripeSessionSchema, 
  payWithBalanceSchema, 
  orderIdParamSchema, 
  sessionIdParamSchema 
} from '../schemas';

const checkout = new Hono();

checkout.use('*', authMiddleware);

checkout.post('/stripe', zValidator('json', createStripeSessionSchema), checkoutController.createStripeSession);
checkout.post('/balance', zValidator('json', payWithBalanceSchema), checkoutController.payWithBalance);
checkout.post('/validate-cart', checkoutController.validateCart);
checkout.get('/verify/:orderId', zValidator('param', orderIdParamSchema), checkoutController.verifyPayment);
checkout.get('/verify-stripe/:sessionId', zValidator('param', sessionIdParamSchema), checkoutController.verifyStripePayment);

export default checkout;
