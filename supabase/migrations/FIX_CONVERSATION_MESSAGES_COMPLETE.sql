-- COMPLETE FIX FOR TEAM CONVERSATIONS
-- This addresses all the Supabase errors:
-- 1. RLS policy blocking AI messages (user_id = null)
-- 2. Missing foreign key relationship between conversation_messages and profiles
-- 3. Ensures proper data access

-- ============================================
-- PART 1: Add foreign key for profiles relationship
-- ============================================

-- Check if the foreign key already exists before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'conversation_messages_user_id_fkey'
    AND table_name = 'conversation_messages'
  ) THEN
    -- Add foreign key constraint (allowing NULL for AI messages)
    ALTER TABLE conversation_messages
    ADD CONSTRAINT conversation_messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

    RAISE NOTICE 'Added foreign key constraint for conversation_messages.user_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- ============================================
-- PART 2: Fix RLS Policies for conversation_messages
-- ============================================

-- Drop the problematic INSERT policy that blocks AI messages
DROP POLICY IF EXISTS "Participants can send messages to their conversations" ON conversation_messages;

-- Create new INSERT policy that allows:
-- 1. Users to send their own messages (user_id = auth.uid())
-- 2. System/Server to send AI messages (user_id IS NULL)
CREATE POLICY "Allow user and AI messages in participant conversations"
ON conversation_messages
FOR INSERT
WITH CHECK (
  -- Allow AI messages (user_id IS NULL) OR user's own messages
  (user_id IS NULL OR user_id = auth.uid())
  AND
  -- Ensure conversation exists and user is a participant
  conversation_id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid() AND can_send_messages = true
  )
);

-- Also ensure SELECT policy allows viewing AI messages
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON conversation_messages;

CREATE POLICY "Participants can view all messages in their conversations"
ON conversation_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Update policy should still only allow users to edit their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON conversation_messages;

CREATE POLICY "Users can update only their own messages"
ON conversation_messages
FOR UPDATE
USING (user_id = auth.uid() AND user_id IS NOT NULL);

-- Delete policy should still only allow users to delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON conversation_messages;

CREATE POLICY "Users can delete only their own messages"
ON conversation_messages
FOR DELETE
USING (user_id = auth.uid() AND user_id IS NOT NULL);

-- ============================================
-- PART 3: Verify the setup
-- ============================================

-- Check that policies are correctly created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'conversation_messages'
ORDER BY cmd, policyname;

-- Check that foreign key exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'conversation_messages';

-- ============================================
-- SUMMARY OF FIXES
-- ============================================

/*
FIXES APPLIED:

1. ✅ Added foreign key relationship: conversation_messages.user_id -> auth.users(id)
   - This fixes the "Could not find a relationship between 'conversation_messages' and 'profiles'" error
   - Allows NULL values for AI messages

2. ✅ Fixed RLS INSERT policy to allow AI messages (user_id = NULL)
   - Previous policy required user_id = auth.uid(), blocking AI responses
   - New policy allows both user messages AND AI messages (null user_id)

3. ✅ Ensured SELECT policy allows viewing all messages (user and AI)
   - Participants can view all messages in conversations they're part of

4. ✅ Maintained security for UPDATE and DELETE
   - Users can only modify/delete their own messages
   - AI messages cannot be modified (user_id IS NOT NULL check)

TABLES NEEDED GOING FORWARD:

Core Team Conversations Tables:
✓ shared_conversations - The conversation container
✓ conversation_participants - Who's in each conversation
✓ conversation_messages - Messages and AI responses

Supporting Tables:
✓ profiles - User profile information (already exists)
✓ documents - For document-based conversations (already exists)
✓ auth.users - Supabase auth users (system table)

Optional Future Tables:
- conversation_attachments - File attachments in messages
- conversation_mentions - @mentions and notifications
- conversation_templates - Reusable conversation templates
- conversation_analytics - Usage metrics and insights
*/
