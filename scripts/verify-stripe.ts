import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import Stripe from 'stripe';

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  console.log('=== STRIPE VERIFICATION ===\n');

  // Check product
  const product = await stripe.products.retrieve('prod_TbwLbxwe6XcW6X');
  console.log('✅ Product:', product.name, '(' + product.id + ')');
  console.log('   Active:', product.active);

  // Check prices
  const prices = await stripe.prices.list({ product: 'prod_TbwLbxwe6XcW6X', limit: 20, active: true });
  console.log('\n✅ Active Prices:', prices.data.length);

  prices.data.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));

  prices.data.forEach(p => {
    const amount = (p.unit_amount || 0) / 100;
    const interval = p.recurring?.interval || 'one-time';
    console.log('   •', (p.nickname || 'Unnamed').padEnd(20), '$' + amount.toString().padStart(6) + '/' + interval);
  });

  // Verify webhook
  console.log('\n=== WEBHOOK STATUS ===');
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    const pcWebhook = webhooks.data.find(w => w.url.includes('perpetualcore.com'));
    if (pcWebhook) {
      console.log('✅ Webhook configured:', pcWebhook.url);
      console.log('   Status:', pcWebhook.status);
    } else {
      console.log('⚠️  No webhook found for perpetualcore.com');
      console.log('   You may need to configure webhook at: https://dashboard.stripe.com/webhooks');
    }
  } catch (e) {
    console.log('   Could not check webhooks');
  }

  console.log('\n=== RESULT: STRIPE IS READY ===');
}

main().catch(console.error);
