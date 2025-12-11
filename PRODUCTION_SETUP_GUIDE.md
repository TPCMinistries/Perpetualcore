# Perpetual Core - Production Setup Guide

This guide walks you through setting up all required API keys and services for production deployment.

---

## Table of Contents
1. [Resend (Email)](#1-resend-email)
2. [Stripe (Payments)](#2-stripe-payments)
3. [Google OAuth](#3-google-oauth)
4. [Slack OAuth](#4-slack-oauth)
5. [GitHub OAuth](#5-github-oauth)
6. [OpenAI](#6-openai)
7. [Anthropic (Claude)](#7-anthropic-claude)
8. [Google Gemini](#8-google-gemini)
9. [Supabase](#9-supabase)
10. [Environment Variables Summary](#10-environment-variables-summary)

---

## 1. Resend (Email)

Resend is used for sending transactional emails (welcome emails, notifications, password resets).

### Setup Steps:
1. Go to [https://resend.com](https://resend.com) and create an account
2. Verify your email domain:
   - Go to **Domains** → **Add Domain**
   - Add your domain (e.g., `perpetualcore.com`)
   - Add the DNS records Resend provides (SPF, DKIM, DMARC)
   - Wait for verification (usually 5-30 minutes)
3. Create an API key:
   - Go to **API Keys** → **Create API Key**
   - Name it "Perpetual Core Production"
   - Copy the key (starts with `re_`)

### Environment Variable:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Update Email From Address:
After verifying your domain, update the from addresses in your `.env.local`:
```env
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_SUPPORT_ADDRESS=support@yourdomain.com
EMAIL_SALES_ADDRESS=sales@yourdomain.com
ADMIN_NOTIFICATION_EMAILS=admin@yourdomain.com
```

---

## 2. Stripe (Payments)

Stripe handles subscriptions and marketplace payments.

### Setup Steps:
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com) and create an account
2. Complete business verification
3. Get your API keys:
   - Go to **Developers** → **API Keys**
   - Copy the **Secret key** (starts with `sk_live_` or `sk_test_`)
   - Copy the **Publishable key** (starts with `pk_live_` or `pk_test_`)

### Create Products & Prices:
1. Go to **Products** → **Add Product**
2. Create these products:

**Pro Plan Monthly:**
- Name: "Pro Monthly"
- Price: $29/month (or your price)
- Copy the Price ID (starts with `price_`)

**Pro Plan Yearly:**
- Name: "Pro Yearly"
- Price: $290/year (or your price)
- Copy the Price ID

**Enterprise Plan Monthly:**
- Name: "Enterprise Monthly"
- Price: $99/month (or your price)
- Copy the Price ID

**Enterprise Plan Yearly:**
- Name: "Enterprise Yearly"
- Price: $990/year (or your price)
- Copy the Price ID

### Set Up Webhooks:
1. Go to **Developers** → **Webhooks** → **Add Endpoint**
2. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** (starts with `whsec_`)

### Environment Variables:
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxxxxxx
```

---

## 3. Google OAuth

Google OAuth enables "Sign in with Google" and Gmail/Calendar integrations.

### Setup Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Go to **APIs & Services** → **Enable APIs**
   - Enable: **Google+ API**, **Gmail API**, **Google Calendar API**, **Google People API**

4. Configure OAuth Consent Screen:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose "External" user type
   - Fill in app information:
     - App name: "Perpetual Core"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `email`
     - `profile`
     - `openid`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users if in testing mode

5. Create OAuth Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "Perpetual Core"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `http://localhost:3001` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
     - `http://localhost:3000/api/integrations/google/callback`
     - `http://localhost:3001/api/integrations/google/callback`
     - `https://yourdomain.com/api/auth/callback/google`
     - `https://yourdomain.com/api/integrations/google/callback`
   - Copy **Client ID** and **Client Secret**

### Environment Variables:
```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
```

---

## 4. Slack OAuth

Slack OAuth enables Slack workspace integration.

### Setup Steps:
1. Go to [Slack API](https://api.slack.com/apps) and click **Create New App**
2. Choose "From scratch"
3. App Name: "Perpetual Core"
4. Select your workspace

5. Configure OAuth & Permissions:
   - Go to **OAuth & Permissions**
   - Add Redirect URLs:
     - `http://localhost:3000/api/integrations/slack/callback`
     - `http://localhost:3001/api/integrations/slack/callback`
     - `https://yourdomain.com/api/integrations/slack/callback`
   - Add Bot Token Scopes:
     - `channels:read`
     - `chat:write`
     - `users:read`
     - `users:read.email`
     - `team:read`

6. Get Credentials:
   - Go to **Basic Information**
   - Copy **Client ID** and **Client Secret**

### Environment Variables:
```env
SLACK_CLIENT_ID=xxxxxxxxxxxx.xxxxxxxxxxxx
SLACK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 5. GitHub OAuth

GitHub OAuth enables GitHub integration for developers.

### Setup Steps:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Application name: "Perpetual Core"
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/api/integrations/github/callback`
   - For development, also register a second app with:
     - Homepage URL: `http://localhost:3001`
     - Callback: `http://localhost:3001/api/integrations/github/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

### Environment Variables:
```env
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. OpenAI

OpenAI powers GPT-4 and GPT-4o models for AI features.

### Setup Steps:
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create account
3. Go to **API Keys** → **Create new secret key**
4. Name it "Perpetual Core"
5. Copy the key (starts with `sk-`)

### Environment Variable:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 7. Anthropic (Claude)

Anthropic powers Claude models for AI features.

### Setup Steps:
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign in or create account
3. Go to **API Keys** → **Create Key**
4. Name it "Perpetual Core"
5. Copy the key (starts with `sk-ant-`)

### Environment Variable:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 8. Google Gemini

Google Gemini provides additional AI model options.

### Setup Steps:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API Key**
4. Select your Google Cloud project
5. Copy the key

### Environment Variable:
```env
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 9. Supabase

Supabase provides the database and authentication.

### Setup Steps:
1. Go to [Supabase](https://supabase.com) and create a project
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep secret!)

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Apply Database Migrations:
Run the SQL files in the `supabase/migrations/` folder in order:
1. Go to Supabase Dashboard → **SQL Editor**
2. Run each migration file, including:
   - `oauth_states.sql` - Required for OAuth integrations
   - `INTELLIGENCE_SCHEMA.sql` - Required for knowledge graph
   - Any other migration files in the folder

**Important OAuth States Migration:**
```sql
-- Run this to enable OAuth flows
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  service TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
```

---

## 10. Environment Variables Summary

Create a `.env.local` file with all variables:

```env
# ===========================================
# APP CONFIGURATION
# ===========================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME="Perpetual Core"

# ===========================================
# SUPABASE
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===========================================
# EMAIL (Resend)
# ===========================================
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_SUPPORT_ADDRESS=support@yourdomain.com
EMAIL_SALES_ADDRESS=sales@yourdomain.com
ADMIN_NOTIFICATION_EMAILS=admin@yourdomain.com

# ===========================================
# STRIPE (Payments)
# ===========================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxx

# ===========================================
# GOOGLE OAUTH
# ===========================================
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx

# ===========================================
# SLACK OAUTH
# ===========================================
SLACK_CLIENT_ID=xxxxxxxxxx.xxxxxxxxxx
SLACK_CLIENT_SECRET=xxxxxxxxxx

# ===========================================
# GITHUB OAUTH
# ===========================================
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxx

# ===========================================
# AI PROVIDERS
# ===========================================
OPENAI_API_KEY=sk-xxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxx

# ===========================================
# SECURITY
# ===========================================
ENCRYPTION_KEY=generate-a-32-character-random-string-here
```

### Generate Encryption Key:
Run this command to generate a secure encryption key:
```bash
openssl rand -base64 32
```

---

## Quick Start Checklist

- [ ] Create Resend account and verify domain
- [ ] Create Stripe account and set up products/prices
- [ ] Set up Google Cloud project with OAuth
- [ ] Create Slack app with OAuth
- [ ] Create GitHub OAuth app
- [ ] Get OpenAI API key
- [ ] Get Anthropic API key
- [ ] Get Google Gemini API key
- [ ] Set up Supabase project
- [ ] Apply database migrations
- [ ] Create `.env.local` with all variables
- [ ] Generate encryption key
- [ ] Test each integration

---

## Testing Integrations

After setting up, test each integration:

1. **Email**: Go to Settings → Send a test email
2. **Stripe**: Try subscribing to a plan
3. **Google**: Click "Connect" in Integrations
4. **Slack**: Click "Connect" in Integrations
5. **GitHub**: Click "Connect" in Integrations
6. **AI**: Start a chat conversation

---

## Production Deployment Notes

1. Use `sk_live_` Stripe keys for production (not `sk_test_`)
2. Ensure all OAuth redirect URIs include your production domain
3. Set `NEXT_PUBLIC_APP_URL` to your production URL
4. Configure DNS for your email domain in Resend
5. Enable Stripe webhooks for your production URL

---

*Last updated: December 2024*
