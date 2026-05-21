-- =============================================================================
-- RFP & Proposal Engine — State/City Drift Detection
-- Phase 05-02: Discovery (state + city scrapers)
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_state_city_drift)
-- =============================================================================
-- SAFETY: Additive only. Two new tables (rfp_source_drift, rfp_source_baseline).
--         Service-only RLS — no end-user access in this phase. Admin UI (Phase 10)
--         will surface these via service-role server actions.
-- Filename slug `_rfp_state_city_drift` distinct from 05-01's
-- `_rfp_opportunities_extensions` to avoid collision when both plans
-- land migrations on the same date.
-- =============================================================================

-- Drift events: one row per detected anomaly. Captures schema/structure breakage,
-- HTTP errors, and parse-count anomalies vs the rolling baseline.
CREATE TABLE IF NOT EXISTS rfp_source_drift (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text        NOT NULL,            -- e.g. 'ny_state', 'nyc_dycd', 'nyc_hra', 'nyc_doe'
  reason      text        NOT NULL,            -- 'zero_nodes' | 'http_status' | 'shape_mismatch' | 'fetch_error' | 'count_anomaly'
  details     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_source_drift_source_idx
  ON rfp_source_drift (source, created_at DESC);

-- Rolling baseline: parsed counts on each successful run. Caller (orchestrator)
-- only inserts here when parsed_count >= 1 AND HTTP 200. The "rolling" window
-- is computed on read: AVG of the last 3 rows per source.
CREATE TABLE IF NOT EXISTS rfp_source_baseline (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text        NOT NULL,
  parsed_count int         NOT NULL,
  recorded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_source_baseline_source_idx
  ON rfp_source_baseline (source, recorded_at DESC);

-- =============================================================================
-- RLS: service-role-only access. The `USING (false)` policy denies all access
-- to anon/authenticated; only service_role (which bypasses RLS) reads or writes.
-- Phase 10 admin UI will fetch these via server-side service-role calls.
-- =============================================================================
ALTER TABLE rfp_source_drift    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_source_baseline ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rfp_source_drift'
      AND policyname = 'rfp_source_drift_service_only'
  ) THEN
    CREATE POLICY rfp_source_drift_service_only
      ON rfp_source_drift
      FOR ALL
      USING (false)
      WITH CHECK (false);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rfp_source_baseline'
      AND policyname = 'rfp_source_baseline_service_only'
  ) THEN
    CREATE POLICY rfp_source_baseline_service_only
      ON rfp_source_baseline
      FOR ALL
      USING (false)
      WITH CHECK (false);
  END IF;
END;
$$;
