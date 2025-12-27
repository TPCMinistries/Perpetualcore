-- Document Annotations for Team Collaboration
-- Supports comments, highlights, and action items on documents

CREATE TABLE IF NOT EXISTS document_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Annotation content
  annotation_type TEXT NOT NULL DEFAULT 'comment' CHECK (annotation_type IN ('comment', 'highlight', 'action_item', 'reply')),
  content TEXT NOT NULL,
  text_selection TEXT, -- The selected text being annotated

  -- Positioning (for inline annotations)
  position_start INT, -- Character offset start
  position_end INT, -- Character offset end

  -- Threading
  parent_id UUID REFERENCES document_annotations(id) ON DELETE CASCADE,

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Mentions (stored as array of user IDs)
  mentioned_users UUID[] DEFAULT '{}',

  -- Action item specific
  assignee_id UUID REFERENCES auth.users(id),
  due_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_annotations_document ON document_annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON document_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_org ON document_annotations(organization_id);
CREATE INDEX IF NOT EXISTS idx_annotations_parent ON document_annotations(parent_id);
CREATE INDEX IF NOT EXISTS idx_annotations_unresolved ON document_annotations(is_resolved) WHERE is_resolved = false;

-- Enable RLS
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view annotations in their organization"
  ON document_annotations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create annotations in their organization"
  ON document_annotations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own annotations"
  ON document_annotations
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own annotations"
  ON document_annotations
  FOR DELETE
  USING (user_id = auth.uid());

-- Document Activity Log for feeds
CREATE TABLE IF NOT EXISTS document_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'upload', 'view', 'download', 'share', 'comment', 'highlight',
    'action_item', 'resolve', 'update', 'delete', 'generate_summary',
    'add_to_collection', 'add_to_project', 'add_to_space'
  )),

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_org ON document_activity(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_document ON document_activity(document_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON document_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON document_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON document_activity(created_at DESC);

-- Enable RLS
ALTER TABLE document_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view activity in their organization"
  ON document_activity
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity in their organization"
  ON document_activity
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Presence tracking for real-time
CREATE TABLE IF NOT EXISTS document_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  cursor_position JSONB, -- For future cursor sharing

  UNIQUE(document_id, user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_presence_document ON document_presence(document_id);
CREATE INDEX IF NOT EXISTS idx_presence_recent ON document_presence(last_seen DESC);

-- Enable RLS
ALTER TABLE document_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to see presence
CREATE POLICY "Users can view document presence"
  ON document_presence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own presence"
  ON document_presence
  FOR ALL
  USING (user_id = auth.uid());

-- Function to clean up stale presence records
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM document_presence WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER annotations_updated_at
  BEFORE UPDATE ON document_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_annotations_updated_at();
