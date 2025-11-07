-- =====================================================
-- TEST RAG VECTOR SEARCH
-- Run this AFTER deploying FIX_RAG_SEARCH_SIMPLE.sql
-- =====================================================

-- Step 1: Verify pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Expected: 1 row showing vector extension

-- Step 2: Check if we have any documents
SELECT
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_documents
FROM documents;

-- Step 3: Check if we have document chunks with embeddings
SELECT
  COUNT(*) as total_chunks,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as chunks_with_embeddings,
  CASE
    WHEN COUNT(*) FILTER (WHERE embedding IS NOT NULL) > 0
    THEN array_length((SELECT embedding::float[] FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1), 1)
    ELSE 0
  END as embedding_dimensions
FROM document_chunks;
-- Expected: chunks_with_embeddings > 0, embedding_dimensions = 1536

-- Step 4: Get a sample document and chunk info
SELECT
  d.id as document_id,
  d.title,
  d.organization_id,
  d.status,
  COUNT(dc.id) as chunk_count,
  COUNT(dc.embedding) as chunks_with_embeddings
FROM documents d
LEFT JOIN document_chunks dc ON dc.document_id = d.id
GROUP BY d.id, d.title, d.organization_id, d.status
ORDER BY d.created_at DESC
LIMIT 5;

-- Step 5: Test self-similarity (should return the chunk itself with ~1.0 similarity)
-- This uses a chunk's own embedding to search - should ALWAYS find itself
DO $$
DECLARE
  test_org_id uuid;
  test_user_id uuid;
  test_embedding vector(1536);
BEGIN
  -- Get a test chunk
  SELECT d.organization_id, d.user_id, dc.embedding
  INTO test_org_id, test_user_id, test_embedding
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE dc.embedding IS NOT NULL
  LIMIT 1;

  IF test_embedding IS NULL THEN
    RAISE NOTICE '❌ No chunks with embeddings found!';
  ELSE
    RAISE NOTICE '✅ Found test chunk';
    RAISE NOTICE '   Org ID: %', test_org_id;
    RAISE NOTICE '   User ID: %', test_user_id;
    RAISE NOTICE '   Embedding dimensions: %', array_length(test_embedding::float[], 1);

    -- Now test the function
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Testing search_document_chunks function...';
  END IF;
END $$;

-- Step 6: Actual function call test
WITH test_data AS (
  SELECT
    d.organization_id,
    d.user_id,
    dc.embedding,
    d.title as original_title,
    dc.content as original_content
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE dc.embedding IS NOT NULL
  LIMIT 1
)
SELECT
  'SEARCH RESULTS' as test,
  s.document_title,
  s.chunk_index,
  s.similarity,
  SUBSTRING(s.content, 1, 100) as content_preview
FROM test_data t
CROSS JOIN LATERAL search_document_chunks(
  t.embedding,              -- Use the chunk's own embedding
  t.organization_id,        -- org_id
  t.user_id,                -- requesting_user_id
  0.0,                      -- threshold = 0 to see ANY results
  5,                        -- match_count
  'all',                    -- search_scope
  NULL,                     -- conversation_id
  NULL                      -- space_id
) s;

-- Expected: At least 1 result with similarity ~1.0
-- If you get 0 results here, there's still an issue

-- Step 7: Check function permissions
SELECT
  p.proname as function_name,
  array_agg(DISTINCT acl.privilege_type) as granted_privileges,
  array_agg(DISTINCT acl.grantee) as grantees
FROM pg_proc p
LEFT JOIN LATERAL (
  SELECT
    (aclexplode(p.proacl)).grantee::regrole::text as grantee,
    (aclexplode(p.proacl)).privilege_type
) acl ON true
WHERE p.proname = 'search_document_chunks'
GROUP BY p.proname;

RAISE NOTICE '✅ Test complete! Check results above.';
