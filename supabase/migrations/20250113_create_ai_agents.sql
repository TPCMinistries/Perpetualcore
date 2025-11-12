-- Create ai_agents table for proactive monitoring assistants
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL CHECK (agent_type IN (
    'email_monitor',
    'calendar_monitor',
    'document_analyzer',
    'task_manager',
    'meeting_assistant',
    'email_organizer',
    'research_assistant',
    'workflow_optimizer',
    'daily_digest',
    'sentiment_monitor'
  )),
  config JSONB DEFAULT '{}'::jsonb,
  personality TEXT DEFAULT 'professional' CHECK (personality IN (
    'professional',
    'friendly',
    'casual',
    'formal',
    'enthusiastic'
  )),
  instructions TEXT,
  enabled BOOLEAN DEFAULT true,
  total_actions INTEGER DEFAULT 0,
  successful_actions INTEGER DEFAULT 0,
  failed_actions INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_agents_org ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_enabled ON ai_agents(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON ai_agents(agent_type);

-- RLS policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agents in their organization"
  ON ai_agents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create agents in their organization"
  ON ai_agents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update agents in their organization"
  ON ai_agents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agents in their organization"
  ON ai_agents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create agent_actions table to track what agents do
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_task',
    'send_email',
    'create_reminder',
    'update_document',
    'schedule_meeting',
    'analyze_sentiment',
    'send_notification'
  )),
  action_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_agent ON agent_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_task ON agent_actions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created ON agent_actions(created_at DESC);

-- RLS for agent_actions
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent actions for their agents"
  ON agent_actions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM ai_agents 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to increment agent action counters
CREATE OR REPLACE FUNCTION increment_agent_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE ai_agents 
    SET 
      total_actions = total_actions + 1,
      successful_actions = successful_actions + 1,
      last_active_at = NOW()
    WHERE id = NEW.agent_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE ai_agents 
    SET 
      total_actions = total_actions + 1,
      failed_actions = failed_actions + 1,
      last_active_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment counters when action is recorded
CREATE TRIGGER update_agent_action_counters
  AFTER INSERT ON agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION increment_agent_counters();

-- Insert default "Email Monitor" agent template
COMMENT ON TABLE ai_agents IS 'AI agents that proactively monitor work and automatically create tasks';
COMMENT ON TABLE agent_actions IS 'Actions performed by AI agents, with links to created tasks';
