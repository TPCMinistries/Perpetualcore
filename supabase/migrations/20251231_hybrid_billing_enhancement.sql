-- =====================================================
-- HYBRID BILLING ENHANCEMENT
-- Phase 1: Metered billing, per-model pricing, overage system
-- =====================================================

-- =====================================================
-- 1. USAGE METERS (for Stripe metered billing sync)
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Meter configuration
  meter_type TEXT NOT NULL CHECK (meter_type IN ('ai_tokens', 'api_calls', 'storage_gb', 'premium_models', 'agents')),
  stripe_meter_id TEXT, -- Stripe Meter Event ID for Usage-based billing

  -- Usage tracking
  current_usage BIGINT DEFAULT 0,
  included_quota BIGINT DEFAULT 0, -- Quota included in base plan
  overage_units BIGINT GENERATED ALWAYS AS (GREATEST(current_usage - included_quota, 0)) STORED,

  -- Pricing
  overage_price_per_unit DECIMAL(10, 6) DEFAULT 0, -- Price per unit after quota exceeded
  overage_cost DECIMAL(10, 6) GENERATED ALWAYS AS (GREATEST(current_usage - included_quota, 0) * overage_price_per_unit) STORED,

  -- Billing period
  billing_period_start TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  billing_period_end TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),

  -- Sync tracking
  last_synced_to_stripe TIMESTAMPTZ,
  last_synced_usage BIGINT DEFAULT 0, -- Track what was already synced to avoid double-counting

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT usage_meters_org_type_period UNIQUE (organization_id, meter_type, billing_period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_meters_org ON usage_meters(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_meters_type ON usage_meters(meter_type);
CREATE INDEX IF NOT EXISTS idx_usage_meters_period ON usage_meters(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_usage_meters_overage ON usage_meters(overage_units) WHERE overage_units > 0;

-- =====================================================
-- 2. AI MODEL PRICING (per-model cost tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model identification
  model_id TEXT NOT NULL UNIQUE, -- e.g., 'claude-opus-4', 'gpt-4o'
  provider TEXT NOT NULL, -- 'anthropic', 'openai', 'google', etc.
  display_name TEXT NOT NULL,

  -- Cost per 1K tokens (in USD)
  input_cost_per_1k DECIMAL(10, 6) NOT NULL,
  output_cost_per_1k DECIMAL(10, 6) NOT NULL,

  -- Classification
  is_premium BOOLEAN DEFAULT false, -- Premium models require higher tier
  tier_required TEXT DEFAULT 'free' CHECK (tier_required IN ('free', 'starter', 'pro', 'team', 'business', 'enterprise')),

  -- Overage rates (when user exceeds quota)
  overage_multiplier DECIMAL(4, 2) DEFAULT 1.0, -- 1.0 = same rate, 1.5 = 50% markup

  -- Feature flags
  is_active BOOLEAN DEFAULT true,
  supports_vision BOOLEAN DEFAULT false,
  supports_function_calling BOOLEAN DEFAULT true,
  context_window INTEGER DEFAULT 128000,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert current model pricing (as of Dec 2024)
INSERT INTO ai_model_pricing (model_id, provider, display_name, input_cost_per_1k, output_cost_per_1k, is_premium, tier_required, supports_vision, context_window) VALUES
  -- Anthropic
  ('claude-opus-4', 'anthropic', 'Claude Opus 4', 0.015, 0.075, true, 'business', true, 200000),
  ('claude-sonnet-4', 'anthropic', 'Claude Sonnet 4', 0.003, 0.015, false, 'pro', true, 200000),
  ('claude-3-haiku', 'anthropic', 'Claude 3 Haiku', 0.00025, 0.00125, false, 'free', true, 200000),

  -- OpenAI
  ('gpt-4o', 'openai', 'GPT-4o', 0.0025, 0.010, true, 'business', true, 128000),
  ('gpt-4o-mini', 'openai', 'GPT-4o Mini', 0.00015, 0.0006, false, 'free', true, 128000),
  ('o1-preview', 'openai', 'o1 Preview', 0.015, 0.060, true, 'enterprise', false, 128000),
  ('o1-mini', 'openai', 'o1 Mini', 0.003, 0.012, true, 'pro', false, 128000),

  -- Google
  ('gemini-2.0-flash-exp', 'google', 'Gemini 2.0 Flash', 0.0, 0.0, false, 'free', true, 1000000),
  ('gemini-pro', 'google', 'Gemini Pro', 0.00025, 0.0005, false, 'free', false, 32000),

  -- Perplexity (for web search)
  ('perplexity-sonar', 'perplexity', 'Perplexity Sonar', 0.001, 0.001, false, 'pro', false, 127000),

  -- Groq (fast inference)
  ('llama-3.3-70b', 'groq', 'Llama 3.3 70B', 0.00059, 0.00079, false, 'starter', false, 128000),
  ('mixtral-8x7b', 'groq', 'Mixtral 8x7B', 0.00024, 0.00024, false, 'free', false, 32000)
ON CONFLICT (model_id) DO UPDATE SET
  input_cost_per_1k = EXCLUDED.input_cost_per_1k,
  output_cost_per_1k = EXCLUDED.output_cost_per_1k,
  updated_at = NOW();

-- =====================================================
-- 3. OVERAGE ALERTS
-- =====================================================
CREATE TABLE IF NOT EXISTS overage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert configuration
  meter_type TEXT NOT NULL CHECK (meter_type IN ('ai_tokens', 'api_calls', 'storage_gb', 'premium_models', 'agents', 'total_cost')),
  threshold_percentage INTEGER NOT NULL CHECK (threshold_percentage > 0 AND threshold_percentage <= 200), -- 80%, 90%, 100%, 150%, 200%

  -- Alert state
  is_active BOOLEAN DEFAULT true,
  alert_sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),

  -- Current state (for idempotency)
  current_percentage DECIMAL(5, 2) DEFAULT 0,

  -- Notification preferences
  notify_email BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  notify_webhook BOOLEAN DEFAULT false,
  webhook_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT overage_alerts_org_meter_threshold UNIQUE (organization_id, meter_type, threshold_percentage)
);

CREATE INDEX IF NOT EXISTS idx_overage_alerts_org ON overage_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_overage_alerts_active ON overage_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_overage_alerts_pending ON overage_alerts(organization_id, meter_type) WHERE alert_sent_at IS NULL AND is_active = true;

-- Create default alerts for all organizations
INSERT INTO overage_alerts (organization_id, meter_type, threshold_percentage)
SELECT
  o.id,
  meter.type,
  threshold.pct
FROM organizations o
CROSS JOIN (VALUES ('ai_tokens'), ('api_calls'), ('total_cost')) AS meter(type)
CROSS JOIN (VALUES (80), (90), (100)) AS threshold(pct)
ON CONFLICT (organization_id, meter_type, threshold_percentage) DO NOTHING;

-- =====================================================
-- 4. PLAN OVERAGE CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS plan_overage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL UNIQUE CHECK (plan IN ('free', 'starter', 'pro', 'team', 'business', 'enterprise')),

  -- Whether overage is allowed (or hard limit)
  overage_allowed BOOLEAN DEFAULT false,

  -- Included quotas per billing period
  included_ai_tokens BIGINT DEFAULT 0,
  included_api_calls BIGINT DEFAULT 0,
  included_storage_gb INTEGER DEFAULT 0,
  included_premium_model_tokens BIGINT DEFAULT 0,
  included_agent_runs INTEGER DEFAULT 0,

  -- Overage rates (per unit after quota exceeded)
  overage_rate_per_1k_tokens DECIMAL(10, 6) DEFAULT 0,
  overage_rate_per_api_call DECIMAL(10, 6) DEFAULT 0,
  overage_rate_per_gb DECIMAL(10, 6) DEFAULT 0,

  -- Caps (max overage before hard limit)
  max_overage_usd DECIMAL(10, 2), -- NULL = unlimited overage for enterprise

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert plan configuration
INSERT INTO plan_overage_config (
  plan, overage_allowed,
  included_ai_tokens, included_api_calls, included_storage_gb, included_premium_model_tokens, included_agent_runs,
  overage_rate_per_1k_tokens, overage_rate_per_api_call, overage_rate_per_gb, max_overage_usd
) VALUES
  ('free', false, 1000000, 0, 1, 0, 0, 0, 0, 0, 0),
  ('starter', true, 5000000, 1000, 10, 100000, 10, 0.002, 0.001, 0.50, 50),
  ('pro', true, 20000000, 10000, 50, 1000000, 50, 0.0015, 0.0008, 0.40, 200),
  ('team', true, 100000000, 50000, 200, 5000000, 200, 0.001, 0.0005, 0.30, 500),
  ('business', true, 500000000, 200000, 1000, 50000000, 1000, 0.0008, 0.0003, 0.20, 2000),
  ('enterprise', true, 2000000000, 1000000, 10000, 500000000, 10000, 0.0005, 0.0001, 0.10, NULL)
ON CONFLICT (plan) DO UPDATE SET
  overage_allowed = EXCLUDED.overage_allowed,
  included_ai_tokens = EXCLUDED.included_ai_tokens,
  included_api_calls = EXCLUDED.included_api_calls,
  included_storage_gb = EXCLUDED.included_storage_gb,
  included_premium_model_tokens = EXCLUDED.included_premium_model_tokens,
  included_agent_runs = EXCLUDED.included_agent_runs,
  overage_rate_per_1k_tokens = EXCLUDED.overage_rate_per_1k_tokens,
  overage_rate_per_api_call = EXCLUDED.overage_rate_per_api_call,
  overage_rate_per_gb = EXCLUDED.overage_rate_per_gb,
  max_overage_usd = EXCLUDED.max_overage_usd,
  updated_at = NOW();

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get or create usage meter for org
CREATE OR REPLACE FUNCTION get_or_create_usage_meter(
  p_org_id UUID,
  p_meter_type TEXT
)
RETURNS usage_meters
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meter usage_meters;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_plan TEXT;
  v_included_quota BIGINT;
  v_overage_rate DECIMAL(10, 6);
BEGIN
  v_period_start := DATE_TRUNC('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month';

  -- Try to get existing meter
  SELECT * INTO v_meter
  FROM usage_meters
  WHERE organization_id = p_org_id
    AND meter_type = p_meter_type
    AND billing_period_start = v_period_start;

  IF FOUND THEN
    RETURN v_meter;
  END IF;

  -- Get plan config for included quota
  SELECT s.plan INTO v_plan
  FROM subscriptions s
  WHERE s.organization_id = p_org_id;

  v_plan := COALESCE(v_plan, 'free');

  -- Get included quota based on meter type and plan
  SELECT
    CASE p_meter_type
      WHEN 'ai_tokens' THEN included_ai_tokens
      WHEN 'api_calls' THEN included_api_calls
      WHEN 'storage_gb' THEN included_storage_gb
      WHEN 'premium_models' THEN included_premium_model_tokens
      WHEN 'agents' THEN included_agent_runs
      ELSE 0
    END,
    CASE p_meter_type
      WHEN 'ai_tokens' THEN overage_rate_per_1k_tokens / 1000
      WHEN 'api_calls' THEN overage_rate_per_api_call
      WHEN 'storage_gb' THEN overage_rate_per_gb
      ELSE 0
    END
  INTO v_included_quota, v_overage_rate
  FROM plan_overage_config
  WHERE plan = v_plan;

  -- Create new meter
  INSERT INTO usage_meters (
    organization_id,
    meter_type,
    included_quota,
    overage_price_per_unit,
    billing_period_start,
    billing_period_end
  ) VALUES (
    p_org_id,
    p_meter_type,
    COALESCE(v_included_quota, 0),
    COALESCE(v_overage_rate, 0),
    v_period_start,
    v_period_end
  )
  RETURNING * INTO v_meter;

  RETURN v_meter;
END;
$$;

-- Function to increment usage meter
CREATE OR REPLACE FUNCTION increment_usage_meter(
  p_org_id UUID,
  p_meter_type TEXT,
  p_amount BIGINT
)
RETURNS usage_meters
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meter usage_meters;
BEGIN
  -- Ensure meter exists
  v_meter := get_or_create_usage_meter(p_org_id, p_meter_type);

  -- Increment usage
  UPDATE usage_meters
  SET
    current_usage = current_usage + p_amount,
    updated_at = NOW()
  WHERE id = v_meter.id
  RETURNING * INTO v_meter;

  RETURN v_meter;
END;
$$;

-- Function to check and trigger overage alerts
CREATE OR REPLACE FUNCTION check_overage_alerts(p_org_id UUID)
RETURNS TABLE (
  alert_id UUID,
  meter_type TEXT,
  threshold_percentage INTEGER,
  current_percentage DECIMAL,
  should_send BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH meter_percentages AS (
    SELECT
      um.meter_type,
      CASE
        WHEN um.included_quota = 0 THEN 100.0
        ELSE (um.current_usage::DECIMAL / um.included_quota * 100)
      END as current_pct
    FROM usage_meters um
    WHERE um.organization_id = p_org_id
      AND um.billing_period_start = DATE_TRUNC('month', NOW())
  )
  SELECT
    oa.id as alert_id,
    oa.meter_type,
    oa.threshold_percentage,
    mp.current_pct as current_percentage,
    (oa.is_active
      AND oa.alert_sent_at IS NULL
      AND mp.current_pct >= oa.threshold_percentage) as should_send
  FROM overage_alerts oa
  JOIN meter_percentages mp ON mp.meter_type = oa.meter_type
  WHERE oa.organization_id = p_org_id
    AND oa.is_active = true;
END;
$$;

-- Function to calculate model cost
CREATE OR REPLACE FUNCTION calculate_model_cost(
  p_model_id TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
)
RETURNS DECIMAL(10, 6)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_input_cost DECIMAL(10, 6);
  v_output_cost DECIMAL(10, 6);
BEGIN
  SELECT
    input_cost_per_1k,
    output_cost_per_1k
  INTO v_input_cost, v_output_cost
  FROM ai_model_pricing
  WHERE model_id = p_model_id;

  IF NOT FOUND THEN
    -- Default fallback pricing
    v_input_cost := 0.001;
    v_output_cost := 0.002;
  END IF;

  RETURN (p_input_tokens / 1000.0 * v_input_cost) + (p_output_tokens / 1000.0 * v_output_cost);
END;
$$;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE overage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_overage_config ENABLE ROW LEVEL SECURITY;

-- Usage meters: org members can view, system can update
CREATE POLICY "Users can view org usage meters"
  ON usage_meters FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage usage meters"
  ON usage_meters FOR ALL
  USING (true)
  WITH CHECK (true);

-- Model pricing: everyone can read
CREATE POLICY "Everyone can view model pricing"
  ON ai_model_pricing FOR SELECT
  USING (true);

-- Overage alerts: org members can view/manage
CREATE POLICY "Users can view org overage alerts"
  ON overage_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage org overage alerts"
  ON overage_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = overage_alerts.organization_id
        AND (p.role = 'admin' OR p.role = 'owner')
    )
  );

-- Plan config: everyone can read
CREATE POLICY "Everyone can view plan overage config"
  ON plan_overage_config FOR SELECT
  USING (true);

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_or_create_usage_meter TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage_meter TO authenticated;
GRANT EXECUTE ON FUNCTION check_overage_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_model_cost TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Hybrid Billing Enhancement installed successfully!';
  RAISE NOTICE 'Tables created: usage_meters, ai_model_pricing, overage_alerts, plan_overage_config';
  RAISE NOTICE 'Functions: get_or_create_usage_meter, increment_usage_meter, check_overage_alerts, calculate_model_cost';
END $$;
