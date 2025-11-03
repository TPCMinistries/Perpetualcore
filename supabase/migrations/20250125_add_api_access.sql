-- API Access Infrastructure
-- Enables pay-per-call API access with usage tracking and billing

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key details
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key for security
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_prod_")

  -- Environment
  environment TEXT NOT NULL CHECK (environment IN ('production', 'development', 'test')),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Usage tracking
  total_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create api_usage table for detailed tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,

  -- AI model details (if applicable)
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,

  -- Cost calculation
  cost_usd DECIMAL(10, 6),

  -- Performance metrics
  response_time_ms INTEGER,

  -- Metadata
  user_agent TEXT,
  ip_address INET,
  request_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_usage_aggregates table for efficient querying
CREATE TABLE IF NOT EXISTS api_usage_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregated metrics
  total_requests BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10, 2) DEFAULT 0,

  -- By model
  usage_by_model JSONB DEFAULT '{}'::jsonb,

  -- By endpoint
  usage_by_endpoint JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for period
  UNIQUE(user_id, organization_id, period_type, period_start)
);

-- Create api_billing table
CREATE TABLE IF NOT EXISTS api_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Billing period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Usage details
  total_requests BIGINT DEFAULT 0,
  included_requests BIGINT DEFAULT 0, -- From subscription
  overage_requests BIGINT DEFAULT 0,

  -- Costs
  subscription_cost_usd DECIMAL(10, 2) DEFAULT 0,
  usage_cost_usd DECIMAL(10, 2) DEFAULT 0,
  total_cost_usd DECIMAL(10, 2) DEFAULT 0,

  -- Payment
  stripe_invoice_id TEXT,
  paid_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, organization_id, billing_period_start)
);

-- Create api_rate_limits table for tracking rate limit violations
CREATE TABLE IF NOT EXISTS api_rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Violation details
  limit_type TEXT NOT NULL CHECK (limit_type IN ('per_minute', 'per_day', 'per_month')),
  current_count BIGINT NOT NULL,
  limit_value BIGINT NOT NULL,

  -- Context
  endpoint TEXT,
  ip_address INET,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX idx_api_usage_key ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_org ON api_usage(organization_id);
CREATE INDEX idx_api_usage_created ON api_usage(created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_model ON api_usage(model);

CREATE INDEX idx_api_usage_aggregates_user ON api_usage_aggregates(user_id);
CREATE INDEX idx_api_usage_aggregates_org ON api_usage_aggregates(organization_id);
CREATE INDEX idx_api_usage_aggregates_period ON api_usage_aggregates(period_type, period_start);

CREATE INDEX idx_api_billing_user ON api_billing(user_id);
CREATE INDEX idx_api_billing_org ON api_billing(organization_id);
CREATE INDEX idx_api_billing_period ON api_billing(billing_period_start);
CREATE INDEX idx_api_billing_status ON api_billing(status);

CREATE INDEX idx_api_rate_violations_key ON api_rate_limit_violations(api_key_id);
CREATE INDEX idx_api_rate_violations_created ON api_rate_limit_violations(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER api_usage_aggregates_updated_at
  BEFORE UPDATE ON api_usage_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER api_billing_updated_at
  BEFORE UPDATE ON api_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- API Usage policies
CREATE POLICY "Users can view their own usage"
  ON api_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- API Usage Aggregates policies
CREATE POLICY "Users can view their own usage aggregates"
  ON api_usage_aggregates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- API Billing policies
CREATE POLICY "Users can view their own billing"
  ON api_billing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Rate Limit Violations policies
CREATE POLICY "Users can view their own rate limit violations"
  ON api_rate_limit_violations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate API key prefix based on environment
CREATE OR REPLACE FUNCTION generate_api_key_prefix(env TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE env
    WHEN 'production' THEN 'sk_prod_'
    WHEN 'development' THEN 'sk_dev_'
    WHEN 'test' THEN 'sk_test_'
    ELSE 'sk_'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate usage data (to be called periodically)
CREATE OR REPLACE FUNCTION aggregate_api_usage(
  agg_user_id UUID,
  agg_org_id UUID,
  agg_period_type TEXT,
  agg_period_start TIMESTAMPTZ,
  agg_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  v_total_requests BIGINT;
  v_total_tokens BIGINT;
  v_total_cost DECIMAL(10, 2);
  v_usage_by_model JSONB;
  v_usage_by_endpoint JSONB;
BEGIN
  -- Calculate aggregates
  SELECT
    COUNT(*),
    COALESCE(SUM(total_tokens), 0),
    COALESCE(SUM(cost_usd), 0)
  INTO v_total_requests, v_total_tokens, v_total_cost
  FROM api_usage
  WHERE user_id = agg_user_id
    AND organization_id = agg_org_id
    AND created_at >= agg_period_start
    AND created_at < agg_period_end;

  -- Aggregate by model
  SELECT jsonb_object_agg(model, model_stats)
  INTO v_usage_by_model
  FROM (
    SELECT
      model,
      jsonb_build_object(
        'requests', COUNT(*),
        'tokens', COALESCE(SUM(total_tokens), 0),
        'cost', COALESCE(SUM(cost_usd), 0)
      ) as model_stats
    FROM api_usage
    WHERE user_id = agg_user_id
      AND organization_id = agg_org_id
      AND created_at >= agg_period_start
      AND created_at < agg_period_end
      AND model IS NOT NULL
    GROUP BY model
  ) model_agg;

  -- Aggregate by endpoint
  SELECT jsonb_object_agg(endpoint, endpoint_stats)
  INTO v_usage_by_endpoint
  FROM (
    SELECT
      endpoint,
      jsonb_build_object(
        'requests', COUNT(*),
        'avg_response_time_ms', AVG(response_time_ms)
      ) as endpoint_stats
    FROM api_usage
    WHERE user_id = agg_user_id
      AND organization_id = agg_org_id
      AND created_at >= agg_period_start
      AND created_at < agg_period_end
    GROUP BY endpoint
  ) endpoint_agg;

  -- Insert or update aggregate
  INSERT INTO api_usage_aggregates (
    user_id,
    organization_id,
    period_type,
    period_start,
    period_end,
    total_requests,
    total_tokens,
    total_cost_usd,
    usage_by_model,
    usage_by_endpoint
  ) VALUES (
    agg_user_id,
    agg_org_id,
    agg_period_type,
    agg_period_start,
    agg_period_end,
    v_total_requests,
    v_total_tokens,
    v_total_cost,
    COALESCE(v_usage_by_model, '{}'::jsonb),
    COALESCE(v_usage_by_endpoint, '{}'::jsonb)
  )
  ON CONFLICT (user_id, organization_id, period_type, period_start)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    total_tokens = EXCLUDED.total_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    usage_by_model = EXCLUDED.usage_by_model,
    usage_by_endpoint = EXCLUDED.usage_by_endpoint,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to AI OS';
COMMENT ON TABLE api_usage IS 'Detailed API usage logs for billing and analytics';
COMMENT ON TABLE api_usage_aggregates IS 'Aggregated API usage metrics for faster queries';
COMMENT ON TABLE api_billing IS 'Monthly API billing records';
COMMENT ON TABLE api_rate_limit_violations IS 'Rate limit violation tracking';
