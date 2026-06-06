-- =============================================================================
-- RFP & Proposal Engine — API Key Expiry Health Tracking
-- Phase 13-03: SAM.gov API key expiry alerting
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_api_key_expiry)
-- =============================================================================
-- SAFETY: Additive only. One new table (rfp_api_key_health).
--         Service-only RLS — no end-user access. Admin UI (Phase 10)
--         will surface this via service-role server actions.
--         Mirrors the service-only policy pattern from 20260510_rfp_state_city_drift.sql.
-- =============================================================================

-- Tracks API key expiry dates for external discovery sources (e.g. SAM.gov).
-- One row per key. expires_at is NULL until the key is issued and recorded.
CREATE TABLE IF NOT EXISTS rfp_api_key_health (
  key_name        text        PRIMARY KEY,          -- e.g. 'sam_gov'
  expires_at      timestamptz,                      -- null until set after registration
  account_type    text,                             -- 'system' | 'individual'
  last_alerted_at timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- RLS: service-role-only access. USING(false) denies all anon/authenticated
-- access; service_role bypasses RLS and can read/write freely.
-- =============================================================================
ALTER TABLE rfp_api_key_health ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'rfp_api_key_health'
      AND policyname = 'rfp_api_key_health_service_only'
  ) THEN
    CREATE POLICY rfp_api_key_health_service_only
      ON rfp_api_key_health
      FOR ALL
      USING (false)
      WITH CHECK (false);
  END IF;
END;
$$;

-- =============================================================================
-- Seed the SAM.gov row. expires_at stays NULL until Lorenzo registers the
-- system account at fsd.gov and records the issued expiry date.
-- =============================================================================
INSERT INTO rfp_api_key_health (key_name, expires_at, account_type, last_alerted_at)
VALUES ('sam_gov', NULL, 'system', NULL)
ON CONFLICT (key_name) DO NOTHING;
