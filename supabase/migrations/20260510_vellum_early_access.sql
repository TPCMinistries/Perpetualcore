-- Migration: vellum_early_access
-- Purpose: Capture Vellum waitlist signups with tier preference for STUDIO-VW-01
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Phase: 12-studio-repositioning-v1-1 / Plan 04

CREATE TABLE IF NOT EXISTS public.vellum_early_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tier_preference text NOT NULL CHECK (tier_preference IN ('free', 'operator', 'team', 'institution')),
  organization_type text CHECK (organization_type IN ('501c3', 'forprofit', 'individual', 'other')),
  is_501c3 boolean NOT NULL DEFAULT false,
  source text DEFAULT 'vellum-waitlist',
  ip_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  setup_intent_id text,
  setup_intent_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vellum_early_access_email ON public.vellum_early_access (email);
CREATE INDEX IF NOT EXISTS idx_vellum_early_access_tier ON public.vellum_early_access (tier_preference);
CREATE INDEX IF NOT EXISTS idx_vellum_early_access_created ON public.vellum_early_access (created_at DESC);

-- Enforce email-tier uniqueness softly: same email can re-submit with different tier preference,
-- but most-recent wins (handled in app code). No unique constraint on email alone.

ALTER TABLE public.vellum_early_access ENABLE ROW LEVEL SECURITY;

-- INSERT: service role only. The /api/early-access endpoint runs server-side via createAdminClient().
-- No public anonymous insert path.
CREATE POLICY "Service role can insert"
  ON public.vellum_early_access
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- SELECT: service role only. The /admin/vellum-waitlist page (Plan 12-05) reads via createAdminClient().
-- No authenticated-user read path — the waitlist is Lorenzo-only.
CREATE POLICY "Service role can select"
  ON public.vellum_early_access
  FOR SELECT
  TO service_role
  USING (true);

-- No UPDATE / DELETE policies — append-only. If a user double-submits, app dedupes by email + most-recent.

COMMENT ON TABLE public.vellum_early_access IS 'Vellum waitlist signups (STUDIO-VW-01). Append-only; service role access only.';
