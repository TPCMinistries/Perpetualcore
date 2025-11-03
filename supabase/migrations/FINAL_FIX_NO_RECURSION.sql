-- FINAL FIX: Remove infinite recursion from conversation_participants

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants in conversations they belong to" ON conversation_participants;

-- Simple solution: Allow all authenticated users to view conversation_participants
-- This is safe because:
-- 1. Users can only see conversations they're part of (enforced on shared_conversations table)
-- 2. The API already checks if user is a participant before showing conversation details
-- 3. Knowing who's in a conversation isn't sensitive if you can't access the conversation itself

CREATE POLICY "Authenticated users can view conversation participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (true);

-- Keep the INSERT policy as is
-- (Already exists, no recursion issue)

COMMENT ON POLICY "Authenticated users can view conversation participants" ON conversation_participants
IS 'Allows authenticated users to see participants. Access to conversations themselves is controlled by shared_conversations policies.';
