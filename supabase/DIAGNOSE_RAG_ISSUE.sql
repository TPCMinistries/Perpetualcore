-- =====================================================
-- COMPREHENSIVE RAG DIAGNOSTICS
-- Run each section sequentially and share results
-- =====================================================

-- ============ SECTION 1: Verify Document Status ============
-- Check the actual status value in the database
SELECT
  id,
  title,
  status,
  organization_id,
  created_at
FROM documents
WHERE title LIKE '%Working_USA%';

-- Expected: status should be 'completed' (not 'ready' or 'processing')

-- ============ SECTION 2: Verify Chunks and Embeddings ============
-- Check if chunks exist with embeddings
SELECT
  dc.id,
  dc.document_id,
  dc.chunk_index,
  dc.embedding IS NOT NULL as has_embedding,
  -- Check embedding dimensions
  CASE
    WHEN dc.embedding IS NOT NULL THEN array_length(dc.embedding::float[], 1)
    ELSE NULL
  END as embedding_dimensions,
  LENGTH(dc.content) as content_length,
  SUBSTRING(dc.content, 1, 100) as content_preview
FROM document_chunks dc
INNER JOIN documents d ON dc.document_id = d.id
WHERE d.title LIKE '%Working_USA%'
ORDER BY dc.chunk_index;

-- Expected: 2 rows, has_embedding = true, embedding_dimensions = 1536

-- ============ SECTION 3: Check RLS Policies on Documents ============
-- Verify RLS policies exist for documents table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  SUBSTRING(qual::text, 1, 100) as qual_preview
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY cmd;

-- Expected: Policies allowing SELECT for user's organization

-- ============ SECTION 4: Check RLS Policies on Document Chunks ============
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  SUBSTRING(qual::text, 1, 100) as qual_preview
FROM pg_policies
WHERE tablename = 'document_chunks'
ORDER BY cmd;

-- Expected: Policies we created earlier

-- ============ SECTION 5: Test Search Function with Self-Search ============
-- This tests if the function works by searching for a chunk using its own embedding
-- This should DEFINITELY return the chunk itself (100% match)

WITH test_chunk AS (
  SELECT
    dc.embedding as test_embedding,
    d.organization_id as test_org_id,
    dc.content as original_content
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE d.title LIKE '%Working_USA%'
  LIMIT 1
)
SELECT
  'Test embedding dimensions:' as info,
  array_length((SELECT test_embedding::float[] FROM test_chunk), 1) as dimensions,
  'Test org_id:' as org_label,
  (SELECT test_org_id FROM test_chunk) as org_id;

-- Now actually call the search function
WITH test_chunk AS (
  SELECT
    dc.embedding as test_embedding,
    d.organization_id as test_org_id
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE d.title LIKE '%Working_USA%'
  LIMIT 1
)
SELECT
  'SEARCH RESULTS:' as label,
  r.*
FROM test_chunk tc
CROSS JOIN LATERAL search_document_chunks(
  tc.test_embedding,
  tc.test_org_id,
  0.0,  -- threshold = 0 to see ANY results
  10
) r;

-- Expected: Should return at least 1 result (the chunk itself with ~1.0 similarity)
-- If this returns 0 results, there's an RLS or function issue

-- ============ SECTION 6: Check if RLS is blocking the function ============
-- Temporarily disable RLS to test (ONLY FOR DEBUGGING!)
-- DO NOT LEAVE THIS DISABLED!

-- First, check current RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('documents', 'document_chunks');

-- ============ SECTION 7: Direct Query Without Function ============
-- Bypass the function and query directly to see if RLS is the issue

WITH test_chunk AS (
  SELECT
    dc.embedding as test_embedding,
    d.organization_id as test_org_id
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE d.title LIKE '%Working_USA%'
  LIMIT 1
)
SELECT
  dc.document_id,
  d.title as document_title,
  dc.chunk_index,
  dc.content,
  1 - (dc.embedding <=> (SELECT test_embedding FROM test_chunk)) as similarity
FROM document_chunks dc
INNER JOIN documents d ON dc.document_id = d.id
CROSS JOIN test_chunk tc
WHERE
  d.organization_id = tc.test_org_id
  AND d.status = 'completed'
  AND dc.embedding IS NOT NULL
  AND 1 - (dc.embedding <=> tc.test_embedding) > 0.0
ORDER BY dc.embedding <=> tc.test_embedding
LIMIT 10;

-- Expected: Should return results
-- If this works but Section 5 doesn't, the issue is with the function itself
-- If this also returns nothing, the issue is with RLS policies
