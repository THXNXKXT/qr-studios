import stripe from '../config/stripe';
import { ordersService } from './orders.service';
import { topupService } from './topup.service';
import type Stripe from 'stripe';

export const webhooksService = {
  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await webhooksService.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await webhooksService.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.async_payment_failed':
        await webhooksService.handlePaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment intent failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  },

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;

    if (!metadata) {
      console.error('No metadata in session');
      return;
    }

    if (metadata.type === 'topup' && metadata.transactionId) {
      // Get the payment method from the session
      let paymentMethod = 'stripe';
      try {
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['payment_intent'],
        });
        if (fullSession.payment_intent && typeof fullSession.payment_intent !== 'string') {
          const pi = fullSession.payment_intent as any;
          paymentMethod = pi.payment_method_types?.[0] || 'stripe';
        }
      } catch (err) {
        console.error('Error expanding session for payment method:', err);
      }

      await topupService.completeTopup(metadata.transactionId, paymentMethod);
      console.log('Topup completed:', metadata.transactionId, 'Method:', paymentMethod);
    } else if (metadata.orderId) {
      await ordersService.completeOrder(metadata.orderId);
      console.log('Order completed:', metadata.orderId);
    }
  },

  async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (metadata?.type === 'topup' && metadata.transactionId) {
      await topupService.cancelTopup(metadata.transactionId, 'CANCELLED');
      console.log('Topup cancelled (session expired):', metadata.transactionId);
    }
  },

  async handlePaymentFailed(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (metadata?.type === 'topup' && metadata.transactionId) {
      await topupService.cancelTopup(metadata.transactionId, 'FAILED');
      console.log('Topup failed:', metadata.transactionId);
    }
  },
};
