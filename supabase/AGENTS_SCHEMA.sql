-- AI Agents (Autonomous Workers)
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL,
  -- Types: document_analyzer, task_manager, meeting_assistant, email_organizer, research_assistant

  -- Agent configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- Document Analyzer: {"auto_tag": true, "auto_summarize": true, "languages": ["en"]}
  -- Task Manager: {"priority_threshold": "high", "auto_reschedule": true}
  -- Meeting Assistant: {"auto_create_tasks": true, "send_reminders": true}

  -- Agent personality/behavior
  personality TEXT DEFAULT 'professional',
  -- Options: professional, friendly, concise, detailed

  instructions TEXT,
  -- Custom instructions: "Always prioritize urgent tasks" "Focus on technical documents"

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,

  -- Performance metrics
  total_actions INTEGER DEFAULT 0,
  successful_actions INTEGER DEFAULT 0,
  failed_actions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity logs
CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL,
  -- Types: analysis, action, monitoring, suggestion, error

  title TEXT NOT NULL,
  description TEXT,

  -- Input/output data
  input_data JSONB,
  output_data JSONB,

  -- Related entities
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  related_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  error_message TEXT,

  -- AI model used
  model_used TEXT,
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent templates (pre-configured agents)
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL,

  -- Default configuration
  default_config JSONB NOT NULL,
  default_personality TEXT DEFAULT 'professional',
  default_instructions TEXT,

  -- Capabilities
  capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Example: ["document_analysis", "task_creation", "email_sending"]

  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_enabled ON ai_agents(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_agents_agent_type ON ai_agents(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent_id ON agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_organization_id ON agent_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_created_at ON agent_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_activity_type ON agent_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);

-- RLS Policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- AI Agents policies
CREATE POLICY "Users can view agents in their organization" ON ai_agents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agents in their organization" ON ai_agents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own agents" ON ai_agents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own agents" ON ai_agents
  FOR DELETE USING (user_id = auth.uid());

-- Agent activities policies
CREATE POLICY "Users can view activities in their organization" ON agent_activities
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert activities" ON agent_activities
  FOR INSERT WITH CHECK (true);

-- Templates are public read
CREATE POLICY "Anyone can view agent templates" ON agent_templates
  FOR SELECT USING (true);

-- Triggers
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default agent templates
INSERT INTO agent_templates (name, description, agent_type, icon, category, default_config, default_instructions, capabilities) VALUES
  (
    'Document Intelligence Agent',
    'Automatically analyzes, tags, and summarizes uploaded documents',
    'document_analyzer',
    '📚',
    'Documents',
    '{"auto_tag": true, "auto_summarize": true, "extract_entities": true}'::jsonb,
    'Analyze all uploaded documents. Extract key information, generate concise summaries, and suggest relevant tags based on content.',
    ARRAY['document_analysis', 'tagging', 'summarization']
  ),
  (
    'Task Prioritization Agent',
    'Monitors your tasks and intelligently prioritizes them based on deadlines and importance',
    'task_manager',
    '✅',
    'Productivity',
    '{"auto_prioritize": true, "deadline_threshold_hours": 24, "notify_on_overdue": true}'::jsonb,
    'Monitor all tasks. Automatically adjust priorities based on deadlines, dependencies, and user behavior patterns. Send alerts for high-priority items.',
    ARRAY['task_management', 'prioritization', 'notifications']
  ),
  (
    'Meeting Preparation Agent',
    'Prepares you for upcoming meetings by gathering context and creating agendas',
    'meeting_assistant',
    '📅',
    'Calendar',
    '{"hours_before": 2, "create_agenda": true, "gather_context": true}'::jsonb,
    'Monitor calendar for upcoming meetings. 2 hours before each meeting, gather relevant documents, create agenda items, and prepare summary of previous meetings with same attendees.',
    ARRAY['calendar_monitoring', 'document_search', 'agenda_creation']
  ),
  (
    'Email Triage Agent',
    'Organizes your inbox by categorizing and prioritizing emails',
    'email_organizer',
    '📧',
    'Communication',
    '{"auto_categorize": true, "priority_keywords": ["urgent", "asap", "important"], "auto_archive_spam": false}'::jsonb,
    'Monitor incoming emails. Categorize by type (action required, FYI, newsletters). Flag urgent items. Suggest quick replies for common questions.',
    ARRAY['email_analysis', 'categorization', 'smart_replies']
  ),
  (
    'Research & Insights Agent',
    'Conducts research across your documents and provides insights',
    'research_assistant',
    '🔍',
    'Knowledge',
    '{"search_depth": "thorough", "cite_sources": true, "cross_reference": true}'::jsonb,
    'When asked questions, search through all documents and conversations. Provide comprehensive answers with citations. Identify patterns and connections across different sources.',
    ARRAY['document_search', 'knowledge_synthesis', 'citation']
  ),
  (
    'Workflow Optimizer Agent',
    'Analyzes your usage patterns and suggests workflow improvements',
    'workflow_optimizer',
    '⚡',
    'Productivity',
    '{"analysis_window_days": 7, "min_pattern_occurrences": 3, "suggestion_frequency": "weekly"}'::jsonb,
    'Observe user behavior patterns. Identify repetitive tasks that could be automated. Suggest new workflows and shortcuts based on actual usage data.',
    ARRAY['usage_analysis', 'pattern_detection', 'suggestions']
  ),
  (
    'Daily Digest Agent',
    'Prepares a personalized daily summary of your work',
    'daily_digest',
    '📰',
    'Productivity',
    '{"send_time": "09:00", "include_tasks": true, "include_calendar": true, "include_metrics": true}'::jsonb,
    'Every morning, compile a digest: upcoming tasks, calendar events, unread important emails, productivity metrics from yesterday, and suggested focus areas for today.',
    ARRAY['data_aggregation', 'email_sending', 'analytics']
  ),
  (
    'Sentiment Monitor Agent',
    'Monitors communication tone and alerts you to potential issues',
    'sentiment_monitor',
    '😊',
    'Communication',
    '{"monitor_emails": true, "monitor_messages": true, "alert_threshold": "negative"}'::jsonb,
    'Analyze sentiment in emails and messages. Alert when detecting frustration, urgency, or negative sentiment from important contacts. Suggest empathetic responses.',
    ARRAY['sentiment_analysis', 'alerts', 'response_suggestions']
  )
ON CONFLICT DO NOTHING;
