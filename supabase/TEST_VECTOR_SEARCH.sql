-- =====================================================
-- TEST VECTOR SEARCH FUNCTION
-- This tests if the search function works with actual data
-- =====================================================

-- Step 1: Get an actual embedding from your document to test with
-- This should return 1 row with the embedding and org info
SELECT
  dc.embedding,
  d.organization_id,
  d.title,
  dc.content,
  dc.chunk_index
FROM document_chunks dc
INNER JOIN documents d ON dc.document_id = d.id
WHERE d.title LIKE '%Working_USA%'
LIMIT 1;

-- =====================================================
-- Step 2: Test the search function with that embedding
-- Copy one of the embeddings from above and paste it below
-- This should find the chunk we just queried (self-similarity test)
-- =====================================================

-- UNCOMMENT AND RUN THIS AFTER GETTING THE EMBEDDING FROM STEP 1:
/*
WITH test_data AS (
  SELECT
    dc.embedding as test_embedding,
    d.organization_id as test_org_id
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE d.title LIKE '%Working_USA%'
  LIMIT 1
)
SELECT * FROM search_document_chunks(
  (SELECT test_embedding FROM test_data),
  (SELECT test_org_id FROM test_data),
  0.0,  -- threshold = 0 to see ANY results
  10     -- get up to 10 results
);
*/

-- =====================================================
-- Step 3: Check if embeddings are actually stored correctly
-- This counts chunks with non-null embeddings
-- =====================================================

SELECT
  d.title,
  d.status,
  d.organization_id,
  COUNT(dc.id) as total_chunks,
  COUNT(dc.embedding) as chunks_with_embeddings,
  -- Check the dimensionality of embeddings
  (SELECT array_length(dc2.embedding::float[], 1)
   FROM document_chunks dc2
   WHERE dc2.document_id = d.id
   AND dc2.embedding IS NOT NULL
   LIMIT 1) as embedding_dimensions
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
WHERE d.title LIKE '%Working_USA%'
GROUP BY d.id, d.title, d.status, d.organization_id;
