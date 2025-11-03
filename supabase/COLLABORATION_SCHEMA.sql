-- COLLABORATION FEATURES SCHEMA
-- This schema manages comments, mentions, activity feed, and real-time collaboration

-- =====================================================
-- TABLE: comments
-- Universal comments system for any entity
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What is being commented on
  entity_type TEXT NOT NULL, -- 'document', 'task', 'workflow', 'email', 'meeting', 'agent', etc.
  entity_id UUID NOT NULL, -- ID of the entity being commented on

  -- Comment content
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML with mentions highlighted

  -- Thread support
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
  thread_position INTEGER DEFAULT 0, -- Position in thread

  -- Mentions
  mentioned_user_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Array of mentioned user IDs

  -- Reactions
  reactions JSONB DEFAULT '{}'::jsonb, -- {"👍": ["user1", "user2"], "❤️": ["user3"]}

  -- Metadata
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_entity_type CHECK (entity_type IN ('document', 'task', 'workflow', 'email', 'meeting', 'agent', 'workflow_execution', 'suggestion', 'calendar_event'))
);

-- =====================================================
-- TABLE: mentions
-- Track @mentions across the platform
-- =====================================================
CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Who was mentioned
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who mentioned them
  mentioning_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Where they were mentioned
  mention_type TEXT NOT NULL, -- 'comment', 'document', 'task', 'message'
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Context
  context TEXT, -- Snippet of text around the mention
  url TEXT, -- Deep link to the mention

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_mention_type CHECK (mention_type IN ('comment', 'document', 'task', 'message', 'description')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('document', 'task', 'workflow', 'email', 'meeting', 'comment', 'message'))
);

-- =====================================================
-- TABLE: activity_feed
-- Track all team activities for the feed
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor (who did the action)
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT, -- Cached name for deleted users

  -- Action
  action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'commented', 'mentioned', 'completed', 'assigned', 'shared'

  -- Target (what was acted upon)
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT, -- Cached name of entity

  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb, -- Extra data about the action

  -- Visibility
  is_public BOOLEAN DEFAULT true, -- If false, only visible to specific users
  visible_to_user_ids UUID[], -- If not public, who can see it

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_action_type CHECK (action_type IN ('created', 'updated', 'deleted', 'commented', 'mentioned', 'completed', 'assigned', 'shared', 'archived', 'restored', 'uploaded', 'downloaded')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('document', 'task', 'workflow', 'email', 'meeting', 'agent', 'comment', 'file', 'folder'))
);

-- =====================================================
-- TABLE: document_versions
-- Track document version history
-- =====================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document reference
  document_id UUID NOT NULL, -- References documents table

  -- Version info
  version_number INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  content_snapshot JSONB, -- Full snapshot of document state

  -- Change tracking
  changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT, -- Brief description of changes
  changes_diff JSONB, -- Detailed diff of changes

  -- Size tracking
  content_length INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(document_id, version_number)
);

-- =====================================================
-- TABLE: realtime_presence
-- Track who is currently viewing/editing
-- =====================================================
CREATE TABLE IF NOT EXISTS realtime_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Location
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Status
  status TEXT DEFAULT 'viewing', -- 'viewing', 'editing', 'commenting'
  cursor_position INTEGER, -- For text editing

  -- Metadata
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, entity_type, entity_id),

  CONSTRAINT valid_status CHECK (status IN ('viewing', 'editing', 'commenting', 'idle'))
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Comments indexes
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_org ON comments(organization_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentioned_user_ids);

-- Mentions indexes
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_entity ON mentions(entity_type, entity_id);
CREATE INDEX idx_mentions_unread ON mentions(mentioned_user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_mentions_created ON mentions(created_at DESC);

-- Activity feed indexes
CREATE INDEX idx_activity_org ON activity_feed(organization_id);
CREATE INDEX idx_activity_actor ON activity_feed(actor_user_id);
CREATE INDEX idx_activity_entity ON activity_feed(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_visible ON activity_feed USING GIN(visible_to_user_ids) WHERE visible_to_user_ids IS NOT NULL;

-- Document versions indexes
CREATE INDEX idx_doc_versions_document ON document_versions(document_id);
CREATE INDEX idx_doc_versions_created ON document_versions(created_at DESC);
CREATE INDEX idx_doc_versions_user ON document_versions(changed_by_user_id);

-- Realtime presence indexes
CREATE INDEX idx_presence_entity ON realtime_presence(entity_type, entity_id);
CREATE INDEX idx_presence_user ON realtime_presence(user_id);
CREATE INDEX idx_presence_active ON realtime_presence(last_active_at) WHERE status != 'idle';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_presence ENABLE ROW LEVEL SECURITY;

-- Comments Policies
CREATE POLICY "Users can view comments in their organization"
  ON comments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND is_deleted = false
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can soft delete their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

-- Mentions Policies
CREATE POLICY "Users can view their own mentions"
  ON mentions FOR SELECT
  USING (mentioned_user_id = auth.uid());

CREATE POLICY "System can create mentions"
  ON mentions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own mentions"
  ON mentions FOR UPDATE
  USING (mentioned_user_id = auth.uid());

-- Activity Feed Policies
CREATE POLICY "Users can view organization activity"
  ON activity_feed FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      is_public = true
      OR auth.uid() = ANY(visible_to_user_ids)
    )
  );

CREATE POLICY "System can create activity"
  ON activity_feed FOR INSERT
  WITH CHECK (true);

-- Document Versions Policies
CREATE POLICY "Users can view versions in their organization"
  ON document_versions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can create versions"
  ON document_versions FOR INSERT
  WITH CHECK (true);

-- Realtime Presence Policies
CREATE POLICY "Users can view presence in their organization"
  ON realtime_presence FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own presence"
  ON realtime_presence FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to extract @mentions from text
CREATE OR REPLACE FUNCTION extract_mentions(text_content TEXT)
RETURNS UUID[] AS $$
DECLARE
  mention_pattern TEXT := '@\[([^\]]+)\]\(([a-f0-9-]+)\)';
  user_ids UUID[];
BEGIN
  -- Extract user IDs from @[Name](uuid) format
  SELECT ARRAY_AGG(DISTINCT (regexp_matches(text_content, mention_pattern, 'g'))[2]::UUID)
  INTO user_ids;

  RETURN COALESCE(user_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create mention notifications
CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_id UUID;
  org_id UUID;
BEGIN
  -- Get organization_id
  org_id := NEW.organization_id;

  -- Create mention record for each mentioned user
  FOREACH mentioned_id IN ARRAY NEW.mentioned_user_ids
  LOOP
    INSERT INTO mentions (
      organization_id,
      mentioned_user_id,
      mentioning_user_id,
      mention_type,
      entity_type,
      entity_id,
      context,
      url
    ) VALUES (
      org_id,
      mentioned_id,
      NEW.user_id,
      'comment',
      NEW.entity_type,
      NEW.entity_id,
      LEFT(NEW.content, 200),
      '/dashboard/' || NEW.entity_type || 's/' || NEW.entity_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create mentions when comments are created
CREATE TRIGGER create_mentions_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (array_length(NEW.mentioned_user_ids, 1) > 0)
  EXECUTE FUNCTION create_mention_notifications();

-- Function to create activity feed entries
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  action TEXT;
  actor_name_val TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action := 'deleted';
  END IF;

  -- Get actor name
  SELECT full_name INTO actor_name_val
  FROM profiles
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Insert activity
  INSERT INTO activity_feed (
    organization_id,
    actor_user_id,
    actor_name,
    action_type,
    entity_type,
    entity_id,
    entity_name
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.user_id, OLD.user_id),
    actor_name_val,
    action,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.content, OLD.content, '')::TEXT
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Clean up old presence records (> 5 minutes inactive)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM realtime_presence
  WHERE last_active_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get comments for an entity with user info
-- SELECT
--   c.*,
--   p.full_name as user_name,
--   p.avatar_url as user_avatar
-- FROM comments c
-- JOIN profiles p ON c.user_id = p.id
-- WHERE c.entity_type = 'document'
--   AND c.entity_id = 'ENTITY_UUID'
--   AND c.parent_comment_id IS NULL
-- ORDER BY c.created_at DESC;

-- Get unread mentions for a user
-- SELECT
--   m.*,
--   p.full_name as mentioning_user_name
-- FROM mentions m
-- JOIN profiles p ON m.mentioning_user_id = p.id
-- WHERE m.mentioned_user_id = 'USER_UUID'
--   AND m.is_read = false
-- ORDER BY m.created_at DESC;

-- Get activity feed for organization
-- SELECT * FROM activity_feed
-- WHERE organization_id = 'ORG_UUID'
--   AND (is_public = true OR 'USER_UUID' = ANY(visible_to_user_ids))
-- ORDER BY created_at DESC
-- LIMIT 50;

-- Get who's currently viewing an entity
-- SELECT
--   rp.*,
--   p.full_name as user_name,
--   p.avatar_url as user_avatar
-- FROM realtime_presence rp
-- JOIN profiles p ON rp.user_id = p.id
-- WHERE rp.entity_type = 'document'
--   AND rp.entity_id = 'ENTITY_UUID'
--   AND rp.last_active_at > NOW() - INTERVAL '2 minutes';
