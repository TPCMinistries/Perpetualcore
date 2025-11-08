-- =====================================================
-- CHECK RLS POLICIES ON CONVERSATIONS AND MESSAGES
-- Find policies that might reference organization_members
-- =====================================================

-- 1. Check conversations table RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

-- 2. Get detailed policy definitions for conversations
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command,
  pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('conversations', 'messages')
ORDER BY c.relname, pol.polname;

-- 3. Check if RLS is even enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('conversations', 'messages');
