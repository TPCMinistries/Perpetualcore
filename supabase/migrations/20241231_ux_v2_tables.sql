-- UX V2 Database Schema Additions
-- Migration for the new UX overhaul features

-- ============================================
-- Workspace configurations
-- ============================================
CREATE TABLE IF NOT EXISTS user_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user workspace lookups
CREATE INDEX IF NOT EXISTS idx_user_workspaces_user_id ON user_workspaces(user_id);

-- RLS policies for user_workspaces
ALTER TABLE user_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workspaces"
  ON user_workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workspaces"
  ON user_workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces"
  ON user_workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces"
  ON user_workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AI assistant conversation memory
-- ============================================
CREATE TABLE IF NOT EXISTS ai_assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_type TEXT,
  context_id TEXT,
  messages JSONB[] DEFAULT ARRAY[]::JSONB[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user conversations
CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_user_id ON ai_assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_context ON ai_assistant_conversations(user_id, context_type, context_id);

-- RLS policies
ALTER TABLE ai_assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON ai_assistant_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON ai_assistant_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON ai_assistant_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON ai_assistant_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Unified attention items cache
-- ============================================
CREATE TABLE IF NOT EXISTS attention_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  preview TEXT,
  ai_priority_score FLOAT DEFAULT 0.5,
  is_resolved BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  due_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for attention items
CREATE INDEX IF NOT EXISTS idx_attention_items_user_id ON attention_items(user_id);
CREATE INDEX IF NOT EXISTS idx_attention_items_user_unresolved ON attention_items(user_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_attention_items_source ON attention_items(user_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_attention_items_priority ON attention_items(user_id, ai_priority_score DESC);

-- RLS policies
ALTER TABLE attention_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attention items"
  ON attention_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attention items"
  ON attention_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attention items"
  ON attention_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attention items"
  ON attention_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Daily briefing cache
-- ============================================
CREATE TABLE IF NOT EXISTS briefing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  briefing_date DATE NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, briefing_date)
);

-- Index for briefing cache
CREATE INDEX IF NOT EXISTS idx_briefing_cache_user_date ON briefing_cache(user_id, briefing_date);

-- RLS policies
ALTER TABLE briefing_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own briefing cache"
  ON briefing_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefing cache"
  ON briefing_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefing cache"
  ON briefing_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefing cache"
  ON briefing_cache FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AI Insights table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pattern', 'suggestion', 'warning')),
  title TEXT NOT NULL,
  description TEXT,
  action_url TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index for AI insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_active ON ai_insights(user_id, dismissed) WHERE dismissed = FALSE;

-- RLS policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Mentions table (for @mentions across the platform)
-- ============================================
CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentioned_by TEXT NOT NULL,
  mentioned_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for mentions
CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user_unread ON mentions(user_id, is_read) WHERE is_read = FALSE;

-- RLS policies
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mentions"
  ON mentions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentions"
  ON mentions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Automation executions tracking
-- ============================================
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID NOT NULL,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('bot', 'workflow', 'n8n', 'job')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  summary TEXT,
  error_message TEXT,
  input_data JSONB,
  output_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for automation executions
CREATE INDEX IF NOT EXISTS idx_automation_executions_user_id ON automation_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_automation ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_recent ON automation_executions(user_id, created_at DESC);

-- RLS policies
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executions"
  ON automation_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own executions"
  ON automation_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions"
  ON automation_executions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Automation triggers
-- ============================================
CREATE TABLE IF NOT EXISTS automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'schedule', 'event', 'email', 'api')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for automation triggers
CREATE INDEX IF NOT EXISTS idx_automation_triggers_user_id ON automation_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_automation ON automation_triggers(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_active ON automation_triggers(user_id, is_active) WHERE is_active = TRUE;

-- RLS policies
ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own triggers"
  ON automation_triggers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own triggers"
  ON automation_triggers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own triggers"
  ON automation_triggers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own triggers"
  ON automation_triggers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Add last_login_at to profiles if not exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- Updated at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_user_workspaces_updated_at ON user_workspaces;
CREATE TRIGGER update_user_workspaces_updated_at
  BEFORE UPDATE ON user_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_assistant_conversations_updated_at ON ai_assistant_conversations;
CREATE TRIGGER update_ai_assistant_conversations_updated_at
  BEFORE UPDATE ON ai_assistant_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attention_items_updated_at ON attention_items;
CREATE TRIGGER update_attention_items_updated_at
  BEFORE UPDATE ON attention_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_triggers_updated_at ON automation_triggers;
CREATE TRIGGER update_automation_triggers_updated_at
  BEFORE UPDATE ON automation_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
