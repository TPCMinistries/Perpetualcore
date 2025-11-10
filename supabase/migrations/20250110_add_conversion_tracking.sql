-- Conversion Events Table
-- Track all conversion events (consultation bookings, enterprise demos, etc.)
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'consultation_booking',
    'enterprise_demo_request',
    'trial_started',
    'trial_converted',
    'pricing_page_visit',
    'signup',
    'upgrade',
    'downgrade',
    'churn'
  )),

  -- User/Organization (nullable for anonymous events)
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Event metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,

  -- Additional data
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for common queries
  INDEX idx_conversion_events_type (event_type),
  INDEX idx_conversion_events_user (user_id),
  INDEX idx_conversion_events_org (organization_id),
  INDEX idx_conversion_events_created (created_at DESC)
);

-- Consultation Bookings Table
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,

  -- Booking details
  preferred_date TIMESTAMPTZ,
  preferred_time TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-100', '101-500', '500+')),
  budget_range TEXT,

  -- Source attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'canceled', 'no_show')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,
  admin_notes TEXT,

  -- Link to user if they sign up
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_consultation_bookings_email (email),
  INDEX idx_consultation_bookings_status (status),
  INDEX idx_consultation_bookings_created (created_at DESC)
);

-- Enterprise Demo Requests Table
CREATE TABLE IF NOT EXISTS enterprise_demo_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,

  -- Company details
  company_size TEXT CHECK (company_size IN ('50-100', '101-500', '501-1000', '1000+')),
  industry TEXT,
  use_case TEXT,

  -- Requirements
  estimated_users INTEGER,
  required_features JSONB DEFAULT '[]'::jsonb,
  compliance_requirements JSONB DEFAULT '[]'::jsonb,

  -- Source attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'demo_scheduled', 'demo_completed', 'proposal_sent', 'won', 'lost')),
  contacted_at TIMESTAMPTZ,
  demo_scheduled_at TIMESTAMPTZ,
  demo_completed_at TIMESTAMPTZ,
  deal_value DECIMAL(10, 2),

  -- Notes
  notes TEXT,
  admin_notes TEXT,

  -- Link to user/org if they sign up
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_enterprise_demo_email (email),
  INDEX idx_enterprise_demo_company (company_name),
  INDEX idx_enterprise_demo_status (status),
  INDEX idx_enterprise_demo_created (created_at DESC)
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_consultation_bookings_updated_at ON consultation_bookings;
CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enterprise_demo_requests_updated_at ON enterprise_demo_requests;
CREATE TRIGGER update_enterprise_demo_requests_updated_at
  BEFORE UPDATE ON enterprise_demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_demo_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view all conversion events
CREATE POLICY "Admins can view all conversion events"
  ON conversion_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND (is_super_admin = true OR is_admin = true)
    )
  );

-- Service role can insert conversion events
CREATE POLICY "Service role can insert conversion events"
  ON conversion_events FOR INSERT
  WITH CHECK (true);

-- Admins can view all consultation bookings
CREATE POLICY "Admins can view all consultation bookings"
  ON consultation_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND (is_super_admin = true OR is_admin = true)
    )
  );

-- Admins can view all enterprise demo requests
CREATE POLICY "Admins can view all enterprise demo requests"
  ON enterprise_demo_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND (is_super_admin = true OR is_admin = true)
    )
  );

-- Function to track conversion event
CREATE OR REPLACE FUNCTION track_conversion_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_term TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO conversion_events (
    event_type,
    user_id,
    organization_id,
    metadata,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    referrer,
    page_url,
    user_agent,
    ip_address
  ) VALUES (
    p_event_type,
    p_user_id,
    p_organization_id,
    p_metadata,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_utm_term,
    p_utm_content,
    p_referrer,
    p_page_url,
    p_user_agent,
    p_ip_address::inet
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on function to authenticated users
GRANT EXECUTE ON FUNCTION track_conversion_event TO authenticated;
GRANT EXECUTE ON FUNCTION track_conversion_event TO anon;

-- Comments for documentation
COMMENT ON TABLE conversion_events IS 'Tracks all conversion events for analytics and attribution';
COMMENT ON TABLE consultation_bookings IS 'Stores consultation booking requests from /consultation page';
COMMENT ON TABLE enterprise_demo_requests IS 'Stores enterprise demo requests from /enterprise-demo page';
