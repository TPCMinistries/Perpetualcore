-- COMPLETE RLS FIX FOR ALL TEAM CONVERSATIONS TABLES
-- This migration comprehensively fixes all infinite recursion issues
-- by ensuring no policy queries the table it's protecting

-- =============================================================================
-- STEP 1: Drop ALL existing policies on all conversation-related tables
-- =============================================================================

-- Drop all policies on shared_conversations
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON shared_conversations;
DROP POLICY IF EXISTS "Users can view their organization conversations" ON shared_conversations;
DROP POLICY IF EXISTS "View conversations in organization" ON shared_conversations;
DROP POLICY IF EXISTS "Users can view shared conversations they participate in" ON shared_conversations;
DROP POLICY IF EXISTS "View org conversations" ON shared_conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON shared_conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON shared_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON shared_conversations;
DROP POLICY IF EXISTS "Insert org conversations" ON shared_conversations;
DROP POLICY IF EXISTS "Conversation owners and moderators can update" ON shared_conversations;
DROP POLICY IF EXISTS "Conversation owners can update" ON shared_conversations;
DROP POLICY IF EXISTS "Update own conversations" ON shared_conversations;
DROP POLICY IF EXISTS "Delete own conversations" ON shared_conversations;

-- Drop all policies on conversation_participants
DROP POLICY IF EXISTS "Users can view participants in conversations they belong to" ON conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can view their conversation members" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view all participants in organization" ON conversation_participants;
DROP POLICY IF EXISTS "View participants in org conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Insert participants in own org" ON conversation_participants;
DROP POLICY IF EXISTS "Delete participants in own org" ON conversation_participants;

-- Drop all policies on conversation_messages (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_messages') THEN
    DROP POLICY IF EXISTS "Participants can view conversation messages" ON conversation_messages;
    DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON conversation_messages;
    DROP POLICY IF EXISTS "Participants can send messages" ON conversation_messages;
    DROP POLICY IF EXISTS "Participants can send messages to their conversations" ON conversation_messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON conversation_messages;
    DROP POLICY IF EXISTS "Users can delete their own messages" ON conversation_messages;
  END IF;
END $$;

-- Drop all policies on shared_conversation_messages (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shared_conversation_messages') THEN
    DROP POLICY IF EXISTS "Participants can view messages" ON shared_conversation_messages;
    DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON shared_conversation_messages;
    DROP POLICY IF EXISTS "Participants can send messages" ON shared_conversation_messages;
    DROP POLICY IF EXISTS "Participants can send messages to their conversations" ON shared_conversation_messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON shared_conversation_messages;
    DROP POLICY IF EXISTS "Users can delete their own messages" ON shared_conversation_messages;
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Create NON-RECURSIVE policies for shared_conversations
-- =============================================================================

-- SELECT: Users can view conversations in their organization
-- SAFE: Only queries profiles table, NOT shared_conversations
CREATE POLICY "View org conversations"
  ON shared_conversations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT: Users can create conversations in their organization
-- SAFE: Only queries profiles table
CREATE POLICY "Insert org conversations"
  ON shared_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- UPDATE: Users can update conversations they created or in their org
-- SAFE: Only queries profiles table
CREATE POLICY "Update own conversations"
  ON shared_conversations FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- DELETE: Users can delete conversations they created
-- SAFE: Direct column check, no subquery needed
CREATE POLICY "Delete own conversations"
  ON shared_conversations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =============================================================================
-- STEP 3: Create NON-RECURSIVE policies for conversation_participants
-- =============================================================================

-- SELECT: Users can see participants for conversations in their organization
-- SAFE: Queries shared_conversations and profiles, NOT conversation_participants
CREATE POLICY "View participants in org conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM shared_conversations
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- INSERT: Users can add participants to conversations in their organization
-- SAFE: Queries shared_conversations and profiles, NOT conversation_participants
CREATE POLICY "Insert participants in own org"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM shared_conversations
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- DELETE: Users can remove participants from conversations in their organization
-- SAFE: Queries shared_conversations and profiles, NOT conversation_participants
CREATE POLICY "Delete participants in own org"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM shared_conversations
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- =============================================================================
-- STEP 4: Create NON-RECURSIVE policies for conversation_messages (if exists)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_messages') THEN

    -- SELECT: Users can view messages in conversations within their org
    -- SAFE: Queries shared_conversations and profiles, NOT conversation_messages
    EXECUTE 'CREATE POLICY "View messages in org conversations"
      ON conversation_messages FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM shared_conversations
          WHERE organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
          )
        )
      )';

    -- INSERT: Users can send messages to conversations in their org
    -- SAFE: Queries shared_conversations and profiles, NOT conversation_messages
    EXECUTE 'CREATE POLICY "Send messages in org conversations"
      ON conversation_messages FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND conversation_id IN (
          SELECT id FROM shared_conversations
          WHERE organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
          )
        )
      )';

    -- UPDATE: Users can update their own messages
    -- SAFE: Direct column check
    EXECUTE 'CREATE POLICY "Update own messages"
      ON conversation_messages FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())';

    -- DELETE: Users can delete their own messages
    -- SAFE: Direct column check
    EXECUTE 'CREATE POLICY "Delete own messages"
      ON conversation_messages FOR DELETE
      TO authenticated
      USING (user_id = auth.uid())';

  END IF;
END $$;

-- =============================================================================
-- STEP 5: Create NON-RECURSIVE policies for shared_conversation_messages (if exists)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shared_conversation_messages') THEN

    -- SELECT: Users can view messages in conversations within their org
    -- SAFE: Queries shared_conversations and profiles, NOT shared_conversation_messages
    EXECUTE 'CREATE POLICY "View messages in org conversations"
      ON shared_conversation_messages FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM shared_conversations
          WHERE organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
          )
        )
      )';

    -- INSERT: Users can send messages to conversations in their org
    -- SAFE: Queries shared_conversations and profiles, NOT shared_conversation_messages
    EXECUTE 'CREATE POLICY "Send messages in org conversations"
      ON shared_conversation_messages FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND conversation_id IN (
          SELECT id FROM shared_conversations
          WHERE organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
          )
        )
      )';

    -- UPDATE: Users can update their own messages
    -- SAFE: Direct column check
    EXECUTE 'CREATE POLICY "Update own messages"
      ON shared_conversation_messages FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())';

    -- DELETE: Users can delete their own messages
    -- SAFE: Direct column check
    EXECUTE 'CREATE POLICY "Delete own messages"
      ON shared_conversation_messages FOR DELETE
      TO authenticated
      USING (user_id = auth.uid())';

  END IF;
END $$;

-- =============================================================================
-- STEP 6: Add helpful comments
-- =============================================================================

COMMENT ON POLICY "View org conversations" ON shared_conversations
IS 'Users can view all conversations in their organization - NO RECURSION (only queries profiles)';

COMMENT ON POLICY "View participants in org conversations" ON conversation_participants
IS 'Users can view participants in org conversations - NO RECURSION (queries shared_conversations + profiles)';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- You can verify the policies by running:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename LIKE '%conversation%';
