import { stripe } from '../src/config/stripe';

async function verifyStripe() {
  try {
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe connection successful!');
    console.log('Mode:', balance.livemode ? 'LIVE' : 'TEST');
    console.log('Currency:', balance.available[0].currency.toUpperCase());
  } catch (error) {
    console.error('❌ Stripe connection failed:', error instanceof Error ? error.message : error);
  }
}

verifyStripe();
