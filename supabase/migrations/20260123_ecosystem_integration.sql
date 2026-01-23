-- =====================================================
-- ECOSYSTEM INTEGRATION TABLES
-- Cross-app event tracking, people sync, and metrics
-- =====================================================

-- =====================================================
-- PART 1: APP CONNECTIONS REGISTRY
-- =====================================================

CREATE TABLE IF NOT EXISTS app_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- App Identity
  app_slug TEXT NOT NULL UNIQUE, -- 'uplift-ops', 'tpc-ministries', etc.
  app_name TEXT NOT NULL,
  app_description TEXT,
  app_url TEXT, -- Base URL of the app
  
  -- Security
  api_key_hash TEXT, -- Hashed API key for authentication
  api_key_prefix TEXT, -- First few chars for identification
  
  -- Configuration
  events_enabled BOOLEAN DEFAULT true,
  people_sync_enabled BOOLEAN DEFAULT true,
  transaction_tracking_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  owner_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_event_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert known apps
INSERT INTO app_connections (app_slug, app_name, app_description, app_url) VALUES
  ('perpetual-core', 'Perpetual Core', 'AI Operating System - Central Hub', 'https://perpetualcore.com'),
  ('uplift-ops', 'Uplift Ops', 'Internal operations management', 'https://uplift-ops.vercel.app'),
  ('uplift-workforce', 'Uplift Medical Workforce', 'DYCD workforce development platform', 'https://uplift-workforce.vercel.app'),
  ('tpc-ministries', 'TPC Ministries', 'Church management platform', 'https://tpc-ministries.vercel.app'),
  ('lorenzodc-site', 'Lorenzo DC Website', 'Personal website and content', 'https://lorenzodc.com'),
  ('streams-of-grace', 'Streams of Grace', 'Daily devotional platform', 'https://streamsofgrace.app'),
  ('ai-media-empire', 'AI Media Empire', 'AI content creation platform', 'https://ai-media-empire.vercel.app'),
  ('boardroom-prayer', 'Boardroom Prayer Room', 'Faith + business platform', 'https://boardroomprayer.com'),
  ('ai-hedge-fund', 'AI Hedge Fund', 'Quantitative trading platform', NULL)
ON CONFLICT (app_slug) DO NOTHING;

-- =====================================================
-- PART 2: EXTERNAL APP EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS external_app_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source App
  app_slug TEXT NOT NULL REFERENCES app_connections(app_slug) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'user.created', 'checkin.completed', 'transaction.created', etc.
  entity_type TEXT, -- 'user', 'task', 'transaction', etc.
  entity_id TEXT, -- ID from the source app
  
  -- Actor (who did it)
  actor_email TEXT, -- Email of the user who triggered the event
  actor_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Linked contact if known
  
  -- Event Data
  payload JSONB DEFAULT '{}',
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_result JSONB,
  
  -- Timestamp
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_events_app ON external_app_events(app_slug);
CREATE INDEX IF NOT EXISTS idx_external_events_type ON external_app_events(event_type);
CREATE INDEX IF NOT EXISTS idx_external_events_actor ON external_app_events(actor_email);
CREATE INDEX IF NOT EXISTS idx_external_events_timestamp ON external_app_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_external_events_processed ON external_app_events(processed) WHERE processed = false;

-- =====================================================
-- PART 3: PEOPLE/CONTACT CROSSWALK
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_app_crosswalk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Contact (in Perpetual Core)
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- External App Reference
  app_slug TEXT NOT NULL REFERENCES app_connections(app_slug) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL, -- User ID in the external app
  
  -- Sync Metadata
  external_email TEXT,
  external_data JSONB DEFAULT '{}', -- Cached data from external app
  
  -- Sync Status
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_direction TEXT DEFAULT 'bidirectional', -- 'inbound', 'outbound', 'bidirectional'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contact_id, app_slug),
  UNIQUE(app_slug, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_crosswalk_contact ON contact_app_crosswalk(contact_id);
CREATE INDEX IF NOT EXISTS idx_crosswalk_app ON contact_app_crosswalk(app_slug);
CREATE INDEX IF NOT EXISTS idx_crosswalk_email ON contact_app_crosswalk(external_email);

-- =====================================================
-- PART 4: ECOSYSTEM FINANCIAL TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS ecosystem_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  app_slug TEXT NOT NULL REFERENCES app_connections(app_slug) ON DELETE CASCADE,
  external_transaction_id TEXT, -- ID from source app
  
  -- Transaction Details
  transaction_type TEXT NOT NULL, -- 'revenue', 'donation', 'expense', 'transfer', 'grant'
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Categorization
  category TEXT, -- 'subscription', 'consulting', 'product', 'program_fee', etc.
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL, -- Which entity this belongs to
  
  -- Related Contact
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_email TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timing
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eco_transactions_app ON ecosystem_transactions(app_slug);
CREATE INDEX IF NOT EXISTS idx_eco_transactions_type ON ecosystem_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_eco_transactions_date ON ecosystem_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_eco_transactions_entity ON ecosystem_transactions(entity_id);

-- =====================================================
-- PART 5: DAILY ECOSYSTEM METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_ecosystem_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  metric_date DATE NOT NULL,
  app_slug TEXT NOT NULL REFERENCES app_connections(app_slug) ON DELETE CASCADE,
  
  -- Event Counts
  total_events INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  
  -- Specific Event Counts (JSONB for flexibility)
  event_counts JSONB DEFAULT '{}', -- {"user.created": 5, "task.completed": 23, ...}
  
  -- Financial Metrics
  revenue DECIMAL(12,2) DEFAULT 0,
  donations DECIMAL(12,2) DEFAULT 0,
  expenses DECIMAL(12,2) DEFAULT 0,
  
  -- Engagement Metrics
  active_sessions INT DEFAULT 0,
  avg_session_duration INT DEFAULT 0, -- seconds
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(metric_date, app_slug)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_ecosystem_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_app ON daily_ecosystem_metrics(app_slug);

-- =====================================================
-- PART 6: ECOSYSTEM OVERVIEW VIEW
-- =====================================================

CREATE OR REPLACE VIEW ecosystem_overview AS
SELECT 
  ac.app_slug,
  ac.app_name,
  ac.app_url,
  ac.is_active,
  ac.last_event_at,
  (
    SELECT COUNT(*) 
    FROM external_app_events e 
    WHERE e.app_slug = ac.app_slug 
      AND e.event_timestamp > NOW() - INTERVAL '24 hours'
  ) as events_last_24h,
  (
    SELECT COUNT(DISTINCT actor_email) 
    FROM external_app_events e 
    WHERE e.app_slug = ac.app_slug 
      AND e.event_timestamp > NOW() - INTERVAL '24 hours'
  ) as active_users_24h,
  (
    SELECT COUNT(*) 
    FROM contact_app_crosswalk cw 
    WHERE cw.app_slug = ac.app_slug
  ) as synced_contacts,
  (
    SELECT COALESCE(SUM(amount), 0) 
    FROM ecosystem_transactions et 
    WHERE et.app_slug = ac.app_slug 
      AND et.transaction_type = 'revenue'
      AND et.transaction_date >= date_trunc('month', CURRENT_DATE)
  ) as revenue_mtd,
  (
    SELECT COALESCE(SUM(amount), 0) 
    FROM ecosystem_transactions et 
    WHERE et.app_slug = ac.app_slug 
      AND et.transaction_type = 'donation'
      AND et.transaction_date >= date_trunc('month', CURRENT_DATE)
  ) as donations_mtd
FROM app_connections ac
WHERE ac.is_active = true
ORDER BY ac.app_name;

-- =====================================================
-- PART 7: HELPER FUNCTIONS
-- =====================================================

-- Sync a person from an external app
CREATE OR REPLACE FUNCTION sync_external_person(
  p_app_slug TEXT,
  p_external_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id UUID;
  v_name_parts TEXT[];
BEGIN
  -- Check if crosswalk exists
  SELECT contact_id INTO v_contact_id
  FROM contact_app_crosswalk
  WHERE app_slug = p_app_slug AND external_user_id = p_external_user_id;
  
  IF v_contact_id IS NOT NULL THEN
    -- Update crosswalk
    UPDATE contact_app_crosswalk
    SET external_email = p_email,
        external_data = p_metadata,
        last_synced_at = NOW(),
        updated_at = NOW()
    WHERE app_slug = p_app_slug AND external_user_id = p_external_user_id;
    
    RETURN v_contact_id;
  END IF;
  
  -- Check if contact exists by email
  SELECT id INTO v_contact_id
  FROM contacts
  WHERE email = p_email
  LIMIT 1;
  
  IF v_contact_id IS NULL THEN
    -- Parse name
    v_name_parts := string_to_array(COALESCE(p_name, ''), ' ');
    
    -- Create new contact
    INSERT INTO contacts (
      email,
      first_name,
      last_name,
      source,
      metadata
    ) VALUES (
      p_email,
      COALESCE(v_name_parts[1], ''),
      COALESCE(array_to_string(v_name_parts[2:], ' '), ''),
      p_app_slug,
      p_metadata
    )
    RETURNING id INTO v_contact_id;
  END IF;
  
  -- Create crosswalk entry
  INSERT INTO contact_app_crosswalk (
    contact_id,
    app_slug,
    external_user_id,
    external_email,
    external_data
  ) VALUES (
    v_contact_id,
    p_app_slug,
    p_external_user_id,
    p_email,
    p_metadata
  )
  ON CONFLICT (app_slug, external_user_id) DO UPDATE SET
    external_email = p_email,
    external_data = p_metadata,
    last_synced_at = NOW(),
    updated_at = NOW();
  
  RETURN v_contact_id;
END;
$$;

-- Log an external event
CREATE OR REPLACE FUNCTION log_external_event(
  p_app_slug TEXT,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_actor_email TEXT,
  p_payload JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_actor_contact_id UUID;
BEGIN
  -- Try to find actor's contact ID
  SELECT contact_id INTO v_actor_contact_id
  FROM contact_app_crosswalk
  WHERE app_slug = p_app_slug AND external_email = p_actor_email
  LIMIT 1;
  
  -- If not found in crosswalk, check contacts directly
  IF v_actor_contact_id IS NULL THEN
    SELECT id INTO v_actor_contact_id
    FROM contacts
    WHERE email = p_actor_email
    LIMIT 1;
  END IF;
  
  -- Insert event
  INSERT INTO external_app_events (
    app_slug,
    event_type,
    entity_type,
    entity_id,
    actor_email,
    actor_contact_id,
    payload
  ) VALUES (
    p_app_slug,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_actor_email,
    v_actor_contact_id,
    p_payload
  )
  RETURNING id INTO v_event_id;
  
  -- Update app's last_event_at
  UPDATE app_connections
  SET last_event_at = NOW(),
      updated_at = NOW()
  WHERE app_slug = p_app_slug;
  
  RETURN v_event_id;
END;
$$;

-- Get ecosystem totals
CREATE OR REPLACE FUNCTION get_ecosystem_totals(
  p_start_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_donations DECIMAL,
  total_events BIGINT,
  total_active_users BIGINT,
  apps_active INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(amount) 
      FROM ecosystem_transactions 
      WHERE transaction_type = 'revenue' 
        AND transaction_date BETWEEN p_start_date AND p_end_date
    ), 0)::DECIMAL as total_revenue,
    COALESCE((
      SELECT SUM(amount) 
      FROM ecosystem_transactions 
      WHERE transaction_type = 'donation' 
        AND transaction_date BETWEEN p_start_date AND p_end_date
    ), 0)::DECIMAL as total_donations,
    COALESCE((
      SELECT COUNT(*) 
      FROM external_app_events 
      WHERE event_timestamp::DATE BETWEEN p_start_date AND p_end_date
    ), 0)::BIGINT as total_events,
    COALESCE((
      SELECT COUNT(DISTINCT actor_email) 
      FROM external_app_events 
      WHERE event_timestamp::DATE BETWEEN p_start_date AND p_end_date
    ), 0)::BIGINT as total_active_users,
    (SELECT COUNT(*)::INT FROM app_connections WHERE is_active = true) as apps_active;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_external_person TO authenticated;
GRANT EXECUTE ON FUNCTION sync_external_person TO service_role;
GRANT EXECUTE ON FUNCTION log_external_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_external_event TO service_role;
GRANT EXECUTE ON FUNCTION get_ecosystem_totals TO authenticated;
GRANT EXECUTE ON FUNCTION get_ecosystem_totals TO service_role;

-- =====================================================
-- PART 8: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE app_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_app_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_ecosystem_metrics ENABLE ROW LEVEL SECURITY;

-- App connections: Admin only (service role can access all)
CREATE POLICY "Service role access app_connections"
  ON app_connections FOR ALL
  USING (true);

-- External events: Viewable by admins, insertable by service role
CREATE POLICY "Service role access external_app_events"
  ON external_app_events FOR ALL
  USING (true);

-- Crosswalk: Service role access
CREATE POLICY "Service role access contact_app_crosswalk"
  ON contact_app_crosswalk FOR ALL
  USING (true);

-- Transactions: Service role access
CREATE POLICY "Service role access ecosystem_transactions"
  ON ecosystem_transactions FOR ALL
  USING (true);

-- Metrics: Service role access
CREATE POLICY "Service role access daily_ecosystem_metrics"
  ON daily_ecosystem_metrics FOR ALL
  USING (true);

-- =====================================================
-- DONE! Ecosystem integration tables ready
-- =====================================================
