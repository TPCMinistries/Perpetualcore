-- Create matters table for legal case/matter organization
CREATE TABLE IF NOT EXISTS matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Matter details
  matter_number VARCHAR(100) UNIQUE NOT NULL,
  matter_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,

  -- Matter classification
  matter_type TEXT NOT NULL, -- e.g., "Civil Litigation", "Corporate", "Real Estate", "Family Law"
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Dates
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_date DATE,
  statute_of_limitations_date DATE,

  -- Financial
  billing_type TEXT, -- e.g., "hourly", "flat_fee", "contingency"
  hourly_rate DECIMAL(10, 2),
  estimated_value DECIMAL(15, 2),

  -- Details
  description TEXT,
  notes TEXT,
  tags TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matters_organization_id ON matters(organization_id);
CREATE INDEX IF NOT EXISTS idx_matters_user_id ON matters(user_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_matters_matter_type ON matters(matter_type);
CREATE INDEX IF NOT EXISTS idx_matters_client_name ON matters(client_name);
CREATE INDEX IF NOT EXISTS idx_matters_matter_number ON matters(matter_number);
CREATE INDEX IF NOT EXISTS idx_matters_opened_date ON matters(opened_date);

-- Add matter_id to documents table to associate documents with matters
ALTER TABLE documents ADD COLUMN IF NOT EXISTS matter_id UUID REFERENCES matters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_matter_id ON documents(matter_id);

-- Enable Row Level Security
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for matters
CREATE POLICY "Users can view matters in their organization"
  ON matters FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create matters in their organization"
  ON matters FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update matters in their organization"
  ON matters FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete matters in their organization"
  ON matters FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_matters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matters_updated_at_trigger
  BEFORE UPDATE ON matters
  FOR EACH ROW
  EXECUTE FUNCTION update_matters_updated_at();

-- Create view for matter statistics
CREATE OR REPLACE VIEW matter_stats AS
SELECT
  m.id as matter_id,
  m.matter_number,
  m.matter_name,
  m.status,
  COUNT(DISTINCT d.id) as document_count,
  SUM(d.file_size) as total_storage_bytes,
  COUNT(DISTINCT d.id) FILTER (WHERE d.summary IS NOT NULL) as documents_with_summaries,
  MAX(d.created_at) as last_document_uploaded
FROM matters m
LEFT JOIN documents d ON d.matter_id = m.id
GROUP BY m.id, m.matter_number, m.matter_name, m.status;

COMMENT ON TABLE matters IS 'Legal matters/cases for organizing documents and work';
COMMENT ON COLUMN matters.matter_number IS 'Unique matter/case reference number';
COMMENT ON COLUMN matters.matter_type IS 'Type of legal matter (Civil Litigation, Corporate, etc.)';
COMMENT ON COLUMN matters.status IS 'Current status of the matter';
COMMENT ON COLUMN matters.statute_of_limitations_date IS 'Critical deadline for statute of limitations';
