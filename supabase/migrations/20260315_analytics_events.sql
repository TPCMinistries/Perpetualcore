-- Phase 3: Conversion Analytics — Analytics Events Table
-- Extends the existing conversion_events system with full-funnel tracking

-- 1. Create analytics_events table for high-volume funnel events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view',
    'cta_click',
    'signup',
    'onboarding_complete',
    'first_chat',
    'first_document',
    'explore_agents',
    'trial_started',
    'trial_converted',
    'upgrade',
    'downgrade',
    'churn'
  )),
  event_name TEXT, -- Specific event label (e.g. 'hero_start_free', 'pricing_pro_cta')

  -- User identity
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  anonymous_id TEXT, -- Cookie-based ID for pre-signup visitors
  session_id TEXT,

  -- Attribution (persisted from UTM cookies)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,

  -- Event context
  page_url TEXT,
  page_path TEXT,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Technical
  user_agent TEXT,
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_anon ON analytics_events(anonymous_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_utm ON analytics_events(utm_source, utm_medium, utm_campaign);
-- Composite for funnel queries
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at DESC);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Admins can read all events
CREATE POLICY "Admins can view analytics events"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND (is_super_admin = true OR is_admin = true)
    )
  );

-- Service role inserts (from API routes using createAdminClient)
CREATE POLICY "Service role can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- 2. Funnel summary materialized view for fast dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_daily_summary AS
SELECT
  date_trunc('day', created_at)::date AS day,
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) AS unique_users,
  utm_source,
  utm_medium,
  utm_campaign
FROM analytics_events
GROUP BY day, event_type, utm_source, utm_medium, utm_campaign;

CREATE UNIQUE INDEX idx_funnel_daily_unique
  ON funnel_daily_summary(day, event_type, COALESCE(utm_source, ''), COALESCE(utm_medium, ''), COALESCE(utm_campaign, ''));

-- 3. Function to refresh the materialized view (called by cron)
CREATE OR REPLACE FUNCTION refresh_funnel_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_daily_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to track analytics event (server-side)
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_event_type TEXT,
  p_event_name TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_term TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_page_path TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO analytics_events (
    event_type, event_name, user_id, anonymous_id, session_id,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    referrer, page_url, page_path, metadata, user_agent, ip_address
  ) VALUES (
    p_event_type, p_event_name, p_user_id, p_anonymous_id, p_session_id,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content,
    p_referrer, p_page_url, p_page_path, p_metadata, p_user_agent,
    CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::inet ELSE NULL END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_analytics_event TO authenticated;
GRANT EXECUTE ON FUNCTION track_analytics_event TO anon;

-- 5. Link anonymous sessions to user on signup
CREATE OR REPLACE FUNCTION link_anonymous_to_user(
  p_anonymous_id TEXT,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE analytics_events
  SET user_id = p_user_id
  WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION link_anonymous_to_user TO authenticated;

COMMENT ON TABLE analytics_events IS 'Full-funnel analytics events for conversion tracking';
COMMENT ON MATERIALIZED VIEW funnel_daily_summary IS 'Daily aggregation of funnel events for dashboard performance';
