-- =============================================================================
-- RFP Engine — relax rfp_opportunities.source CHECK from fixed enum to a format
-- pattern (Phase 16 / DISCO-10). The all-50-state connector framework adds new
-- source tags declaratively via rfp_state_coverage; a hardcoded allow-list would
-- force a migration per state. Pattern keeps integrity (lowercase slug) without
-- blocking new sources. All existing values satisfy the pattern.
-- SAFETY: reversible — old enum is documented below for rollback.
--   OLD: source = ANY (ARRAY['sam_gov','grants_gov','simpler_grants','sbir',
--        'fed_register','nih_grants','nsf_grants','ny_state','nyc_dycd','nyc_hra',
--        'nyc_doe','nyc_passport','ca_grants','foundation_url'])
-- =============================================================================

ALTER TABLE rfp_opportunities DROP CONSTRAINT IF EXISTS rfp_opportunities_source_check;

ALTER TABLE rfp_opportunities ADD CONSTRAINT rfp_opportunities_source_check
  CHECK (source ~ '^[a-z0-9_]+$' AND char_length(source) BETWEEN 2 AND 64);
