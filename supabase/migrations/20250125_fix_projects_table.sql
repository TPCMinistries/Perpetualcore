-- Fix projects table - ensure all required columns exist
-- This migration adds any missing columns that the API expects

-- Add description column if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

-- Add team_id column if missing (for team-scoped projects)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add current_stage column if missing (for Kanban workflow)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'ideation'
  CHECK (current_stage IN ('ideation', 'planning', 'in_progress', 'review', 'complete'));

-- Add priority column if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add timeline columns if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add progress tracking columns if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tasks_total INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;

-- Add AI context column if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_context JSONB DEFAULT '{}'::jsonb;

-- Add settings column if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create indexes for new columns (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_current_stage ON projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON projects(target_date);

-- Ensure project_members table exists
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'lead', 'member', 'viewer')),
  can_edit_project BOOLEAN DEFAULT false,
  can_manage_tasks BOOLEAN DEFAULT true,
  can_upload_files BOOLEAN DEFAULT true,
  can_invite_members BOOLEAN DEFAULT false,
  can_manage_milestones BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(project_id, user_id)
);

-- Create indexes for project_members
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Enable RLS on project_members if not already enabled
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for project_members (idempotent)
DROP POLICY IF EXISTS "Users can view project members in their organization" ON project_members;
CREATE POLICY "Users can view project members in their organization"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners and leads can manage members" ON project_members;
CREATE POLICY "Project owners and leads can manage members"
  ON project_members FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners and leads can update members" ON project_members;
CREATE POLICY "Project owners and leads can update members"
  ON project_members FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners and leads can remove members" ON project_members;
CREATE POLICY "Project owners and leads can remove members"
  ON project_members FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

COMMENT ON TABLE project_members IS 'Project team membership with role-based permissions';
