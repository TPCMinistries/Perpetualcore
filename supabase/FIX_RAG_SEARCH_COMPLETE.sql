-- =====================================================
-- COMPLETE RAG SEARCH FIX
-- This script addresses all potential issues with RAG vector search
-- Run this in Supabase SQL Editor
-- =====================================================

-- ============ STEP 1: Drop and recreate search function with SECURITY DEFINER ============
-- This allows the function to bypass RLS policies during execution
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, float, int);

CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  org_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  document_id uuid,
  document_title text,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This is KEY - allows function to bypass RLS
SET search_path = public  -- Security best practice
AS $$
BEGIN
  -- Log the search attempt for debugging
  RAISE LOG 'search_document_chunks called with org_id: %, threshold: %, count: %',
    org_id, match_threshold, match_count;

  RETURN QUERY
  SELECT
    dc.document_id,
    d.title as document_title,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE
    d.organization_id = org_id
    AND d.status = 'completed'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO anon;

COMMENT ON FUNCTION search_document_chunks IS 'Vector similarity search for document chunks with SECURITY DEFINER to bypass RLS';

-- ============ STEP 2: Verify and fix RLS policies ============

-- Enable RLS on both tables if not already
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view documents in their organization" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their organization" ON documents;
DROP POLICY IF EXISTS "Users can update documents in their organization" ON documents;
DROP POLICY IF EXISTS "Users can delete documents in their organization" ON documents;

DROP POLICY IF EXISTS "Users can view chunks in their organization" ON document_chunks;
DROP POLICY IF EXISTS "Users can insert chunks in their organization" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete chunks in their organization" ON document_chunks;

-- Recreate documents policies
CREATE POLICY "Users can view documents in their organization"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their organization"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their organization"
  ON documents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in their organization"
  ON documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Recreate document_chunks policies with proper join
CREATE POLICY "Users can view chunks in their organization"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_chunks.document_id
      AND d.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert chunks in their organization"
  ON document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_chunks.document_id
      AND d.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete chunks in their organization"
  ON document_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_chunks.document_id
      AND d.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============ STEP 3: Create indexes if missing ============

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
  ON document_chunks(document_id);

-- Index for document organization
CREATE INDEX IF NOT EXISTS idx_documents_organization_status
  ON documents(organization_id, status);

-- ============ STEP 4: Test the function ============

DO $$
DECLARE
  test_org_id uuid;
  test_embedding vector(1536);
  result_count int;
BEGIN
  -- Get a test organization ID and embedding
  SELECT d.organization_id, dc.embedding
  INTO test_org_id, test_embedding
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE dc.embedding IS NOT NULL
  LIMIT 1;

  IF test_embedding IS NULL THEN
    RAISE NOTICE 'No embeddings found in database - cannot test';
    RETURN;
  END IF;

  -- Test the function
  SELECT COUNT(*)
  INTO result_count
  FROM search_document_chunks(test_embedding, test_org_id, 0.0, 10);

  RAISE NOTICE 'Test results: Found % chunks for org %', result_count, test_org_id;

  IF result_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS: Vector search is working!';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Vector search returned 0 results. Check RLS policies.';
  END IF;
END $$;

-- ============ VERIFICATION QUERIES ============

-- Check function exists
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'search_document_chunks';

-- Check document count
SELECT
  COUNT(*) as total_documents,
  COUNT(DISTINCT organization_id) as organizations,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_documents
FROM documents;

-- Check chunk count
SELECT
  COUNT(*) as total_chunks,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as chunks_with_embeddings,
  COUNT(DISTINCT document_id) as documents_with_chunks
FROM document_chunks;

-- Show RLS policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('documents', 'document_chunks')
ORDER BY tablename, cmd;

-- =====================================================
-- EXPECTED OUTPUT:
-- - Function should show security_type = DEFINER
-- - Test should return "SUCCESS: Vector search is working!"
-- - Should see documents and chunks with embeddings
-- - RLS policies should be listed for both tables
-- =====================================================
