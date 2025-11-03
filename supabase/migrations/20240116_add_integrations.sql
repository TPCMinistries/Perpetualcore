-- Migration: Add third-party integrations (Slack, Zoom, Google Drive)
-- Created: 2024-01-16

-- 1. Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'slack', 'zoom', 'google_drive', etc.
  provider_user_id TEXT, -- ID of user on the provider's platform
  provider_team_id TEXT, -- Team/workspace ID (for Slack, etc.)
  access_token TEXT NOT NULL, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  token_expires_at TIMESTAMPTZ, -- When access token expires
  scopes TEXT[], -- Granted OAuth scopes
  metadata JSONB DEFAULT '{}', -- Additional provider-specific data
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, provider, provider_user_id)
);

-- 2. Create integration_actions table (for tracking integration usage)
CREATE TABLE IF NOT EXISTS integration_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'slack_message', 'zoom_meeting', 'drive_upload', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  request_data JSONB, -- What was requested
  response_data JSONB, -- Response from provider
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_integration_actions_integration_id ON integration_actions(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_actions_created_at ON integration_actions(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_actions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for integrations
CREATE POLICY "Users can view integrations in their organization"
  ON integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create integrations in their organization"
  ON integrations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own integrations"
  ON integrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations"
  ON integrations FOR DELETE
  USING (user_id = auth.uid());

-- 6. RLS Policies for integration_actions
CREATE POLICY "Users can view integration actions in their organization"
  ON integration_actions FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM integrations WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create integration actions"
  ON integration_actions FOR INSERT
  WITH CHECK (
    integration_id IN (
      SELECT id FROM integrations WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 7. Function to update integration updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_updated_at();

-- 8. Function to refresh expired tokens (placeholder - implement in app code)
CREATE OR REPLACE FUNCTION check_expired_integrations()
RETURNS TABLE(id UUID, provider TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.provider
  FROM integrations i
  WHERE i.is_active = true
    AND i.token_expires_at IS NOT NULL
    AND i.token_expires_at < NOW() + INTERVAL '5 minutes'
    AND i.refresh_token IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Comments for documentation
COMMENT ON TABLE integrations IS 'OAuth integrations with third-party services (Slack, Zoom, Google Drive)';
COMMENT ON TABLE integration_actions IS 'Log of actions performed through integrations';
COMMENT ON COLUMN integrations.access_token IS 'Encrypted OAuth access token - MUST be encrypted in application';
COMMENT ON COLUMN integrations.refresh_token IS 'Encrypted OAuth refresh token - MUST be encrypted in application';
COMMENT ON COLUMN integrations.scopes IS 'Array of OAuth scopes granted by the user';
COMMENT ON COLUMN integrations.metadata IS 'Provider-specific metadata (team name, workspace URL, etc.)';
