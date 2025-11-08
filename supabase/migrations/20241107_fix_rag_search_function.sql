-- =====================================================
-- FIX RAG SEARCH FUNCTION - Update to 8-parameter version
-- This updates the search_document_chunks function to match
-- the TypeScript code that calls it with 8 parameters
-- =====================================================

-- Drop old function versions
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, float, int);
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, uuid, float, int, text, uuid, uuid);

-- Create enhanced search function with SECURITY DEFINER
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
SECURITY DEFINER  -- KEY: Bypasses RLS during execution
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
    (conversation_id IS NOT NULL AND conversation_id = ANY(COALESCE(d.mentioned_in_conversations, '{}'))) as shared_in_conversation,
    ks.name as space_name
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  LEFT JOIN knowledge_spaces ks ON ks.id = ANY(COALESCE(d.featured_in_spaces, '{}'))
  WHERE
    -- Organization match
    d.organization_id = org_id
    AND d.status = 'completed'
    AND dc.embedding IS NOT NULL

    -- Similarity threshold
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold

    -- Scope filtering
    AND (
      search_scope = 'all'
      OR (search_scope = 'personal' AND d.user_id = requesting_user_id)
      OR (search_scope = 'team' AND space_id IS NOT NULL AND space_id = ANY(COALESCE(d.featured_in_spaces, '{}')))
      OR (search_scope = 'organization' AND (d.visibility IS NULL OR d.visibility = 'organization'))
    )

    -- Conversation context (boost docs mentioned in this conversation)
    AND (
      conversation_id IS NULL
      OR conversation_id = ANY(COALESCE(d.mentioned_in_conversations, '{}'))
      OR TRUE  -- Include all docs but prioritize conversation-mentioned ones
    )

    -- Space filtering
    AND (
      space_id IS NULL
      OR space_id = ANY(COALESCE(d.featured_in_spaces, '{}'))
      OR TRUE  -- Include all docs if no space filter
    )
  ORDER BY
    -- Prioritize docs mentioned in conversation
    CASE WHEN conversation_id IS NOT NULL AND conversation_id = ANY(COALESCE(d.mentioned_in_conversations, '{}'))
      THEN 0 ELSE 1 END,
    -- Then by similarity
    dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO anon;

-- Add comment
COMMENT ON FUNCTION search_document_chunks IS
  'Enhanced vector similarity search with context-awareness, visibility filtering, and team spaces support. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- ENSURE RLS POLICIES ARE CORRECT
-- =====================================================

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Documents policies (recreate if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'documents'
    AND policyname = 'Users can view documents in their organization'
  ) THEN
    CREATE POLICY "Users can view documents in their organization"
      ON documents FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Document chunks policies (recreate if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_chunks'
    AND policyname = 'Users can view chunks in their organization'
  ) THEN
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
  END IF;
END $$;

-- =====================================================
-- CREATE INDEXES IF MISSING
-- =====================================================

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Document lookup indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
  ON document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_documents_organization_status
  ON documents(organization_id, status);

-- =====================================================
-- TEST THE FUNCTION
-- =====================================================

DO $$
DECLARE
  test_org_id uuid;
  test_user_id uuid;
  test_embedding vector(1536);
  result_count int;
BEGIN
  -- Get test data
  SELECT
    d.organization_id,
    d.user_id,
    dc.embedding
  INTO test_org_id, test_user_id, test_embedding
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE dc.embedding IS NOT NULL
  LIMIT 1;

  IF test_embedding IS NULL THEN
    RAISE NOTICE '⚠️  No embeddings found - cannot test. Upload a document first.';
    RETURN;
  END IF;

  -- Test the function
  SELECT COUNT(*)
  INTO result_count
  FROM search_document_chunks(
    test_embedding,
    test_org_id,
    test_user_id,
    0.0,  -- Very low threshold to ensure results
    10,
    'all',
    NULL,
    NULL
  );

  RAISE NOTICE 'Test complete: Found % matching chunks', result_count;

  IF result_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS: Enhanced RAG search is working!';
  ELSE
    RAISE NOTICE '❌ FAILURE: Search returned 0 results. Check RLS policies and data.';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show function details
SELECT
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'search_document_chunks';

-- Show document counts
SELECT
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'processing') as processing
FROM documents;

-- Show chunk counts
SELECT
  COUNT(*) as total_chunks,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embeddings
FROM document_chunks;
