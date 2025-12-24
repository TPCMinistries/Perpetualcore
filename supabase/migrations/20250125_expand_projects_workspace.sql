-- Expand Projects Table for Full Workspace Features
-- Adds Kanban stages, team linkage, milestones, and project members

-- Add workspace columns to existing projects table
ALTER TABLE projects
  -- Kanban workflow stage
  ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'ideation'
    CHECK (current_stage IN ('ideation', 'planning', 'in_progress', 'review', 'complete')),

  -- Link to team (optional - project can belong to a department)
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Project timeline
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,

  -- Progress tracking
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  ADD COLUMN IF NOT EXISTS tasks_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0,

  -- AI Context for project-specific AI behavior
  ADD COLUMN IF NOT EXISTS ai_context JSONB DEFAULT '{}'::jsonb,

  -- Project settings
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "visibility": "team",
    "allow_external_members": false,
    "auto_archive_completed": true,
    "default_task_assignee": null
  }'::jsonb,

  -- Project priority/urgency
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_current_stage ON projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON projects(target_date);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

-- Project members table (for project-specific team)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Member role within project
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'lead', 'member', 'viewer')),

  -- Granular permissions
  can_edit_project BOOLEAN DEFAULT false,
  can_manage_tasks BOOLEAN DEFAULT true,
  can_upload_files BOOLEAN DEFAULT true,
  can_invite_members BOOLEAN DEFAULT false,
  can_manage_milestones BOOLEAN DEFAULT false,

  -- Audit fields
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  UNIQUE(project_id, user_id)
);

-- Project milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Milestone details
  name TEXT NOT NULL,
  description TEXT,

  -- Timeline
  due_date DATE,
  completed_at TIMESTAMPTZ,

  -- Linkage to stage (optional - milestone can mark stage completion)
  stage TEXT CHECK (stage IN ('ideation', 'planning', 'in_progress', 'review', 'complete')),

  -- Organization
  sort_order INTEGER DEFAULT 0,
  is_key_milestone BOOLEAN DEFAULT false,

  -- Audit
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for project_members
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Indexes for project_milestones
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_stage ON project_milestones(stage);

-- Trigger for milestones updated_at
CREATE OR REPLACE FUNCTION update_project_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_project_milestones_updated_at ON project_milestones;
CREATE TRIGGER trigger_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_project_milestones_updated_at();

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members
CREATE POLICY "Users can view project members in their organization"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Project owners and leads can manage members"
  ON project_members FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid() AND (
        pr.user_role IN ('admin', 'owner') OR
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
          AND pm.can_invite_members = true
        )
      )
    )
  );

CREATE POLICY "Project owners and leads can update members"
  ON project_members FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid() AND (
        pr.user_role IN ('admin', 'owner') OR
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
          AND pm.role IN ('owner', 'lead')
        )
      )
    )
  );

CREATE POLICY "Project owners and leads can remove members"
  ON project_members FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid() AND (
        pr.user_role IN ('admin', 'owner') OR
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
          AND pm.role IN ('owner', 'lead')
        )
      )
    )
  );

-- RLS Policies for project_milestones
CREATE POLICY "Users can view milestones in their organization projects"
  ON project_milestones FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Project members can create milestones"
  ON project_milestones FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid() AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
          AND pm.can_manage_milestones = true
        )
      )
    )
  );

CREATE POLICY "Project members can update milestones"
  ON project_milestones FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid() AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
          AND (pm.can_manage_milestones = true OR pm.role IN ('owner', 'lead'))
        )
      )
    )
  );

CREATE POLICY "Project members can delete milestones"
  ON project_milestones FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid() AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
          AND (pm.can_manage_milestones = true OR pm.role IN ('owner', 'lead'))
        )
      )
    )
  );

-- Function to update project progress based on tasks
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_count INTEGER;
  completed_count INTEGER;
  progress INTEGER;
BEGIN
  -- Get task counts for the project
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_count, completed_count
  FROM tasks
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  -- Calculate progress
  IF total_count > 0 THEN
    progress := (completed_count * 100) / total_count;
  ELSE
    progress := 0;
  END IF;

  -- Update project
  UPDATE projects
  SET
    tasks_total = total_count,
    tasks_completed = completed_count,
    progress_percent = progress,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE project_members IS 'Project-specific team membership with role-based permissions. Projects can have their own team separate from department teams.';
COMMENT ON TABLE project_milestones IS 'Key milestones and deliverables for tracking project progress. Can be linked to Kanban stages.';
COMMENT ON COLUMN projects.current_stage IS 'Kanban workflow stage: ideation, planning, in_progress, review, or complete';
COMMENT ON COLUMN projects.ai_context IS 'Project-specific AI context that gets injected when chatting within project context';
COMMENT ON COLUMN projects.settings IS 'Project configuration including visibility, member permissions, and automation settings';
