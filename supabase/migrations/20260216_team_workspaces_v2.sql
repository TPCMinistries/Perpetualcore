-- Phase 2: Team Workspaces V2
-- Adds invitation system, shared skills, and shared credentials for teams.

-- Team invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email, team_id);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "team_invitations_service_role" ON team_invitations
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Shared team skills
CREATE TABLE IF NOT EXISTS team_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  skill_id TEXT NOT NULL,
  shared_by UUID REFERENCES auth.users(id),
  config JSONB DEFAULT '{}',
  credential_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, skill_id)
);

ALTER TABLE team_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "team_skills_service_role" ON team_skills
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Shared team credentials (encrypted)
CREATE TABLE IF NOT EXISTS team_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  skill_id TEXT NOT NULL,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  shared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, skill_id, credential_key)
);

ALTER TABLE team_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "team_credentials_service_role" ON team_credentials
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
