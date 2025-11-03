-- =====================================================
-- SMART NOTIFICATIONS SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Tables: notifications, notification_preferences, notification_digests
-- =====================================================

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'task_due',
  'task_assigned',
  'email_important',
  'email_mention',
  'calendar_event',
  'calendar_reminder',
  'document_shared',
  'document_comment',
  'whatsapp_message',
  'system_alert',
  'ai_insight',
  'usage_limit'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Notification status enum
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived', 'snoozed');

-- =====================================================
-- 1. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification details
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  status notification_status DEFAULT 'unread',

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Link to relevant page
  action_label TEXT, -- Button text (e.g., "View Task", "Read Email")

  -- AI scoring
  ai_priority_score DECIMAL(3, 2), -- 0.00 to 1.00
  ai_urgency_reason TEXT, -- Why AI thinks this is important

  -- Related entities
  related_entity_type TEXT, -- 'task', 'email', 'calendar_event', etc.
  related_entity_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Delivery
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel preferences
  enable_in_app BOOLEAN DEFAULT true,
  enable_email BOOLEAN DEFAULT true,
  enable_push BOOLEAN DEFAULT false,

  -- Type preferences (which notification types to receive)
  enable_task_due BOOLEAN DEFAULT true,
  enable_task_assigned BOOLEAN DEFAULT true,
  enable_email_important BOOLEAN DEFAULT true,
  enable_email_mention BOOLEAN DEFAULT true,
  enable_calendar_event BOOLEAN DEFAULT true,
  enable_calendar_reminder BOOLEAN DEFAULT true,
  enable_document_shared BOOLEAN DEFAULT true,
  enable_document_comment BOOLEAN DEFAULT true,
  enable_whatsapp_message BOOLEAN DEFAULT true,
  enable_system_alert BOOLEAN DEFAULT true,
  enable_ai_insight BOOLEAN DEFAULT true,
  enable_usage_limit BOOLEAN DEFAULT true,

  -- Smart features
  enable_ai_prioritization BOOLEAN DEFAULT true,
  enable_smart_digest BOOLEAN DEFAULT true,
  digest_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME, -- e.g., '08:00'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT notification_preferences_user_unique UNIQUE (user_id)
);

-- =====================================================
-- 3. NOTIFICATION DIGESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Digest details
  digest_type TEXT NOT NULL, -- 'daily', 'weekly'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Content
  notification_count INTEGER DEFAULT 0,
  high_priority_count INTEGER DEFAULT 0,
  summary TEXT, -- AI-generated summary

  -- Delivery
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_snoozed ON notifications(snoozed_until) WHERE snoozed_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_digests_user ON notification_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_digests_sent ON notification_digests(sent_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Preferences policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Digests policies
CREATE POLICY "Users can view own digests"
  ON notification_digests FOR SELECT
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create preferences on user creation
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(usr_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = usr_id
      AND status = 'unread'
      AND (snoozed_until IS NULL OR snoozed_until < NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notif_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET status = 'read',
      read_at = NOW()
  WHERE id = notif_id
    AND user_id = usr_id
    AND status = 'unread';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(usr_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET status = 'read',
      read_at = NOW()
  WHERE user_id = usr_id
    AND status = 'unread';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Snooze notification
CREATE OR REPLACE FUNCTION snooze_notification(
  notif_id UUID,
  usr_id UUID,
  snooze_duration INTERVAL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET status = 'snoozed',
      snoozed_until = NOW() + snooze_duration
  WHERE id = notif_id
    AND user_id = usr_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Un-snooze notifications that are due
CREATE OR REPLACE FUNCTION unsnooze_due_notifications()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET status = 'unread',
      snoozed_until = NULL
  WHERE status = 'snoozed'
    AND snoozed_until < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Archive old read notifications (cleanup)
CREATE OR REPLACE FUNCTION archive_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE notifications
  SET status = 'archived',
      archived_at = NOW()
  WHERE status = 'read'
    AND read_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE notifications IS 'Smart notifications with AI prioritization';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';
COMMENT ON TABLE notification_digests IS 'Daily/weekly notification digests';
COMMENT ON COLUMN notifications.ai_priority_score IS 'AI-calculated priority score (0.00 to 1.00)';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
COMMENT ON FUNCTION unsnooze_due_notifications IS 'Automatically un-snooze notifications that are due';
