-- =====================================================
-- FIX VECTOR SEARCH FUNCTION (8 Parameters)
-- Run this in Supabase SQL Editor to fix the document search API
-- =====================================================

-- Drop old function versions (all signatures)
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, float, int);
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, uuid, float, int, text, uuid, uuid);

-- Create the 8-parameter version that the API code expects
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  org_id uuid,
  requesting_user_id uuid,
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 10,
  search_scope text DEFAULT 'all',
  conversation_id uuid DEFAULT NULL,
  space_id uuid DEFAULT NULL
)
RETURNS TABLE (
  document_id uuid,
  document_title text,
  document_visibility text,
  chunk_index int,
  content text,
  similarity float,
  is_personal boolean,
  is_shared boolean,
  shared_in_conversation boolean,
  space_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.document_id,
    d.title as document_title,
    COALESCE(d.visibility, 'organization')::text as document_visibility,
    dc.chunk_index,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    (d.user_id = requesting_user_id) as is_personal,
    false as is_shared,
    false as shared_in_conversation,
    NULL::text as space_name
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE
    d.organization_id = org_id
    AND d.status = 'completed'
    AND dc.embedding IS NOT NULL
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO anon;

-- Verify function was created
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'search_document_chunks';

-- =====================================================
-- SUCCESS! The vector search API should now work at:
-- POST https://perpetualcore.com/api/v1/documents/search
-- =====================================================
