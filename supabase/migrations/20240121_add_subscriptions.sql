-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  stripe_product_id TEXT,

  -- Plan details
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired')),
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Metadata
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Usage metrics
  ai_messages_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  whatsapp_messages INTEGER DEFAULT 0,
  workflows_executed INTEGER DEFAULT 0,

  -- Reset tracking
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, period_start)
);

-- Stripe events log (for debugging and idempotency)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  stripe_invoice_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',

  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),

  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_organization_id ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's plan limits
CREATE OR REPLACE FUNCTION get_plan_limits(p_plan TEXT)
RETURNS TABLE (
  ai_messages_limit INTEGER,
  documents_limit INTEGER,
  storage_gb_limit INTEGER,
  team_members_limit INTEGER,
  has_advanced_ai BOOLEAN,
  has_workflows BOOLEAN,
  has_sso BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_plan
      WHEN 'free' THEN 100
      WHEN 'pro' THEN -1  -- unlimited
      WHEN 'team' THEN -1
      WHEN 'enterprise' THEN -1
      ELSE 100
    END AS ai_messages_limit,
    CASE p_plan
      WHEN 'free' THEN 5
      WHEN 'pro' THEN -1
      WHEN 'team' THEN -1
      WHEN 'enterprise' THEN -1
      ELSE 5
    END AS documents_limit,
    CASE p_plan
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 50
      WHEN 'team' THEN 500
      WHEN 'enterprise' THEN -1
      ELSE 1
    END AS storage_gb_limit,
    CASE p_plan
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 5
      WHEN 'team' THEN -1
      WHEN 'enterprise' THEN -1
      ELSE 1
    END AS team_members_limit,
    CASE p_plan
      WHEN 'free' THEN false
      ELSE true
    END AS has_advanced_ai,
    CASE p_plan
      WHEN 'free' THEN false
      ELSE true
    END AS has_workflows,
    CASE p_plan
      WHEN 'free' THEN false
      WHEN 'pro' THEN false
      ELSE true
    END AS has_sso;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage against limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_organization_id UUID,
  p_metric TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get the organization's plan
  SELECT plan INTO v_plan
  FROM subscriptions
  WHERE organization_id = p_organization_id
  AND status IN ('active', 'trialing')
  LIMIT 1;

  -- Default to free plan if no subscription
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  -- Get current usage for the metric
  IF p_metric = 'ai_messages' THEN
    SELECT ai_messages_count INTO v_current_usage
    FROM usage_tracking
    WHERE organization_id = p_organization_id
    AND period_end > NOW()
    LIMIT 1;

    SELECT ai_messages_limit INTO v_limit
    FROM get_plan_limits(v_plan);
  ELSIF p_metric = 'documents' THEN
    SELECT documents_count INTO v_current_usage
    FROM usage_tracking
    WHERE organization_id = p_organization_id
    AND period_end > NOW()
    LIMIT 1;

    SELECT documents_limit INTO v_limit
    FROM get_plan_limits(v_plan);
  END IF;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN true;
  END IF;

  -- Check if under limit
  RETURN COALESCE(v_current_usage, 0) < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their organization's subscription
CREATE POLICY "Users can view organization subscription"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Only service role can modify subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Users can view their invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Initialize usage tracking for existing organizations
INSERT INTO usage_tracking (user_id, organization_id)
SELECT
  up.user_id,
  up.organization_id
FROM user_profiles up
LEFT JOIN usage_tracking ut ON ut.organization_id = up.organization_id
WHERE ut.id IS NULL
AND up.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Initialize free subscriptions for existing users
INSERT INTO subscriptions (user_id, organization_id, plan, status)
SELECT
  up.user_id,
  up.organization_id,
  'free',
  'active'
FROM user_profiles up
LEFT JOIN subscriptions s ON s.organization_id = up.organization_id
WHERE s.id IS NULL
AND up.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;
