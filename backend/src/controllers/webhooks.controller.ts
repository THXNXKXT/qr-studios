import type { Context } from 'hono';
import stripe from '../config/stripe';
import { env } from '../config/env';
import { webhooksService } from '../services/webhooks.service';
import { BadRequestError } from '../utils/errors';

export const webhooksController = {
  async handleStripe(c: Context) {
    const signature = c.req.header('stripe-signature');
    
    if (!signature) {
      throw new BadRequestError('No signature provided');
    }

    const body = await c.req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      throw new BadRequestError(`Webhook signature verification failed: ${err.message}`);
    }

    await webhooksService.handleStripeWebhook(event);

    return c.json({ received: true });
  },
};
