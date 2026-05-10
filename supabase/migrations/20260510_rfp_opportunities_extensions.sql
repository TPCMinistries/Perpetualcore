-- =============================================================================
-- RFP & Proposal Engine — rfp_opportunities Extensions
-- Phase 05-01: Discovery cron — extend rfp_opportunities for feed UI + scoring
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_opportunities_extensions)
-- =============================================================================
-- SAFETY: Additive ALTER TABLE … ADD COLUMN IF NOT EXISTS only.
--         No drops, no constraint changes, no enum mutation.
--         Existing rows get NULL (or default) for new nullable columns.
--         RLS policies unchanged — new columns inherit the existing SELECT policy
--         (rfp_opportunities is globally readable per Phase 04-01 policies).
-- =============================================================================
-- Phase 04-01 schema enum on `source` already includes:
--   'sam_gov', 'grants_gov', 'simpler_grants', 'sbir', 'ny_state', 'nyc_dycd', 'foundation_url'
-- Note: registry key in lib/rfp/sources.ts is `sbir_gov`; the schema's canonical
-- value is `sbir`. The ingest normalizer maps sbir_gov -> sbir on write.
-- =============================================================================

-- 1. brief — 1-2 sentence summary populated from synopsis/description on ingest.
--    Falls back to NULL when the source provides no description.
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS brief text;

-- 2. keywords — extracted keywords for keyword_alignment scoring (Phase 05-03).
--    Defaults to empty array so downstream code can rely on `array_length(...) IS NOT NULL`.
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}';

-- 3. geo — geography string for geo_match scoring.
--    Examples: 'US', 'NY', 'NYC', 'national', 'KE'. Free-form on purpose so each
--    source can pass through its native geography token; normalizer is responsible
--    for any canonicalisation downstream phases require.
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS geo text;

-- 4. url — direct link to the source posting (uiLink, opportunity URL, etc.).
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS url text;

-- 5. needs_review — flips true when Quick Import (Phase 05-05) or any ingest
--    can't fully populate required fields. Surfaced in the feed as a "Needs review" badge.
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

-- 6. last_seen_at — set on every upsert. Lets us detect when an opportunity
--    has been withdrawn (no longer appearing in source listings) by comparing
--    last_seen_at against the most recent successful run for that source.
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
