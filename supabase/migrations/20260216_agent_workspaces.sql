-- Agent Workspaces + Channel Pairing: Multi-persona routing with DM security
-- Phase 3 of OpenClaw Competitive Upgrade

-- Agent workspaces - isolated personas per channel/use case
CREATE TABLE IF NOT EXISTS agent_workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  persona JSONB DEFAULT '{}', -- AgentPersona: display_name, tone, system_prompt_override, greeting, signature
  channel_bindings JSONB DEFAULT '[]', -- Array of ChannelBinding: channel_type, channel_identifier, match_all
  context_filter JSONB DEFAULT '{}', -- ContextFilter: include/exclude tags, folders, groups
  skill_overrides JSONB DEFAULT '[]', -- Array of skill IDs
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_workspaces_user
  ON agent_workspaces(user_id, is_active);

-- Ensure at most one default workspace per user
CREATE UNIQUE INDEX idx_agent_workspaces_default
  ON agent_workspaces(user_id)
  WHERE is_default = TRUE;

ALTER TABLE agent_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_workspaces" ON agent_workspaces
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_workspaces" ON agent_workspaces
  FOR ALL USING (auth.role() = 'service_role');

-- Channel pairing codes - 6-digit verification for unknown DM senders
CREATE TABLE IF NOT EXISTS channel_pairing_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pairing_codes_lookup
  ON channel_pairing_codes(code, channel_type, channel_user_id)
  WHERE used_at IS NULL;

CREATE INDEX idx_pairing_codes_expiry
  ON channel_pairing_codes(expires_at)
  WHERE used_at IS NULL;

ALTER TABLE channel_pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_pairing_codes" ON channel_pairing_codes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_pairing" ON channel_pairing_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Channel links - maps external channel IDs to Perpetual Core users (after pairing)
CREATE TABLE IF NOT EXISTS channel_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  display_name TEXT,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(channel_type, channel_user_id)
);

CREATE INDEX idx_channel_links_lookup
  ON channel_links(channel_type, channel_user_id)
  WHERE is_active = TRUE;

ALTER TABLE channel_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_links" ON channel_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_links" ON channel_links
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE agent_workspaces IS 'Agent personas with channel bindings - route different channels to different AI personas';
COMMENT ON TABLE channel_pairing_codes IS '6-digit verification codes for linking unknown DM senders to Perpetual Core accounts';
COMMENT ON TABLE channel_links IS 'Maps external channel user IDs to Perpetual Core user accounts after pairing verification';
