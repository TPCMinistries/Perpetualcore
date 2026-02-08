-- Agent Identity System
-- Stores per-user AI agent persona configuration

CREATE TABLE IF NOT EXISTS agent_identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'Atlas',
  persona TEXT DEFAULT 'A helpful AI assistant',
  communication_style JSONB DEFAULT '{"tone": "professional", "verbosity": "moderate", "useEmoji": false, "language": "en", "personality": "Helpful, knowledgeable, and proactive"}',
  boundaries TEXT[] DEFAULT '{}',
  greeting TEXT DEFAULT 'Hello! How can I help you today?',
  signoff TEXT DEFAULT '',
  system_prompt_override TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_identities_user ON agent_identities(user_id);

ALTER TABLE agent_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own identity" ON agent_identities
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_agent_identity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_identity_updated
  BEFORE UPDATE ON agent_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_identity_timestamp();

-- Agent Activity Feed table for tracking agent events
CREATE TABLE IF NOT EXISTS agent_activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_activity_user ON agent_activity_feed(user_id);
CREATE INDEX idx_agent_activity_type ON agent_activity_feed(event_type);
CREATE INDEX idx_agent_activity_created ON agent_activity_feed(created_at DESC);

ALTER TABLE agent_activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity" ON agent_activity_feed
  FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activity_feed;
