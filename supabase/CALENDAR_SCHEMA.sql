-- =====================================================
-- CALENDAR & EVENTS SCHEMA
-- For Google Calendar, Outlook sync and meeting intelligence
-- =====================================================

-- Calendar accounts table (stores OAuth tokens)
CREATE TABLE IF NOT EXISTS calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple'
  provider_account_id TEXT NOT NULL, -- email or account ID from provider
  access_token TEXT, -- Encrypted in production
  refresh_token TEXT, -- Encrypted in production
  token_expires_at TIMESTAMPTZ,
  calendar_list JSONB, -- List of calendars from this account
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, provider_account_id)
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details from provider
  provider_event_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple'
  calendar_id TEXT NOT NULL, -- Which calendar this event belongs to

  -- Event information
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT,

  -- Participants
  organizer_email TEXT,
  organizer_name TEXT,
  attendees JSONB, -- Array of {email, name, response_status}

  -- Meeting links
  meeting_url TEXT, -- Zoom, Meet, Teams link
  conference_data JSONB, -- Full conference details

  -- Status
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'tentative'
  response_status TEXT, -- user's response: 'accepted', 'declined', 'tentative', 'needsAction'

  -- AI-enhanced fields
  ai_summary TEXT, -- AI-generated summary
  ai_briefing TEXT, -- Pre-meeting briefing
  ai_action_items JSONB, -- Extracted action items post-meeting
  meeting_transcript TEXT, -- If recorded
  meeting_recording_url TEXT,

  -- Metadata
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  raw_data JSONB, -- Full event data from provider

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(calendar_account_id, provider_event_id)
);

-- Meeting transcripts table (for detailed transcription storage)
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transcript details
  full_transcript TEXT,
  speaker_segments JSONB, -- Array of {speaker, text, timestamp}
  summary TEXT,
  action_items JSONB,
  key_points JSONB,

  -- Recording info
  recording_url TEXT,
  recording_duration_seconds INT,

  -- Processing status
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user ON calendar_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_org ON calendar_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_account ON calendar_events(calendar_account_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_event ON meeting_transcripts(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_org ON meeting_transcripts(organization_id);

-- RLS Policies
ALTER TABLE calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Calendar accounts policies
CREATE POLICY "Users can view their own calendar accounts"
  ON calendar_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar accounts"
  ON calendar_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar accounts"
  ON calendar_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar accounts"
  ON calendar_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view events in their organization"
  ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = calendar_events.organization_id
    )
  );

CREATE POLICY "Users can create events in their organization"
  ON calendar_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = calendar_events.organization_id
    )
  );

CREATE POLICY "Users can update their own events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Meeting transcripts policies
CREATE POLICY "Users can view transcripts in their organization"
  ON meeting_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = meeting_transcripts.organization_id
    )
  );

CREATE POLICY "Users can create transcripts in their organization"
  ON meeting_transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = meeting_transcripts.organization_id
    )
  );

-- =====================================================
-- DONE! Calendar schema is ready
-- Now run this SQL in Supabase SQL Editor
-- =====================================================
