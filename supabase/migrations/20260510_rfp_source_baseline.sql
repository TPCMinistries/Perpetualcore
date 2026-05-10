-- =============================================================================
-- RFP & Proposal Engine — Source CHECK constraint extension for state/city scrapers
-- Phase 05-02: Discovery (state + city scrapers)
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_source_baseline)
-- =============================================================================
-- SAFETY: Drops and re-adds the CHECK constraint on rfp_opportunities.source so
--         we can add 'nyc_hra' and 'nyc_doe' to the allowed values. The original
--         constraint enumerated:
--           'sam_gov', 'grants_gov', 'simpler_grants', 'sbir',
--           'ny_state', 'nyc_dycd', 'foundation_url'
--         The plan calls for four state/city scrapers — DYCD is already allowed,
--         but HRA and DOE were not. Without this, INSERTs from those scrapers
--         would fail with check_violation.
--
--         CONSTRAINT_NAME pattern: rfp_opportunities_source_check (Postgres
--         default for un-named CHECK constraints on columns).
--
-- Filename slug `_rfp_source_baseline` is one of the two distinct slugs the
-- plan reserved for 05-02 to avoid colliding with 05-01's migrations.
-- =============================================================================

DO $$
DECLARE
  cons_name text;
BEGIN
  SELECT con.conname
    INTO cons_name
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
   WHERE nsp.nspname = 'public'
     AND cls.relname = 'rfp_opportunities'
     AND con.contype = 'c'
     AND pg_get_constraintdef(con.oid) LIKE '%source%'
   LIMIT 1;

  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE rfp_opportunities DROP CONSTRAINT %I', cons_name);
  END IF;

  ALTER TABLE rfp_opportunities
    ADD CONSTRAINT rfp_opportunities_source_check
    CHECK (source IN (
      'sam_gov',
      'grants_gov',
      'simpler_grants',
      'sbir',
      'ny_state',
      'nyc_dycd',
      'nyc_hra',
      'nyc_doe',
      'foundation_url'
    ));
END;
$$;
