-- Sales Contacts Table
-- Stores enterprise sales inquiries from the contact form

CREATE TABLE IF NOT EXISTS sales_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  company_size TEXT NOT NULL,
  interested_in TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_company_size CHECK (
    company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
  ),
  CONSTRAINT valid_interested_in CHECK (
    interested_in IN ('business', 'enterprise', 'custom', 'consultation')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'closed_won', 'closed_lost')
  ),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster lookups
CREATE INDEX idx_sales_contacts_status ON sales_contacts(status);
CREATE INDEX idx_sales_contacts_created_at ON sales_contacts(created_at DESC);
CREATE INDEX idx_sales_contacts_email ON sales_contacts(email);
CREATE INDEX idx_sales_contacts_company ON sales_contacts(company);

-- RLS Policies
ALTER TABLE sales_contacts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can view sales contacts
CREATE POLICY "Admin users can view sales contacts"
  ON sales_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admin users can update sales contacts
CREATE POLICY "Admin users can update sales contacts"
  ON sales_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Anyone can insert (form submission doesn't require auth)
CREATE POLICY "Anyone can submit sales contact"
  ON sales_contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_sales_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_contacts_updated_at
  BEFORE UPDATE ON sales_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_contacts_updated_at();

-- Comments
COMMENT ON TABLE sales_contacts IS 'Enterprise sales inquiries from contact form';
COMMENT ON COLUMN sales_contacts.status IS 'Sales pipeline status: new, contacted, qualified, demo_scheduled, proposal_sent, closed_won, closed_lost';
COMMENT ON COLUMN sales_contacts.company_size IS 'Number of employees: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+';
COMMENT ON COLUMN sales_contacts.interested_in IS 'Plan they are interested in: business, enterprise, custom, consultation';
