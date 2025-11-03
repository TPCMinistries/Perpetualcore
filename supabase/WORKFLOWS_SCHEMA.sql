-- Workflows (Automation Rules)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- Event: {"event": "document.uploaded", "filters": {"file_type": "pdf"}}
  -- Schedule: {"cron": "0 9 * * 1", "timezone": "America/New_York"}
  -- Manual: {}

  -- Actions to perform when triggered
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"type": "ai_analyze", "config": {"prompt": "Summarize this document"}},
  --   {"type": "create_task", "config": {"title": "Review summary", "priority": "high"}},
  --   {"type": "send_email", "config": {"to": "user@example.com", "subject": "New document"}}
  -- ]

  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  run_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  trigger_data JSONB, -- Data that triggered this execution

  -- Step-by-step execution log
  steps JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"step": 1, "action": "ai_analyze", "status": "success", "output": "Summary: ..."},
  --   {"step": 2, "action": "create_task", "status": "success", "task_id": "uuid"}
  -- ]

  error_message TEXT,
  duration_ms INTEGER,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Workflow templates (pre-built automation recipes)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,

  -- Template configuration
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  actions JSONB NOT NULL,

  -- Popularity and usage
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_organization_id ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);

-- RLS Policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view workflows in their organization" ON workflows
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workflows in their organization" ON workflows
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workflows" ON workflows
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" ON workflows
  FOR DELETE USING (user_id = auth.uid());

-- Workflow executions policies
CREATE POLICY "Users can view executions in their organization" ON workflow_executions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert executions" ON workflow_executions
  FOR INSERT WITH CHECK (true);

-- Templates are public read
CREATE POLICY "Anyone can view workflow templates" ON workflow_templates
  FOR SELECT USING (true);

-- Triggers
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workflow templates
INSERT INTO workflow_templates (name, description, category, icon, trigger_type, trigger_config, actions) VALUES
  (
    'Auto-summarize uploaded documents',
    'Automatically generate AI summaries for new documents',
    'Documents',
    '📄',
    'event',
    '{"event": "document.uploaded"}'::jsonb,
    '[
      {"type": "ai_analyze", "config": {"prompt": "Generate a concise summary of this document in 3-5 bullet points"}},
      {"type": "update_document", "config": {"field": "summary", "value": "{{ai_output}}"}}
    ]'::jsonb
  ),
  (
    'Daily task digest',
    'Send a daily email with upcoming tasks',
    'Tasks',
    '✅',
    'schedule',
    '{"cron": "0 9 * * *", "timezone": "UTC"}'::jsonb,
    '[
      {"type": "fetch_tasks", "config": {"status": ["todo", "in_progress"], "limit": 10}},
      {"type": "send_email", "config": {"subject": "Your tasks for today", "template": "task_digest"}}
    ]'::jsonb
  ),
  (
    'Auto-create tasks from meetings',
    'Create follow-up tasks for calendar events',
    'Calendar',
    '📅',
    'event',
    '{"event": "calendar.event_ended"}'::jsonb,
    '[
      {"type": "ai_analyze", "config": {"prompt": "Extract action items from this meeting"}},
      {"type": "create_tasks", "config": {"source": "ai_output", "priority": "medium"}}
    ]'::jsonb
  ),
  (
    'High-priority task alerts',
    'Get notified when high-priority tasks are due soon',
    'Tasks',
    '🔔',
    'schedule',
    '{"cron": "0 8,14,20 * * *", "timezone": "UTC"}'::jsonb,
    '[
      {"type": "fetch_tasks", "config": {"priority": "high", "due_within_hours": 24}},
      {"type": "send_notification", "config": {"title": "High-priority tasks due soon", "template": "task_alert"}}
    ]'::jsonb
  ),
  (
    'Weekly analytics report',
    'Get a weekly summary of your productivity metrics',
    'Analytics',
    '📊',
    'schedule',
    '{"cron": "0 9 * * 1", "timezone": "UTC"}'::jsonb,
    '[
      {"type": "generate_analytics", "config": {"period": "last_week"}},
      {"type": "send_email", "config": {"subject": "Your weekly productivity report", "template": "analytics_report"}}
    ]'::jsonb
  ),
  (
    'Smart document tagging',
    'Automatically tag documents based on content',
    'Documents',
    '🏷️',
    'event',
    '{"event": "document.uploaded"}'::jsonb,
    '[
      {"type": "ai_analyze", "config": {"prompt": "Suggest 3-5 relevant tags for this document based on its content"}},
      {"type": "update_document", "config": {"field": "tags", "value": "{{ai_output}}"}}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;
