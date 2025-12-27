-- Document Intelligence: Entity extraction, timelines, and action items

-- Extracted entities from documents
CREATE TABLE IF NOT EXISTS document_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'organization', 'date', 'amount', 'location', 'email', 'phone', 'url', 'product', 'event')),
  entity_value TEXT NOT NULL,
  normalized_value TEXT, -- Standardized form (e.g., date in ISO format)

  confidence FLOAT DEFAULT 0.8,

  -- Position in document for highlighting
  position_start INT,
  position_end INT,
  context TEXT, -- Surrounding text for context

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entities_document ON document_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_entities_org ON document_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON document_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_value ON document_entities(entity_value);

-- Enable RLS
ALTER TABLE document_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entities in their organization"
  ON document_entities
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create entities in their organization"
  ON document_entities
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete entities in their organization"
  ON document_entities
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Document timeline events
CREATE TABLE IF NOT EXISTS document_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  event_title TEXT NOT NULL,
  event_description TEXT,
  event_date DATE,
  event_type TEXT CHECK (event_type IN ('milestone', 'deadline', 'meeting', 'decision', 'action', 'mention', 'other')),

  -- Source info
  source_text TEXT, -- The text that mentioned this event
  confidence FLOAT DEFAULT 0.8,

  is_past BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_document ON document_timeline_events(document_id);
CREATE INDEX IF NOT EXISTS idx_timeline_org ON document_timeline_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON document_timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON document_timeline_events(event_type);

-- Enable RLS
ALTER TABLE document_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline events in their organization"
  ON document_timeline_events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create timeline events in their organization"
  ON document_timeline_events
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline events in their organization"
  ON document_timeline_events
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events in their organization"
  ON document_timeline_events
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Document action items (extracted from documents)
CREATE TABLE IF NOT EXISTS document_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  -- Assignment
  assignee_user_id UUID REFERENCES auth.users(id),
  assignee_name TEXT, -- For mentions that aren't matched to users

  -- Timing
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),

  -- Source
  source_text TEXT, -- The text that contained this action item
  confidence FLOAT DEFAULT 0.8,

  -- Link to project task if converted
  linked_task_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_items_document ON document_action_items(document_id);
CREATE INDEX IF NOT EXISTS idx_action_items_org ON document_action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee ON document_action_items(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON document_action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_due ON document_action_items(due_date);

-- Enable RLS
ALTER TABLE document_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action items in their organization"
  ON document_action_items
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create action items in their organization"
  ON document_action_items
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update action items in their organization"
  ON document_action_items
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete action items in their organization"
  ON document_action_items
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_items_updated_at
  BEFORE UPDATE ON document_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_action_items_updated_at();
