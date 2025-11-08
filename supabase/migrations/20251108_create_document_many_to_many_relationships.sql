-- =====================================================
-- ENABLE MANY-TO-MANY RELATIONSHIPS FOR DOCUMENTS
-- Allow documents to belong to multiple projects, folders, and spaces
-- Add contextual intelligence and overlap detection
-- =====================================================

-- =====================================================
-- PHASE 1: CREATE JUNCTION TABLES
-- =====================================================

-- Document to Projects (Many-to-Many)
CREATE TABLE IF NOT EXISTS document_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Metadata
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(document_id, project_id)
);

-- Document to Folders (Many-to-Many)
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,

  -- Metadata
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ordering within folder
  position INTEGER DEFAULT 0,

  -- Prevent duplicates
  UNIQUE(document_id, folder_id)
);

-- Document to Knowledge Spaces (Many-to-Many)
CREATE TABLE IF NOT EXISTS document_knowledge_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  knowledge_space_id UUID NOT NULL REFERENCES knowledge_spaces(id) ON DELETE CASCADE,

  -- Metadata
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  -- Is this document pinned/featured in this space?
  is_pinned BOOLEAN DEFAULT false,

  -- Prevent duplicates
  UNIQUE(document_id, knowledge_space_id)
);

COMMENT ON TABLE document_projects IS 'Many-to-many: Documents can belong to multiple projects';
COMMENT ON TABLE document_folders IS 'Many-to-many: Documents can belong to multiple folders';
COMMENT ON TABLE document_knowledge_spaces IS 'Many-to-many: Documents can belong to multiple knowledge spaces';

-- =====================================================
-- PHASE 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Document Projects indexes
CREATE INDEX IF NOT EXISTS idx_document_projects_document ON document_projects(document_id);
CREATE INDEX IF NOT EXISTS idx_document_projects_project ON document_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_document_projects_added_at ON document_projects(added_at DESC);

-- Document Folders indexes
CREATE INDEX IF NOT EXISTS idx_document_folders_document ON document_folders(document_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_folder ON document_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_position ON document_folders(folder_id, position);

-- Document Knowledge Spaces indexes
CREATE INDEX IF NOT EXISTS idx_document_spaces_document ON document_knowledge_spaces(document_id);
CREATE INDEX IF NOT EXISTS idx_document_spaces_space ON document_knowledge_spaces(knowledge_space_id);
CREATE INDEX IF NOT EXISTS idx_document_spaces_pinned ON document_knowledge_spaces(knowledge_space_id, is_pinned);

-- =====================================================
-- PHASE 3: MIGRATE EXISTING DATA
-- Migrate single relationships to junction tables
-- =====================================================

-- Migrate existing folder_id relationships
INSERT INTO document_folders (document_id, folder_id, added_by, added_at)
SELECT
  id as document_id,
  folder_id,
  user_id as added_by,
  created_at as added_at
FROM documents
WHERE folder_id IS NOT NULL
ON CONFLICT (document_id, folder_id) DO NOTHING;

-- Migrate existing project_id relationships (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'project_id'
  ) THEN
    INSERT INTO document_projects (document_id, project_id, added_by, added_at)
    SELECT
      id as document_id,
      project_id,
      user_id as added_by,
      created_at as added_at
    FROM documents
    WHERE project_id IS NOT NULL
    ON CONFLICT (document_id, project_id) DO NOTHING;
  END IF;
END $$;

-- Migrate existing knowledge_space_id relationships (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'knowledge_space_id'
  ) THEN
    INSERT INTO document_knowledge_spaces (document_id, knowledge_space_id, added_by, added_at)
    SELECT
      id as document_id,
      knowledge_space_id,
      user_id as added_by,
      created_at as added_at
    FROM documents
    WHERE knowledge_space_id IS NOT NULL
    ON CONFLICT (document_id, knowledge_space_id) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- PHASE 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE document_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_knowledge_spaces ENABLE ROW LEVEL SECURITY;

-- Document Projects RLS
CREATE POLICY "Users can view document-project links in their org"
  ON document_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE d.id = document_projects.document_id
      AND d.organization_id = p.organization_id
    )
  );

CREATE POLICY "Users can create document-project links for their docs"
  ON document_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_projects.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete document-project links for their docs"
  ON document_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_projects.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Document Folders RLS
CREATE POLICY "Users can view document-folder links in their org"
  ON document_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE d.id = document_folders.document_id
      AND d.organization_id = p.organization_id
    )
  );

CREATE POLICY "Users can create document-folder links for their docs"
  ON document_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_folders.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete document-folder links for their docs"
  ON document_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_folders.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Document Knowledge Spaces RLS
CREATE POLICY "Users can view document-space links in their org"
  ON document_knowledge_spaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE d.id = document_knowledge_spaces.document_id
      AND d.organization_id = p.organization_id
    )
  );

CREATE POLICY "Users can create document-space links for their docs"
  ON document_knowledge_spaces FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_knowledge_spaces.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete document-space links for their docs"
  ON document_knowledge_spaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_knowledge_spaces.document_id
      AND d.user_id = auth.uid()
    )
  );

-- =====================================================
-- PHASE 5: HELPER FUNCTIONS
-- =====================================================

-- Add document to multiple projects
CREATE OR REPLACE FUNCTION add_document_to_projects(
  doc_id UUID,
  project_ids UUID[]
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INT := 0;
  proj_id UUID;
BEGIN
  FOREACH proj_id IN ARRAY project_ids
  LOOP
    INSERT INTO document_projects (document_id, project_id, added_by)
    VALUES (doc_id, proj_id, auth.uid())
    ON CONFLICT (document_id, project_id) DO NOTHING;

    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- Add document to multiple folders
CREATE OR REPLACE FUNCTION add_document_to_folders(
  doc_id UUID,
  folder_ids UUID[]
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INT := 0;
  fld_id UUID;
BEGIN
  FOREACH fld_id IN ARRAY folder_ids
  LOOP
    INSERT INTO document_folders (document_id, folder_id, added_by)
    VALUES (doc_id, fld_id, auth.uid())
    ON CONFLICT (document_id, folder_id) DO NOTHING;

    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- Add document to multiple knowledge spaces
CREATE OR REPLACE FUNCTION add_document_to_spaces(
  doc_id UUID,
  space_ids UUID[]
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INT := 0;
  sp_id UUID;
BEGIN
  FOREACH sp_id IN ARRAY space_ids
  LOOP
    INSERT INTO document_knowledge_spaces (document_id, knowledge_space_id, added_by)
    VALUES (doc_id, sp_id, auth.uid())
    ON CONFLICT (document_id, knowledge_space_id) DO NOTHING;

    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- =====================================================
-- PHASE 6: OVERLAP DETECTION & CONTEXTUAL INTELLIGENCE
-- Find documents that share projects/folders/tags for context building
-- =====================================================

-- Find related documents based on shared organizational context
CREATE OR REPLACE FUNCTION find_related_documents_by_context(
  doc_id UUID,
  similarity_threshold FLOAT DEFAULT 0.3,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  related_document_id UUID,
  document_title TEXT,
  similarity_score FLOAT,
  shared_projects INT,
  shared_folders INT,
  shared_spaces INT,
  shared_tags INT,
  relationship_strength TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH document_context AS (
    -- Get all context for the source document
    SELECT
      doc_id as source_id,
      COALESCE(array_agg(DISTINCT dp.project_id) FILTER (WHERE dp.project_id IS NOT NULL), '{}') as projects,
      COALESCE(array_agg(DISTINCT df.folder_id) FILTER (WHERE df.folder_id IS NOT NULL), '{}') as folders,
      COALESCE(array_agg(DISTINCT ds.knowledge_space_id) FILTER (WHERE ds.knowledge_space_id IS NOT NULL), '{}') as spaces,
      COALESCE(array_agg(DISTINCT dt.tag_id) FILTER (WHERE dt.tag_id IS NOT NULL), '{}') as tags
    FROM documents d
    LEFT JOIN document_projects dp ON dp.document_id = d.id
    LEFT JOIN document_folders df ON df.document_id = d.id
    LEFT JOIN document_knowledge_spaces ds ON ds.document_id = d.id
    LEFT JOIN document_tags dt ON dt.document_id = d.id
    WHERE d.id = doc_id
    GROUP BY d.id
  ),
  related_docs AS (
    -- Find documents with overlapping context
    SELECT DISTINCT
      d.id as related_id,
      d.title,
      -- Count overlaps
      (
        SELECT COUNT(*)
        FROM unnest((SELECT projects FROM document_context)) AS p
        WHERE p = ANY(COALESCE(array_agg(DISTINCT dp2.project_id) FILTER (WHERE dp2.project_id IS NOT NULL), '{}'))
      )::INT as shared_proj,
      (
        SELECT COUNT(*)
        FROM unnest((SELECT folders FROM document_context)) AS f
        WHERE f = ANY(COALESCE(array_agg(DISTINCT df2.folder_id) FILTER (WHERE df2.folder_id IS NOT NULL), '{}'))
      )::INT as shared_fold,
      (
        SELECT COUNT(*)
        FROM unnest((SELECT spaces FROM document_context)) AS s
        WHERE s = ANY(COALESCE(array_agg(DISTINCT ds2.knowledge_space_id) FILTER (WHERE ds2.knowledge_space_id IS NOT NULL), '{}'))
      )::INT as shared_sp,
      (
        SELECT COUNT(*)
        FROM unnest((SELECT tags FROM document_context)) AS t
        WHERE t = ANY(COALESCE(array_agg(DISTINCT dt2.tag_id) FILTER (WHERE dt2.tag_id IS NOT NULL), '{}'))
      )::INT as shared_tg
    FROM documents d
    LEFT JOIN document_projects dp2 ON dp2.document_id = d.id
    LEFT JOIN document_folders df2 ON df2.document_id = d.id
    LEFT JOIN document_knowledge_spaces ds2 ON ds2.document_id = d.id
    LEFT JOIN document_tags dt2 ON dt2.document_id = d.id
    WHERE d.id != doc_id
      AND d.status = 'completed'
      AND d.organization_id = (SELECT organization_id FROM documents WHERE id = doc_id)
    GROUP BY d.id, d.title
  )
  SELECT
    rd.related_id,
    rd.title,
    -- Calculate similarity score based on overlaps (weighted)
    (
      (rd.shared_proj * 0.3) +
      (rd.shared_fold * 0.2) +
      (rd.shared_sp * 0.3) +
      (rd.shared_tg * 0.2)
    )::FLOAT as score,
    rd.shared_proj,
    rd.shared_fold,
    rd.shared_sp,
    rd.shared_tg,
    -- Classify relationship strength
    CASE
      WHEN (rd.shared_proj + rd.shared_fold + rd.shared_sp + rd.shared_tg) >= 4 THEN 'very_strong'
      WHEN (rd.shared_proj + rd.shared_fold + rd.shared_sp + rd.shared_tg) >= 2 THEN 'strong'
      WHEN (rd.shared_proj + rd.shared_fold + rd.shared_sp + rd.shared_tg) >= 1 THEN 'moderate'
      ELSE 'weak'
    END::TEXT as strength
  FROM related_docs rd
  WHERE (
    (rd.shared_proj * 0.3) +
    (rd.shared_fold * 0.2) +
    (rd.shared_sp * 0.3) +
    (rd.shared_tg * 0.2)
  ) >= similarity_threshold
  ORDER BY score DESC, rd.shared_proj DESC, rd.shared_sp DESC
  LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION find_related_documents_by_context IS 'Find related documents based on shared projects, folders, spaces, and tags - builds contextual intelligence';

-- Get document overlap statistics for analytics
CREATE OR REPLACE FUNCTION get_document_overlap_stats(org_id UUID)
RETURNS TABLE (
  metric TEXT,
  value BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_documents'::TEXT, COUNT(*)::BIGINT FROM documents WHERE organization_id = org_id AND status = 'completed'
  UNION ALL
  SELECT 'docs_in_multiple_projects'::TEXT, COUNT(DISTINCT document_id)::BIGINT
  FROM (
    SELECT document_id, COUNT(*) as proj_count
    FROM document_projects dp
    INNER JOIN documents d ON d.id = dp.document_id
    WHERE d.organization_id = org_id
    GROUP BY document_id
    HAVING COUNT(*) > 1
  ) multi_proj
  UNION ALL
  SELECT 'docs_in_multiple_folders'::TEXT, COUNT(DISTINCT document_id)::BIGINT
  FROM (
    SELECT document_id, COUNT(*) as folder_count
    FROM document_folders df
    INNER JOIN documents d ON d.id = df.document_id
    WHERE d.organization_id = org_id
    GROUP BY document_id
    HAVING COUNT(*) > 1
  ) multi_fold
  UNION ALL
  SELECT 'docs_in_multiple_spaces'::TEXT, COUNT(DISTINCT document_id)::BIGINT
  FROM (
    SELECT document_id, COUNT(*) as space_count
    FROM document_knowledge_spaces ds
    INNER JOIN documents d ON d.id = ds.document_id
    WHERE d.organization_id = org_id
    GROUP BY document_id
    HAVING COUNT(*) > 1
  ) multi_space
  UNION ALL
  SELECT 'avg_projects_per_doc'::TEXT, ROUND(AVG(proj_count))::BIGINT
  FROM (
    SELECT COUNT(*) as proj_count
    FROM document_projects dp
    INNER JOIN documents d ON d.id = dp.document_id
    WHERE d.organization_id = org_id
    GROUP BY dp.document_id
  ) proj_counts
  UNION ALL
  SELECT 'avg_folders_per_doc'::TEXT, ROUND(AVG(folder_count))::BIGINT
  FROM (
    SELECT COUNT(*) as folder_count
    FROM document_folders df
    INNER JOIN documents d ON d.id = df.document_id
    WHERE d.organization_id = org_id
    GROUP BY df.document_id
  ) folder_counts
  UNION ALL
  SELECT 'avg_spaces_per_doc'::TEXT, ROUND(AVG(space_count))::BIGINT
  FROM (
    SELECT COUNT(*) as space_count
    FROM document_knowledge_spaces ds
    INNER JOIN documents d ON d.id = ds.document_id
    WHERE d.organization_id = org_id
    GROUP BY ds.document_id
  ) space_counts;
END;
$$;

COMMENT ON FUNCTION get_document_overlap_stats IS 'Get statistics about document overlap across projects/folders/spaces for analytics';

-- =====================================================
-- PHASE 7: UPDATE TRIGGERS
-- Automatically update counts when relationships change
-- =====================================================

-- Update project document count
CREATE OR REPLACE FUNCTION update_project_document_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects
    SET conversation_count = conversation_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET conversation_count = GREATEST(0, conversation_count - 1)
    WHERE id = OLD.project_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_project_count
AFTER INSERT OR DELETE ON document_projects
FOR EACH ROW
EXECUTE FUNCTION update_project_document_count();

-- Update knowledge space document count
CREATE OR REPLACE FUNCTION update_space_document_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_spaces
    SET document_count = document_count + 1
    WHERE id = NEW.knowledge_space_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_spaces
    SET document_count = GREATEST(0, document_count - 1)
    WHERE id = OLD.knowledge_space_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_space_count
AFTER INSERT OR DELETE ON document_knowledge_spaces
FOR EACH ROW
EXECUTE FUNCTION update_space_document_count();

-- =====================================================
-- PHASE 8: COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN document_projects.added_by IS 'User who added document to this project';
COMMENT ON COLUMN document_folders.position IS 'Display order within folder (for custom sorting)';
COMMENT ON COLUMN document_knowledge_spaces.is_pinned IS 'Whether document is pinned/featured in this space';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Junction tables created successfully:';
  RAISE NOTICE '  - document_projects: % rows', (SELECT COUNT(*) FROM document_projects);
  RAISE NOTICE '  - document_folders: % rows', (SELECT COUNT(*) FROM document_folders);
  RAISE NOTICE '  - document_knowledge_spaces: % rows', (SELECT COUNT(*) FROM document_knowledge_spaces);
END $$;
