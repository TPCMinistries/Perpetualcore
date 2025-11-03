-- AI WORKFLOWS SCHEMA
-- Automated multi-step AI workflows with assistant chaining

-- =====================================================
-- TABLE: workflows
-- Main workflow definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Workflow details
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '⚡',
  category TEXT, -- 'content', 'research', 'automation', 'analysis', 'custom'

  -- Workflow configuration
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of workflow nodes/steps
  edges JSONB NOT NULL DEFAULT '[]'::jsonb, -- Connections between nodes

  -- Trigger configuration
  trigger_type TEXT NOT NULL, -- 'manual', 'schedule', 'webhook', 'event'
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Trigger-specific configuration

  -- Settings
  enabled BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Share with organization

  -- Execution settings
  timeout_seconds INTEGER DEFAULT 300, -- 5 minutes default
  max_retries INTEGER DEFAULT 3,

  -- Usage stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event')),
  CONSTRAINT valid_category CHECK (category IS NULL OR category IN ('content', 'research', 'automation', 'analysis', 'custom'))
);

-- =====================================================
-- TABLE: workflow_executions
-- Individual workflow runs/executions
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  triggered_by TEXT NOT NULL, -- 'manual', 'schedule', 'webhook', 'event'

  -- Input/Output
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,

  -- Progress tracking
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  step_results JSONB DEFAULT '[]'::jsonb, -- Results from each step

  -- Error handling
  error_message TEXT,
  error_step INTEGER,
  retry_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- =====================================================
-- TABLE: workflow_steps
-- Individual step executions within a workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Step details
  step_index INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL, -- 'assistant', 'condition', 'transform', 'webhook', 'delay'

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Execution
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,

  -- Assistant-specific (if step_type = 'assistant')
  assistant_id UUID REFERENCES ai_assistants(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES assistant_conversations(id) ON DELETE SET NULL,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_step_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  CONSTRAINT valid_step_type CHECK (step_type IN ('assistant', 'condition', 'transform', 'webhook', 'delay', 'input', 'output'))
);

-- =====================================================
-- TABLE: workflow_templates
-- Pre-built workflow templates
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '⚡',
  category TEXT,

  -- Template configuration
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_trigger_type TEXT DEFAULT 'manual',

  -- Example data
  example_input JSONB DEFAULT '{}'::jsonb,
  example_output JSONB DEFAULT '{}'::jsonb,
  use_cases JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  is_popular BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  estimated_duration TEXT, -- e.g., "5-10 minutes"

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: workflow_schedules
-- Scheduled workflow runs
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Schedule configuration
  cron_expression TEXT NOT NULL, -- e.g., "0 9 * * 1-5" = weekdays at 9am
  timezone TEXT DEFAULT 'UTC',

  -- Status
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_enabled ON workflows(enabled) WHERE enabled = true;
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_template ON workflows(is_template) WHERE is_template = true;

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created ON workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_user ON workflow_executions(user_id);

CREATE INDEX idx_workflow_steps_execution ON workflow_steps(execution_id);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_assistant ON workflow_steps(assistant_id) WHERE assistant_id IS NOT NULL;

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_popular ON workflow_templates(is_popular) WHERE is_popular = true;

CREATE INDEX idx_workflow_schedules_workflow ON workflow_schedules(workflow_id);
CREATE INDEX idx_workflow_schedules_next_run ON workflow_schedules(next_run_at) WHERE enabled = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;

-- Workflows Policies
CREATE POLICY "Users can view their organization's workflows"
  ON workflows FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create workflows in their organization"
  ON workflows FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own workflows"
  ON workflows FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows"
  ON workflows FOR DELETE
  USING (user_id = auth.uid());

-- Executions Policies
CREATE POLICY "Users can view their organization's workflow executions"
  ON workflow_executions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert workflow executions"
  ON workflow_executions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update workflow executions"
  ON workflow_executions FOR UPDATE
  USING (true);

-- Steps Policies
CREATE POLICY "Users can view workflow steps from their org's executions"
  ON workflow_steps FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM workflow_executions
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage workflow steps"
  ON workflow_steps FOR ALL
  USING (true)
  WITH CHECK (true);

-- Templates Policies (public read)
CREATE POLICY "Anyone can view workflow templates"
  ON workflow_templates FOR SELECT
  USING (true);

-- Schedules Policies
CREATE POLICY "Users can view schedules for their org's workflows"
  ON workflow_schedules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage schedules for their workflows"
  ON workflow_schedules FOR ALL
  USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update workflow stats after execution
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('completed', 'failed') THEN
    UPDATE workflows
    SET
      total_runs = total_runs + 1,
      successful_runs = successful_runs + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      failed_runs = failed_runs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      last_run_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.workflow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update workflow stats
CREATE TRIGGER update_workflow_stats_trigger
  AFTER UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_stats();

-- Function to calculate execution duration
CREATE OR REPLACE FUNCTION calculate_execution_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND NEW.started_at IS NOT NULL THEN
    NEW.completed_at = NOW();
    NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate duration
CREATE TRIGGER calculate_workflow_execution_duration
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed', 'cancelled'))
  EXECUTE FUNCTION calculate_execution_duration();

-- Same for workflow steps
CREATE TRIGGER calculate_workflow_step_duration
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed', 'skipped'))
  EXECUTE FUNCTION calculate_execution_duration();

-- =====================================================
-- SEED DATA: Workflow Templates
-- =====================================================
INSERT INTO workflow_templates (name, description, icon, category, nodes, edges, use_cases, is_popular, estimated_duration) VALUES

-- Content Creation Pipeline
(
  'Content Creation Pipeline',
  'Research topic → Write article → Generate social posts → Review & publish',
  '📝',
  'content',
  '[
    {"id": "1", "type": "input", "data": {"label": "Topic Input", "fields": [{"name": "topic", "type": "text", "required": true}]}},
    {"id": "2", "type": "assistant", "data": {"label": "Research Topic", "assistantRole": "research"}},
    {"id": "3", "type": "assistant", "data": {"label": "Write Article", "assistantRole": "writing"}},
    {"id": "4", "type": "assistant", "data": {"label": "Generate Social Posts", "assistantRole": "marketing"}},
    {"id": "5", "type": "output", "data": {"label": "Results", "fields": ["article", "social_posts"]}}
  ]'::jsonb,
  '[
    {"source": "1", "target": "2"},
    {"source": "2", "target": "3"},
    {"source": "3", "target": "4"},
    {"source": "4", "target": "5"}
  ]'::jsonb,
  '["Blog content creation", "Social media campaigns", "Content marketing automation"]'::jsonb,
  true,
  '10-15 minutes'
),

-- Customer Support Response
(
  'AI Customer Support Response',
  'Analyze inquiry → Draft empathetic response → Review & send',
  '🎧',
  'automation',
  '[
    {"id": "1", "type": "input", "data": {"label": "Customer Inquiry", "fields": [{"name": "inquiry", "type": "text", "required": true}]}},
    {"id": "2", "type": "assistant", "data": {"label": "Analyze Issue", "assistantRole": "customer_support"}},
    {"id": "3", "type": "condition", "data": {"label": "Is Urgent?", "field": "priority", "operator": "equals", "value": "high"}},
    {"id": "4", "type": "assistant", "data": {"label": "Draft Response", "assistantRole": "customer_support"}},
    {"id": "5", "type": "output", "data": {"label": "Response Ready", "fields": ["response", "priority"]}}
  ]'::jsonb,
  '[
    {"source": "1", "target": "2"},
    {"source": "2", "target": "3"},
    {"source": "3", "target": "4", "label": "Yes"},
    {"source": "3", "target": "5", "label": "No"},
    {"source": "4", "target": "5"}
  ]'::jsonb,
  '["Customer support automation", "Ticket response drafting", "Support quality assurance"]'::jsonb,
  true,
  '3-5 minutes'
),

-- Code Review Workflow
(
  'Automated Code Review',
  'Review code → Security audit → Performance check → Generate report',
  '👨‍💻',
  'automation',
  '[
    {"id": "1", "type": "input", "data": {"label": "Code Input", "fields": [{"name": "code", "type": "text", "required": true}, {"name": "language", "type": "select"}]}},
    {"id": "2", "type": "assistant", "data": {"label": "Code Quality Review", "assistantRole": "code_review"}},
    {"id": "3", "type": "assistant", "data": {"label": "Security Audit", "assistantRole": "code_review"}},
    {"id": "4", "type": "assistant", "data": {"label": "Performance Analysis", "assistantRole": "code_review"}},
    {"id": "5", "type": "assistant", "data": {"label": "Generate Report", "assistantRole": "code_review"}},
    {"id": "6", "type": "output", "data": {"label": "Review Complete", "fields": ["report", "issues", "recommendations"]}}
  ]'::jsonb,
  '[
    {"source": "1", "target": "2"},
    {"source": "2", "target": "3"},
    {"source": "3", "target": "4"},
    {"source": "4", "target": "5"},
    {"source": "5", "target": "6"}
  ]'::jsonb,
  '["Pull request reviews", "Code quality checks", "Security audits", "Pre-deployment validation"]'::jsonb,
  true,
  '5-8 minutes'
),

-- Market Research Report
(
  'Market Research Report',
  'Research competitors → Analyze trends → SWOT analysis → Generate report',
  '📊',
  'research',
  '[
    {"id": "1", "type": "input", "data": {"label": "Research Topic", "fields": [{"name": "market", "type": "text", "required": true}, {"name": "competitors", "type": "text"}]}},
    {"id": "2", "type": "assistant", "data": {"label": "Competitor Research", "assistantRole": "research"}},
    {"id": "3", "type": "assistant", "data": {"label": "Trend Analysis", "assistantRole": "research"}},
    {"id": "4", "type": "assistant", "data": {"label": "SWOT Analysis", "assistantRole": "custom"}},
    {"id": "5", "type": "assistant", "data": {"label": "Generate Report", "assistantRole": "writing"}},
    {"id": "6", "type": "output", "data": {"label": "Research Report", "fields": ["report", "insights", "recommendations"]}}
  ]'::jsonb,
  '[
    {"source": "1", "target": "2"},
    {"source": "2", "target": "3"},
    {"source": "3", "target": "4"},
    {"source": "4", "target": "5"},
    {"source": "5", "target": "6"}
  ]'::jsonb,
  '["Market analysis", "Competitive intelligence", "Business planning", "Investment research"]'::jsonb,
  true,
  '15-20 minutes'
),

-- Email Campaign Creator
(
  'Email Campaign Creator',
  'Define campaign → Write subject lines → Create email copy → A/B test variants',
  '📧',
  'content',
  '[
    {"id": "1", "type": "input", "data": {"label": "Campaign Brief", "fields": [{"name": "goal", "type": "text"}, {"name": "audience", "type": "text"}, {"name": "offer", "type": "text"}]}},
    {"id": "2", "type": "assistant", "data": {"label": "Strategy Planning", "assistantRole": "marketing"}},
    {"id": "3", "type": "assistant", "data": {"label": "Subject Lines (5 variants)", "assistantRole": "marketing"}},
    {"id": "4", "type": "assistant", "data": {"label": "Email Copy", "assistantRole": "writing"}},
    {"id": "5", "type": "assistant", "data": {"label": "Create A/B Test Variants", "assistantRole": "marketing"}},
    {"id": "6", "type": "output", "data": {"label": "Campaign Ready", "fields": ["subject_lines", "email_variants", "strategy"]}}
  ]'::jsonb,
  '[
    {"source": "1", "target": "2"},
    {"source": "2", "target": "3"},
    {"source": "3", "target": "4"},
    {"source": "4", "target": "5"},
    {"source": "5", "target": "6"}
  ]'::jsonb,
  '["Email marketing", "Campaign creation", "Newsletter automation", "Promotional emails"]'::jsonb,
  true,
  '8-12 minutes'
);
