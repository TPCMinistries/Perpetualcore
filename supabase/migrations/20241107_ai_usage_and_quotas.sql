-- =====================================================
-- AI USAGE TRACKING & QUOTA SYSTEM
-- Tracks AI usage per user and enforces tier-based quotas
-- =====================================================

-- =====================================================
-- PART 1: USAGE TRACKING
-- =====================================================

-- Track every AI request for billing and analytics
CREATE TABLE IF NOT EXISTS user_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Usage details
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  model TEXT NOT NULL, -- 'claude-opus-4', 'gpt-4o', etc.
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  total_tokens INT GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  total_cost DECIMAL(10, 6) NOT NULL, -- dollars

  -- Context (optional but useful for analytics)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  task_type TEXT, -- 'code', 'writing', 'analysis', 'general', etc.
  was_auto_selected BOOLEAN DEFAULT false, -- was model auto-selected?
  selected_by_routing BOOLEAN DEFAULT false, -- was there a fallback?

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries (one row per user/date/model combo)
  CONSTRAINT unique_user_date_model UNIQUE (user_id, date, model)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_date ON user_ai_usage(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_org_date ON user_ai_usage(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_conversation ON user_ai_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_cost ON user_ai_usage(total_cost DESC);

-- RLS Policies for user_ai_usage
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
  ON user_ai_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI usage"
  ON user_ai_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all usage in their org
CREATE POLICY "Admins can view org AI usage"
  ON user_ai_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (up.is_admin = true OR up.is_super_admin = true)
      AND organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- PART 2: USER QUOTAS (TIER-BASED LIMITS)
-- =====================================================

-- Define quotas based on subscription tier
CREATE TABLE IF NOT EXISTS user_ai_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Subscription tier
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'business', 'enterprise')),

  -- Daily limits
  max_tokens_per_day INT NOT NULL DEFAULT 50000, -- 50k for free tier
  tokens_used_today INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,

  -- Monthly limits
  max_tokens_per_month INT NOT NULL DEFAULT 1000000, -- 1M for free tier
  tokens_used_this_month INT DEFAULT 0,
  month_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,

  -- Model permissions
  can_use_premium_models BOOLEAN DEFAULT false,
  allowed_models TEXT[] DEFAULT ARRAY['gpt-4o-mini', 'gemini-2.0-flash-exp'],

  -- Cost limits (optional - for enterprise custom limits)
  max_cost_per_month DECIMAL(10, 2),
  cost_spent_this_month DECIMAL(10, 6) DEFAULT 0,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_quotas_org ON user_ai_quotas(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_quotas_tier ON user_ai_quotas(tier);

-- RLS Policies for user_ai_quotas
ALTER TABLE user_ai_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quota"
  ON user_ai_quotas FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own quota"
  ON user_ai_quotas FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can manage quotas
CREATE POLICY "Admins can manage org quotas"
  ON user_ai_quotas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (up.is_admin = true OR up.is_super_admin = true)
      AND organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- PART 3: HELPER FUNCTIONS
-- =====================================================

-- Function to get or create user quota (with defaults based on tier)
CREATE OR REPLACE FUNCTION get_or_create_user_quota(p_user_id UUID)
RETURNS user_ai_quotas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota user_ai_quotas;
  v_org_id UUID;
BEGIN
  -- Try to get existing quota
  SELECT * INTO v_quota
  FROM user_ai_quotas
  WHERE user_id = p_user_id;

  -- If exists, return it
  IF FOUND THEN
    RETURN v_quota;
  END IF;

  -- Otherwise, create default quota
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM profiles
  WHERE id = p_user_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User % has no organization', p_user_id;
  END IF;

  -- Insert default free tier quota
  INSERT INTO user_ai_quotas (
    user_id,
    organization_id,
    tier,
    max_tokens_per_day,
    max_tokens_per_month,
    can_use_premium_models,
    allowed_models
  ) VALUES (
    p_user_id,
    v_org_id,
    'free',
    50000, -- 50k tokens/day
    1000000, -- 1M tokens/month
    false,
    ARRAY['gpt-4o-mini', 'gemini-2.0-flash-exp']
  )
  RETURNING * INTO v_quota;

  RETURN v_quota;
END;
$$;

-- Function to check if user can make a request
CREATE OR REPLACE FUNCTION can_use_tokens(
  p_user_id UUID,
  p_estimated_tokens INT,
  p_model TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota user_ai_quotas;
  v_result JSONB;
BEGIN
  -- Get or create quota
  v_quota := get_or_create_user_quota(p_user_id);

  -- Reset daily counter if new day
  IF v_quota.last_reset_date < CURRENT_DATE THEN
    UPDATE user_ai_quotas
    SET tokens_used_today = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;

    v_quota.tokens_used_today := 0;
  END IF;

  -- Reset monthly counter if new month
  IF v_quota.month_start_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    UPDATE user_ai_quotas
    SET tokens_used_this_month = 0,
        cost_spent_this_month = 0,
        month_start_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
    WHERE user_id = p_user_id;

    v_quota.tokens_used_this_month := 0;
  END IF;

  -- Check daily quota
  IF v_quota.tokens_used_today + p_estimated_tokens > v_quota.max_tokens_per_day THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily quota exceeded',
      'daily_limit', v_quota.max_tokens_per_day,
      'daily_used', v_quota.tokens_used_today,
      'monthly_limit', v_quota.max_tokens_per_month,
      'monthly_used', v_quota.tokens_used_this_month
    );
  END IF;

  -- Check monthly quota
  IF v_quota.tokens_used_this_month + p_estimated_tokens > v_quota.max_tokens_per_month THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly quota exceeded',
      'daily_limit', v_quota.max_tokens_per_day,
      'daily_used', v_quota.tokens_used_today,
      'monthly_limit', v_quota.max_tokens_per_month,
      'monthly_used', v_quota.tokens_used_this_month
    );
  END IF;

  -- Check model permissions (premium models)
  IF p_model IN ('claude-opus-4', 'gpt-4o') AND NOT v_quota.can_use_premium_models THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Premium models not available on ' || v_quota.tier || ' tier',
      'tier', v_quota.tier,
      'model', p_model
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'tier', v_quota.tier,
    'daily_remaining', v_quota.max_tokens_per_day - v_quota.tokens_used_today,
    'monthly_remaining', v_quota.max_tokens_per_month - v_quota.tokens_used_this_month
  );
END;
$$;

-- Function to record usage after a request completes
CREATE OR REPLACE FUNCTION record_ai_usage(
  p_user_id UUID,
  p_model TEXT,
  p_input_tokens INT,
  p_output_tokens INT,
  p_cost DECIMAL,
  p_conversation_id UUID DEFAULT NULL,
  p_task_type TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get organization ID
  SELECT organization_id INTO v_org_id
  FROM profiles
  WHERE id = p_user_id;

  -- Insert usage record (or update if exists for this user/date/model)
  INSERT INTO user_ai_usage (
    user_id,
    organization_id,
    date,
    model,
    input_tokens,
    output_tokens,
    total_cost,
    conversation_id,
    task_type
  ) VALUES (
    p_user_id,
    v_org_id,
    CURRENT_DATE,
    p_model,
    p_input_tokens,
    p_output_tokens,
    p_cost,
    p_conversation_id,
    p_task_type
  )
  ON CONFLICT (user_id, date, model)
  DO UPDATE SET
    input_tokens = user_ai_usage.input_tokens + p_input_tokens,
    output_tokens = user_ai_usage.output_tokens + p_output_tokens,
    total_cost = user_ai_usage.total_cost + p_cost;

  -- Update quota counters
  UPDATE user_ai_quotas
  SET
    tokens_used_today = tokens_used_today + p_input_tokens + p_output_tokens,
    tokens_used_this_month = tokens_used_this_month + p_input_tokens + p_output_tokens,
    cost_spent_this_month = cost_spent_this_month + p_cost,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_user_quota TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION record_ai_usage TO authenticated;

-- =====================================================
-- PART 4: VIEWS FOR ANALYTICS
-- =====================================================

-- Daily usage summary
CREATE OR REPLACE VIEW daily_ai_usage_summary AS
SELECT
  date,
  model,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost) as total_cost,
  AVG(total_cost) as avg_cost_per_user
FROM user_ai_usage
GROUP BY date, model
ORDER BY date DESC, total_cost DESC;

-- User usage summary
CREATE OR REPLACE VIEW user_ai_usage_summary AS
SELECT
  u.user_id,
  p.email,
  p.full_name,
  q.tier,
  SUM(u.total_tokens) as total_tokens_all_time,
  SUM(u.total_cost) as total_cost_all_time,
  COUNT(DISTINCT u.date) as days_active,
  q.tokens_used_today,
  q.tokens_used_this_month,
  q.max_tokens_per_day,
  q.max_tokens_per_month,
  ROUND(100.0 * q.tokens_used_this_month / NULLIF(q.max_tokens_per_month, 0), 1) as monthly_quota_used_pct
FROM user_ai_usage u
JOIN profiles p ON u.user_id = p.id
LEFT JOIN user_ai_quotas q ON u.user_id = q.user_id
GROUP BY u.user_id, p.email, p.full_name, q.tier, q.tokens_used_today, q.tokens_used_this_month, q.max_tokens_per_day, q.max_tokens_per_month;

-- =====================================================
-- PART 5: INITIALIZE QUOTAS FOR EXISTING USERS
-- =====================================================

-- Create default quota for all existing users who don't have one
INSERT INTO user_ai_quotas (user_id, organization_id, tier, max_tokens_per_day, max_tokens_per_month, can_use_premium_models, allowed_models)
SELECT
  p.id,
  p.organization_id,
  'free',
  50000,
  1000000,
  false,
  ARRAY['gpt-4o-mini', 'gemini-2.0-flash-exp']
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_ai_quotas q WHERE q.user_id = p.id
)
AND p.organization_id IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ AI Usage & Quota System installed successfully!';
  RAISE NOTICE 'Tables created: user_ai_usage, user_ai_quotas';
  RAISE NOTICE 'Functions created: get_or_create_user_quota, can_use_tokens, record_ai_usage';
  RAISE NOTICE 'Views created: daily_ai_usage_summary, user_ai_usage_summary';
END $$;
