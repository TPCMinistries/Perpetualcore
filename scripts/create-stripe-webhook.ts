import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import Stripe from 'stripe';

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  console.log('Creating Stripe webhook for perpetualcore.com...\n');

  // Check if webhook already exists
  const webhooks = await stripe.webhookEndpoints.list({ limit: 50 });
  const existingWebhook = webhooks.data.find(w => w.url.includes('perpetualcore.com'));

  if (existingWebhook) {
    console.log('⚠️  Webhook already exists:', existingWebhook.url);
    console.log('   ID:', existingWebhook.id);
    console.log('   Status:', existingWebhook.status);
    return;
  }

  // Create new webhook
  const webhook = await stripe.webhookEndpoints.create({
    url: 'https://perpetualcore.com/api/stripe/webhook',
    enabled_events: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
      'customer.created',
      'customer.updated',
    ],
    description: 'Perpetual Core production webhook',
  });

  console.log('✅ Webhook created!');
  console.log('   URL:', webhook.url);
  console.log('   ID:', webhook.id);
  console.log('   Secret:', webhook.secret);
  console.log('\n⚠️  IMPORTANT: Update STRIPE_WEBHOOK_SECRET in .env.local and Vercel with:');
  console.log('   STRIPE_WEBHOOK_SECRET=' + webhook.secret);
}

main().catch(console.error);
