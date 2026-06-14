-- Migration: create sales_contacts table (if missing) and add product column
-- Purpose: STUDIO-AD-01 — create the sales_contacts table with the product column
--          so Atlas Discovery intakes can be tagged and queried by product source.
-- Forward-additive only: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS.
--
-- Context: sales_contacts was defined in 20250122_add_sales_contacts.sql migration
-- but had not been applied to the LDC Brain AI remote project.
-- This migration brings the table up-to-date with the product column included.
--
-- Deviations from original plan (Rule 3 — auto-fix blocking issue):
--   ORIGINAL SCENARIO: table already exists, just ADD COLUMN IF NOT EXISTS.
--   ACTUAL: table was missing from the remote project entirely; created here.
--
-- Rule 1 auto-fix (bug):
--   The original valid_interested_in constraint used lowercase values
--   ('business','enterprise','custom','consultation') but the API route submits
--   uppercase values ('Pro','Enterprise','Custom'). This caused all DB inserts to
--   silently fail. Fixed here by accepting both case variants.

CREATE TABLE IF NOT EXISTS public.sales_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  company_size TEXT NOT NULL,
  interested_in TEXT NOT NULL,
  message TEXT,
  -- product column — Atlas Discovery / product-tagged intakes
  product TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  -- Constraints
  CONSTRAINT valid_company_size CHECK (
    company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001+', '1000+')
  ),
  CONSTRAINT valid_interested_in CHECK (
    interested_in IN (
      -- API values (from /api/contact-sales route zod schema)
      'Pro', 'Enterprise', 'Custom',
      -- Legacy values (original constraint — kept for backward compat)
      'business', 'enterprise', 'custom', 'consultation'
    )
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'closed_won', 'closed_lost')
  ),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sales_contacts_status ON public.sales_contacts(status);
CREATE INDEX IF NOT EXISTS idx_sales_contacts_created_at ON public.sales_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_contacts_email ON public.sales_contacts(email);
CREATE INDEX IF NOT EXISTS idx_sales_contacts_company ON public.sales_contacts(company);

-- Index for product-based filtering (Atlas Discovery routing)
CREATE INDEX IF NOT EXISTS idx_sales_contacts_product
  ON public.sales_contacts (product) WHERE product IS NOT NULL;

-- Document the product column
COMMENT ON COLUMN public.sales_contacts.product IS
  'Optional product tag for routing intakes (e.g., atlas-discovery, atlas-flagship, vellum-institution). NULL for generic engagement intakes. Added per STUDIO-AD-01.';

-- RLS Policies
ALTER TABLE public.sales_contacts ENABLE ROW LEVEL SECURITY;

-- Only service role (admin) can insert sales contacts
-- (API uses createAdminClient() per CORE-tier rule)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sales_contacts'
      AND policyname = 'Service role can insert sales contacts'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can insert sales contacts"
      ON public.sales_contacts
      FOR INSERT
      TO service_role
      WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sales_contacts'
      AND policyname = 'Service role can read sales contacts'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can read sales contacts"
      ON public.sales_contacts
      FOR SELECT
      TO service_role
      USING (true)';
  END IF;
END $$;
