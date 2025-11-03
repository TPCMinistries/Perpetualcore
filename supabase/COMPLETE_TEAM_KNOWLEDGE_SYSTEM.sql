-- =====================================================
-- COMPLETE TEAM KNOWLEDGE & COLLABORATION SYSTEM
-- Integrates: Documents, Sharing, Teams, Chat, Comments, RAG
-- Phase: Foundation + Smart Features
-- =====================================================

-- =====================================================
-- PHASE 1: EXTEND DOCUMENTS TABLE
-- =====================================================

-- Add visibility and sharing columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'organization'
  CHECK (visibility IN ('personal', 'team', 'organization', 'public')),
ADD COLUMN IF NOT EXISTS shared_with_user_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shared_with_team_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_message TEXT,
ADD COLUMN IF NOT EXISTS featured_in_spaces UUID[] DEFAULT '{}';

-- Add context tracking columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS mentioned_in_conversations UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS used_in_tasks UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS viewed_by_user_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- Add AI-powered features
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS ai_extracted_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_related_document_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_relevance_score FLOAT DEFAULT 0.0;

COMMENT ON COLUMN documents.visibility IS 'personal=only creator, team=specific teams, organization=all org members, public=marketplace';
COMMENT ON COLUMN documents.shared_with_user_ids IS 'Array of user IDs who have explicit access';
COMMENT ON COLUMN documents.shared_with_team_ids IS 'Array of team/space IDs who have access';
COMMENT ON COLUMN documents.mentioned_in_conversations IS 'Track which conversations reference this doc';
COMMENT ON COLUMN documents.ai_extracted_topics IS 'AI-extracted keywords/topics for smart categorization';

-- =====================================================
-- PHASE 2: KNOWLEDGE SPACES (TEAMS)
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  space_type TEXT NOT NULL DEFAULT 'team' CHECK (space_type IN ('team', 'project', 'department', 'client')),
  emoji TEXT DEFAULT '📁',
  color TEXT DEFAULT '#3B82F6',

  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_ids UUID[] DEFAULT '{}',
  moderator_ids UUID[] DEFAULT '{}',

  -- Knowledge organization
  default_folder_id UUID REFERENCES folders(id),
  featured_document_ids UUID[] DEFAULT '{}',
  pinned_conversation_ids UUID[] DEFAULT '{}',

  -- Settings
  is_private BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- RAG configuration
  rag_enabled BOOLEAN DEFAULT true,
  rag_scope TEXT DEFAULT 'space_plus_org' CHECK (rag_scope IN ('space_only', 'space_plus_org', 'space_plus_related')),

  -- Auto-sharing rules (JSONB)
  auto_tag_rules JSONB DEFAULT '[]'::jsonb,
  auto_share_rules JSONB DEFAULT '[]'::jsonb,

  -- Stats
  document_count INT DEFAULT 0,
  member_count INT DEFAULT 0,
  conversation_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_spaces_org ON knowledge_spaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_spaces_owner ON knowledge_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_spaces_members ON knowledge_spaces USING GIN(member_ids);

-- RLS Policies
ALTER TABLE knowledge_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view spaces they're members of"
  ON knowledge_spaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR auth.uid() = ANY(member_ids)
    OR auth.uid() = ANY(moderator_ids)
    OR NOT is_private
  );

CREATE POLICY "Space owners can update their spaces"
  ON knowledge_spaces FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = ANY(moderator_ids));

CREATE POLICY "Users can create spaces in their org"
  ON knowledge_spaces FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = knowledge_spaces.organization_id
    )
  );

-- =====================================================
-- PHASE 3: DOCUMENT ACCESS & SHARING
-- =====================================================

CREATE TABLE IF NOT EXISTS document_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Who has access
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES knowledge_spaces(id) ON DELETE CASCADE,
  role_name TEXT, -- Access by role (e.g., 'sales', 'admin')

  -- Access level
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit', 'admin')),
  can_reshare BOOLEAN DEFAULT false,

  -- Context
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Sharing context
  share_message TEXT,
  share_reason TEXT CHECK (share_reason IN ('collaboration', 'review', 'fyi', 'approval_needed')),
  shared_in_conversation_id UUID REFERENCES shared_conversations(id),

  -- Tracking
  require_acknowledgment BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,

  -- Constraints
  CONSTRAINT document_access_target_check CHECK (
    (user_id IS NOT NULL)::int +
    (team_id IS NOT NULL)::int +
    (role_name IS NOT NULL)::int = 1
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_access_doc ON document_access(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_user ON document_access(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_team ON document_access(team_id);
CREATE INDEX IF NOT EXISTS idx_document_access_expires ON document_access(expires_at);

-- RLS Policies
ALTER TABLE document_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access grants"
  ON document_access FOR SELECT
  USING (
    user_id = auth.uid()
    OR granted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_access.document_id
      AND d.user_id = auth.uid()
    )
  );

-- =====================================================
-- PHASE 4: DOCUMENT RELATIONSHIPS (KNOWLEDGE GRAPH)
-- =====================================================

CREATE TABLE IF NOT EXISTS document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  related_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Relationship metadata
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('references', 'supersedes', 'related', 'version_of', 'derived_from', 'discusses')),
  strength FLOAT DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),

  -- How was this relationship created?
  created_by_type TEXT NOT NULL CHECK (created_by_type IN ('user', 'ai_detected', 'system')),
  created_by_user_id UUID REFERENCES auth.users(id),

  -- Context
  found_in_conversation_id UUID REFERENCES shared_conversations(id),
  ai_confidence FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(source_document_id, related_document_id, relationship_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_relationships_source ON document_relationships(source_document_id);
CREATE INDEX IF NOT EXISTS idx_doc_relationships_related ON document_relationships(related_document_id);
CREATE INDEX IF NOT EXISTS idx_doc_relationships_strength ON document_relationships(strength DESC);

-- RLS Policies
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships for accessible documents"
  ON document_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE id = document_relationships.source_document_id
      AND (
        user_id = auth.uid()
        OR visibility = 'organization'
        OR auth.uid() = ANY(shared_with_user_ids)
      )
    )
  );

-- =====================================================
-- PHASE 5: DOCUMENT CONTEXT USAGE
-- =====================================================

CREATE TABLE IF NOT EXISTS document_context_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Where was it used?
  used_in_entity_type TEXT NOT NULL CHECK (used_in_entity_type IN ('conversation', 'task', 'email', 'workflow', 'comment')),
  used_in_entity_id UUID NOT NULL,

  -- Who used it?
  used_by_user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Usage tracking
  usage_count INT DEFAULT 1,
  first_used_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  usage_context TEXT, -- How was it used? "attached", "mentioned", "rag_retrieved"

  UNIQUE(document_id, used_in_entity_type, used_in_entity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_usage_document ON document_context_usage(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_usage_entity ON document_context_usage(used_in_entity_type, used_in_entity_id);
CREATE INDEX IF NOT EXISTS idx_doc_usage_user ON document_context_usage(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_usage_last_used ON document_context_usage(last_used_at DESC);

-- RLS Policies
ALTER TABLE document_context_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage for accessible documents"
  ON document_context_usage FOR SELECT
  USING (
    used_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE id = document_context_usage.document_id
      AND (user_id = auth.uid() OR visibility = 'organization')
    )
  );

-- =====================================================
-- PHASE 6: UPDATE SHARED CONVERSATIONS
-- Link conversations to knowledge spaces and documents
-- =====================================================

ALTER TABLE shared_conversations
ADD COLUMN IF NOT EXISTS knowledge_space_id UUID REFERENCES knowledge_spaces(id),
ADD COLUMN IF NOT EXISTS attached_document_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rag_accessible_document_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rag_scope TEXT DEFAULT 'space' CHECK (rag_scope IN ('personal', 'space', 'organization', 'attached_only'));

COMMENT ON COLUMN shared_conversations.attached_document_ids IS 'Documents explicitly attached to this conversation';
COMMENT ON COLUMN shared_conversations.rag_accessible_document_ids IS 'Documents RAG can search in this conversation';
COMMENT ON COLUMN shared_conversations.rag_scope IS 'What documents can RAG search: personal, team space, full org, or only attached';

-- =====================================================
-- PHASE 7: ENHANCED COMMENTS ON DOCUMENTS
-- Link existing comments table to documents
-- =====================================================

-- Comments table already exists with entity_type/entity_id
-- Just add indexes for document comments
CREATE INDEX IF NOT EXISTS idx_comments_documents
  ON comments(entity_type, entity_id)
  WHERE entity_type = 'document';

-- =====================================================
-- PHASE 8: UPDATE RAG SEARCH FUNCTION
-- Make RAG respect visibility, sharing, and context
-- =====================================================

DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), uuid, float, int);

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
    d.visibility as document_visibility,
    dc.chunk_index,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    (d.user_id = requesting_user_id) as is_personal,
    (requesting_user_id = ANY(d.shared_with_user_ids)) as is_shared,
    (conversation_id IS NOT NULL AND conversation_id = ANY(d.mentioned_in_conversations)) as shared_in_conversation,
    ks.name as space_name
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  LEFT JOIN knowledge_spaces ks ON ks.id = ANY(d.featured_in_spaces)
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

      -- 2. Document is organization-visible
      OR d.visibility = 'organization'

      -- 3. Document is explicitly shared with user
      OR requesting_user_id = ANY(d.shared_with_user_ids)

      -- 4. Document is shared via knowledge space membership
      OR EXISTS (
        SELECT 1 FROM knowledge_spaces ks
        WHERE ks.id = ANY(d.featured_in_spaces)
        AND (
          ks.owner_id = requesting_user_id
          OR requesting_user_id = ANY(ks.member_ids)
        )
      )

      -- 5. Document is accessible in current conversation context
      OR (conversation_id IS NOT NULL AND conversation_id = ANY(d.mentioned_in_conversations))

      -- 6. User has explicit document access grant
      OR EXISTS (
        SELECT 1 FROM document_access da
        WHERE da.document_id = d.id
        AND da.user_id = requesting_user_id
        AND (da.expires_at IS NULL OR da.expires_at > NOW())
      )
    )

    -- Search scope filtering
    AND (
      search_scope = 'all'
      OR (search_scope = 'personal' AND d.user_id = requesting_user_id)
      OR (search_scope = 'team' AND (
        d.visibility = 'team'
        OR requesting_user_id = ANY(d.shared_with_user_ids)
        OR space_id = ANY(d.featured_in_spaces)
      ))
      OR (search_scope = 'organization' AND d.visibility IN ('organization', 'team'))
    )

  ORDER BY
    -- Boost factors for ranking
    (1 - (dc.embedding <=> query_embedding)) DESC,
    -- Boost documents in current space
    CASE WHEN space_id = ANY(d.featured_in_spaces) THEN 0.1 ELSE 0 END DESC,
    -- Boost recently updated
    CASE WHEN d.updated_at > NOW() - INTERVAL '7 days' THEN 0.05 ELSE 0 END DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_document_chunks IS 'Enhanced RAG search with visibility, sharing, and context awareness';

-- =====================================================
-- PHASE 9: HELPER FUNCTIONS
-- =====================================================

-- Function to share document with user
CREATE OR REPLACE FUNCTION share_document_with_user(
  doc_id uuid,
  target_user_id uuid,
  access_level text DEFAULT 'view',
  share_msg text DEFAULT NULL,
  share_reason_val text DEFAULT 'collaboration'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  access_id uuid;
BEGIN
  -- Add to document_access table
  INSERT INTO document_access (
    document_id,
    user_id,
    access_level,
    granted_by,
    share_message,
    share_reason
  ) VALUES (
    doc_id,
    target_user_id,
    access_level,
    auth.uid(),
    share_msg,
    share_reason_val
  )
  ON CONFLICT (document_id, user_id) DO UPDATE
  SET access_level = EXCLUDED.access_level,
      share_message = EXCLUDED.share_message,
      granted_at = NOW()
  RETURNING id INTO access_id;

  -- Update document's shared_with_user_ids array
  UPDATE documents
  SET shared_with_user_ids = array_append(
    COALESCE(shared_with_user_ids, '{}'),
    target_user_id
  )
  WHERE id = doc_id
  AND NOT (target_user_id = ANY(COALESCE(shared_with_user_ids, '{}')));

  -- Create activity feed entry
  INSERT INTO activity_feed (
    organization_id,
    user_id,
    activity_type,
    entity_type,
    entity_id,
    metadata
  )
  SELECT
    d.organization_id,
    auth.uid(),
    'document_shared',
    'document',
    doc_id,
    jsonb_build_object(
      'shared_with_user_id', target_user_id,
      'access_level', access_level,
      'document_title', d.title
    )
  FROM documents d
  WHERE d.id = doc_id;

  RETURN access_id;
END;
$$;

-- Function to track document usage in conversation
CREATE OR REPLACE FUNCTION track_document_usage(
  doc_id uuid,
  entity_type text,
  entity_id uuid,
  usage_ctx text DEFAULT 'attached'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO document_context_usage (
    document_id,
    used_in_entity_type,
    used_in_entity_id,
    used_by_user_id,
    usage_context,
    usage_count,
    last_used_at
  ) VALUES (
    doc_id,
    entity_type,
    entity_id,
    auth.uid(),
    usage_ctx,
    1,
    NOW()
  )
  ON CONFLICT (document_id, used_in_entity_type, used_in_entity_id)
  DO UPDATE SET
    usage_count = document_context_usage.usage_count + 1,
    last_used_at = NOW(),
    used_by_user_id = auth.uid();

  -- Update document's mentioned_in_conversations array if it's a conversation
  IF entity_type = 'conversation' THEN
    UPDATE documents
    SET mentioned_in_conversations = array_append(
      COALESCE(mentioned_in_conversations, '{}'),
      entity_id
    )
    WHERE id = doc_id
    AND NOT (entity_id = ANY(COALESCE(mentioned_in_conversations, '{}')));
  END IF;
END;
$$;

-- Function to get user's accessible documents (for feed)
CREATE OR REPLACE FUNCTION get_accessible_documents(
  user_id_param uuid,
  org_id_param uuid,
  scope_filter text DEFAULT 'all',
  limit_count int DEFAULT 50
)
RETURNS TABLE (
  document_id uuid,
  title text,
  visibility text,
  is_personal boolean,
  is_shared boolean,
  space_names text[],
  view_count int,
  last_viewed_at timestamptz,
  relevance_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as document_id,
    d.title,
    d.visibility,
    (d.user_id = user_id_param) as is_personal,
    (user_id_param = ANY(d.shared_with_user_ids)) as is_shared,
    ARRAY(
      SELECT ks.name
      FROM knowledge_spaces ks
      WHERE ks.id = ANY(d.featured_in_spaces)
    ) as space_names,
    d.view_count,
    d.last_viewed_at,
    d.ai_relevance_score as relevance_score
  FROM documents d
  WHERE
    d.organization_id = org_id_param
    AND d.status = 'completed'
    AND (
      d.user_id = user_id_param
      OR d.visibility = 'organization'
      OR user_id_param = ANY(d.shared_with_user_ids)
      OR EXISTS (
        SELECT 1 FROM knowledge_spaces ks
        WHERE ks.id = ANY(d.featured_in_spaces)
        AND (ks.owner_id = user_id_param OR user_id_param = ANY(ks.member_ids))
      )
    )
    AND (
      scope_filter = 'all'
      OR (scope_filter = 'personal' AND d.user_id = user_id_param)
      OR (scope_filter = 'shared' AND user_id_param = ANY(d.shared_with_user_ids))
      OR (scope_filter = 'team' AND d.visibility IN ('team', 'organization'))
    )
  ORDER BY
    d.updated_at DESC,
    d.ai_relevance_score DESC
  LIMIT limit_count;
END;
$$;

-- =====================================================
-- PHASE 10: TRIGGERS FOR AUTO-UPDATES
-- =====================================================

-- Update knowledge space stats when documents are added
CREATE OR REPLACE FUNCTION update_knowledge_space_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update document count for spaces
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE knowledge_spaces
    SET
      document_count = (
        SELECT COUNT(*)
        FROM documents
        WHERE knowledge_spaces.id = ANY(documents.featured_in_spaces)
      ),
      updated_at = NOW()
    WHERE id = ANY(NEW.featured_in_spaces);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_space_stats
AFTER INSERT OR UPDATE OF featured_in_spaces ON documents
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_space_stats();

-- Update member count when members added
CREATE OR REPLACE FUNCTION update_knowledge_space_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.member_count := array_length(NEW.member_ids, 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_member_count
BEFORE INSERT OR UPDATE OF member_ids ON knowledge_spaces
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_space_member_count();

-- =====================================================
-- PHASE 11: CREATE DEFAULT KNOWLEDGE SPACES
-- Create starter spaces for each organization
-- =====================================================

-- Function to create default spaces for an organization
CREATE OR REPLACE FUNCTION create_default_knowledge_spaces(org_id uuid, owner_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Company Knowledge Base
  INSERT INTO knowledge_spaces (
    organization_id, owner_id, name, description, space_type, emoji, color,
    member_ids, rag_enabled, rag_scope
  ) VALUES (
    org_id,
    owner_user_id,
    'Company Knowledge Base',
    'Shared knowledge and resources for the entire organization',
    'organization',
    '🏢',
    '#3B82F6',
    ARRAY[]::uuid[], -- Empty, all org members have implicit access
    true,
    'space_plus_org'
  );

  -- Sales Team
  INSERT INTO knowledge_spaces (
    organization_id, owner_id, name, description, space_type, emoji, color,
    rag_enabled
  ) VALUES (
    org_id,
    owner_user_id,
    'Sales Team',
    'RFPs, proposals, product catalogs, and sales collateral',
    'team',
    '💼',
    '#10B981',
    true
  );

  -- Project Documentation
  INSERT INTO knowledge_spaces (
    organization_id, owner_id, name, description, space_type, emoji, color,
    rag_enabled
  ) VALUES (
    org_id,
    owner_user_id,
    'Project Documentation',
    'Project plans, specifications, and deliverables',
    'project',
    '📋',
    '#8B5CF6',
    true
  );
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT
  'knowledge_spaces' as table_name,
  COUNT(*) as row_count
FROM knowledge_spaces
UNION ALL
SELECT
  'document_access',
  COUNT(*)
FROM document_access
UNION ALL
SELECT
  'document_relationships',
  COUNT(*)
FROM document_relationships
UNION ALL
SELECT
  'document_context_usage',
  COUNT(*)
FROM document_context_usage;

-- Test RAG function signature
SELECT
  proname as function_name,
  pronargs as parameter_count,
  pg_get_function_arguments(oid) as parameters
FROM pg_proc
WHERE proname = 'search_document_chunks';

COMMENT ON SCHEMA public IS 'Complete Team Knowledge & Collaboration System - Phase 1 Complete';
