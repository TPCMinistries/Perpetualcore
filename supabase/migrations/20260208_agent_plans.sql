-- Agent Plans table for autonomous multi-step plan execution
-- Stores decomposed goals, steps, results, and approval state

CREATE TABLE IF NOT EXISTS agent_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  status TEXT DEFAULT 'planning'
    CHECK (status IN ('planning', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  steps JSONB DEFAULT '[]',
  step_results JSONB DEFAULT '{}',
  current_step_index INTEGER DEFAULT 0,
  planning_model TEXT DEFAULT 'claude-sonnet',
  execution_model TEXT DEFAULT 'gpt-4o-mini',
  total_cost NUMERIC(10,6) DEFAULT 0,
  context JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_plans_user ON agent_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_plans_status ON agent_plans(user_id, status);

-- Row Level Security
ALTER TABLE agent_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON agent_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON agent_plans
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role needs full access for background execution
CREATE POLICY "Service role full access" ON agent_plans
  FOR ALL USING (auth.role() = 'service_role');
