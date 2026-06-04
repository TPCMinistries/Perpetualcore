-- =============================================================================
-- RFP Engine — Add NIH grants source
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Constraint-only update. No table drops, no data rewrite.
-- Adds `nih_grants` as an allowed rfp_opportunities.source value so the
-- NIH-focused Grants.gov connector can upsert records idempotently.
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
      'fed_register',
      'nih_grants',
      'ny_state',
      'nyc_dycd',
      'nyc_hra',
      'nyc_doe',
      'nyc_passport',
      'ca_grants',
      'foundation_url'
    ));
END;
$$;
