-- =============================================================================
-- RFP Engine — Typed contract/grant fields on rfp_opportunities (FND-01)
-- Phase 14-01: Canonical Data Foundation — typed fields migration
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_opportunity_typed_fields)
-- =============================================================================
-- SAFETY: Additive only. All ALTER TABLE statements use ADD COLUMN IF NOT EXISTS.
--         All index creation uses CREATE INDEX IF NOT EXISTS.
--         No DROP TABLE, DROP COLUMN, or TRUNCATE statements.
--         Backfill UPDATEs are conditional (only where target arrays are still '{}').
--         Re-running this migration is safe and idempotent.
-- =============================================================================
-- PURPOSE: Promote contract- and grant-specific fields from prefixed keywords[]
--   strings and raw_json into named, typed, indexable columns. Phase 18 scoring
--   reads these by name; Phase 15 ingest will populate them going forward.
--   A single SELECT now returns both contract and grant typed fields.
--
-- COLUMNS ADDED (7 total):
--   Contract fields: naics_codes, psc_code, set_aside_code
--   Grant fields:    cfda_numbers, eligibility_types, cost_share_required, funder_name
-- =============================================================================

-- =============================================================================
-- 1. ADD TYPED COLUMNS (all additive, IF NOT EXISTS)
-- =============================================================================
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS naics_codes         text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS psc_code            text,
  ADD COLUMN IF NOT EXISTS set_aside_code      text,
  ADD COLUMN IF NOT EXISTS cfda_numbers        text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS eligibility_types   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cost_share_required boolean,
  ADD COLUMN IF NOT EXISTS funder_name         text;

-- =============================================================================
-- 2. GIN INDEXES for array-overlap filtering
--    Phase 18 scoring uses: WHERE naics_codes && ARRAY['541712']
--    Phase 15 grant matching uses: WHERE cfda_numbers && ARRAY['93.123']
-- =============================================================================
CREATE INDEX IF NOT EXISTS rfp_opportunities_naics_idx ON rfp_opportunities USING GIN (naics_codes);
CREATE INDEX IF NOT EXISTS rfp_opportunities_cfda_idx  ON rfp_opportunities USING GIN (cfda_numbers);

-- =============================================================================
-- 3. BACKFILL from existing keywords[] using strict regex
--    Pattern: naics:[0-9]{2,6}  →  extract the numeric code after the prefix
--    Pattern: cfda:[0-9]{2}.[0-9]{3}  →  extract the CFDA number after the prefix
--
--    SAFETY: Only updates rows where the target array is still '{}' (empty).
--    Only processes rows that have at least one keyword entry.
--    Regex is intentionally strict to avoid the naïve-split corruption pitfall
--    (keywords might contain colons in other contexts).
-- =============================================================================

-- Backfill naics_codes from keywords[] entries prefixed with "naics:"
UPDATE rfp_opportunities
SET naics_codes = ARRAY(
  SELECT substring(k FROM 7)
  FROM unnest(keywords) AS k
  WHERE k ~ '^naics:[0-9]{2,6}$'
)
WHERE array_length(keywords, 1) > 0
  AND naics_codes = '{}';

-- Backfill cfda_numbers from keywords[] entries prefixed with "cfda:"
UPDATE rfp_opportunities
SET cfda_numbers = ARRAY(
  SELECT substring(k FROM 6)
  FROM unnest(keywords) AS k
  WHERE k ~ '^cfda:[0-9]{2}\.[0-9]{3}$'
)
WHERE array_length(keywords, 1) > 0
  AND cfda_numbers = '{}';

-- =============================================================================
-- NOTE: psc_code, set_aside_code, eligibility_types, cost_share_required,
--   and funder_name are NOT backfilled here — they require deeper raw_json
--   parsing that Phase 15 ingest will handle with source-specific parsers.
--   database.types.ts regen is deferred to Plan 14-04 (single owner).
-- =============================================================================
