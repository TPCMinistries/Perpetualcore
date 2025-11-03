-- =====================================================
-- STRIPE BILLING & SUBSCRIPTIONS SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Tables: subscriptions, usage_tracking, invoices
-- =====================================================

-- Subscription plans enum
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'premium', 'team', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');

-- =====================================================
-- 1. SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Plan details
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT subscriptions_organization_unique UNIQUE (organization_id)
);

-- =====================================================
-- 2. USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage metrics (monthly reset)
  month TEXT NOT NULL, -- Format: YYYY-MM

  -- AI usage
  ai_messages_count INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,

  -- Document usage
  documents_stored INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,

  -- Email usage
  emails_synced INTEGER DEFAULT 0,
  email_ai_actions INTEGER DEFAULT 0,

  -- WhatsApp usage
  whatsapp_messages INTEGER DEFAULT 0,

  -- Calendar usage
  calendar_events INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT usage_tracking_org_month_unique UNIQUE (organization_id, month)
);

-- =====================================================
-- 3. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,

  -- Invoice details
  amount_due INTEGER NOT NULL, -- In cents
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

  -- Dates
  invoice_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Links
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. PLAN LIMITS REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan subscription_plan NOT NULL UNIQUE,

  -- Limits
  ai_messages_per_month INTEGER,
  documents_limit INTEGER,
  storage_gb INTEGER,
  team_members_limit INTEGER,

  -- Features
  advanced_ai BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  custom_integrations BOOLEAN DEFAULT false,
  sso_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO plan_limits (plan, ai_messages_per_month, documents_limit, storage_gb, team_members_limit, advanced_ai, priority_support, custom_integrations, sso_enabled) VALUES
  ('free', 150, 10, 1, 1, false, false, false, false), -- 5 AI requests/day = ~150/month
  ('starter', 500, 100, 2, 2, false, false, false, false),
  ('pro', -1, -1, 10, 5, true, false, false, false), -- -1 = unlimited
  ('premium', -1, -1, 50, 10, true, true, false, false),
  ('team', -1, -1, 100, -1, true, true, false, false), -- Per-user pricing
  ('enterprise', -1, -1, 200, -1, true, true, true, true)
ON CONFLICT (plan) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_org ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month ON usage_tracking(month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_month ON usage_tracking(organization_id, month);

CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own organization subscription"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Usage tracking policies
CREATE POLICY "Users can view own organization usage"
  ON usage_tracking FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage usage tracking"
  ON usage_tracking FOR ALL
  USING (true)
  WITH CHECK (true);

-- Invoices policies
CREATE POLICY "Users can view own organization invoices"
  ON invoices FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Plan limits policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view plan limits"
  ON plan_limits FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get current usage for organization
CREATE OR REPLACE FUNCTION get_current_usage(org_id UUID)
RETURNS TABLE (
  month TEXT,
  ai_messages_count INTEGER,
  ai_tokens_used INTEGER,
  documents_stored INTEGER,
  storage_bytes BIGINT,
  emails_synced INTEGER,
  email_ai_actions INTEGER,
  whatsapp_messages INTEGER,
  calendar_events INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.month,
    u.ai_messages_count,
    u.ai_tokens_used,
    u.documents_stored,
    u.storage_bytes,
    u.emails_synced,
    u.email_ai_actions,
    u.whatsapp_messages,
    u.calendar_events
  FROM usage_tracking u
  WHERE u.organization_id = org_id
    AND u.month = TO_CHAR(NOW(), 'YYYY-MM')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Check if organization has reached usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  limit_value INTEGER;
  current_plan subscription_plan;
BEGIN
  -- Get current plan
  SELECT plan INTO current_plan
  FROM subscriptions
  WHERE organization_id = org_id;

  -- Get limit for plan
  CASE limit_type
    WHEN 'ai_messages' THEN
      SELECT ai_messages_per_month INTO limit_value
      FROM plan_limits
      WHERE plan = current_plan;

      SELECT ai_messages_count INTO current_usage
      FROM usage_tracking
      WHERE organization_id = org_id
        AND month = TO_CHAR(NOW(), 'YYYY-MM');

    WHEN 'documents' THEN
      SELECT documents_limit INTO limit_value
      FROM plan_limits
      WHERE plan = current_plan;

      SELECT documents_stored INTO current_usage
      FROM usage_tracking
      WHERE organization_id = org_id
        AND month = TO_CHAR(NOW(), 'YYYY-MM');

    ELSE
      RETURN false;
  END CASE;

  -- -1 means unlimited
  IF limit_value = -1 THEN
    RETURN false;
  END IF;

  -- Check if limit reached
  RETURN COALESCE(current_usage, 0) >= limit_value;
END;
$$ LANGUAGE plpgsql;

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  org_id UUID,
  usr_id UUID,
  usage_type TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Insert or update usage tracking
  INSERT INTO usage_tracking (organization_id, user_id, month)
  VALUES (org_id, usr_id, current_month)
  ON CONFLICT (organization_id, month) DO NOTHING;

  -- Increment the specific counter
  CASE usage_type
    WHEN 'ai_messages' THEN
      UPDATE usage_tracking
      SET ai_messages_count = ai_messages_count + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'documents' THEN
      UPDATE usage_tracking
      SET documents_stored = documents_stored + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'emails' THEN
      UPDATE usage_tracking
      SET emails_synced = emails_synced + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'whatsapp' THEN
      UPDATE usage_tracking
      SET whatsapp_messages = whatsapp_messages + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'calendar' THEN
      UPDATE usage_tracking
      SET calendar_events = calendar_events + increment_by
      WHERE organization_id = org_id AND month = current_month;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE subscriptions IS 'Stripe subscription data for organizations';
COMMENT ON TABLE usage_tracking IS 'Monthly usage metrics for billing and limits';
COMMENT ON TABLE invoices IS 'Stripe invoice records';
COMMENT ON TABLE plan_limits IS 'Plan limits and features configuration';
