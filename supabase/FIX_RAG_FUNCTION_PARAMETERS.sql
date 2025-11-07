-- =====================================================
-- FIX RAG SEARCH FUNCTION - Update to 8-parameter version
-- This fixes the parameter mismatch causing chat to fail
-- =====================================================

-- Drop the old 4-parameter version
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, float, int);
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, uuid, float, int, text, uuid, uuid);

-- Create the enhanced 8-parameter version that matches the TypeScript code
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  org_id uuid,
  requesting_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  search_scope text DEFAULT 'all', -- 'personal', 'team', 'organization', 'all'
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
    COALESCE(d.visibility, 'organization') as document_visibility,
    dc.chunk_index,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    (d.user_id = requesting_user_id) as is_personal,
    (requesting_user_id = ANY(COALESCE(d.shared_with_user_ids, '{}'))) as is_shared,
    false as shared_in_conversation, -- Simplified for now
    NULL::text as space_name -- Simplified for now
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE
    -- Organization match
    d.organization_id = org_id
    AND d.status = 'completed'
    AND dc.embedding IS NOT NULL

    -- Similarity threshold
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold

    -- Access control: User can see document if ANY of these are true
    AND (
      -- 1. User owns the document
      d.user_id = requesting_user_id

      -- 2. Document is organization-visible (default)
      OR COALESCE(d.visibility, 'organization') IN ('organization', 'public')

      -- 3. Document is explicitly shared with user (if column exists)
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'documents'
          AND column_name = 'shared_with_user_ids'
        )
        AND requesting_user_id = ANY(COALESCE(d.shared_with_user_ids, '{}'))
      )
    )

    -- Search scope filtering
    AND (
      search_scope = 'all'
      OR (search_scope = 'personal' AND d.user_id = requesting_user_id)
      OR (search_scope = 'team' AND (
        COALESCE(d.visibility, 'organization') = 'team'
        OR requesting_user_id = ANY(COALESCE(d.shared_with_user_ids, '{}'))
      ))
      OR (search_scope = 'organization' AND COALESCE(d.visibility, 'organization') IN ('organization', 'team'))
    )

  ORDER BY
    (1 - (dc.embedding <=> query_embedding)) DESC
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO anon;

COMMENT ON FUNCTION search_document_chunks IS 'Enhanced RAG search with 8 parameters to match TypeScript implementation';

-- =====================================================
-- VERIFICATION
-- Test that the function exists with correct signature
-- =====================================================

SELECT
  routine_name,
  routine_type,
  security_type,
  specific_name
FROM information_schema.routines
WHERE routine_name = 'search_document_chunks';

-- Expected output: Should show DEFINER security type

SELECT
  'Function created successfully!' as status;
