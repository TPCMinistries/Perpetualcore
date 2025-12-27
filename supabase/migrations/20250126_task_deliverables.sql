-- Migration: Task Deliverables System
-- Stores AI-generated content (social posts, emails, documents) for tasks

-- =============================================================================
-- 1. Create task_deliverables table
-- =============================================================================

CREATE TABLE IF NOT EXISTS task_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Content
  content_type TEXT NOT NULL CHECK (content_type IN (
    'social_post', 'email', 'document', 'plan', 'research', 'image', 'other'
  )),
  title TEXT,
  content TEXT NOT NULL,

  -- Metadata for specific content types
  platform TEXT,  -- 'twitter', 'linkedin', 'instagram', 'facebook' for social posts
  format TEXT DEFAULT 'plain' CHECK (format IN ('plain', 'markdown', 'html', 'json')),
  metadata JSONB DEFAULT '{}',  -- Additional structured data (e.g., subject line for emails)

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Version tracking for edits
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES task_deliverables(id),

  -- AI metadata
  ai_generated BOOLEAN DEFAULT true,
  ai_model TEXT,
  ai_prompt_context TEXT,  -- What context was used to generate

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Create indexes for efficient queries
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_deliverables_task ON task_deliverables(task_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_user ON task_deliverables(user_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON task_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_content_type ON task_deliverables(content_type);
CREATE INDEX IF NOT EXISTS idx_deliverables_created ON task_deliverables(created_at DESC);

-- =============================================================================
-- 3. Enable Row Level Security
-- =============================================================================

ALTER TABLE task_deliverables ENABLE ROW LEVEL SECURITY;

-- Users can view deliverables for tasks they own
DROP POLICY IF EXISTS "Users can view own task deliverables" ON task_deliverables;
CREATE POLICY "Users can view own task deliverables"
  ON task_deliverables FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_deliverables.task_id
      AND t.user_id = auth.uid()
    )
  );

-- Users can create deliverables for their tasks
DROP POLICY IF EXISTS "Users can create deliverables" ON task_deliverables;
CREATE POLICY "Users can create deliverables"
  ON task_deliverables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own deliverables
DROP POLICY IF EXISTS "Users can update own deliverables" ON task_deliverables;
CREATE POLICY "Users can update own deliverables"
  ON task_deliverables FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own deliverables
DROP POLICY IF EXISTS "Users can delete own deliverables" ON task_deliverables;
CREATE POLICY "Users can delete own deliverables"
  ON task_deliverables FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. Add updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_task_deliverable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deliverable_timestamp ON task_deliverables;
CREATE TRIGGER trigger_update_deliverable_timestamp
  BEFORE UPDATE ON task_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_task_deliverable_updated_at();

-- =============================================================================
-- 5. Function to get deliverables count per task
-- =============================================================================

CREATE OR REPLACE FUNCTION get_task_deliverables_count(for_task_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM task_deliverables
    WHERE task_id = for_task_id
    AND status != 'archived'
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. Comments for documentation
-- =============================================================================

COMMENT ON TABLE task_deliverables IS 'Stores AI-generated and manually created deliverables for tasks';
COMMENT ON COLUMN task_deliverables.content_type IS 'Type of content: social_post, email, document, plan, research, image, other';
COMMENT ON COLUMN task_deliverables.platform IS 'Target platform for social posts (twitter, linkedin, instagram, facebook)';
COMMENT ON COLUMN task_deliverables.metadata IS 'Additional structured data like email subject, hashtags, etc.';
COMMENT ON COLUMN task_deliverables.version IS 'Version number, increments with each edit';
COMMENT ON COLUMN task_deliverables.parent_id IS 'Reference to original version for edit history';
