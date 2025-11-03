-- Fix infinite recursion in conversation_participants RLS policy
-- The issue: Previous policies query conversation_participants within the policy for conversation_participants
-- Solution: Use shared_conversations table to check access instead

-- Drop ALL existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view participants in conversations they belong to" ON conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can view their conversation members" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view all participants in organization" ON conversation_participants;

-- Create a simple, non-recursive SELECT policy
-- Users can see participants for conversations in their organization
CREATE POLICY "View participants in org conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- Check if the conversation belongs to user's organization
    -- This avoids recursion by NOT querying conversation_participants
    conversation_id IN (
      SELECT id FROM shared_conversations
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Allow users to insert participants (for creating conversations)
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

-- Allow users to delete participants (for leaving conversations or removing others)
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

COMMENT ON POLICY "View participants in org conversations" ON conversation_participants
IS 'Users can view participants in conversations within their organization - NO RECURSION';
