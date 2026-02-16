-- Agent Inbox: Persistent queue for agent work items
-- Phase 2 of OpenClaw Competitive Upgrade

-- Agent inbox table - any system can queue work for the agent
CREATE TABLE IF NOT EXISTS agent_inbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'channel', 'cron', 'webhook', 'schedule', 'trigger', 'user', 'system'
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for the processor: find pending items ready to process
CREATE INDEX idx_agent_inbox_pending
  ON agent_inbox(status, scheduled_for)
  WHERE status = 'pending';

-- Index for user's inbox view
CREATE INDEX idx_agent_inbox_user
  ON agent_inbox(user_id, created_at DESC);

-- RLS
ALTER TABLE agent_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_inbox" ON agent_inbox
  FOR ALL USING (auth.uid() = user_id);

-- Service role bypass for cron/background processing
CREATE POLICY "service_role_full_access" ON agent_inbox
  FOR ALL USING (auth.role() = 'service_role');

-- Proactive behaviors table - user-configurable recurring agent actions
CREATE TABLE IF NOT EXISTS proactive_behaviors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  behavior_type TEXT NOT NULL CHECK (behavior_type IN (
    'morning_briefing', 'email_summary', 'follow_up_reminder',
    'custom_check', 'daily_digest', 'weekly_report'
  )),
  schedule TEXT NOT NULL, -- Cron expression
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proactive_behaviors_user
  ON proactive_behaviors(user_id, is_active);

CREATE INDEX idx_proactive_behaviors_next_run
  ON proactive_behaviors(next_run_at)
  WHERE is_active = TRUE;

ALTER TABLE proactive_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_behaviors" ON proactive_behaviors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_behaviors" ON proactive_behaviors
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE agent_inbox IS 'Persistent queue for agent work items - any system can queue work for the agent to process';
COMMENT ON TABLE proactive_behaviors IS 'User-configurable recurring agent behaviors (briefings, summaries, reminders)';
