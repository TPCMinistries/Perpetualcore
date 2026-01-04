-- =====================================================
-- DAILY BRIEFING BOT - REQUIRED TABLES
-- Creates tasks, meetings, promises, calendar_events
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dates
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,

  -- Source tracking
  source_type TEXT CHECK (source_type IN ('chat', 'email', 'calendar', 'meeting', 'manual', 'n8n')),
  source_id UUID,
  source_reference TEXT,

  -- AI extraction metadata
  ai_extracted BOOLEAN DEFAULT false,
  ai_confidence FLOAT,
  ai_context TEXT,

  -- Project/grouping
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  tags TEXT[] DEFAULT '{}',

  -- For executive command center
  blocked_since TIMESTAMPTZ,
  blocking_reason TEXT,
  workload_weight INTEGER DEFAULT 1,

  -- External integrations
  external_provider TEXT,
  external_id TEXT,
  external_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks in their organization" ON tasks;
CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
CREATE POLICY "Users can update their tasks"
  ON tasks FOR UPDATE
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can delete their tasks" ON tasks;
CREATE POLICY "Users can delete their tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 2. MEETINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meeting details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  meeting_url TEXT, -- Zoom/Meet/Teams link

  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  all_day BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

  -- Attendees (stored as JSON array)
  attendees JSONB DEFAULT '[]', -- [{email, name, status, is_organizer}]
  organizer_email TEXT,
  organizer_name TEXT,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  recurring_event_id TEXT,

  -- External sync
  external_provider TEXT CHECK (external_provider IN ('google', 'outlook', 'apple', 'manual')),
  external_id TEXT,
  external_calendar_id TEXT,
  external_url TEXT,
  last_synced_at TIMESTAMPTZ,

  -- Meeting outcomes
  notes TEXT,
  action_items JSONB DEFAULT '[]', -- [{title, assignee, due_date}]
  summary TEXT, -- AI-generated summary
  transcript TEXT,

  -- AI analysis
  ai_briefing TEXT, -- Pre-meeting briefing
  ai_follow_ups TEXT[], -- Suggested follow-ups

  -- Reminder
  reminder_minutes INTEGER[] DEFAULT '{15}', -- Minutes before to remind

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_external ON meetings(external_provider, external_id);
CREATE INDEX IF NOT EXISTS idx_meetings_today ON meetings(user_id, start_time)
  WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '1 day';

-- RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their meetings" ON meetings;
CREATE POLICY "Users can view their meetings"
  ON meetings FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their meetings" ON meetings;
CREATE POLICY "Users can update their meetings"
  ON meetings FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their meetings" ON meetings;
CREATE POLICY "Users can delete their meetings"
  ON meetings FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 3. PROMISES TABLE (Commitments tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Promise details
  title TEXT NOT NULL,
  description TEXT,
  context TEXT, -- What was the original conversation/context

  -- Who is involved
  made_by UUID REFERENCES auth.users(id), -- Who made the promise
  made_to TEXT, -- Name/email of recipient (could be external)
  made_to_user_id UUID REFERENCES auth.users(id), -- If internal user

  -- Source
  source_type TEXT CHECK (source_type IN ('email', 'meeting', 'chat', 'call', 'manual')),
  source_id UUID,
  source_reference TEXT,

  -- Timeline
  promised_date DATE, -- When it was promised to be done
  due_date DATE, -- Actual due date
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'broken', 'cancelled', 'extended')),

  -- Priority based on relationship importance
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- If extended
  original_due_date DATE,
  extension_reason TEXT,
  extended_at TIMESTAMPTZ,

  -- AI extraction
  ai_extracted BOOLEAN DEFAULT false,
  ai_confidence FLOAT,
  ai_reminder_sent BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,
  completion_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promises_user ON promises(user_id);
CREATE INDEX IF NOT EXISTS idx_promises_org ON promises(organization_id);
CREATE INDEX IF NOT EXISTS idx_promises_status ON promises(status);
CREATE INDEX IF NOT EXISTS idx_promises_due ON promises(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_promises_made_by ON promises(made_by);
CREATE INDEX IF NOT EXISTS idx_promises_overdue ON promises(due_date, status)
  WHERE due_date < CURRENT_DATE AND status IN ('pending', 'in_progress');

-- RLS
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their promises" ON promises;
CREATE POLICY "Users can view their promises"
  ON promises FOR SELECT
  USING (
    user_id = auth.uid()
    OR made_by = auth.uid()
    OR made_to_user_id = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can create promises" ON promises;
CREATE POLICY "Users can create promises"
  ON promises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their promises" ON promises;
CREATE POLICY "Users can update their promises"
  ON promises FOR UPDATE
  USING (user_id = auth.uid() OR made_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their promises" ON promises;
CREATE POLICY "Users can delete their promises"
  ON promises FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 4. CALENDAR_EVENTS TABLE (Synced from Google/Outlook)
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  all_day BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  busy_status TEXT DEFAULT 'busy' CHECK (busy_status IN ('free', 'busy', 'tentative', 'out_of_office')),

  -- Attendees
  attendees JSONB DEFAULT '[]',
  organizer_email TEXT,
  is_organizer BOOLEAN DEFAULT false,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  recurring_event_id TEXT,

  -- External sync
  external_provider TEXT NOT NULL CHECK (external_provider IN ('google', 'outlook', 'apple', 'ical')),
  external_id TEXT NOT NULL,
  external_calendar_id TEXT,
  external_url TEXT,
  etag TEXT, -- For sync conflict detection
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Meeting links
  conference_url TEXT,
  conference_type TEXT, -- 'zoom', 'meet', 'teams', etc.

  -- Visibility
  visibility TEXT DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private', 'confidential')),

  -- Reminders (in minutes before)
  reminders INTEGER[] DEFAULT '{15, 60}',

  -- Color/category
  color_id TEXT,
  category TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, external_provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external ON calendar_events(external_provider, external_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_today ON calendar_events(user_id, start_time)
  WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '1 day';
CREATE INDEX IF NOT EXISTS idx_calendar_events_upcoming ON calendar_events(user_id, start_time)
  WHERE start_time >= NOW() AND start_time < NOW() + INTERVAL '7 days';

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their calendar events" ON calendar_events;
CREATE POLICY "Users can view their calendar events"
  ON calendar_events FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
CREATE POLICY "Users can create calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their calendar events" ON calendar_events;
CREATE POLICY "Users can update their calendar events"
  ON calendar_events FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their calendar events" ON calendar_events;
CREATE POLICY "Users can delete their calendar events"
  ON calendar_events FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 5. HELPER FUNCTIONS FOR DAILY BRIEFING
-- =====================================================

-- Get today's summary for daily briefing
CREATE OR REPLACE FUNCTION get_daily_briefing_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tasks', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'due_date', t.due_date,
        'priority', t.priority,
        'status', t.status
      ) ORDER BY
        CASE t.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        t.due_date
      ), '[]')
      FROM tasks t
      WHERE t.user_id = p_user_id
      AND t.status IN ('todo', 'in_progress')
      AND (t.due_date IS NULL OR t.due_date <= CURRENT_DATE + INTERVAL '7 days')
      LIMIT 10
    ),
    'meetings', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'title', m.title,
        'start_time', m.start_time,
        'end_time', m.end_time,
        'location', m.location,
        'meeting_url', m.meeting_url
      ) ORDER BY m.start_time), '[]')
      FROM meetings m
      WHERE m.user_id = p_user_id
      AND m.start_time >= CURRENT_DATE
      AND m.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND m.status = 'scheduled'
    ),
    'calendar_events', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ce.id,
        'title', ce.title,
        'start_time', ce.start_time,
        'end_time', ce.end_time,
        'location', ce.location,
        'conference_url', ce.conference_url
      ) ORDER BY ce.start_time), '[]')
      FROM calendar_events ce
      WHERE ce.user_id = p_user_id
      AND ce.start_time >= CURRENT_DATE
      AND ce.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND ce.status = 'confirmed'
    ),
    'promises', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'due_date', p.due_date,
        'made_to', p.made_to,
        'status', p.status,
        'is_overdue', p.due_date < CURRENT_DATE
      ) ORDER BY p.due_date), '[]')
      FROM promises p
      WHERE p.user_id = p_user_id
      AND p.status IN ('pending', 'in_progress')
      AND (p.due_date IS NULL OR p.due_date <= CURRENT_DATE + INTERVAL '7 days')
      LIMIT 10
    ),
    'decisions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'due_date', d.due_date,
        'priority', d.priority,
        'status', d.status
      ) ORDER BY
        CASE d.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          ELSE 3
        END,
        d.due_date
      ), '[]')
      FROM decisions d
      WHERE d.user_id = p_user_id
      AND d.status = 'pending'
      LIMIT 5
    ),
    'overdue_count', (
      SELECT jsonb_build_object(
        'tasks', (SELECT COUNT(*) FROM tasks WHERE user_id = p_user_id AND status IN ('todo', 'in_progress') AND due_date < CURRENT_DATE),
        'promises', (SELECT COUNT(*) FROM promises WHERE user_id = p_user_id AND status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE)
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Ensure the function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promises_updated_at ON promises;
CREATE TRIGGER update_promises_updated_at
  BEFORE UPDATE ON promises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! Daily Briefing tables are ready
-- Your n8n bots can now query:
-- - tasks (for task counts and overdue items)
-- - meetings (for today's meetings)
-- - promises (for commitment tracking)
-- - calendar_events (synced from Google Calendar)
-- - decisions (already exists from executive_command_center)
--
-- Use get_daily_briefing_data(user_id) for a complete summary
-- =====================================================
