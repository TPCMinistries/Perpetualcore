-- Teams System Migration
-- Creates teams (departments + project teams) and team membership

-- Teams table (represents departments and project teams)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Team identification
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Team type: permanent department or temporary project team
  team_type TEXT NOT NULL DEFAULT 'department' CHECK (team_type IN ('department', 'project_team')),

  -- Visual identity
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'users',
  emoji TEXT,

  -- AI Context Configuration - how AI behaves for this team
  ai_context JSONB DEFAULT '{
    "personality": "professional",
    "tools": [],
    "prompts": {},
    "content_filters": [],
    "suggestions_focus": []
  }'::jsonb,

  -- Dashboard configuration - team-specific metrics and widgets
  dashboard_config JSONB DEFAULT '{
    "metrics": [],
    "widgets": [],
    "kpis": []
  }'::jsonb,

  -- Status and organization
  is_archived BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  parent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

-- Team Members junction table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Member role within team
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'manager', 'member', 'viewer')),

  -- Granular permissions within team
  can_manage_members BOOLEAN DEFAULT false,
  can_edit_settings BOOLEAN DEFAULT false,
  can_manage_projects BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT true,

  -- Audit fields
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  UNIQUE(team_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_parent_team_id ON teams(parent_team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teams_updated_at ON teams;
CREATE TRIGGER trigger_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view teams in their organization"
  ON teams FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can create teams"
  ON teams FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update teams"
  ON teams FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can delete teams"
  ON teams FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'owner')
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Users can view team members in their organization"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Team leads and admins can manage members"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid() AND (
        p.user_role IN ('admin', 'owner') OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.can_manage_members = true
        )
      )
    )
  );

CREATE POLICY "Team leads and admins can update members"
  ON team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid() AND (
        p.user_role IN ('admin', 'owner') OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.can_manage_members = true
        )
      )
    )
  );

CREATE POLICY "Team leads and admins can remove members"
  ON team_members FOR DELETE
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid() AND (
        p.user_role IN ('admin', 'owner') OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.can_manage_members = true
        )
      )
    )
  );

-- Function to create default departments for a new organization
CREATE OR REPLACE FUNCTION create_default_teams_for_org(org_id UUID, creator_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO teams (organization_id, name, slug, team_type, emoji, color, ai_context, created_by)
  VALUES
    (org_id, 'Marketing', 'marketing', 'department', '📣', '#f59e0b',
     '{"personality": "creative and engaging", "tools": ["social_media", "content_calendar", "analytics"], "prompts": {"tone": "persuasive and brand-focused"}, "suggestions_focus": ["content ideas", "campaign optimization", "audience engagement"]}'::jsonb,
     creator_id),
    (org_id, 'Sales', 'sales', 'department', '💼', '#10b981',
     '{"personality": "professional and results-driven", "tools": ["crm", "email_templates", "pipeline"], "prompts": {"tone": "confident and solution-oriented"}, "suggestions_focus": ["deal closing", "follow-up reminders", "prospect research"]}'::jsonb,
     creator_id),
    (org_id, 'Operations', 'operations', 'department', '⚙️', '#6366f1',
     '{"personality": "efficient and process-oriented", "tools": ["task_automation", "process_docs", "scheduling"], "prompts": {"tone": "clear and procedural"}, "suggestions_focus": ["workflow optimization", "resource allocation", "bottleneck identification"]}'::jsonb,
     creator_id),
    (org_id, 'Engineering', 'engineering', 'department', '🔧', '#8b5cf6',
     '{"personality": "technical and precise", "tools": ["code_review", "documentation", "debugging"], "prompts": {"tone": "accurate and detailed"}, "suggestions_focus": ["code quality", "architecture decisions", "technical debt"]}'::jsonb,
     creator_id),
    (org_id, 'Finance', 'finance', 'department', '💰', '#059669',
     '{"personality": "analytical and thorough", "tools": ["spreadsheets", "reports", "forecasting"], "prompts": {"tone": "formal and data-driven"}, "suggestions_focus": ["budget analysis", "cost optimization", "financial planning"]}'::jsonb,
     creator_id),
    (org_id, 'HR', 'hr', 'department', '🤝', '#ec4899',
     '{"personality": "empathetic and supportive", "tools": ["onboarding", "policies", "performance"], "prompts": {"tone": "warm and professional"}, "suggestions_focus": ["employee engagement", "policy compliance", "team culture"]}'::jsonb,
     creator_id)
  ON CONFLICT (organization_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE teams IS 'Teams represent both permanent departments (Marketing, Sales, etc.) and temporary project teams. Each team has its own AI context configuration.';
COMMENT ON TABLE team_members IS 'Junction table for team membership with role-based permissions.';
COMMENT ON COLUMN teams.ai_context IS 'JSON configuration for how AI behaves when user is in this team context. Includes personality, available tools, prompt modifications, and suggestion focus areas.';
COMMENT ON COLUMN teams.dashboard_config IS 'JSON configuration for team-specific dashboard metrics, widgets, and KPIs.';
