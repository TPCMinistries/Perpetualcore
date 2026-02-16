-- Voice Calls Table
-- Tracks all inbound and outbound voice calls made via Twilio.

CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  call_sid TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled'
  )),
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  ai_script JSONB DEFAULT '{}',
  cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user call history (newest first)
CREATE INDEX IF NOT EXISTS idx_voice_calls_user ON voice_calls(user_id, created_at DESC);

-- Index for looking up calls by Twilio SID (webhook updates)
CREATE INDEX IF NOT EXISTS idx_voice_calls_sid ON voice_calls(call_sid) WHERE call_sid IS NOT NULL;

-- Row Level Security
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calls
CREATE POLICY "users_own_calls" ON voice_calls
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all calls (for webhooks and admin)
CREATE POLICY "service_role_calls" ON voice_calls
  FOR ALL USING (auth.role() = 'service_role');
