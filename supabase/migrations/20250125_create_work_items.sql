-- Work Items System Migration
-- Enables BOS 2.0 workflow stages to be functional with items flowing through them

-- ============================================================================
-- Work Items Table (Core entity that flows through team workflow stages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Item identification
  title TEXT NOT NULL,
  description TEXT,
  external_id TEXT, -- For linking to external systems (CRM, ATS, etc.)

  -- Current workflow state
  current_stage_id TEXT NOT NULL, -- References team.workflow_stages[].id
  previous_stage_id TEXT,

  -- Item type (derived from team template: candidate, lead, partner, rfp, etc.)
  item_type TEXT NOT NULL,

  -- Priority and urgency
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Exception handling (human review flag)
  is_exception BOOLEAN DEFAULT false,
  exception_reason TEXT,
  exception_flagged_at TIMESTAMPTZ,
  exception_flagged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  exception_resolved_at TIMESTAMPTZ,
  exception_resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'api', 'automation', 'email', 'form')),
  source_reference TEXT,

  -- Custom fields (JSON for flexibility per item type)
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- AI-generated insights
  ai_score DECIMAL(5,2), -- 0-100 score
  ai_insights JSONB DEFAULT '{}'::jsonb,
  ai_recommendations TEXT[],
  ai_analyzed_at TIMESTAMPTZ,
  ai_model_used TEXT,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_items_organization ON work_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_items_team ON work_items(team_id);
CREATE INDEX IF NOT EXISTS idx_work_items_stage ON work_items(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_work_items_type ON work_items(item_type);
CREATE INDEX IF NOT EXISTS idx_work_items_assigned ON work_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_items_exception ON work_items(is_exception) WHERE is_exception = true;
CREATE INDEX IF NOT EXISTS idx_work_items_priority ON work_items(priority);
CREATE INDEX IF NOT EXISTS idx_work_items_created ON work_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_items_due ON work_items(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_items_archived ON work_items(team_id, is_archived);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_work_items_search ON work_items
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================================================
-- Work Item History (Stage transitions and change audit log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_item_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'stage_changed', 'assigned', 'unassigned',
    'exception_flagged', 'exception_resolved', 'field_updated',
    'ai_analyzed', 'comment_added', 'attachment_added',
    'archived', 'restored', 'priority_changed'
  )),

  -- Stage transition
  from_stage_id TEXT,
  to_stage_id TEXT,

  -- Change details
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,

  -- Actor
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'automation', 'ai')),

  -- Context
  comment TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_item_history_item ON work_item_history(work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_item_history_event ON work_item_history(event_type);
CREATE INDEX IF NOT EXISTS idx_work_item_history_created ON work_item_history(created_at DESC);

-- ============================================================================
-- Work Item Comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  comment_type TEXT DEFAULT 'note' CHECK (comment_type IN (
    'note', 'feedback', 'ai_insight', 'exception_note', 'resolution_note'
  )),

  mentioned_user_ids UUID[],

  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_item_comments_item ON work_item_comments(work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_item_comments_author ON work_item_comments(author_id);

-- ============================================================================
-- Work Item Attachments
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  storage_path TEXT,

  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_item_attachments_item ON work_item_attachments(work_item_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_attachments ENABLE ROW LEVEL SECURITY;

-- Work Items policies
CREATE POLICY "Users can view work items in their organization"
  ON work_items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert work items"
  ON work_items FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = work_items.team_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update work items"
  ON work_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = work_items.team_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team leads and admins can delete work items"
  ON work_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN profiles p ON p.id = auth.uid()
      WHERE tm.team_id = work_items.team_id
      AND tm.user_id = auth.uid()
      AND (tm.role IN ('lead', 'manager') OR p.user_role IN ('admin', 'owner'))
    )
  );

-- History policies (view only, system inserts)
CREATE POLICY "Users can view history for items in their org"
  ON work_item_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_items wi
      JOIN profiles p ON p.organization_id = wi.organization_id
      WHERE wi.id = work_item_history.work_item_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Allow history inserts"
  ON work_item_history FOR INSERT
  WITH CHECK (true);

-- Comments policies
CREATE POLICY "Users can view comments for items in their org"
  ON work_item_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_items wi
      JOIN profiles p ON p.organization_id = wi.organization_id
      WHERE wi.id = work_item_comments.work_item_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert comments"
  ON work_item_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_items wi
      JOIN team_members tm ON tm.team_id = wi.team_id
      WHERE wi.id = work_item_comments.work_item_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their comments"
  ON work_item_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors and admins can delete comments"
  ON work_item_comments FOR DELETE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role IN ('admin', 'owner')
    )
  );

-- Attachments policies
CREATE POLICY "Users can view attachments for items in their org"
  ON work_item_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_items wi
      JOIN profiles p ON p.organization_id = wi.organization_id
      WHERE wi.id = work_item_attachments.work_item_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert attachments"
  ON work_item_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_items wi
      JOIN team_members tm ON tm.team_id = wi.team_id
      WHERE wi.id = work_item_attachments.work_item_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Uploaders and admins can delete attachments"
  ON work_item_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get stage counts for a team
CREATE OR REPLACE FUNCTION get_work_item_stage_counts(p_team_id UUID)
RETURNS TABLE (stage_id TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wi.current_stage_id as stage_id,
    COUNT(*)::BIGINT as count
  FROM work_items wi
  WHERE wi.team_id = p_team_id
    AND wi.is_archived = false
  GROUP BY wi.current_stage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_work_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_work_items_updated_at
  BEFORE UPDATE ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION update_work_item_updated_at();

CREATE TRIGGER trigger_work_item_comments_updated_at
  BEFORE UPDATE ON work_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_work_item_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE work_items IS 'Generic work items that flow through team workflow stages (candidates, leads, partners, etc.)';
COMMENT ON TABLE work_item_history IS 'Audit log of all changes to work items including stage transitions';
COMMENT ON TABLE work_item_comments IS 'Comments and notes on work items';
COMMENT ON TABLE work_item_attachments IS 'Files attached to work items';
COMMENT ON COLUMN work_items.current_stage_id IS 'References the id field in team.workflow_stages JSONB array';
COMMENT ON COLUMN work_items.item_type IS 'Type of item based on team template (candidate, lead, partner, rfp, etc.)';
COMMENT ON COLUMN work_items.custom_fields IS 'Flexible JSONB for team-specific custom fields';
COMMENT ON COLUMN work_items.ai_insights IS 'AI-generated analysis including strengths, concerns, recommendations';
