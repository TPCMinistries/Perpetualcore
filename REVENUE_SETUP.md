# Revenue Streams Setup Guide

This document outlines all the revenue streams built into the platform and how to configure them.

## 🎯 Revenue Streams Overview

1. **Marketplace** - 90% margin passive income ($1.35M - $10.8M ARR potential)
2. **API Access** - Infinite scalability ($500K - $5M+ ARR potential)
3. **Professional Services** - High-margin consulting ($500K - $2M+ ARR potential)
4. **Partner/Affiliate Program** - Exponential growth multiplier
5. **Core SaaS** - Base subscription revenue ($2-20M ARR potential)
6. **Vertical Packages** - Industry-specific offerings ($2.6M+ ARR potential)

**Total Potential: $7-43M ARR** (Year 1-2 projection)

---

## 📦 Database Migrations

Run these migrations in order to set up all database tables:

```bash
# Run all migrations
supabase db push

# Or run individually:
psql -f supabase/migrations/20250122_add_sales_contacts.sql
psql -f supabase/migrations/20250123_fix_user_profiles_compatibility.sql
psql -f supabase/migrations/20250124_add_marketplace.sql
psql -f supabase/migrations/20250125_add_api_access.sql
psql -f supabase/migrations/20250126_add_partner_program.sql
psql -f supabase/migrations/20250127_add_webhook_helpers.sql
```

---

## 🔐 Environment Variables

Add these to your `.env.local` file:

```bash
# Existing variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (required for all payment processing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_ANNUAL=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...

# Optional: File storage for marketplace uploads
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
AWS_REGION=us-east-1

# Optional: Email service for notifications
RESEND_API_KEY=re_...
# OR
SENDGRID_API_KEY=SG...
```

---

## 💳 Stripe Configuration

### 1. Create Products & Prices

In your Stripe Dashboard, create products for:

**Core SaaS Plans:**
- Starter ($50/month or $500/year)
- Professional ($150/month or $1500/year)
- Teams ($350/month or $3500/year)
- Business (Custom pricing)
- Enterprise (Custom pricing)

**Vertical Plans:**
- Law ($999/month per attorney)
- Healthcare ($899/month per provider)
- Real Estate ($499/month per agent)
- Agency ($799/month per seat + $2000/month white label)

**API Access Plans:**
- Free ($0)
- Hobby ($29/month or $290/year)
- Pro ($99/month or $990/year)
- Scale ($299/month or $2990/year)
- Enterprise (Custom)

### 2. Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🛍️ Marketplace Setup

### Pages Created:
- `/marketplace` - Browse marketplace
- `/marketplace/[id]` - Item details
- `/marketplace/sell` - Seller dashboard
- `/marketplace/sell/new` - Create listing
- `/marketplace/my-purchases` - Buyer's purchases
- `/marketplace/purchase-success` - Post-purchase page

### Commission Structure:
- Platform: 30%
- Creator: 70%

### To Launch:
1. ✅ Database tables created
2. ✅ UI pages built
3. ✅ Purchase flow API created
4. ✅ Stripe webhook handler ready
5. ⏳ TODO: Add file upload for agent/workflow configs (S3/Cloudinary)
6. ⏳ TODO: Build admin approval panel
7. ⏳ TODO: Add email notifications

---

## 🔌 API Access Setup

### Pages Created:
- `/api-pricing` - API pricing tiers
- `/developers` - Developer portal with API key management

### Database Tables:
- `api_keys` - API key storage (hashed)
- `api_usage` - Detailed usage logs
- `api_usage_aggregates` - Fast analytics queries
- `api_billing` - Monthly billing records

### Rate Limits by Tier:
- Free: 10 req/min, 1K/month
- Hobby: 60 req/min, 25K/month
- Pro: 300 req/min, 100K/month
- Scale: 1000 req/min, 500K/month
- Enterprise: Custom

### To Launch:
1. ✅ Database schema created
2. ✅ UI pages built
3. ⏳ TODO: Build API key generation endpoint (`/api/developers/keys`)
4. ⏳ TODO: Build API gateway with rate limiting
5. ⏳ TODO: Create usage tracking middleware
6. ⏳ TODO: Monthly billing cron job

---

## 💼 Professional Services Setup

### Page Created:
- `/professional-services` - Service packages & consultation booking

### Service Packages:
- **Quick Start**: $5K (2 weeks)
- **Full Implementation**: $25K (6-8 weeks)
- **Enterprise Transformation**: $75K+ (3-6 months)

### Additional Services:
- Training: $2K-$10K
- Custom Development: $10K-$100K
- Consultation: $500-$5K/hour

### To Launch:
1. ✅ Landing page built
2. ⏳ TODO: Connect to existing sales contact form
3. ⏳ TODO: Build consultation booking calendar (Calendly integration?)
4. ⏳ TODO: Create project tracking system

---

## 🤝 Partner/Affiliate Program Setup

### Page Created:
- `/partners` - Partner program landing page

### Commission Tiers:
- **Affiliate**: 20% for 12 months (0 requirements)
- **Partner**: 25% for 24 months (5+ referrals/month)
- **Enterprise**: 30% for 36 months (10+ referrals or $50K ARR)

### Database Tables:
- `partners` - Partner profiles
- `partner_referrals` - Customer tracking
- `partner_commissions` - Monthly commissions
- `partner_payouts` - Payout records
- `partner_tier_requirements` - Tier configs

### To Launch:
1. ✅ Database schema created
2. ✅ Landing page built
3. ⏳ TODO: Build partner application form (`/partners/apply`)
4. ⏳ TODO: Build partner dashboard (`/partners/dashboard`)
5. ⏳ TODO: Create referral tracking system
6. ⏳ TODO: Monthly payout cron job
7. ⏳ TODO: Stripe Connect for partner payouts

---

## 📧 Email Notifications

### Recommended Service: Resend or SendGrid

### Email Templates Needed:

**Marketplace:**
- Purchase confirmation
- Item delivery (with download link)
- Review request (7 days after purchase)
- Creator new sale notification
- Payout confirmation

**API Access:**
- Welcome email with API key
- Usage threshold alerts (50%, 80%, 100%)
- Monthly usage summary
- Payment receipts

**Professional Services:**
- Consultation booking confirmation
- Project kickoff email
- Milestone updates
- Project completion

**Partner Program:**
- Application approval
- Referral conversion notification
- Monthly commission summary
- Payout confirmation
- Tier upgrade notification

---

## 🔄 Cron Jobs Required

Set up these periodic tasks (use Vercel Cron, GitHub Actions, or similar):

### Daily:
- Aggregate API usage data
- Check for rate limit violations
- Process partner tier upgrades

### Weekly:
- Send usage threshold alerts
- Cleanup expired API keys

### Monthly:
- Generate API billing invoices
- Calculate partner commissions
- Process partner payouts (1st of month)
- Send monthly summary emails

### Quarterly:
- Partner business reviews
- Revenue analytics

---

## 📊 Analytics & Tracking

### Key Metrics to Track:

**Marketplace:**
- Total listings
- Sales conversion rate
- Average item price
- Creator earnings
- Platform revenue

**API Access:**
- Total API calls
- Requests by endpoint
- Requests by model
- Revenue per user
- Overage charges

**Professional Services:**
- Consultation bookings
- Project pipeline value
- Average deal size
- Service revenue

**Partner Program:**
- Active partners by tier
- Referral conversion rate
- Total commissions paid
- Partner-driven ARR

---

## 🚀 Launch Checklist

### Pre-Launch:
- [ ] Run all database migrations
- [ ] Set up Stripe products & prices
- [ ] Configure Stripe webhook
- [ ] Add environment variables
- [ ] Test payment flows
- [ ] Create first marketplace item (test)
- [ ] Generate test API key
- [ ] Test partner referral tracking

### Launch Day:
- [ ] Deploy to production
- [ ] Verify webhook is receiving events
- [ ] Monitor error logs
- [ ] Test live transactions
- [ ] Announce to users

### Post-Launch:
- [ ] Set up cron jobs
- [ ] Configure email templates
- [ ] Build admin panels
- [ ] Create analytics dashboards
- [ ] Document API
- [ ] Train support team

---

## 💰 Revenue Projections

### Conservative Year 1:
- Core SaaS: $2M ARR
- Verticals: $2.6M ARR
- Marketplace: $1.35M ARR
- API Access: $500K ARR
- Services: $500K ARR
- **Total: $7M ARR @ 80% margin = $5.6M net**

### Optimistic Year 2:
- Core SaaS: $10M ARR
- Verticals: $5M ARR
- Marketplace: $10.8M ARR
- API Access: $5M ARR
- Services: $2M ARR
- **Total: $33M ARR @ 80% margin = $26.4M net**

---

## 🎯 Next Steps

1. **Run database migrations** - Set up all tables
2. **Configure Stripe** - Create products and webhook
3. **Add environment variables** - Configure keys
4. **Test payment flows** - Ensure webhooks work
5. **Build remaining TODO items** - See sections above
6. **Launch!** 🚀

---

## 📞 Support

For questions or issues:
- Check logs: `npm run dev`
- Stripe Dashboard: Monitor payments
- Supabase Dashboard: Check database
- Webhook logs: Stripe → Developers → Webhooks → View events

---

Built with ❤️ by Claude Code
