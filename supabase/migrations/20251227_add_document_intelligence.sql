-- =====================================================
-- DOCUMENT INTELLIGENCE MIGRATION
-- Adds entity extraction, timeline, and action items
-- =====================================================

-- =====================================================
-- DOCUMENT ENTITIES TABLE - Extracted people, places, orgs, etc.
-- =====================================================

CREATE TABLE IF NOT EXISTS document_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Entity information
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'organization', 'location', 'date', 'money', 'event', 'product', 'concept', 'other')),
  entity_value TEXT NOT NULL,
  normalized_value TEXT, -- Canonical form (e.g., "John Smith" -> "john_smith")

  -- Context
  context_snippet TEXT, -- Surrounding text where entity was found
  position_start INT, -- Character position in document
  position_end INT,

  -- Metadata
  confidence FLOAT DEFAULT 0.8,
  occurrences INT DEFAULT 1, -- How many times this entity appears
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT TIMELINE TABLE - Extracted dates and events
-- =====================================================

CREATE TABLE IF NOT EXISTS document_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timeline information
  event_type TEXT NOT NULL CHECK (event_type IN ('deadline', 'meeting', 'milestone', 'event', 'reminder', 'recurring', 'historical', 'other')),
  title TEXT NOT NULL,
  description TEXT,

  -- Date/time
  event_date DATE,
  event_time TIME,
  event_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ, -- For events with duration
  is_all_day BOOLEAN DEFAULT false,
  timezone TEXT,

  -- Recurrence (for recurring events)
  recurrence_rule TEXT, -- iCal RRULE format

  -- Context
  context_snippet TEXT,

  -- Priority/importance
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  confidence FLOAT DEFAULT 0.8,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'in_progress')),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTION ITEMS TABLE - Extracted tasks and todos
-- =====================================================

CREATE TABLE IF NOT EXISTS document_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Action item content
  title TEXT NOT NULL,
  description TEXT,

  -- Assignment
  assigned_to TEXT, -- Extracted name/email
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Due date
  due_date DATE,
  due_datetime TIMESTAMPTZ,

  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Context
  context_snippet TEXT,
  source_section TEXT, -- Which part of document this came from

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),

  -- AI extraction metadata
  confidence FLOAT DEFAULT 0.8,
  extraction_method TEXT, -- 'explicit' (clearly stated) or 'inferred'

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENTITY RELATIONSHIPS TABLE - Links between entities
-- =====================================================

CREATE TABLE IF NOT EXISTS entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source and target entities
  source_entity_id UUID NOT NULL REFERENCES document_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES document_entities(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type TEXT NOT NULL, -- 'works_at', 'reports_to', 'located_in', 'owns', 'related_to', etc.
  relationship_strength FLOAT DEFAULT 0.5,

  -- Context
  context_snippet TEXT,

  -- Metadata
  confidence FLOAT DEFAULT 0.8,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_entity_id, target_entity_id, relationship_type)
);

-- =====================================================
-- GLOBAL ENTITY REGISTRY - Deduplicated entities across documents
-- =====================================================

CREATE TABLE IF NOT EXISTS global_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Entity information
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL, -- The "official" name
  aliases TEXT[], -- Alternative names/spellings

  -- Merged from document entities
  source_entity_ids UUID[], -- Document entity IDs that were merged
  document_count INT DEFAULT 1, -- How many documents mention this entity

  -- Additional info
  description TEXT,
  external_links JSONB, -- Links to LinkedIn, Wikipedia, etc.

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, entity_type, canonical_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Document entities indexes
CREATE INDEX IF NOT EXISTS idx_document_entities_document ON document_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_document_entities_org ON document_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_entities_type ON document_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_document_entities_value ON document_entities(entity_value);
CREATE INDEX IF NOT EXISTS idx_document_entities_normalized ON document_entities(normalized_value);

-- Document timeline indexes
CREATE INDEX IF NOT EXISTS idx_document_timeline_document ON document_timeline(document_id);
CREATE INDEX IF NOT EXISTS idx_document_timeline_org ON document_timeline(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_timeline_type ON document_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_document_timeline_date ON document_timeline(event_date);
CREATE INDEX IF NOT EXISTS idx_document_timeline_datetime ON document_timeline(event_datetime);
CREATE INDEX IF NOT EXISTS idx_document_timeline_status ON document_timeline(status);

-- Action items indexes
CREATE INDEX IF NOT EXISTS idx_action_items_document ON document_action_items(document_id);
CREATE INDEX IF NOT EXISTS idx_action_items_org ON document_action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned ON document_action_items(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_due ON document_action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON document_action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON document_action_items(priority);

-- Entity relationships indexes
CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_org ON entity_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_type ON entity_relationships(relationship_type);

-- Global entities indexes
CREATE INDEX IF NOT EXISTS idx_global_entities_org ON global_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_global_entities_type ON global_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_global_entities_name ON global_entities(canonical_name);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE document_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_entities ENABLE ROW LEVEL SECURITY;

-- Document entities policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_entities'
    AND policyname = 'Users can view entities in their organization'
  ) THEN
    CREATE POLICY "Users can view entities in their organization"
      ON document_entities FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_entities'
    AND policyname = 'System can manage entities'
  ) THEN
    CREATE POLICY "System can manage entities"
      ON document_entities FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Document timeline policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_timeline'
    AND policyname = 'Users can view timeline in their organization'
  ) THEN
    CREATE POLICY "Users can view timeline in their organization"
      ON document_timeline FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_timeline'
    AND policyname = 'Users can manage timeline in their organization'
  ) THEN
    CREATE POLICY "Users can manage timeline in their organization"
      ON document_timeline FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Action items policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_action_items'
    AND policyname = 'Users can view action items in their organization'
  ) THEN
    CREATE POLICY "Users can view action items in their organization"
      ON document_action_items FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'document_action_items'
    AND policyname = 'Users can manage action items in their organization'
  ) THEN
    CREATE POLICY "Users can manage action items in their organization"
      ON document_action_items FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Entity relationships policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entity_relationships'
    AND policyname = 'Users can view relationships in their organization'
  ) THEN
    CREATE POLICY "Users can view relationships in their organization"
      ON entity_relationships FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entity_relationships'
    AND policyname = 'System can manage relationships'
  ) THEN
    CREATE POLICY "System can manage relationships"
      ON entity_relationships FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Global entities policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'global_entities'
    AND policyname = 'Users can view global entities in their organization'
  ) THEN
    CREATE POLICY "Users can view global entities in their organization"
      ON global_entities FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'global_entities'
    AND policyname = 'Users can manage global entities in their organization'
  ) THEN
    CREATE POLICY "Users can manage global entities in their organization"
      ON global_entities FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- TRIGGERS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_document_entities_updated_at'
  ) THEN
    CREATE TRIGGER update_document_entities_updated_at
      BEFORE UPDATE ON document_entities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_document_timeline_updated_at'
  ) THEN
    CREATE TRIGGER update_document_timeline_updated_at
      BEFORE UPDATE ON document_timeline
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_action_items_updated_at'
  ) THEN
    CREATE TRIGGER update_action_items_updated_at
      BEFORE UPDATE ON document_action_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_global_entities_updated_at'
  ) THEN
    CREATE TRIGGER update_global_entities_updated_at
      BEFORE UPDATE ON global_entities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get upcoming events from document timeline
CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_organization_id UUID,
  p_days_ahead INT DEFAULT 30,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  event_type TEXT,
  title TEXT,
  description TEXT,
  event_datetime TIMESTAMPTZ,
  priority TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dt.id,
    dt.document_id,
    dt.event_type,
    dt.title,
    dt.description,
    dt.event_datetime,
    dt.priority,
    dt.status
  FROM document_timeline dt
  WHERE dt.organization_id = p_organization_id
    AND dt.status = 'pending'
    AND dt.event_datetime >= NOW()
    AND dt.event_datetime <= NOW() + (p_days_ahead || ' days')::INTERVAL
  ORDER BY dt.event_datetime ASC
  LIMIT p_limit;
END;
$$;

-- Get pending action items for organization
CREATE OR REPLACE FUNCTION get_pending_action_items(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  title TEXT,
  description TEXT,
  assigned_to TEXT,
  due_date DATE,
  priority TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dai.id,
    dai.document_id,
    dai.title,
    dai.description,
    dai.assigned_to,
    dai.due_date,
    dai.priority,
    dai.status
  FROM document_action_items dai
  WHERE dai.organization_id = p_organization_id
    AND dai.status IN ('pending', 'in_progress')
    AND (p_user_id IS NULL OR dai.assigned_to_user_id = p_user_id)
  ORDER BY
    CASE dai.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    dai.due_date ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Get entity statistics for organization
CREATE OR REPLACE FUNCTION get_entity_stats(
  p_organization_id UUID
)
RETURNS TABLE (
  entity_type TEXT,
  count BIGINT,
  unique_values BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.entity_type,
    COUNT(*) as count,
    COUNT(DISTINCT de.normalized_value) as unique_values
  FROM document_entities de
  WHERE de.organization_id = p_organization_id
  GROUP BY de.entity_type
  ORDER BY count DESC;
END;
$$;

-- =====================================================
-- DONE! Document intelligence is ready
-- =====================================================
