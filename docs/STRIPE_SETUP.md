# Stripe Integration Setup Guide

This guide will help you set up Stripe for the Perpetual Core Platform revenue infrastructure.

## Prerequisites

- Stripe account (sign up at [stripe.com](https://stripe.com))
- Supabase project with migrations run
- Environment variables configured

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete business verification (required for live mode)
3. Enable test mode for development

## Step 2: Get API Keys

1. In Stripe Dashboard, go to **Developers → API keys**
2. Copy the following keys to your `.env.local`:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
```

## Step 3: Create Products and Prices

### Pro Plan

1. Go to **Products → Add Product**
2. Create "Pro Plan" product:
   - Name: `Pro Plan`
   - Description: `For individuals and small teams`
   - Pricing:
     - **Monthly**: $29/month (recurring)
       - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
     - **Yearly**: $278/year (recurring, 20% discount)
       - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`

### Team Plan

1. Create "Team Plan" product:
   - Name: `Team Plan`
   - Description: `For growing teams and businesses`
   - Pricing:
     - **Monthly**: $99/month (recurring)
       - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY`
     - **Yearly**: $950/year (recurring, 20% discount)
       - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY`

### Update Environment Variables

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY=price_1xxxxx
```

## Step 4: Configure Customer Portal

1. Go to **Settings → Billing → Customer Portal**
2. Click "Activate test link" or **Configure** for live mode
3. Enable the following features:
   - ✅ Invoice history
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ Update billing information
4. Set **Cancellation**: Immediate or at period end (your choice)
5. Save configuration

## Step 5: Set Up Webhooks

### Development (Local Testing)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Other OS: https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret:
   ```bash
   # Output will show:
   # > Ready! Your webhook signing secret is whsec_xxxxx
   ```

5. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Production Deployment

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click "Add endpoint"
3. Set endpoint URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `invoice.created`
   - ✅ `invoice.updated`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. Click "Add endpoint"
6. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in production env

## Step 6: Run Database Migrations

Ensure the subscription migration has been applied:

```bash
# Check if migration exists
ls supabase/migrations/20240121_add_subscriptions.sql

# If using Supabase CLI
supabase db push
```

The migration creates:
- `subscriptions` table
- `usage_tracking` table
- `stripe_events` table
- `invoices` table
- Helper functions for plan limits and usage checks

## Step 7: Test the Integration

### Test Checkout Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/pricing`

3. Click "Start Free Trial" on any paid plan

4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. Complete checkout

6. Verify subscription created in:
   - Stripe Dashboard → Customers
   - Supabase → `subscriptions` table

### Test Webhook Events

With Stripe CLI running (`stripe listen --forward-to...`):

1. Trigger a test event:
   ```bash
   stripe trigger customer.subscription.created
   ```

2. Check console logs for webhook processing

3. Verify event stored in `stripe_events` table

### Test Customer Portal

1. Go to `/dashboard/settings/billing`
2. Click "Manage Subscription"
3. Verify portal opens with:
   - Current subscription details
   - Payment method management
   - Invoice history
   - Cancel subscription option

## Step 8: Testing Scenarios

### Test Trial Period

- Subscriptions created via checkout have 14-day trial
- Trial end date stored in `subscriptions.trial_end`
- `customer.subscription.trial_will_end` webhook fires 3 days before trial ends

### Test Subscription Update

1. In Stripe Dashboard, find a test subscription
2. Change plan or update metadata
3. Verify `customer.subscription.updated` webhook processes
4. Check `subscriptions` table updated

### Test Payment Failure

1. In Stripe Dashboard, go to a subscription
2. Click "Update payment method"
3. Use test card `4000 0000 0000 0341` (card declined)
4. Verify `invoice.payment_failed` webhook fires
5. Check subscription status changes to `past_due`

### Test Cancellation

1. In Customer Portal, cancel subscription
2. Verify `customer.subscription.deleted` webhook
3. Check subscription downgraded to `free` plan

## Step 9: Production Checklist

Before going live:

- [ ] Switch Stripe to live mode
- [ ] Update API keys to live keys
- [ ] Create production products and prices
- [ ] Configure production webhook endpoint
- [ ] Update webhook secret
- [ ] Test live checkout (real payment)
- [ ] Verify customer portal works
- [ ] Set up monitoring/alerts
- [ ] Configure email notifications
- [ ] Review and accept Stripe Terms of Service

## Environment Variables Summary

```bash
# Required Stripe Variables
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY=price_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Troubleshooting

### Webhook not receiving events

1. Check webhook endpoint is accessible
2. Verify webhook secret matches
3. Check Stripe CLI is forwarding (development)
4. Look at webhook logs in Stripe Dashboard

### Checkout session fails

1. Verify price IDs are correct
2. Check API keys are valid
3. Ensure metadata includes required fields
4. Check console logs for errors

### Subscription not created

1. Check `stripe_events` table for errors
2. Verify webhook handler is processing events
3. Check Supabase RLS policies
4. Ensure service role key is set

### Customer Portal not loading

1. Verify customer portal is configured in Stripe
2. Check customer has a Stripe customer ID
3. Ensure return URL is correct
4. Verify portal session creation API works

## Useful Stripe CLI Commands

```bash
# List products
stripe products list

# List prices for a product
stripe prices list --product=prod_xxx

# List webhooks
stripe webhooks list

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.paid

# View webhook events
stripe events list

# View logs
stripe logs tail
```

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/customer-portal)

## Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs
2. Review webhook event logs
3. Check application logs
4. Verify environment variables
5. Test with Stripe CLI

---

**Next Steps:**
- Set up email notifications for subscription events
- Implement usage tracking and limits
- Add upgrade/downgrade flows
- Configure dunning management (failed payments)
