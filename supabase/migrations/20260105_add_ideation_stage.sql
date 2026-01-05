-- Add ideation stage for project kanban board
-- This stage was missing from the original seed and is needed for frontend kanban columns

INSERT INTO lookup_project_stages (name, description, color, is_terminal, sort_order) VALUES
  ('ideation', 'New ideas and concepts being explored', 'purple', false, 0)
ON CONFLICT (name) DO NOTHING;
