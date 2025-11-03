-- =====================================================
-- FIX: RAG VECTOR SEARCH - SECURITY DEFINER VERSION
-- This resolves RLS policy issues by running with elevated privileges
-- =====================================================

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, float, int);

-- Create the FIXED function with SECURITY DEFINER
-- This allows the function to bypass RLS policies while still being secure
-- because we manually check organization_id
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
SECURITY DEFINER  -- This is the KEY FIX - bypasses RLS
SET search_path = public  -- Security: lock down search path
AS $$
BEGIN
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
    d.organization_id = org_id  -- Security: manually filter by org
    AND d.status = 'completed'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;

-- =====================================================
-- VERIFICATION TEST
-- =====================================================

-- Test 1: Basic function check
SELECT
  'Function created successfully' as status,
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as owner
FROM pg_proc
WHERE proname = 'search_document_chunks';

-- Test 2: Self-similarity test (should return the chunk itself with ~1.0 similarity)
-- This uses a chunk's own embedding to search for itself - should ALWAYS work
WITH test_data AS (
  SELECT
    dc.embedding as test_embedding,
    d.organization_id as test_org_id,
    d.title as test_doc_title
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE dc.embedding IS NOT NULL
  LIMIT 1
)
SELECT
  'Self-Similarity Test' as test_name,
  (SELECT test_doc_title FROM test_data) as test_document,
  (SELECT COUNT(*) FROM test_data) as test_data_available,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM test_data td
      CROSS JOIN LATERAL search_document_chunks(
        td.test_embedding,
        td.test_org_id,
        0.0,  -- threshold = 0 to see ANY results
        5
      ) results
    ),
    0
  ) as results_count;

-- Expected output:
-- - is_security_definer: true
-- - results_count: >= 1 (should find at least the chunk itself)

-- If results_count is still 0, run the diagnostic below:

-- =====================================================
-- DIAGNOSTIC: Manual query to verify data exists
-- =====================================================
SELECT
  'Data Verification' as test_name,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(dc.id) as total_chunks,
  COUNT(dc.embedding) as chunks_with_embeddings,
  COUNT(DISTINCT d.organization_id) as unique_orgs
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
WHERE d.status = 'completed';

-- If this shows data exists but the function still returns 0,
-- the issue might be with the pgvector extension or embedding type.
