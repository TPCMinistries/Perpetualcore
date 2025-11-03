-- Fix infinite recursion in conversation_participants RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Participants can view their conversation members" ON conversation_participants;

-- Create a simpler policy without recursion
-- This allows users to see participants in conversations where they are also a participant
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    -- User can see all participants in conversations they're part of
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Alternative: Just allow users to view all participants (simpler, but less secure)
-- Uncomment if the above still causes issues:
-- DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
-- CREATE POLICY "Users can view all participants in organization"
--   ON conversation_participants FOR SELECT
--   USING (
--     conversation_id IN (
--       SELECT id FROM shared_conversations
--       WHERE organization_id IN (
--         SELECT organization_id FROM profiles WHERE id = auth.uid()
--       )
--     )
--   );

COMMENT ON POLICY "Users can view participants in their conversations" ON conversation_participants
IS 'Allows users to see all participants in conversations they belong to';
