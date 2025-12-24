-- Add Team Scoping to Core Tables
-- Enables filtering tasks, documents, and conversations by team/project

-- Add team_id and project_id to tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Add team_id and project_id to documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_team_id ON documents(team_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

-- Add team_id to shared_conversations (project_id already exists from earlier migration)
ALTER TABLE shared_conversations
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shared_conversations_team_id ON shared_conversations(team_id);

-- Add active_team_context to profiles for admin context switching
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_team_context UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_context_switched_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_active_team_context ON profiles(active_team_context);

-- Create trigger to update project progress when tasks are modified
-- (References function from previous migration)
DROP TRIGGER IF EXISTS trigger_update_project_progress_insert ON tasks;
DROP TRIGGER IF EXISTS trigger_update_project_progress_update ON tasks;
DROP TRIGGER IF EXISTS trigger_update_project_progress_delete ON tasks;

CREATE TRIGGER trigger_update_project_progress_insert
  AFTER INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL)
  EXECUTE FUNCTION update_project_progress();

CREATE TRIGGER trigger_update_project_progress_update
  AFTER UPDATE OF status, project_id ON tasks
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL OR OLD.project_id IS NOT NULL)
  EXECUTE FUNCTION update_project_progress();

CREATE TRIGGER trigger_update_project_progress_delete
  AFTER DELETE ON tasks
  FOR EACH ROW
  WHEN (OLD.project_id IS NOT NULL)
  EXECUTE FUNCTION update_project_progress();

-- Function to switch team context for a user
CREATE OR REPLACE FUNCTION switch_team_context(
  p_user_id UUID,
  p_team_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    active_team_context = p_team_id,
    team_context_switched_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear team context (return to global view)
CREATE OR REPLACE FUNCTION clear_team_context(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    active_team_context = NULL,
    team_context_switched_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for getting team-scoped tasks
CREATE OR REPLACE VIEW team_scoped_tasks AS
SELECT
  t.*,
  tm.name as team_name,
  tm.emoji as team_emoji,
  tm.color as team_color,
  p.name as project_name,
  p.current_stage as project_stage
FROM tasks t
LEFT JOIN teams tm ON t.team_id = tm.id
LEFT JOIN projects p ON t.project_id = p.id;

-- View for getting team-scoped documents
CREATE OR REPLACE VIEW team_scoped_documents AS
SELECT
  d.*,
  tm.name as team_name,
  tm.emoji as team_emoji,
  tm.color as team_color,
  p.name as project_name
FROM documents d
LEFT JOIN teams tm ON d.team_id = tm.id
LEFT JOIN projects p ON d.project_id = p.id;

-- Comments for documentation
COMMENT ON COLUMN tasks.team_id IS 'Team that owns this task. Used for team-scoped filtering.';
COMMENT ON COLUMN tasks.project_id IS 'Project this task belongs to. Used for project workspace views.';
COMMENT ON COLUMN documents.team_id IS 'Team that owns this document. Used for team-scoped library filtering.';
COMMENT ON COLUMN documents.project_id IS 'Project this document belongs to. Used for project file views.';
COMMENT ON COLUMN profiles.active_team_context IS 'Current team context for admin view filtering. NULL means global view.';
COMMENT ON COLUMN profiles.team_context_switched_at IS 'Timestamp of last team context switch for analytics.';
COMMENT ON FUNCTION switch_team_context IS 'Switches user team context for filtering and AI adaptation.';
COMMENT ON FUNCTION clear_team_context IS 'Clears team context to return to global/all-teams view.';
