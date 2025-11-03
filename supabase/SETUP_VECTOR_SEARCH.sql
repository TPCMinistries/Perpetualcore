-- =====================================================
-- VECTOR SEARCH FUNCTION FOR DOCUMENT RAG
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create function to search document chunks by vector similarity
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
    d.organization_id = org_id
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
-- VERIFICATION
-- =====================================================

-- You can test the function with:
-- SELECT * FROM search_document_chunks(
--   (SELECT embedding FROM document_chunks LIMIT 1),
--   (SELECT organization_id FROM profiles LIMIT 1),
--   0.5,
--   5
-- );
