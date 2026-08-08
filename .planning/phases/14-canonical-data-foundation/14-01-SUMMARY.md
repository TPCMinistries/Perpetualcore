---
phase: 14-canonical-data-foundation
plan: 01
subsystem: database
tags: [postgres, supabase, migration, gin-index, rfp-opportunities, naics, cfda, backfill]

# Dependency graph
requires:
  - phase: 13-pre-work-stabilization
    provides: stable rfp_opportunities table with keywords[] array and raw_json column
provides:
  - 7 typed columns on rfp_opportunities (naics_codes, psc_code, set_aside_code, cfda_numbers, eligibility_types, cost_share_required, funder_name)
  - 2 GIN indexes for array-overlap queries (naics_codes, cfda_numbers)
  - 815 rows backfilled from naics:/cfda: prefixed keywords[]
affects: [14-02, 14-03, 14-04, 15-ingest, 17-scoring, 18-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GIN index on text[] columns for && array-overlap predicates"
    - "Strict regex prefix parse (^naics:[0-9]{2,6}$) to avoid naive colon-split corruption"
    - "Conditional backfill UPDATE: WHERE naics_codes = '{}' prevents re-backfill on idempotent runs"

key-files:
  created:
    - supabase/migrations/20260606_rfp_opportunity_typed_fields.sql
  modified: []

key-decisions:
  - "Backfill via strict regex prefix parse (^naics:[0-9]{2,6}$ / ^cfda:[0-9]{2}\\.[0-9]{3}$) rather than naive split on colon — avoids corruption from colons in other keyword contexts (research corruption pitfall #6)"
  - "Only naics_codes and cfda_numbers backfilled from keywords[]; psc_code/set_aside/eligibility/cost_share/funder deferred to Phase 15 ingest parsers which have source-specific context"
  - "database.types.ts regen explicitly deferred to Plan 14-04 (single owner) to avoid parallel-wave write collision"

patterns-established:
  - "Pattern 1: Additive brownfield migration — all 7 columns use ADD COLUMN IF NOT EXISTS; all 2 indexes use CREATE INDEX IF NOT EXISTS; backfill UPDATEs are gated on empty array check"
  - "Pattern 2: Management API pattern for applying SQL — Supabase PAT from mcp.json args, POST to /v1/projects/{ref}/database/query with 201 = success"

requirements-completed: [FND-01]

# Metrics
duration: 12min
completed: 2026-06-06
---

# Phase 14 Plan 01: Canonical Data Foundation — Typed Fields Migration Summary

**Additive migration adding 7 typed contract/grant columns + 2 GIN indexes to rfp_opportunities, with 815 rows backfilled from naics:/cfda: prefixed keywords[] via strict regex**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-06T21:30:24Z
- **Completed:** 2026-06-06T21:42:31Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments

- Wrote idempotent migration file `20260606_rfp_opportunity_typed_fields.sql` following existing 20260606_* header conventions
- Applied migration to LDC Brain AI (hgxxxmtfmvguotkowxbu) via Management API: 7 columns + 2 GIN indexes + 2 backfill UPDATEs — all 201 OK
- Verified: all 4 plan verification checks passed (7 columns, 2 indexes, 815 backfilled rows, FND-01 single-SELECT proof)
- Idempotency confirmed: re-running ALTER TABLE returned 201 with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Write and apply the additive typed-fields migration with backfill** - `dcda09c` (feat)

## Files Created/Modified

- `supabase/migrations/20260606_rfp_opportunity_typed_fields.sql` - Additive migration: 7 typed columns, 2 GIN indexes, 2 backfill UPDATEs with strict naics:/cfda: regex

## Decisions Made

- Used strict regex `^naics:[0-9]{2,6}$` instead of naive colon-split — prevents corruption from other keyword formats that might contain colons (per research pitfall #6)
- Backfill count was 815 rows (not 0): confirms real naics:/cfda: prefixed keywords existed in the dataset and were successfully promoted to typed columns
- psc_code, set_aside_code, eligibility_types, cost_share_required, funder_name left NULL (not backfilled) — these require source-specific raw_json parsing owned by Phase 15 ingest
- database.types.ts regen deferred to Plan 14-04 per plan spec to avoid parallel-wave collision with other Wave-1 plans running concurrently

## Deviations from Plan

None - plan executed exactly as written. Applied via Management API (not supabase CLI) because MCP tool calls and CLI secret access are handled via the PAT-from-mcp.json pattern documented in supabase-management-api-pattern.md memory entry. This is the established pattern for this project.

## Issues Encountered

None — the Management API approach (PAT from `~/.claude/mcp.json` supabase server args, POST to `/v1/projects/{ref}/database/query`) worked cleanly for all 5 queries (1 ALTER TABLE, 2 CREATE INDEX, 2 UPDATE backfill). 201 response with `[]` body = success.

## User Setup Required

None - no external service configuration required. Migration applied directly to production database.

## Next Phase Readiness

- FND-01 complete: `rfp_opportunities` now returns both contract fields (naics_codes, psc_code, set_aside_code) and grant fields (cfda_numbers, eligibility_types, cost_share_required, funder_name) in a single SELECT
- Phase 15 ingest can now write to naics_codes, psc_code, set_aside_code (contract) and cfda_numbers, eligibility_types, cost_share_required, funder_name (grant) by name
- Phase 18 scoring can use `WHERE naics_codes && ARRAY['541712']` predicates — GIN indexes will be hit
- Plan 14-04 needs to run to regenerate database.types.ts (deferred deliberately)

## Self-Check: PASSED

- Migration file: FOUND at supabase/migrations/20260606_rfp_opportunity_typed_fields.sql
- SUMMARY.md: FOUND at .planning/phases/14-canonical-data-foundation/14-01-SUMMARY.md
- Task commit: FOUND dcda09c

---
*Phase: 14-canonical-data-foundation*
*Completed: 2026-06-06*
