-- Add additional project metadata fields
-- These support the enhanced project creation flow

-- Drop existing constraint if it exists (to update with new types)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_type_check;

-- Add project type for categorization (with expanded types for ministry/non-profit)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'general';

-- Add the updated constraint with all project types
ALTER TABLE projects
  ADD CONSTRAINT projects_project_type_check
  CHECK (project_type IN (
    -- Business & Sales
    'client', 'sales_deal', 'rfp_proposal', 'product', 'campaign',
    -- Operations & Planning
    'event', 'content', 'research', 'internal', 'general',
    -- Ministry & Non-Profit
    'mission_trip', 'ministry_campaign', 'partnership', 'fundraising', 'outreach', 'grant_rfp'
  ));

-- Add client name for client projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add tags array for flexible categorization
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for project_type
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- Create GIN index for tags (efficient array searching)
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- Comments
COMMENT ON COLUMN projects.project_type IS 'Type of project - Ministry: mission_trip, ministry_campaign, partnership, fundraising, outreach, grant_rfp; Business: client, sales_deal, product, campaign; Operations: event, content, research, internal, general';
COMMENT ON COLUMN projects.client_name IS 'Client or partner name for client/partnership projects';
COMMENT ON COLUMN projects.tags IS 'Array of tags for flexible project categorization';
