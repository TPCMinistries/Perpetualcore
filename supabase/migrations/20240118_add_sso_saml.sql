-- Add SSO/SAML support
-- This migration adds tables and functions for Single Sign-On and SAML authentication

-- SSO Providers table - stores configuration for SSO/SAML providers
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider details
  provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oauth2', 'oidc')),
  provider_name TEXT NOT NULL, -- e.g., "Google Workspace", "Azure AD", "Okta"
  enabled BOOLEAN DEFAULT false,

  -- SAML Configuration
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_slo_url TEXT,
  saml_certificate TEXT,
  saml_signature_algorithm TEXT DEFAULT 'sha256',
  saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OAuth2/OIDC Configuration
  oauth_client_id TEXT,
  oauth_client_secret TEXT,
  oauth_authorization_url TEXT,
  oauth_token_url TEXT,
  oauth_user_info_url TEXT,
  oauth_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],

  -- Attribute mapping (JSON object mapping SSO attributes to our user fields)
  attribute_mapping JSONB DEFAULT '{
    "email": "email",
    "firstName": "given_name",
    "lastName": "family_name",
    "displayName": "name"
  }'::jsonb,

  -- Settings
  auto_provision_users BOOLEAN DEFAULT true, -- Automatically create users on first login
  enforce_sso BOOLEAN DEFAULT false, -- Require SSO login for this organization
  allowed_domains TEXT[], -- Email domains allowed to use this SSO

  -- Metadata
  created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, provider_name)
);

-- SSO Sessions table - tracks SSO login sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,

  -- Session data
  session_index TEXT, -- SAML SessionIndex
  name_id TEXT, -- SAML NameID
  external_user_id TEXT, -- ID from the SSO provider

  -- Tracking
  ip_address INET,
  user_agent TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO Login Attempts table - audit log of SSO login attempts
CREATE TABLE IF NOT EXISTS sso_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES sso_providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,

  -- Attempt details
  email TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  error_code TEXT,

  -- Request details
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sso_providers_org ON sso_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled ON sso_providers(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_provider ON sso_sessions(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires ON sso_sessions(expires_at) WHERE logout_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_provider ON sso_login_attempts(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_created ON sso_login_attempts(created_at);

-- Row Level Security
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for sso_providers
CREATE POLICY "Users can view their organization's SSO providers"
  ON sso_providers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage SSO providers"
  ON sso_providers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for sso_sessions
CREATE POLICY "Users can view their own SSO sessions"
  ON sso_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage SSO sessions"
  ON sso_sessions FOR ALL
  USING (true);

-- Policies for sso_login_attempts
CREATE POLICY "Organization admins can view SSO login attempts"
  ON sso_login_attempts FOR SELECT
  USING (
    provider_id IN (
      SELECT sp.id FROM sso_providers sp
      INNER JOIN user_profiles up ON up.organization_id = sp.organization_id
      WHERE up.user_id = auth.uid() AND up.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert SSO login attempts"
  ON sso_login_attempts FOR INSERT
  WITH CHECK (true);

-- Function to get organization's SSO configuration
CREATE OR REPLACE FUNCTION get_organization_sso_config(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  provider_type TEXT,
  provider_name TEXT,
  enabled BOOLEAN,
  enforce_sso BOOLEAN,
  allowed_domains TEXT[],
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  oauth_authorization_url TEXT,
  oauth_client_id TEXT,
  oauth_scopes TEXT[]
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.provider_type,
    sp.provider_name,
    sp.enabled,
    sp.enforce_sso,
    sp.allowed_domains,
    sp.saml_entity_id,
    sp.saml_sso_url,
    sp.oauth_authorization_url,
    sp.oauth_client_id,
    sp.oauth_scopes
  FROM sso_providers sp
  WHERE sp.organization_id = p_org_id
    AND sp.enabled = true
  ORDER BY sp.created_at;
END;
$$;

-- Function to check if email domain requires SSO
CREATE OR REPLACE FUNCTION check_sso_required(p_email TEXT)
RETURNS TABLE (
  required BOOLEAN,
  provider_id UUID,
  provider_name TEXT,
  provider_type TEXT,
  organization_id UUID
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_domain TEXT;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  RETURN QUERY
  SELECT
    sp.enforce_sso as required,
    sp.id as provider_id,
    sp.provider_name,
    sp.provider_type,
    sp.organization_id
  FROM sso_providers sp
  WHERE sp.enabled = true
    AND sp.enforce_sso = true
    AND v_domain = ANY(sp.allowed_domains)
  LIMIT 1;
END;
$$;

-- Function to cleanup expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete sessions that have expired
  DELETE FROM sso_sessions
  WHERE expires_at < NOW()
    AND logout_at IS NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- Function to log SSO login attempt
CREATE OR REPLACE FUNCTION log_sso_login_attempt(
  p_provider_id UUID,
  p_user_id UUID,
  p_email TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO sso_login_attempts (
    provider_id,
    user_id,
    email,
    success,
    error_message,
    error_code,
    ip_address,
    user_agent
  ) VALUES (
    p_provider_id,
    p_user_id,
    p_email,
    p_success,
    p_error_message,
    p_error_code,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sso_providers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_sso_providers_timestamp
  BEFORE UPDATE ON sso_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_sso_providers_updated_at();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_organization_sso_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_sso_required(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sso_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION log_sso_login_attempt(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, INET, TEXT) TO authenticated;

COMMENT ON TABLE sso_providers IS 'Configuration for SSO/SAML identity providers';
COMMENT ON TABLE sso_sessions IS 'Active SSO login sessions';
COMMENT ON TABLE sso_login_attempts IS 'Audit log of SSO login attempts';
