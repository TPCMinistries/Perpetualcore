-- Batch 2 Skills Migration
-- Adds tables for external tasks (Todoist/Linear), BYOK credentials, and skill support

-- ============================================
-- 1. External Tasks Table (Todoist/Linear sync)
-- ============================================
CREATE TABLE IF NOT EXISTS external_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source tracking
  provider TEXT NOT NULL CHECK (provider IN ('todoist', 'linear', 'asana', 'jira')),
  provider_task_id TEXT NOT NULL,
  provider_project_id TEXT,
  provider_project_name TEXT,

  -- Task data
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 4), -- 1=highest, 4=lowest
  due_date TIMESTAMPTZ,

  -- Linear-specific
  linear_team_id TEXT,
  linear_team_name TEXT,
  linear_assignee_id TEXT,
  linear_assignee_name TEXT,
  linear_state_id TEXT,
  linear_state_name TEXT,
  linear_identifier TEXT, -- e.g. "ENG-123"

  -- Todoist-specific
  todoist_section_id TEXT,
  todoist_section_name TEXT,
  todoist_labels TEXT[],

  -- Metadata
  url TEXT,
  raw_data JSONB,

  -- Sync tracking
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per provider
  UNIQUE(user_id, provider, provider_task_id)
);

-- Indexes for external_tasks
CREATE INDEX idx_external_tasks_user ON external_tasks(user_id);
CREATE INDEX idx_external_tasks_provider ON external_tasks(provider);
CREATE INDEX idx_external_tasks_status ON external_tasks(status);
CREATE INDEX idx_external_tasks_due ON external_tasks(due_date);
CREATE INDEX idx_external_tasks_org ON external_tasks(organization_id);

-- RLS for external_tasks
ALTER TABLE external_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own external tasks"
  ON external_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own external tasks"
  ON external_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external tasks"
  ON external_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own external tasks"
  ON external_tasks FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 2. Skill Credentials Table (BYOK storage)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (either user or org level)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Credential info
  provider TEXT NOT NULL, -- 'todoist', 'linear', 'notion', etc.
  credential_type TEXT NOT NULL DEFAULT 'api_key' CHECK (credential_type IN ('api_key', 'oauth_token', 'webhook_secret')),

  -- Encrypted storage
  encrypted_key TEXT NOT NULL, -- AES-256 encrypted
  key_hash TEXT NOT NULL, -- For quick lookup without decryption

  -- Metadata
  label TEXT, -- User-friendly name
  scopes TEXT[], -- Permissions granted
  expires_at TIMESTAMPTZ, -- For OAuth tokens

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT, -- Last validation error if any

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either user or org must be set
  CONSTRAINT skill_credentials_owner_check CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  ),

  -- Unique per owner/provider combo
  UNIQUE(user_id, provider),
  UNIQUE(organization_id, provider)
);

-- Indexes for skill_credentials
CREATE INDEX idx_skill_credentials_user ON skill_credentials(user_id);
CREATE INDEX idx_skill_credentials_org ON skill_credentials(organization_id);
CREATE INDEX idx_skill_credentials_provider ON skill_credentials(provider);

-- RLS for skill_credentials
ALTER TABLE skill_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON skill_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org admins can view org credentials"
  ON skill_credentials FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert own credentials"
  ON skill_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org admins can insert org credentials"
  ON skill_credentials FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update own credentials"
  ON skill_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON skill_credentials FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 3. User Skills Configuration Table
-- ============================================
-- This table may already exist but ensure it has all needed columns
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  UNIQUE(user_id, skill_id)
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_enabled ON user_skills(enabled);

-- RLS for user_skills
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skills" ON user_skills;
CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own skills" ON user_skills;
CREATE POLICY "Users can manage own skills"
  ON user_skills FOR ALL
  USING (auth.uid() = user_id);


-- ============================================
-- 4. Skill Executions Table (Logging)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for skill_executions
CREATE INDEX IF NOT EXISTS idx_skill_executions_user ON skill_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_skill ON skill_executions(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_created ON skill_executions(created_at DESC);

-- RLS for skill_executions
ALTER TABLE skill_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own executions" ON skill_executions;
CREATE POLICY "Users can view own executions"
  ON skill_executions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own executions" ON skill_executions;
CREATE POLICY "Users can insert own executions"
  ON skill_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 5. Add encrypted_credentials to user_integrations
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_integrations'
    AND column_name = 'encrypted_credentials'
  ) THEN
    ALTER TABLE user_integrations ADD COLUMN encrypted_credentials JSONB;
  END IF;
END $$;


-- ============================================
-- 6. Update trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
DROP TRIGGER IF EXISTS external_tasks_updated_at ON external_tasks;
CREATE TRIGGER external_tasks_updated_at
  BEFORE UPDATE ON external_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS skill_credentials_updated_at ON skill_credentials;
CREATE TRIGGER skill_credentials_updated_at
  BEFORE UPDATE ON skill_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 7. Comments for documentation
-- ============================================
COMMENT ON TABLE external_tasks IS 'Synced tasks from external providers (Todoist, Linear, etc.)';
COMMENT ON TABLE skill_credentials IS 'Encrypted BYOK API keys for skill integrations';
COMMENT ON TABLE user_skills IS 'User skill configurations and enablement status';
COMMENT ON TABLE skill_executions IS 'Log of skill tool executions for analytics and debugging';

COMMENT ON COLUMN skill_credentials.encrypted_key IS 'AES-256-CBC encrypted API key (format: iv:ciphertext)';
COMMENT ON COLUMN skill_credentials.key_hash IS 'SHA-256 hash of the key for quick lookup without decryption';
COMMENT ON COLUMN external_tasks.linear_identifier IS 'Human-readable Linear issue ID like ENG-123';
