-- ============================================================================
-- DECISION TRACKING SYSTEM ENHANCEMENT
-- Adds relationships, stakeholders, enhanced projects, and notifications
-- ============================================================================

-- ============================================================================
-- 1. ITEM STAKEHOLDERS
-- Links internal users AND external contacts to decisions/opportunities/projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which item this stakeholder is linked to
  item_type TEXT NOT NULL CHECK (item_type IN ('decision', 'opportunity', 'project', 'work_item')),
  item_id UUID NOT NULL,

  -- The stakeholder (either internal user or external contact)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Role in this item
  role TEXT NOT NULL DEFAULT 'stakeholder' CHECK (role IN (
    'owner',           -- Primary responsible person
    'decision_maker',  -- Has authority to decide
    'stakeholder',     -- Affected by the outcome
    'reviewer',        -- Reviews before decision
    'assignee',        -- Assigned to execute
    'informed',        -- Needs to be kept informed
    'contributor'      -- Provides input
  )),

  -- Communication preferences for this item
  notify_on_updates BOOLEAN DEFAULT true,
  notify_on_decision BOOLEAN DEFAULT true,
  notify_on_comments BOOLEAN DEFAULT true,

  -- Notes about this stakeholder's involvement
  notes TEXT,

  -- Metadata
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one of user_id or contact_id is set
  CONSTRAINT stakeholder_type CHECK (
    (user_id IS NOT NULL AND contact_id IS NULL) OR
    (user_id IS NULL AND contact_id IS NOT NULL)
  ),

  -- Unique constraint per item per stakeholder
  CONSTRAINT unique_item_stakeholder UNIQUE (item_type, item_id, user_id, contact_id)
);

-- ============================================================================
-- 2. ITEM RELATIONSHIPS
-- Links decisions ↔ opportunities ↔ projects ↔ work_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source item
  source_type TEXT NOT NULL CHECK (source_type IN ('decision', 'opportunity', 'project', 'work_item')),
  source_id UUID NOT NULL,

  -- Target item
  target_type TEXT NOT NULL CHECK (target_type IN ('decision', 'opportunity', 'project', 'work_item')),
  target_id UUID NOT NULL,

  -- Relationship type
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'decides_on',      -- Decision decides on this opportunity
    'spawns',          -- Decision/opportunity spawns a project
    'blocks',          -- This item blocks the target
    'blocked_by',      -- This item is blocked by target
    'relates_to',      -- General relation
    'duplicates',      -- This is a duplicate of target
    'parent_of',       -- Hierarchical relationship
    'child_of',        -- Hierarchical relationship
    'depends_on',      -- This depends on target
    'informs'          -- This informs the target
  )),

  -- Additional context
  description TEXT,

  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent self-relationships
  CONSTRAINT no_self_relationship CHECK (
    NOT (source_type = target_type AND source_id = target_id)
  ),

  -- Unique constraint
  CONSTRAINT unique_relationship UNIQUE (source_type, source_id, target_type, target_id, relationship_type)
);

-- ============================================================================
-- 3. ENHANCE DECISIONS TABLE
-- Add decision outcome tracking fields
-- ============================================================================
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS spawned_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS implementation_status TEXT CHECK (implementation_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  ADD COLUMN IF NOT EXISTS implementation_notes TEXT,
  ADD COLUMN IF NOT EXISTS next_review_date DATE,
  ADD COLUMN IF NOT EXISTS review_frequency TEXT CHECK (review_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly', 'none'));

-- ============================================================================
-- 4. ENHANCE PROJECTS TABLE
-- Add lifecycle tracking and decision linkage
-- ============================================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS source_decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_opportunity_id UUID REFERENCES work_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS completed_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS spent DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS goals TEXT[],
  ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- 5. DECISION COMMENTS (separate from work_item_comments for decisions table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,

  -- Author
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Comment type
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN (
    'comment',      -- General comment
    'question',     -- Question needing answer
    'suggestion',   -- Suggestion/recommendation
    'concern',      -- Concern or issue
    'update',       -- Status update
    'decision',     -- Records decision outcome
    'ai_insight'    -- AI-generated insight
  )),

  -- For threaded replies
  parent_comment_id UUID REFERENCES decision_comments(id) ON DELETE CASCADE,

  -- Mentions
  mentioned_user_ids UUID[] DEFAULT '{}',

  -- Reactions (simple emoji reactions)
  reactions JSONB DEFAULT '{}'::jsonb,

  -- Edit tracking
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. ITEM NOTIFICATIONS - Extend notification types for decisions
-- ============================================================================
-- Add new notification types (alter existing enum/check)
DO $$
BEGIN
  -- Try to add new types to the notifications table type check
  -- This is safe if the constraint doesn't exist or already has these values
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'message', 'mention', 'conversation_invite',
    'document_share', 'space_invite', 'system',
    -- New decision-related types
    'decision_assigned', 'decision_update', 'decision_made',
    'decision_comment', 'decision_reminder', 'decision_escalated',
    'opportunity_update', 'project_update', 'stakeholder_added'
  ));
EXCEPTION WHEN OTHERS THEN
  -- Ignore if constraint modification fails
  NULL;
END $$;

-- ============================================================================
-- 7. DECISION NOTIFICATIONS TABLE (for more complex decision notifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who receives this
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What decision this is about
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,

  -- Notification type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'assigned',           -- You've been assigned to this decision
    'decision_made',      -- A decision was made
    'comment_added',      -- Someone commented
    'mentioned',          -- You were mentioned
    'deadline_approaching', -- Due date is near
    'deadline_passed',    -- Due date has passed
    'status_changed',     -- Status changed
    'escalated',          -- Decision was escalated
    'delegated_to_you',   -- Decision was delegated to you
    'stakeholder_added',  -- You were added as stakeholder
    'reminder'            -- General reminder
  )),

  -- Content
  title TEXT NOT NULL,
  message TEXT,

  -- Who triggered this (null for system notifications)
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery
  sent_in_app BOOLEAN DEFAULT true,
  sent_email BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. EMAIL OUTBOX - Queue for sending emails about decisions
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Sender
  sent_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Recipients (can be internal users or external contacts)
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Email content
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,

  -- Context (what this email is about)
  context_type TEXT CHECK (context_type IN ('decision', 'opportunity', 'project', 'general', 'notification')),
  context_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timing
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Item stakeholders
CREATE INDEX IF NOT EXISTS idx_stakeholders_item ON item_stakeholders(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_user ON item_stakeholders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_contact ON item_stakeholders(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_role ON item_stakeholders(role);

-- Item relationships
CREATE INDEX IF NOT EXISTS idx_relationships_source ON item_relationships(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON item_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON item_relationships(relationship_type);

-- Decision comments
CREATE INDEX IF NOT EXISTS idx_decision_comments_decision ON decision_comments(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_comments_author ON decision_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_decision_comments_parent ON decision_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Decision notifications
CREATE INDEX IF NOT EXISTS idx_decision_notifications_user ON decision_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_notifications_decision ON decision_notifications(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_notifications_unread ON decision_notifications(user_id, is_read) WHERE is_read = false;

-- Email outbox
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_outbox_scheduled ON email_outbox(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_outbox_context ON email_outbox(context_type, context_id);

-- Projects enhancements
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_source_decision ON projects(source_decision_id);

-- Decisions enhancements
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_spawned_project ON decisions(spawned_project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_implementation ON decisions(implementation_status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE item_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;

-- Item Stakeholders Policies
CREATE POLICY "Users can view stakeholders in their organization"
  ON item_stakeholders FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id IN (
        SELECT organization_id FROM decisions WHERE id = item_stakeholders.item_id AND item_stakeholders.item_type = 'decision'
        UNION
        SELECT organization_id FROM work_items WHERE id = item_stakeholders.item_id AND item_stakeholders.item_type IN ('opportunity', 'work_item')
        UNION
        SELECT organization_id FROM projects WHERE id = item_stakeholders.item_id AND item_stakeholders.item_type = 'project'
      )
    )
  );

CREATE POLICY "Users can manage stakeholders in their organization"
  ON item_stakeholders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id IN (
        SELECT organization_id FROM decisions WHERE id = item_stakeholders.item_id AND item_stakeholders.item_type = 'decision'
        UNION
        SELECT organization_id FROM work_items WHERE id = item_stakeholders.item_id AND item_stakeholders.item_type IN ('opportunity', 'work_item')
        UNION
        SELECT organization_id FROM projects WHERE id = item_stakeholders.item_id AND item_stakeholders.item_type = 'project'
      )
    )
  );

-- Item Relationships Policies
CREATE POLICY "Users can view relationships in their organization"
  ON item_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id IN (
        SELECT organization_id FROM decisions WHERE id = item_relationships.source_id AND item_relationships.source_type = 'decision'
        UNION
        SELECT organization_id FROM work_items WHERE id = item_relationships.source_id AND item_relationships.source_type IN ('opportunity', 'work_item')
        UNION
        SELECT organization_id FROM projects WHERE id = item_relationships.source_id AND item_relationships.source_type = 'project'
      )
    )
  );

CREATE POLICY "Users can manage relationships in their organization"
  ON item_relationships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id IN (
        SELECT organization_id FROM decisions WHERE id = item_relationships.source_id AND item_relationships.source_type = 'decision'
        UNION
        SELECT organization_id FROM work_items WHERE id = item_relationships.source_id AND item_relationships.source_type IN ('opportunity', 'work_item')
        UNION
        SELECT organization_id FROM projects WHERE id = item_relationships.source_id AND item_relationships.source_type = 'project'
      )
    )
  );

-- Decision Comments Policies
CREATE POLICY "Users can view comments on decisions in their organization"
  ON decision_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions d
      JOIN profiles p ON p.organization_id = d.organization_id
      WHERE d.id = decision_comments.decision_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on decisions in their organization"
  ON decision_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM decisions d
      JOIN profiles p ON p.organization_id = d.organization_id
      WHERE d.id = decision_comments.decision_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON decision_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON decision_comments FOR DELETE
  USING (author_id = auth.uid());

-- Decision Notifications Policies
CREATE POLICY "Users can view their own decision notifications"
  ON decision_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own decision notifications"
  ON decision_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create decision notifications"
  ON decision_notifications FOR INSERT
  WITH CHECK (true);

-- Email Outbox Policies
CREATE POLICY "Users can view emails in their organization"
  ON email_outbox FOR SELECT
  USING (
    sent_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = email_outbox.organization_id
    )
  );

CREATE POLICY "Users can create emails in their organization"
  ON email_outbox FOR INSERT
  WITH CHECK (
    sent_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = email_outbox.organization_id
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_item_stakeholders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_stakeholders_updated_at
  BEFORE UPDATE ON item_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_item_stakeholders_updated_at();

CREATE OR REPLACE FUNCTION update_decision_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.content != OLD.content THEN
    NEW.is_edited = true;
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decision_comments_updated_at
  BEFORE UPDATE ON decision_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_decision_comments_updated_at();

-- Auto-create notification when stakeholder is added
CREATE OR REPLACE FUNCTION notify_stakeholder_added()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO decision_notifications (
      user_id,
      decision_id,
      notification_type,
      title,
      message,
      triggered_by
    )
    SELECT
      NEW.user_id,
      NEW.item_id,
      'stakeholder_added',
      'You''ve been added as a ' || NEW.role || ' on a decision',
      'You''ve been added to: ' || d.title,
      NEW.added_by
    FROM decisions d
    WHERE d.id = NEW.item_id
    AND NEW.item_type = 'decision';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_stakeholder_added
  AFTER INSERT ON item_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION notify_stakeholder_added();

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_decision_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decision_notification_mark_read
  BEFORE UPDATE ON decision_notifications
  FOR EACH ROW
  WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
  EXECUTE FUNCTION mark_decision_notification_read();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get all stakeholders for an item with user/contact details
CREATE OR REPLACE FUNCTION get_item_stakeholders(
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  notes TEXT,
  stakeholder_type TEXT,
  stakeholder_id UUID,
  stakeholder_name TEXT,
  stakeholder_email TEXT,
  stakeholder_avatar TEXT,
  notify_on_updates BOOLEAN,
  notify_on_decision BOOLEAN,
  notify_on_comments BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.role,
    s.notes,
    CASE WHEN s.user_id IS NOT NULL THEN 'user' ELSE 'contact' END as stakeholder_type,
    COALESCE(s.user_id, s.contact_id) as stakeholder_id,
    COALESCE(p.full_name, c.full_name) as stakeholder_name,
    COALESCE(p.email, c.email) as stakeholder_email,
    COALESCE(p.avatar_url, c.avatar_url) as stakeholder_avatar,
    s.notify_on_updates,
    s.notify_on_decision,
    s.notify_on_comments,
    s.created_at
  FROM item_stakeholders s
  LEFT JOIN profiles p ON s.user_id = p.id
  LEFT JOIN contacts c ON s.contact_id = c.id
  WHERE s.item_type = p_item_type
    AND s.item_id = p_item_id
  ORDER BY
    CASE s.role
      WHEN 'owner' THEN 1
      WHEN 'decision_maker' THEN 2
      WHEN 'reviewer' THEN 3
      WHEN 'stakeholder' THEN 4
      WHEN 'assignee' THEN 5
      WHEN 'contributor' THEN 6
      WHEN 'informed' THEN 7
    END,
    s.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all related items for a given item
CREATE OR REPLACE FUNCTION get_related_items(
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS TABLE (
  relationship_id UUID,
  relationship_type TEXT,
  direction TEXT,
  related_type TEXT,
  related_id UUID,
  related_title TEXT,
  related_status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Outgoing relationships
  SELECT
    r.id as relationship_id,
    r.relationship_type,
    'outgoing'::TEXT as direction,
    r.target_type as related_type,
    r.target_id as related_id,
    CASE
      WHEN r.target_type = 'decision' THEN (SELECT title FROM decisions WHERE id = r.target_id)
      WHEN r.target_type = 'project' THEN (SELECT name FROM projects WHERE id = r.target_id)
      WHEN r.target_type IN ('opportunity', 'work_item') THEN (SELECT title FROM work_items WHERE id = r.target_id)
    END as related_title,
    CASE
      WHEN r.target_type = 'decision' THEN (SELECT status FROM decisions WHERE id = r.target_id)
      WHEN r.target_type = 'project' THEN (SELECT status FROM projects WHERE id = r.target_id)
      WHEN r.target_type IN ('opportunity', 'work_item') THEN (SELECT current_stage_id FROM work_items WHERE id = r.target_id)
    END as related_status,
    r.created_at
  FROM item_relationships r
  WHERE r.source_type = p_item_type
    AND r.source_id = p_item_id

  UNION ALL

  -- Incoming relationships
  SELECT
    r.id as relationship_id,
    r.relationship_type,
    'incoming'::TEXT as direction,
    r.source_type as related_type,
    r.source_id as related_id,
    CASE
      WHEN r.source_type = 'decision' THEN (SELECT title FROM decisions WHERE id = r.source_id)
      WHEN r.source_type = 'project' THEN (SELECT name FROM projects WHERE id = r.source_id)
      WHEN r.source_type IN ('opportunity', 'work_item') THEN (SELECT title FROM work_items WHERE id = r.source_id)
    END as related_title,
    CASE
      WHEN r.source_type = 'decision' THEN (SELECT status FROM decisions WHERE id = r.source_id)
      WHEN r.source_type = 'project' THEN (SELECT status FROM projects WHERE id = r.source_id)
      WHEN r.source_type IN ('opportunity', 'work_item') THEN (SELECT current_stage_id FROM work_items WHERE id = r.source_id)
    END as related_status,
    r.created_at
  FROM item_relationships r
  WHERE r.target_type = p_item_type
    AND r.target_id = p_item_id

  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a project from a decision
CREATE OR REPLACE FUNCTION create_project_from_decision(
  p_decision_id UUID,
  p_project_name TEXT,
  p_project_description TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_target_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_decision decisions%ROWTYPE;
  v_project_id UUID;
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the decision
  SELECT * INTO v_decision FROM decisions WHERE id = p_decision_id;

  IF v_decision IS NULL THEN
    RAISE EXCEPTION 'Decision not found';
  END IF;

  v_org_id := v_decision.organization_id;
  v_user_id := v_decision.user_id;

  -- Create the project
  INSERT INTO projects (
    organization_id,
    created_by,
    name,
    description,
    source_decision_id,
    team_id,
    target_date,
    status,
    owner_id
  ) VALUES (
    v_org_id,
    v_user_id,
    p_project_name,
    COALESCE(p_project_description, v_decision.decision_rationale),
    p_decision_id,
    p_team_id,
    p_target_date,
    'planning',
    v_user_id
  ) RETURNING id INTO v_project_id;

  -- Update the decision with the spawned project
  UPDATE decisions
  SET spawned_project_id = v_project_id,
      implementation_status = 'in_progress'
  WHERE id = p_decision_id;

  -- Create the relationship
  INSERT INTO item_relationships (
    source_type,
    source_id,
    target_type,
    target_id,
    relationship_type,
    created_by
  ) VALUES (
    'decision',
    p_decision_id,
    'project',
    v_project_id,
    'spawns',
    v_user_id
  );

  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_item_stakeholders TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_project_from_decision TO authenticated;

-- Comments
COMMENT ON TABLE item_stakeholders IS 'Links internal users and external contacts to decisions, opportunities, and projects';
COMMENT ON TABLE item_relationships IS 'Tracks relationships between decisions, opportunities, projects, and work items';
COMMENT ON TABLE decision_comments IS 'Comments and discussions on decisions';
COMMENT ON TABLE decision_notifications IS 'Notifications related to decisions';
COMMENT ON TABLE email_outbox IS 'Queue for outgoing emails about decisions and other items';
COMMENT ON FUNCTION get_item_stakeholders IS 'Get all stakeholders (users and contacts) for an item';
COMMENT ON FUNCTION get_related_items IS 'Get all items related to a given item';
COMMENT ON FUNCTION create_project_from_decision IS 'Create a new project from an approved decision';
