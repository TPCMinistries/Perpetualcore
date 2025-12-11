-- OAuth States table for CSRF protection during OAuth flows
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  service TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);

-- Auto-cleanup expired states (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add columns to user_integrations if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_integrations' AND column_name = 'access_token') THEN
    ALTER TABLE user_integrations ADD COLUMN access_token TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_integrations' AND column_name = 'refresh_token') THEN
    ALTER TABLE user_integrations ADD COLUMN refresh_token TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_integrations' AND column_name = 'token_expires_at') THEN
    ALTER TABLE user_integrations ADD COLUMN token_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own oauth states" ON oauth_states
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth states" ON oauth_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth states" ON oauth_states
  FOR DELETE USING (auth.uid() = user_id);
