-- Phase 2: Team Workspaces V2
-- Adds team_id to existing invitations, plus shared skills and credentials tables.

-- Add team_id to existing team_invitations table (org-level already has organization_id)
ALTER TABLE team_invitations ADD COLUMN IF NOT EXISTS team_id UUID;

CREATE INDEX IF NOT EXISTS idx_team_invitations_team_token ON team_invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_email ON team_invitations(email, team_id) WHERE team_id IS NOT NULL;

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
