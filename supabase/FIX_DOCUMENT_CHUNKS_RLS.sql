-- =====================================================
-- FIX RLS POLICIES FOR DOCUMENT_CHUNKS
-- This fixes the "row-level security policy" error
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if RLS is enabled (it probably is)
-- If this returns true, RLS is the problem
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'document_chunks';

-- 2. Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Users can insert chunks for their org documents" ON document_chunks;
DROP POLICY IF EXISTS "Users can read chunks for their org documents" ON document_chunks;
DROP POLICY IF EXISTS "Users can update chunks for their org documents" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete chunks for their org documents" ON document_chunks;

-- 3. Create comprehensive RLS policies for document_chunks

-- Allow INSERT for documents in user's organization
-- This is crucial for the server-side processing to work
CREATE POLICY "Users can insert chunks for their org documents"
ON document_chunks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    INNER JOIN profiles p ON d.organization_id = p.organization_id
    WHERE d.id = document_chunks.document_id
    AND p.id = auth.uid()
  )
);

-- Allow SELECT for documents in user's organization
CREATE POLICY "Users can read chunks for their org documents"
ON document_chunks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents d
    INNER JOIN profiles p ON d.organization_id = p.organization_id
    WHERE d.id = document_chunks.document_id
    AND p.id = auth.uid()
  )
);

-- Allow UPDATE for documents in user's organization
CREATE POLICY "Users can update chunks for their org documents"
ON document_chunks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM documents d
    INNER JOIN profiles p ON d.organization_id = p.organization_id
    WHERE d.id = document_chunks.document_id
    AND p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    INNER JOIN profiles p ON d.organization_id = p.organization_id
    WHERE d.id = document_chunks.document_id
    AND p.id = auth.uid()
  )
);

-- Allow DELETE for documents in user's organization
CREATE POLICY "Users can delete chunks for their org documents"
ON document_chunks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM documents d
    INNER JOIN profiles p ON d.organization_id = p.organization_id
    WHERE d.id = document_chunks.document_id
    AND p.id = auth.uid()
  )
);

-- 4. Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'document_chunks';

-- =====================================================
-- DONE! Your document uploads should work now
-- =====================================================
