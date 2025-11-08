-- =====================================================
-- DIAGNOSE ORGANIZATION_MEMBERS INFINITE RECURSION
-- Find the RLS policy causing circular reference
-- =====================================================

-- 1. Check if the table exists
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'organization_members';

-- 2. Get all RLS policies on organization_members table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organization_members';

-- 3. Get the detailed policy definitions (this shows the actual SQL)
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
WHERE c.relname = 'organization_members'
ORDER BY pol.polname;

-- 4. Show table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'organization_members'
ORDER BY ordinal_position;

-- =====================================================
-- COMMON RECURSION PATTERNS TO LOOK FOR:
-- =====================================================
-- A policy on organization_members that does something like:
--   EXISTS (SELECT 1 FROM organization_members WHERE ...)
-- This creates a circular reference!
--
-- The fix is usually to:
-- 1. Use auth.uid() directly instead of checking membership
-- 2. Create a helper function that uses SECURITY DEFINER
-- 3. Simplify the policy to avoid self-referencing
-- =====================================================
