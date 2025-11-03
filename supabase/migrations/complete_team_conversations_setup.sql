-- Complete Team Conversations Setup
-- Run this entire file in Supabase SQL Editor

-- First, check if documents table exists, if not create a basic one
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    CREATE TABLE documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      organization_id UUID,
      title TEXT NOT NULL,
      content TEXT,
      file_type TEXT,
      summary TEXT,
      key_points TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_documents_user_id ON documents(user_id);
    CREATE INDEX idx_documents_organization_id ON documents(organization_id);
  END IF;
END $$;

-- Shared Conversations (Collaborative AI chat sessions)
CREATE TABLE IF NOT EXISTS shared_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL,

  -- Conversation details
  title TEXT NOT NULL,
  description TEXT,

  -- Context (what this conversation is about)
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  context_type TEXT CHECK (context_type IN ('document', 'general', 'training', 'project')),

  -- Visibility
  is_private BOOLEAN DEFAULT false,
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
  user_id UUID NOT NULL,

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
  user_id UUID,

  -- Message details
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI response metadata
  model_used TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4),

  -- Message status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,

  -- Reactions and engagement
  reactions JSONB DEFAULT '{}'::jsonb,

  -- Reply threading
  reply_to_message_id UUID REFERENCES conversation_messages(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
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

-- Enable Row Level Security
ALTER TABLE shared_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON shared_conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON shared_conversations;
DROP POLICY IF EXISTS "Conversation owners and moderators can update" ON shared_conversations;
DROP POLICY IF EXISTS "Participants can view their conversation members" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can view conversation messages" ON conversation_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON conversation_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON conversation_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON conversation_messages;

-- RLS Policies for shared_conversations
CREATE POLICY "Users can view conversations they participate in"
  ON shared_conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON shared_conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Conversation owners can update"
  ON shared_conversations FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for conversation_participants (fixed - no recursion)
CREATE POLICY "Users can view participants in conversations they belong to"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT cp2.conversation_id
      FROM conversation_participants cp2
      WHERE cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM shared_conversations WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for conversation_messages
CREATE POLICY "Participants can view messages in their conversations"
  ON conversation_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages to their conversations"
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

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_shared_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shared_conversations_updated_at_trigger ON shared_conversations;
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

DROP TRIGGER IF EXISTS conversation_messages_update_last_message_trigger ON conversation_messages;
CREATE TRIGGER conversation_messages_update_last_message_trigger
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Comments
COMMENT ON TABLE shared_conversations IS 'Collaborative AI chat conversations';
COMMENT ON TABLE conversation_participants IS 'Participants in shared conversations';
COMMENT ON TABLE conversation_messages IS 'Messages within shared conversations';
