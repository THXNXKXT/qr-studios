import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export default stripe;
