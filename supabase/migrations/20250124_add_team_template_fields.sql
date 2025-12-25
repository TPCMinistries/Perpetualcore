-- Add template_id and workflow_stages columns to teams table for BOS 2.0 support
-- These fields track which template was used to create the team and its lifecycle workflow stages

-- Add template_id column to track which template was used
ALTER TABLE teams ADD COLUMN IF NOT EXISTS template_id text;

-- Add workflow_stages column to store lifecycle stages (JSON array)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS workflow_stages jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN teams.template_id IS 'ID of the template used to create this team (e.g., talent-engine, sales-engine)';
COMMENT ON COLUMN teams.workflow_stages IS 'Lifecycle workflow stages for BOS 2.0 teams (JSON array of {id, name, order, color})';

-- Create an index on template_id for filtering teams by template
CREATE INDEX IF NOT EXISTS idx_teams_template_id ON teams(template_id) WHERE template_id IS NOT NULL;
