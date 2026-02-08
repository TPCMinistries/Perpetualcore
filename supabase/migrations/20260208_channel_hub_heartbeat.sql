-- ============================================================================
-- Channel Hub + Heartbeat Agent Migration
-- Created: 2026-02-08
--
-- Creates tables for:
-- 1. channel_messages - Unified log of all channel messages (inbound + outbound)
-- 2. heartbeat_runs - Records of autonomous heartbeat agent runs
-- 3. agent_activity_feed - Unified activity feed across all agent actions
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Channel Messages (unified log)
-- Stores all messages across all channels in a normalized format.
-- Used for analytics, debugging, and conversation continuity.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS channel_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  conversation_id UUID,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('telegram', 'slack', 'whatsapp', 'discord', 'email', 'web')),
  channel_user_id TEXT,
  channel_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Heartbeat Runs
-- Records each autonomous heartbeat check: what was checked, results,
-- AI-generated insights, and notification status.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS heartbeat_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  checks_run JSONB DEFAULT '[]',
  check_results JSONB DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_channel TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- 3. Agent Activity Feed
-- Unified feed of all agent actions across channels, tools, and agents.
-- Powers the activity timeline in the dashboard.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes for efficient querying
-- ---------------------------------------------------------------------------

-- Channel messages: look up by user (sorted by time), by channel+user, by conversation
CREATE INDEX IF NOT EXISTS idx_channel_messages_user ON channel_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channel_type, channel_user_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_conversation ON channel_messages(conversation_id);

-- Heartbeat runs: look up by user (sorted by time)
CREATE INDEX IF NOT EXISTS idx_heartbeat_runs_user ON heartbeat_runs(user_id, started_at DESC);

-- Activity feed: look up by user (sorted by time), by user+event_type (filtered queries)
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON agent_activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON agent_activity_feed(user_id, event_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_feed ENABLE ROW LEVEL SECURITY;

-- Channel Messages: Users can view their own messages
-- (Server-side inserts use service role key which bypasses RLS)
CREATE POLICY "Users can view own channel messages" ON channel_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Heartbeat Runs: Users can view their own runs
-- (Server-side management uses service role key which bypasses RLS)
CREATE POLICY "Users can view own heartbeat runs" ON heartbeat_runs
  FOR SELECT USING (auth.uid() = user_id);

-- Activity Feed: Users can view their own activity
-- (Server-side inserts use service role key which bypasses RLS)
CREATE POLICY "Users can view own activity" ON agent_activity_feed
  FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for activity feed (powers live dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activity_feed;
