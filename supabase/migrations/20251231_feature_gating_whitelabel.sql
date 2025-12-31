-- =====================================================
-- FEATURE GATING & WHITE-LABEL SYSTEM
-- Phase 2: Advanced feature flags, tier gating, white-label
-- =====================================================

-- =====================================================
-- 1. FEATURE FLAGS
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Feature identification
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- URL-safe identifier
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',

  -- Tier requirements (JSONB for flexibility)
  -- Format: { "free": false, "starter": true, "pro": true, ... }
  -- Can also be numbers for limits: { "free": 0, "starter": 5, "pro": -1 }
  tier_access JSONB NOT NULL DEFAULT '{}',

  -- Feature state
  is_enabled BOOLEAN DEFAULT true, -- Global kill switch
  is_beta BOOLEAN DEFAULT false,
  is_deprecated BOOLEAN DEFAULT false,

  -- Rollout (for gradual feature releases)
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert core features
INSERT INTO feature_flags (name, slug, category, tier_access, description) VALUES
  -- AI Features
  ('Basic AI Models', 'basic_ai_models', 'ai', '{"free": true, "starter": true, "pro": true, "team": true, "business": true, "enterprise": true}', 'Access to GPT-4o Mini, Gemini Flash'),
  ('Premium AI Models', 'premium_ai_models', 'ai', '{"free": false, "starter": 100, "pro": -1, "team": -1, "business": -1, "enterprise": -1}', 'Access to Claude Opus, GPT-4o (number = monthly limit, -1 = unlimited)'),
  ('AI Agents', 'ai_agents', 'ai', '{"free": false, "starter": 1, "pro": 5, "team": 10, "business": 50, "enterprise": -1}', 'Autonomous AI agents'),
  ('Custom AI Training', 'custom_training', 'ai', '{"free": false, "starter": false, "pro": false, "team": false, "business": true, "enterprise": true}', 'Fine-tune AI on your data'),

  -- Integrations
  ('n8n Integration', 'n8n_integration', 'integrations', '{"free": false, "starter": false, "pro": true, "team": true, "business": true, "enterprise": true}', 'Connect to n8n workflows'),
  ('Custom Bots', 'custom_bots', 'integrations', '{"free": false, "starter": false, "pro": 3, "team": 10, "business": 50, "enterprise": -1}', 'Build custom bot automations'),
  ('API Access', 'api_access', 'integrations', '{"free": false, "starter": false, "pro": true, "team": true, "business": true, "enterprise": true}', 'REST API access'),
  ('Webhooks', 'webhooks', 'integrations', '{"free": false, "starter": false, "pro": 5, "team": 20, "business": 100, "enterprise": -1}', 'Outgoing webhook notifications'),
  ('Email Integration', 'email_integration', 'integrations', '{"free": false, "starter": true, "pro": true, "team": true, "business": true, "enterprise": true}', 'Gmail/Outlook sync'),
  ('Calendar Integration', 'calendar_integration', 'integrations', '{"free": false, "starter": true, "pro": true, "team": true, "business": true, "enterprise": true}', 'Google/Outlook calendar'),
  ('WhatsApp', 'whatsapp', 'integrations', '{"free": false, "starter": false, "pro": false, "team": false, "business": true, "enterprise": true}', 'WhatsApp Business integration'),
  ('Slack Integration', 'slack_integration', 'integrations', '{"free": false, "starter": false, "pro": false, "team": true, "business": true, "enterprise": true}', 'Slack workspace integration'),

  -- Team Features
  ('Team Members', 'team_members', 'team', '{"free": 1, "starter": 1, "pro": 1, "team": 10, "business": 50, "enterprise": 250}', 'Number of team members allowed'),
  ('SSO/SAML', 'sso_saml', 'team', '{"free": false, "starter": false, "pro": false, "team": true, "business": true, "enterprise": true}', 'Single sign-on'),
  ('Role-Based Access', 'rbac', 'team', '{"free": false, "starter": false, "pro": false, "team": true, "business": true, "enterprise": true}', 'Custom roles and permissions'),
  ('Audit Logs', 'audit_logs', 'team', '{"free": false, "starter": false, "pro": false, "team": false, "business": true, "enterprise": true}', 'Security audit trail'),

  -- Storage & Documents
  ('Document Storage', 'document_storage_gb', 'storage', '{"free": 1, "starter": 10, "pro": 50, "team": 200, "business": 1000, "enterprise": -1}', 'Storage in GB'),
  ('Document Upload', 'document_upload', 'storage', '{"free": 5, "starter": -1, "pro": -1, "team": -1, "business": -1, "enterprise": -1}', 'Number of documents (-1 = unlimited)'),

  -- Workflows
  ('Workflow Automations', 'workflows', 'automation', '{"free": 5, "starter": -1, "pro": -1, "team": -1, "business": -1, "enterprise": -1}', 'Active workflow automations'),

  -- Branding
  ('White Label', 'white_label', 'branding', '{"free": false, "starter": false, "pro": false, "team": false, "business": false, "enterprise": true}', 'Remove PerpetualCore branding'),
  ('Custom Domain', 'custom_domain', 'branding', '{"free": false, "starter": false, "pro": false, "team": false, "business": false, "enterprise": true}', 'Use your own domain'),
  ('Custom Logo', 'custom_logo', 'branding', '{"free": false, "starter": false, "pro": false, "team": false, "business": true, "enterprise": true}', 'Upload custom logo'),

  -- Support
  ('Priority Support', 'priority_support', 'support', '{"free": false, "starter": true, "pro": true, "team": true, "business": true, "enterprise": true}', 'Priority email support'),
  ('Dedicated Success Manager', 'dedicated_csm', 'support', '{"free": false, "starter": false, "pro": false, "team": true, "business": true, "enterprise": true}', 'Dedicated customer success'),
  ('Phone Support', 'phone_support', 'support', '{"free": false, "starter": false, "pro": false, "team": false, "business": true, "enterprise": true}', 'Phone support access'),
  ('24/7 Support', 'support_24_7', 'support', '{"free": false, "starter": false, "pro": false, "team": false, "business": false, "enterprise": true}', 'Round-the-clock support')
ON CONFLICT (slug) DO UPDATE SET
  tier_access = EXCLUDED.tier_access,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- 2. ORGANIZATION FEATURE OVERRIDES
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Override value (can be boolean or number)
  is_enabled BOOLEAN, -- NULL means use default
  limit_override INTEGER, -- Override the numeric limit

  -- Validity period (for trials, promotions)
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Audit
  granted_by UUID REFERENCES auth.users(id),
  reason TEXT, -- "Trial", "Enterprise negotiation", etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT org_feature_unique UNIQUE (organization_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_overrides_org ON organization_feature_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_feature_overrides_active ON organization_feature_overrides(organization_id)
  WHERE (expires_at IS NULL OR expires_at > NOW());

-- =====================================================
-- 3. WHITE-LABEL CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Domain
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  domain_verification_token TEXT,
  domain_verified_at TIMESTAMPTZ,

  -- Branding
  logo_url TEXT,
  logo_dark_url TEXT, -- For dark mode
  favicon_url TEXT,

  -- Colors (hex codes)
  primary_color TEXT DEFAULT '#3B82F6', -- Blue
  secondary_color TEXT,
  accent_color TEXT,

  -- Text
  company_name TEXT,
  tagline TEXT,
  support_email TEXT,
  support_url TEXT,

  -- Footer
  hide_powered_by BOOLEAN DEFAULT false,
  custom_footer_text TEXT,
  footer_links JSONB DEFAULT '[]', -- [{"label": "Terms", "url": "..."}]

  -- Login/Signup
  login_background_url TEXT,
  welcome_message TEXT,

  -- CSS overrides (advanced)
  custom_css TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_white_label_domain ON white_label_configs(custom_domain) WHERE custom_domain IS NOT NULL;

-- =====================================================
-- 4. BETA ACCESS
-- =====================================================
CREATE TABLE IF NOT EXISTS beta_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who has access
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What feature
  feature_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Access period
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  invited_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Unique indexes for beta access (handles NULL values properly)
CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_access_org_feature
  ON beta_access(organization_id, feature_id)
  WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_access_user_feature
  ON beta_access(user_id, feature_id)
  WHERE user_id IS NOT NULL;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Check if organization has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(
  p_org_id UUID,
  p_feature_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_feature feature_flags;
  v_override organization_feature_overrides;
  v_plan TEXT;
  v_tier_value JSONB;
  v_result JSONB;
BEGIN
  -- Get the feature
  SELECT * INTO v_feature
  FROM feature_flags
  WHERE slug = p_feature_slug AND is_enabled = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Feature not found or disabled');
  END IF;

  -- Check for organization override
  SELECT * INTO v_override
  FROM organization_feature_overrides
  WHERE organization_id = p_org_id
    AND feature_id = v_feature.id
    AND (expires_at IS NULL OR expires_at > NOW());

  IF FOUND THEN
    -- Has override
    IF v_override.is_enabled = false THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Feature disabled for organization');
    END IF;

    IF v_override.is_enabled = true OR v_override.limit_override IS NOT NULL THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'limit', COALESCE(v_override.limit_override, -1),
        'source', 'override',
        'expires_at', v_override.expires_at
      );
    END IF;
  END IF;

  -- Get organization's plan
  SELECT s.plan INTO v_plan
  FROM subscriptions s
  WHERE s.organization_id = p_org_id;

  v_plan := COALESCE(v_plan, 'free');

  -- Get tier access value
  v_tier_value := v_feature.tier_access -> v_plan;

  IF v_tier_value IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Feature not configured for plan');
  END IF;

  -- Check boolean access
  IF jsonb_typeof(v_tier_value) = 'boolean' THEN
    IF v_tier_value::boolean THEN
      RETURN jsonb_build_object('allowed', true, 'limit', -1, 'source', 'plan');
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'Feature not available on ' || v_plan || ' plan');
    END IF;
  END IF;

  -- Check numeric access (limit)
  IF jsonb_typeof(v_tier_value) = 'number' THEN
    IF (v_tier_value::integer) = 0 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Feature not available on ' || v_plan || ' plan');
    ELSIF (v_tier_value::integer) = -1 THEN
      RETURN jsonb_build_object('allowed', true, 'limit', -1, 'source', 'plan');
    ELSE
      RETURN jsonb_build_object('allowed', true, 'limit', v_tier_value::integer, 'source', 'plan');
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', false, 'reason', 'Invalid feature configuration');
END;
$$;

-- Get all features for an organization with access status
CREATE OR REPLACE FUNCTION get_organization_features(p_org_id UUID)
RETURNS TABLE (
  feature_slug TEXT,
  feature_name TEXT,
  category TEXT,
  allowed BOOLEAN,
  feature_limit INTEGER,
  source TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.slug as feature_slug,
    f.name as feature_name,
    f.category,
    (check_feature_access(p_org_id, f.slug) ->> 'allowed')::boolean as allowed,
    (check_feature_access(p_org_id, f.slug) ->> 'limit')::integer as feature_limit,
    check_feature_access(p_org_id, f.slug) ->> 'source' as source,
    (check_feature_access(p_org_id, f.slug) ->> 'expires_at')::timestamptz as expires_at
  FROM feature_flags f
  WHERE f.is_enabled = true
  ORDER BY f.category, f.name;
END;
$$;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_access ENABLE ROW LEVEL SECURITY;

-- Feature flags: everyone can read
CREATE POLICY "Everyone can view feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Feature overrides: org members can view
CREATE POLICY "Org members can view feature overrides"
  ON organization_feature_overrides FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can manage overrides
CREATE POLICY "Admins can manage feature overrides"
  ON organization_feature_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organization_feature_overrides.organization_id
        AND (p.role = 'admin' OR p.role = 'owner')
    )
  );

-- White label: org members can view
CREATE POLICY "Org members can view white label config"
  ON white_label_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can manage white label
CREATE POLICY "Admins can manage white label config"
  ON white_label_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = white_label_configs.organization_id
        AND (p.role = 'admin' OR p.role = 'owner')
    )
  );

-- Beta access
CREATE POLICY "Users can view their beta access"
  ON beta_access FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION check_feature_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_features TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Feature Gating & White-Label System installed!';
  RAISE NOTICE 'Tables: feature_flags, organization_feature_overrides, white_label_configs, beta_access';
  RAISE NOTICE 'Functions: check_feature_access, get_organization_features';
END $$;
