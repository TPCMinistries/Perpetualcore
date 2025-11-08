-- =====================================================
-- EMERGENCY FIX: DISABLE RLS ON CHAT TABLES
-- This allows personal chat to work immediately
-- =====================================================

-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('conversations', 'messages');

-- Should show rls_enabled = false for both tables
