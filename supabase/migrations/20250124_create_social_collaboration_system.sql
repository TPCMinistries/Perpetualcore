-- Social & Collaboration System for AI OS Platform
-- Enables team knowledge sharing, collaborative AI conversations, and institutional brain

-- Document Shares (Make documents accessible to teams)
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Sharing scope
  share_type TEXT NOT NULL CHECK (share_type IN ('team', 'organization', 'specific_users')),
  shared_with_users UUID[], -- Specific user IDs (when share_type = 'specific_users')

  -- Permissions
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_reshare BOOLEAN DEFAULT false,

  -- Metadata
  share_message TEXT, -- Optional message from sharer
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration

  UNIQUE(document_id, share_type) -- Prevent duplicate shares of same type
);

-- Shared Conversations (Collaborative AI chat sessions)
CREATE TABLE IF NOT EXISTS shared_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation details
  title TEXT NOT NULL,
  description TEXT,

  -- Context (what this conversation is about)
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- Optional: tied to a document
  context_type TEXT CHECK (context_type IN ('document', 'general', 'training', 'project')),

  -- Visibility
  is_private BOOLEAN DEFAULT false, -- Only participants can see
  is_archived BOOLEAN DEFAULT false,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Conversation Participants (Who's in each conversation)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES shared_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Participant role
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant', 'viewer')),

  -- Permissions
  can_send_messages BOOLEAN DEFAULT true,
  can_invite_others BOOLEAN DEFAULT false,
  can_edit_conversation BOOLEAN DEFAULT false,

  -- Activity tracking
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  notification_enabled BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  UNIQUE(conversation_id, user_id)
);

-- Conversation Messages (Messages in shared conversations)
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES shared_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for AI messages

  -- Message details
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI response metadata
  model_used TEXT, -- e.g., 'claude-3-5-sonnet-20241022'
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4),

  -- Message status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,

  -- Reactions and engagement
  reactions JSONB DEFAULT '{}'::jsonb, -- {emoji: [user_ids]}

  -- Reply threading
  reply_to_message_id UUID REFERENCES conversation_messages(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge Contributions (Track who contributed what to the institutional brain)
CREATE TABLE IF NOT EXISTS knowledge_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contribution details
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('document', 'training_module', 'conversation', 'annotation')),
  resource_id UUID NOT NULL, -- ID of the document, training module, etc.
  resource_title TEXT,

  -- Impact metrics
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Bookmarks (Users can bookmark important conversations)
CREATE TABLE IF NOT EXISTS conversation_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES shared_conversations(id) ON DELETE CASCADE,

  -- Bookmark details
  note TEXT, -- Personal note about why this is bookmarked

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, conversation_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_organization_id ON document_shares(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_share_type ON document_shares(share_type);

CREATE INDEX IF NOT EXISTS idx_shared_conversations_organization_id ON shared_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_created_by ON shared_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_document_id ON shared_conversations(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_conversations_is_archived ON shared_conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_last_message ON shared_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_reply_to ON conversation_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_user_id ON knowledge_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_organization_id ON knowledge_contributions(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_type ON knowledge_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_resource ON knowledge_contributions(resource_id);

CREATE INDEX IF NOT EXISTS idx_conversation_bookmarks_user_id ON conversation_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_bookmarks_conversation_id ON conversation_bookmarks(conversation_id);

-- Enable Row Level Security
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares in their organization"
  ON document_shares FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Document owners can create shares"
  ON document_shares FOR INSERT
  WITH CHECK (
    shared_by = auth.uid() AND
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

CREATE POLICY "Sharers can delete their shares"
  ON document_shares FOR DELETE
  USING (shared_by = auth.uid());

-- RLS Policies for shared_conversations
CREATE POLICY "Users can view conversations they participate in"
  ON shared_conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    ) OR
    (is_private = false AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create conversations in their organization"
  ON shared_conversations FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Conversation owners and moderators can update"
  ON shared_conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND role IN ('owner', 'moderator')
    )
  );

-- RLS Policies for conversation_participants
CREATE POLICY "Participants can view their conversation members"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM shared_conversations WHERE created_by = auth.uid()
    ) OR
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND can_invite_others = true
    )
  );

-- RLS Policies for conversation_messages
CREATE POLICY "Participants can view conversation messages"
  ON conversation_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND can_send_messages = true
    )
  );

CREATE POLICY "Users can update their own messages"
  ON conversation_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON conversation_messages FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for knowledge_contributions
CREATE POLICY "Users can view contributions in their organization"
  ON knowledge_contributions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for conversation_bookmarks
CREATE POLICY "Users can manage their own bookmarks"
  ON conversation_bookmarks FOR ALL
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_shared_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shared_conversations_updated_at_trigger
  BEFORE UPDATE ON shared_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_conversations_updated_at();

-- Trigger to update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shared_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_messages_update_last_message_trigger
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Create view for user's accessible documents (including shared)
CREATE OR REPLACE VIEW accessible_documents AS
SELECT DISTINCT
  d.*,
  CASE
    WHEN d.user_id = auth.uid() THEN 'owner'
    WHEN ds.id IS NOT NULL THEN 'shared'
    ELSE NULL
  END as access_type,
  ds.shared_by,
  ds.can_edit as can_edit_shared,
  p.full_name as shared_by_name
FROM documents d
LEFT JOIN document_shares ds ON d.id = ds.document_id
LEFT JOIN profiles p ON ds.shared_by = p.id
WHERE
  d.user_id = auth.uid() -- User owns it
  OR (
    -- Or it's shared with them
    ds.share_type = 'organization' AND d.organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  OR (
    ds.share_type = 'team' AND d.organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  OR (
    ds.share_type = 'specific_users' AND auth.uid() = ANY(ds.shared_with_users)
  );

-- Create view for conversation stats
CREATE OR REPLACE VIEW conversation_stats AS
SELECT
  sc.id as conversation_id,
  sc.title,
  sc.organization_id,
  COUNT(DISTINCT cp.user_id) as participant_count,
  COUNT(DISTINCT cm.id) as message_count,
  MAX(cm.created_at) as last_message_at,
  SUM(cm.tokens_used) as total_tokens_used,
  SUM(cm.cost_usd) as total_cost_usd
FROM shared_conversations sc
LEFT JOIN conversation_participants cp ON cp.conversation_id = sc.id
LEFT JOIN conversation_messages cm ON cm.conversation_id = sc.id
GROUP BY sc.id, sc.title, sc.organization_id;

-- Create view for knowledge contributor leaderboard
CREATE OR REPLACE VIEW knowledge_contributor_stats AS
SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  p.organization_id,
  COUNT(DISTINCT kc.id) as total_contributions,
  COUNT(DISTINCT kc.id) FILTER (WHERE kc.contribution_type = 'document') as documents_contributed,
  COUNT(DISTINCT kc.id) FILTER (WHERE kc.contribution_type = 'training_module') as training_contributed,
  COUNT(DISTINCT kc.id) FILTER (WHERE kc.contribution_type = 'conversation') as conversations_contributed,
  SUM(kc.views_count) as total_views,
  SUM(kc.shares_count) as total_shares,
  SUM(kc.helpful_votes) as total_helpful_votes
FROM profiles p
LEFT JOIN knowledge_contributions kc ON kc.user_id = p.id
GROUP BY p.id, p.full_name, p.email, p.organization_id;

COMMENT ON TABLE document_shares IS 'Document sharing for team collaboration';
COMMENT ON TABLE shared_conversations IS 'Collaborative AI chat conversations';
COMMENT ON TABLE conversation_participants IS 'Participants in shared conversations';
COMMENT ON TABLE conversation_messages IS 'Messages within shared conversations';
COMMENT ON TABLE knowledge_contributions IS 'Track user contributions to institutional knowledge';
COMMENT ON TABLE conversation_bookmarks IS 'User bookmarks for important conversations';
