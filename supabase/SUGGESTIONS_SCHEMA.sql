-- PROACTIVE AI SUGGESTIONS SCHEMA
-- This schema manages AI-generated suggestions for users

-- =====================================================
-- TABLE: ai_suggestions
-- Stores AI-generated suggestions for users
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Suggestion details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'productivity', 'workflow', 'task', 'document', 'email', 'meeting', 'optimization', 'insight'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

  -- Context
  context_type TEXT, -- 'task', 'document', 'email', 'calendar', 'workflow', 'general'
  context_id UUID, -- Reference to related entity
  context_data JSONB DEFAULT '{}'::jsonb, -- Additional context

  -- Action
  suggested_action TEXT NOT NULL, -- What action to take
  action_type TEXT, -- 'create', 'update', 'delete', 'optimize', 'review', 'schedule'
  action_data JSONB DEFAULT '{}'::jsonb, -- Data for executing the action
  action_url TEXT, -- Deep link to execute action

  -- AI metadata
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  reasoning TEXT, -- Why this suggestion was made
  related_patterns JSONB DEFAULT '[]'::jsonb, -- Patterns that led to this suggestion

  -- User interaction
  status TEXT DEFAULT 'pending', -- 'pending', 'viewed', 'accepted', 'dismissed', 'snoozed'
  viewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  feedback TEXT, -- User feedback on suggestion

  -- Scheduling
  expires_at TIMESTAMPTZ, -- When suggestion becomes irrelevant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IN ('productivity', 'workflow', 'task', 'document', 'email', 'meeting', 'optimization', 'insight', 'collaboration')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'viewed', 'accepted', 'dismissed', 'snoozed'))
);

-- =====================================================
-- TABLE: suggestion_templates
-- Templates for common suggestion patterns
-- =====================================================
CREATE TABLE IF NOT EXISTS suggestion_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',

  -- Template content
  title_template TEXT NOT NULL, -- Can include {variables}
  description_template TEXT NOT NULL,
  suggested_action_template TEXT NOT NULL,

  -- Trigger conditions
  trigger_type TEXT NOT NULL, -- 'pattern', 'time', 'event', 'threshold'
  trigger_conditions JSONB NOT NULL, -- Conditions that trigger this suggestion

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_suggestion_preferences
-- User preferences for suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS user_suggestion_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Category preferences
  enabled_categories JSONB DEFAULT '["productivity", "workflow", "task", "document", "email", "meeting", "optimization", "insight"]'::jsonb,
  disabled_categories JSONB DEFAULT '[]'::jsonb,

  -- Frequency
  max_suggestions_per_day INTEGER DEFAULT 10,
  notification_enabled BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Preferences
  min_confidence_score DECIMAL(3,2) DEFAULT 0.70,
  auto_dismiss_low_confidence BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_suggestions_user ON ai_suggestions(user_id);
CREATE INDEX idx_suggestions_org ON ai_suggestions(organization_id);
CREATE INDEX idx_suggestions_status ON ai_suggestions(status);
CREATE INDEX idx_suggestions_category ON ai_suggestions(category);
CREATE INDEX idx_suggestions_priority ON ai_suggestions(priority);
CREATE INDEX idx_suggestions_created ON ai_suggestions(created_at DESC);
CREATE INDEX idx_suggestions_expires ON ai_suggestions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_suggestion_templates_category ON suggestion_templates(category);
CREATE INDEX idx_suggestion_templates_active ON suggestion_templates(is_active) WHERE is_active = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestion_preferences ENABLE ROW LEVEL SECURITY;

-- Suggestions Policies
CREATE POLICY "Users can view their own suggestions"
  ON ai_suggestions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own suggestions"
  ON ai_suggestions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own suggestions"
  ON ai_suggestions FOR DELETE
  USING (user_id = auth.uid());

-- Templates Policies (public read)
CREATE POLICY "Anyone can view active templates"
  ON suggestion_templates FOR SELECT
  USING (is_active = true);

-- Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON user_suggestion_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON user_suggestion_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON user_suggestion_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-dismiss expired suggestions
CREATE OR REPLACE FUNCTION dismiss_expired_suggestions()
RETURNS void AS $$
BEGIN
  UPDATE ai_suggestions
  SET
    status = 'dismissed',
    dismissed_at = NOW(),
    updated_at = NOW()
  WHERE
    status IN ('pending', 'viewed', 'snoozed')
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to mark suggestion as viewed
CREATE OR REPLACE FUNCTION mark_suggestion_viewed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'viewed' AND OLD.status = 'pending' THEN
    NEW.viewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_viewed_trigger
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW
  WHEN (NEW.status = 'viewed' AND OLD.status = 'pending')
  EXECUTE FUNCTION mark_suggestion_viewed();

-- =====================================================
-- SEED DATA: Suggestion Templates
-- =====================================================
INSERT INTO suggestion_templates (name, description, category, priority, title_template, description_template, suggested_action_template, trigger_type, trigger_conditions) VALUES

-- Productivity Suggestions
(
  'Overdue Tasks Reminder',
  'Remind user about overdue tasks',
  'productivity',
  'high',
  'You have {count} overdue tasks',
  'These tasks are past their due date and need attention: {task_list}',
  'Review and update your overdue tasks',
  'threshold',
  '{"metric": "overdue_tasks", "operator": ">", "value": 0}'::jsonb
),

(
  'Unread Email Buildup',
  'Alert when inbox has too many unread emails',
  'email',
  'medium',
  '{count} unread emails in your inbox',
  'Your inbox has accumulated {count} unread emails. Consider processing them to stay organized.',
  'Process your unread emails',
  'threshold',
  '{"metric": "unread_emails", "operator": ">", "value": 50}'::jsonb
),

(
  'Daily Task Planning',
  'Suggest planning tasks for the day',
  'productivity',
  'medium',
  'Plan your day',
  'You haven''t reviewed your tasks today. Take a moment to prioritize your work.',
  'Review and prioritize today''s tasks',
  'time',
  '{"time": "09:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb
),

-- Workflow Optimization
(
  'Repetitive Task Pattern',
  'Identify repetitive tasks that could be automated',
  'workflow',
  'medium',
  'Automate repetitive task: {task_name}',
  'You''ve done this task {count} times this month. Consider creating a workflow to automate it.',
  'Create a workflow automation',
  'pattern',
  '{"metric": "task_repetition", "threshold": 5, "timeframe": "month"}'::jsonb
),

(
  'Workflow Efficiency',
  'Suggest workflow improvements',
  'optimization',
  'low',
  'Optimize your {workflow_name} workflow',
  'Based on execution history, we found opportunities to improve this workflow.',
  'Review workflow optimization suggestions',
  'pattern',
  '{"metric": "workflow_performance", "analyze": true}'::jsonb
),

-- Meeting Preparation
(
  'Upcoming Meeting Prep',
  'Remind to prepare for upcoming meetings',
  'meeting',
  'high',
  'Prepare for "{meeting_title}"',
  'Your meeting "{meeting_title}" is in {time_until}. Review the agenda and prepare materials.',
  'Prepare for the meeting',
  'time',
  '{"lead_time_hours": 2, "requires_preparation": true}'::jsonb
),

(
  'Meeting Follow-up Tasks',
  'Create tasks from meeting notes',
  'meeting',
  'medium',
  'Create follow-up tasks from "{meeting_title}"',
  'Your meeting "{meeting_title}" ended {time_ago}. Create tasks for action items discussed.',
  'Create follow-up tasks',
  'event',
  '{"trigger": "meeting_ended", "delay_hours": 1}'::jsonb
),

-- Document Organization
(
  'Unorganized Documents',
  'Suggest organizing documents',
  'document',
  'low',
  'Organize {count} untagged documents',
  'You have {count} documents without tags or folders. Organize them for easier discovery.',
  'Tag and organize documents',
  'threshold',
  '{"metric": "untagged_documents", "operator": ">", "value": 10}'::jsonb
),

(
  'Document Review Needed',
  'Remind to review stale documents',
  'document',
  'low',
  'Review outdated documents',
  'Some of your documents haven''t been updated in over 6 months. Review them for accuracy.',
  'Review and update old documents',
  'time',
  '{"metric": "document_age", "threshold_days": 180}'::jsonb
),

-- Task Management
(
  'High Priority Task Alert',
  'Alert about new high priority tasks',
  'task',
  'urgent',
  'New high priority task: {task_title}',
  'A high priority task "{task_title}" was just assigned to you.',
  'Review the high priority task',
  'event',
  '{"trigger": "task_created", "priority": "high"}'::jsonb
),

(
  'Task Completion Streak',
  'Encourage continued productivity',
  'productivity',
  'low',
  'Great job! {count} tasks completed',
  'You''ve completed {count} tasks today. Keep up the momentum!',
  'Continue your productivity streak',
  'pattern',
  '{"metric": "tasks_completed_today", "operator": ">=", "value": 5}'::jsonb
),

-- Collaboration
(
  'Pending Response',
  'Remind about messages needing response',
  'collaboration',
  'medium',
  '{count} messages awaiting your response',
  'You have {count} messages from team members that need a response.',
  'Respond to pending messages',
  'threshold',
  '{"metric": "pending_responses", "operator": ">", "value": 3}'::jsonb
),

(
  'Team Update Needed',
  'Suggest sharing status update',
  'collaboration',
  'low',
  'Share a status update with your team',
  'It''s been {days} days since you shared a status update. Keep your team informed.',
  'Post a status update',
  'time',
  '{"metric": "days_since_update", "threshold": 7}'::jsonb
),

-- Insights
(
  'Weekly Productivity Insight',
  'Share weekly productivity analysis',
  'insight',
  'low',
  'Your weekly productivity summary',
  'This week you completed {tasks_completed} tasks and attended {meetings_count} meetings.',
  'View detailed productivity insights',
  'time',
  '{"day": "friday", "time": "17:00"}'::jsonb
),

(
  'Goal Progress Update',
  'Update on goal progress',
  'insight',
  'medium',
  'You''re {percent}% towards your {goal_type} goal',
  'Great progress! You''re {percent}% of the way to your {goal_type} goal.',
  'Review goal progress',
  'pattern',
  '{"metric": "goal_progress", "check_interval_days": 7}'::jsonb
);

-- =====================================================
-- HELPER FUNCTIONS FOR GENERATING SUGGESTIONS
-- =====================================================

-- Function to generate suggestions based on templates
CREATE OR REPLACE FUNCTION generate_suggestions_for_user(
  target_user_id UUID,
  target_org_id UUID
) RETURNS SETOF ai_suggestions AS $$
DECLARE
  template RECORD;
  new_suggestion ai_suggestions;
BEGIN
  -- This is a simplified version - in production, implement proper trigger logic
  -- For now, just return empty set
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get active suggestions for user
-- SELECT * FROM ai_suggestions
-- WHERE user_id = 'USER_ID'
--   AND status IN ('pending', 'viewed', 'snoozed')
--   AND (expires_at IS NULL OR expires_at > NOW())
--   AND (snoozed_until IS NULL OR snoozed_until < NOW())
-- ORDER BY priority DESC, created_at DESC;

-- Get suggestion stats
-- SELECT
--   category,
--   status,
--   COUNT(*) as count,
--   AVG(confidence_score) as avg_confidence
-- FROM ai_suggestions
-- WHERE user_id = 'USER_ID'
-- GROUP BY category, status;

-- Get acceptance rate by category
-- SELECT
--   category,
--   COUNT(*) as total,
--   SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
--   ROUND(SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as acceptance_rate
-- FROM ai_suggestions
-- WHERE user_id = 'USER_ID'
-- GROUP BY category;
