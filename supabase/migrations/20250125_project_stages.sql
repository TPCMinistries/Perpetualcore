-- Project Stages Table
-- Allows organizations to customize their project pipeline stages

CREATE TABLE IF NOT EXISTS project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stage info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'circle',
  description TEXT,

  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Flags
  is_default BOOLEAN DEFAULT false,  -- If true, new projects start here
  is_complete BOOLEAN DEFAULT false, -- If true, projects here are considered done
  is_archived BOOLEAN DEFAULT false, -- Soft delete

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique slug per organization
  UNIQUE(organization_id, slug)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_stages_org ON project_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_order ON project_stages(organization_id, sort_order);

-- Enable RLS
ALTER TABLE project_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stages in their organization"
  ON project_stages FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create stages in their organization"
  ON project_stages FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update stages in their organization"
  ON project_stages FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stages in their organization"
  ON project_stages FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to seed default stages for an organization
CREATE OR REPLACE FUNCTION seed_default_project_stages(org_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO project_stages (organization_id, name, slug, color, icon, description, sort_order, is_default, is_complete, created_by)
  VALUES
    (org_id, 'Ideation', 'ideation', '#a855f7', 'lightbulb', 'New ideas and concepts being explored', 0, true, false, user_id),
    (org_id, 'Planning', 'planning', '#3b82f6', 'clipboard-list', 'Defining scope, requirements, and timeline', 1, false, false, user_id),
    (org_id, 'In Progress', 'in_progress', '#f59e0b', 'play-circle', 'Actively being worked on', 2, false, false, user_id),
    (org_id, 'Review', 'review', '#10b981', 'eye', 'Under review or testing', 3, false, false, user_id),
    (org_id, 'Complete', 'complete', '#22c55e', 'check-circle', 'Successfully completed', 4, false, true, user_id)
  ON CONFLICT (organization_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_project_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_stages_timestamp
  BEFORE UPDATE ON project_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stages_updated_at();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
