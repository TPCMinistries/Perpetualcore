-- Email Sequences System
-- Automated drip campaigns and follow-up workflows

-- Email sequence definitions
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sequence_type TEXT NOT NULL, -- 'consultation' or 'enterprise_demo'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual steps in each sequence
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL, -- Days after previous step (or enrollment for step 1)
  subject TEXT NOT NULL,
  email_template TEXT NOT NULL, -- Name of the template function to call
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

-- Track which leads are in which sequences
CREATE TABLE IF NOT EXISTS lead_email_sequence_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL, -- 'consultation' or 'enterprise_demo'
  lead_id UUID NOT NULL,
  sequence_id UUID NOT NULL REFERENCES email_sequences(id),
  current_step INTEGER DEFAULT 0,
  next_send_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'unsubscribed'
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lead_type, lead_id, sequence_id)
);

-- Create indexes for performance
CREATE INDEX idx_lead_sequence_state_next_send ON lead_email_sequence_state(next_send_date, status);
CREATE INDEX idx_lead_sequence_state_lead ON lead_email_sequence_state(lead_type, lead_id);
CREATE INDEX idx_email_sequence_steps_sequence ON email_sequence_steps(sequence_id, step_number);

-- Enable RLS
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_sequence_state ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admin full access to email_sequences" ON email_sequences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.is_super_admin = true OR user_profiles.is_admin = true)
    )
  );

CREATE POLICY "Admin full access to email_sequence_steps" ON email_sequence_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.is_super_admin = true OR user_profiles.is_admin = true)
    )
  );

CREATE POLICY "Admin full access to lead_email_sequence_state" ON lead_email_sequence_state
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.is_super_admin = true OR user_profiles.is_admin = true)
    )
  );

-- Insert default consultation follow-up sequence
INSERT INTO email_sequences (name, description, sequence_type, is_active)
VALUES
  ('consultation_nurture', 'Follow-up sequence for consultation bookings', 'consultation', true),
  ('enterprise_demo_follow_up', 'Follow-up sequence for enterprise demo requests', 'enterprise_demo', true);

-- Consultation sequence steps
INSERT INTO email_sequence_steps (sequence_id, step_number, delay_days, subject, email_template, is_active)
SELECT
  (SELECT id FROM email_sequences WHERE name = 'consultation_nurture'),
  1,
  1,
  'Quick question about your AI implementation goals',
  'consultation_day_1',
  true
UNION ALL
SELECT
  (SELECT id FROM email_sequences WHERE name = 'consultation_nurture'),
  2,
  3,
  'Here are some quick wins you can implement today',
  'consultation_day_3',
  true
UNION ALL
SELECT
  (SELECT id FROM email_sequences WHERE name = 'consultation_nurture'),
  3,
  7,
  'Case study: How a team like yours saved 750 hours/month',
  'consultation_day_7',
  true;

-- Enterprise demo sequence steps
INSERT INTO email_sequence_steps (sequence_id, step_number, delay_days, subject, email_template, is_active)
SELECT
  (SELECT id FROM email_sequences WHERE name = 'enterprise_demo_follow_up'),
  1,
  1,
  'Your enterprise demo preparation checklist',
  'enterprise_day_1',
  true
UNION ALL
SELECT
  (SELECT id FROM email_sequences WHERE name = 'enterprise_demo_follow_up'),
  2,
  3,
  'ROI Calculator: Expected savings for your organization',
  'enterprise_day_3',
  true
UNION ALL
SELECT
  (SELECT id FROM email_sequences WHERE name = 'enterprise_demo_follow_up'),
  3,
  7,
  'Security & compliance: Your questions answered',
  'enterprise_day_7',
  true;

-- Function to enroll a lead in a sequence
CREATE OR REPLACE FUNCTION enroll_lead_in_sequence(
  p_lead_type TEXT,
  p_lead_id UUID,
  p_sequence_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_sequence_id UUID;
  v_first_step_delay INTEGER;
  v_enrollment_id UUID;
BEGIN
  -- Get sequence ID
  SELECT id INTO v_sequence_id
  FROM email_sequences
  WHERE name = p_sequence_name AND is_active = true;

  IF v_sequence_id IS NULL THEN
    RAISE EXCEPTION 'Sequence not found: %', p_sequence_name;
  END IF;

  -- Get delay for first step
  SELECT delay_days INTO v_first_step_delay
  FROM email_sequence_steps
  WHERE sequence_id = v_sequence_id AND step_number = 1 AND is_active = true;

  -- Insert or update enrollment
  INSERT INTO lead_email_sequence_state (
    lead_type,
    lead_id,
    sequence_id,
    current_step,
    next_send_date,
    status
  ) VALUES (
    p_lead_type,
    p_lead_id,
    v_sequence_id,
    0,
    CURRENT_DATE + v_first_step_delay,
    'active'
  )
  ON CONFLICT (lead_type, lead_id, sequence_id)
  DO UPDATE SET
    status = 'active',
    next_send_date = CURRENT_DATE + v_first_step_delay,
    updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leads ready for next email
CREATE OR REPLACE FUNCTION get_leads_ready_for_email()
RETURNS TABLE (
  enrollment_id UUID,
  lead_type TEXT,
  lead_id UUID,
  sequence_id UUID,
  current_step INTEGER,
  next_step INTEGER,
  subject TEXT,
  email_template TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lss.id as enrollment_id,
    lss.lead_type,
    lss.lead_id,
    lss.sequence_id,
    lss.current_step,
    (lss.current_step + 1) as next_step,
    ess.subject,
    ess.email_template
  FROM lead_email_sequence_state lss
  JOIN email_sequence_steps ess
    ON ess.sequence_id = lss.sequence_id
    AND ess.step_number = lss.current_step + 1
    AND ess.is_active = true
  WHERE lss.status = 'active'
    AND lss.next_send_date <= CURRENT_DATE
    AND ess.is_active = true
  ORDER BY lss.next_send_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as sent and schedule next
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_enrollment_id UUID,
  p_next_step INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_next_delay INTEGER;
  v_sequence_id UUID;
BEGIN
  -- Get the sequence_id for this enrollment
  SELECT sequence_id INTO v_sequence_id
  FROM lead_email_sequence_state
  WHERE id = p_enrollment_id;

  -- Get delay for next step (if exists)
  SELECT delay_days INTO v_next_delay
  FROM email_sequence_steps
  WHERE sequence_id = v_sequence_id
    AND step_number = p_next_step + 1
    AND is_active = true;

  -- Update enrollment
  IF v_next_delay IS NOT NULL THEN
    -- There's another step, schedule it
    UPDATE lead_email_sequence_state
    SET
      current_step = p_next_step,
      last_sent_at = NOW(),
      next_send_date = CURRENT_DATE + v_next_delay,
      updated_at = NOW()
    WHERE id = p_enrollment_id;
  ELSE
    -- No more steps, mark as completed
    UPDATE lead_email_sequence_state
    SET
      current_step = p_next_step,
      last_sent_at = NOW(),
      next_send_date = NULL,
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_enrollment_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
