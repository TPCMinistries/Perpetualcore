-- Lead Management and Email Sequences
-- Drop existing tables if they exist
DROP TABLE IF EXISTS email_sequence_sends CASCADE;
DROP TABLE IF EXISTS email_sequence_steps CASCADE;
DROP TABLE IF EXISTS email_sequences CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  source TEXT, -- e.g., "lead-magnet", "contact-form", "webinar"
  lead_magnet TEXT, -- which lead magnet they downloaded
  status TEXT DEFAULT 'active', -- active, unsubscribed, bounced
  tags TEXT[], -- for segmentation
  metadata JSONB DEFAULT '{}', -- additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email sequences (campaigns)
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sequence_type TEXT NOT NULL, -- 'nurture', 'sales', 'onboarding', 'welcome'
  is_active BOOLEAN DEFAULT true,
  trigger_event TEXT, -- 'lead_magnet_download', 'signup', 'contact_form'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email sequence steps
CREATE TABLE email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0, -- days after previous step (0 for immediate)
  delay_hours INTEGER DEFAULT 0, -- additional hours
  subject TEXT NOT NULL,
  email_template TEXT NOT NULL, -- template name or HTML content
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sequence_id, step_number)
);

-- Track sent emails
CREATE TABLE email_sequence_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_id UUID REFERENCES email_sequence_steps(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled', -- scheduled, sent, failed, opened, clicked
  resend_email_id TEXT, -- ID from Resend
  error_message TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_sequence_sends_lead ON email_sequence_sends(lead_id);
CREATE INDEX idx_sequence_sends_scheduled ON email_sequence_sends(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_sequence_sends_status ON email_sequence_sends(status);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service role full access, restrict user access)
CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sequences" ON email_sequences
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sequence steps" ON email_sequence_steps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sends" ON email_sequence_sends
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON email_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to schedule sequence emails when a lead is added
CREATE OR REPLACE FUNCTION schedule_sequence_for_lead()
RETURNS TRIGGER AS $$
DECLARE
  seq RECORD;
  step RECORD;
  send_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find matching sequences based on source/trigger
  FOR seq IN
    SELECT * FROM email_sequences
    WHERE is_active = true
    AND (
      (trigger_event = 'lead_magnet_download' AND NEW.source = 'lead-magnet')
      OR (trigger_event = 'signup' AND NEW.source = 'signup')
      OR (trigger_event = 'contact_form' AND NEW.source = 'contact-form')
    )
  LOOP
    -- Schedule all steps in the sequence
    FOR step IN
      SELECT * FROM email_sequence_steps
      WHERE sequence_id = seq.id
      AND is_active = true
      ORDER BY step_number
    LOOP
      -- Calculate when to send this email
      send_time := NEW.created_at + (step.delay_days || ' days')::INTERVAL + (step.delay_hours || ' hours')::INTERVAL;

      -- Insert scheduled send
      INSERT INTO email_sequence_sends (
        lead_id,
        sequence_id,
        step_id,
        scheduled_for,
        status
      ) VALUES (
        NEW.id,
        seq.id,
        step.id,
        send_time,
        'scheduled'
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-schedule sequences
CREATE TRIGGER auto_schedule_sequences AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION schedule_sequence_for_lead();

-- Function to get next scheduled emails (for cron job)
CREATE OR REPLACE FUNCTION get_pending_sequence_emails(batch_size INT DEFAULT 100)
RETURNS TABLE (
  send_id UUID,
  lead_email TEXT,
  lead_first_name TEXT,
  subject TEXT,
  email_template TEXT,
  sequence_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ess.id as send_id,
    l.email as lead_email,
    l.first_name as lead_first_name,
    esst.subject,
    esst.email_template,
    es.name as sequence_name
  FROM email_sequence_sends ess
  JOIN leads l ON ess.lead_id = l.id
  JOIN email_sequence_steps esst ON ess.step_id = esst.id
  JOIN email_sequences es ON ess.sequence_id = es.id
  WHERE ess.status = 'scheduled'
  AND ess.scheduled_for <= now()
  AND l.status = 'active'
  ORDER BY ess.scheduled_for ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE leads IS 'Lead management for email marketing';
COMMENT ON TABLE email_sequences IS 'Email sequence/campaign definitions';
COMMENT ON TABLE email_sequence_steps IS 'Individual steps in email sequences';
COMMENT ON TABLE email_sequence_sends IS 'Tracking of sent/scheduled emails';
