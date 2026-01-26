-- =====================================================
-- PROACTIVE NUDGES SYSTEM
-- Creates tables for commitment tracking and proactive nudging
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Table to store extracted commitments from conversations
CREATE TABLE IF NOT EXISTS commitment_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  commitments_found INTEGER DEFAULT 0,
  commitments_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_commitment_extractions_user
  ON commitment_extractions(user_id, created_at DESC);

-- 2. Table to store sent proactive nudges
CREATE TABLE IF NOT EXISTS proactive_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'whatsapp', 'in_app', 'email')),
  nudge_content TEXT NOT NULL,
  nudge_data JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  response_text TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for nudge queries
CREATE INDEX IF NOT EXISTS idx_proactive_nudges_user
  ON proactive_nudges(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_proactive_nudges_acknowledged
  ON proactive_nudges(user_id, acknowledged);

-- 3. Table to store cron execution logs
CREATE TABLE IF NOT EXISTS cron_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_name TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  users_processed INTEGER DEFAULT 0,
  nudges_sent INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('success', 'partial_success', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for cron logs
CREATE INDEX IF NOT EXISTS idx_cron_executions_name
  ON cron_executions(cron_name, executed_at DESC);

-- 4. Add notification_preferences and messaging fields to profiles if not exists
DO $$
BEGIN
  -- Add telegram_chat_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN telegram_chat_id TEXT;
  END IF;

  -- Add whatsapp_number if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_number TEXT;
  END IF;

  -- Add notification_preferences if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
      "proactive_nudges_enabled": true,
      "preferred_channel": "telegram",
      "nudge_frequency": "balanced",
      "quiet_hours_start": 22,
      "quiet_hours_end": 7,
      "auto_act_threshold": 0.9
    }'::jsonb;
  END IF;
END $$;

-- 5. Add source tracking to tasks table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'source'
  ) THEN
    ALTER TABLE tasks ADD COLUMN source TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'source_reference'
  ) THEN
    ALTER TABLE tasks ADD COLUMN source_reference TEXT;
  END IF;
END $$;

-- 6. RLS Policies for new tables
ALTER TABLE commitment_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_executions ENABLE ROW LEVEL SECURITY;

-- Commitment extractions: users can only see their own
CREATE POLICY "Users can view own commitment extractions"
  ON commitment_extractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage commitment extractions"
  ON commitment_extractions FOR ALL
  USING (auth.role() = 'service_role');

-- Proactive nudges: users can see their own, service role can manage
CREATE POLICY "Users can view own proactive nudges"
  ON proactive_nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own proactive nudges"
  ON proactive_nudges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage proactive nudges"
  ON proactive_nudges FOR ALL
  USING (auth.role() = 'service_role');

-- Cron executions: only service role
CREATE POLICY "Service role can manage cron executions"
  ON cron_executions FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Create a view for proactive nudge opportunities
CREATE OR REPLACE VIEW pending_nudge_opportunities AS
SELECT
  t.id as task_id,
  t.user_id,
  t.title,
  t.due_date,
  t.priority,
  t.source,
  t.metadata,
  CASE
    WHEN t.due_date < NOW() THEN 'overdue'
    WHEN t.due_date < NOW() + INTERVAL '1 day' THEN 'due_today'
    WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 'due_soon'
    ELSE 'upcoming'
  END as urgency,
  EXTRACT(DAY FROM NOW() - t.created_at) as days_since_created
FROM tasks t
WHERE t.status = 'pending'
  AND t.source = 'ai_extracted'
ORDER BY
  CASE
    WHEN t.due_date < NOW() THEN 1
    WHEN t.due_date < NOW() + INTERVAL '1 day' THEN 2
    ELSE 3
  END,
  t.priority DESC,
  t.due_date ASC;

-- 8. Function to get nudge-eligible users
CREATE OR REPLACE FUNCTION get_nudge_eligible_users()
RETURNS TABLE (
  user_id UUID,
  organization_id UUID,
  telegram_chat_id TEXT,
  whatsapp_number TEXT,
  preferred_channel TEXT,
  nudge_frequency TEXT,
  quiet_hours_start INT,
  quiet_hours_end INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.organization_id,
    p.telegram_chat_id,
    p.whatsapp_number,
    COALESCE(p.notification_preferences->>'preferred_channel', 'telegram') as preferred_channel,
    COALESCE(p.notification_preferences->>'nudge_frequency', 'balanced') as nudge_frequency,
    COALESCE((p.notification_preferences->>'quiet_hours_start')::int, 22) as quiet_hours_start,
    COALESCE((p.notification_preferences->>'quiet_hours_end')::int, 7) as quiet_hours_end
  FROM profiles p
  WHERE
    (p.telegram_chat_id IS NOT NULL OR p.whatsapp_number IS NOT NULL)
    AND COALESCE((p.notification_preferences->>'proactive_nudges_enabled')::boolean, true) = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nudge_eligible_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_nudge_eligible_users() TO service_role;

COMMENT ON TABLE commitment_extractions IS 'Stores commitments extracted from AI conversations for proactive nudging';
COMMENT ON TABLE proactive_nudges IS 'Tracks all proactive nudges sent to users via Telegram/WhatsApp/etc';
COMMENT ON TABLE cron_executions IS 'Logs all cron job executions for monitoring';
