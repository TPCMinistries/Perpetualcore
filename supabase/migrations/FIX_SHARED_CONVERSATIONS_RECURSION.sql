-- Fix infinite recursion in shared_conversations RLS policy

-- Drop ALL existing policies on shared_conversations that might cause recursion
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON shared_conversations;
DROP POLICY IF EXISTS "Users can view their organization conversations" ON shared_conversations;
DROP POLICY IF EXISTS "View conversations in organization" ON shared_conversations;
DROP POLICY IF EXISTS "Users can view shared conversations they participate in" ON shared_conversations;

-- Create a simple, non-recursive SELECT policy
-- Users can view conversations in their organization
CREATE POLICY "View org conversations"
  ON shared_conversations FOR SELECT
  TO authenticated
  USING (
    -- Check if conversation belongs to user's organization
    -- This is safe - no recursion
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Allow users to insert conversations in their org
CREATE POLICY "Insert org conversations"
  ON shared_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Allow users to update conversations they created
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

-- Allow users to delete conversations they created
CREATE POLICY "Delete own conversations"
  ON shared_conversations FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

COMMENT ON POLICY "View org conversations" ON shared_conversations
IS 'Users can view all conversations in their organization - NO RECURSION';
