---
phase: 18-explainable-fit-scoring
plan: 01
subsystem: database
tags: [supabase, postgres, rls, scoring, vault, evidence]

# Dependency graph
requires:
  - phase: 14-canonical-data-foundation
    provides: rfp_opportunities, rfp_orgs, rfp_vault_artifacts, rfp_my_org_ids() helper
  - phase: 17-ai-cost-guardrail
    provides: createAdminClient pattern confirmed; scoring infrastructure stable

provides:
  - rfp_fit_evidence table with RLS (SELECT via rfp_my_org_ids; ALL via service_role)
  - upsertFitEvidence() server helper that writes vault citations and prunes stale versions
  - FitEvidenceRow TypeScript interface

affects: [18-02, 18-03, 18-04, recompute.ts, DetailPane.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - artifact_id stored without FK (artifact may be deleted post-scoring; citation must survive)
    - scored_version column mirrors rfp_opp_matches.scored_version for stale-row pruning
    - as-unknown-as cast for new table until database.types.ts regen in single-owner plan

key-files:
  created:
    - supabase/migrations/20260607_rfp_fit_evidence.sql
    - lib/rfp/scoring/evidence-store.ts
  modified: []

key-decisions:
  - "rfp_fit_evidence artifact_id is NOT a FK to rfp_vault_artifacts — artifacts may be deleted after scoring; citation rows must outlive the source artifact"
  - "Stale-row prune strategy: evidence-store.ts deletes rows where scored_version < current per (opp_id, org_id) pair rather than relying on DB cascade — gives full control over when old evidence is removed"
  - "database.types.ts regen deferred to later plan (established project pattern from Phase 14-04 decision)"

patterns-established:
  - "Pattern: rfp_fit_evidence RLS mirrors rfp_entitlements exactly (rfp_my_org_ids() SELECT + service_role ALL)"
  - "Pattern: evidence-store empty-input short-circuit handles zero-artifact orgs without blocking scoring"

requirements-completed: [SCORE-02]

# Metrics
duration: 7min
completed: 2026-06-07
---

# Phase 18 Plan 01: Explainable Fit Scoring — Evidence Persistence Layer Summary

**rfp_fit_evidence table with org-scoped RLS + upsertFitEvidence() helper that writes vault citations per dimension and prunes stale scored_version rows**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-07T19:42:48Z
- **Completed:** 2026-06-07T19:49:48Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `rfp_fit_evidence` migration: 12-column table, UNIQUE constraint on (opp_id, org_id, scored_version, artifact_id, dimension), feed-path index, ON DELETE CASCADE from both rfp_opportunities and rfp_orgs, RLS via rfp_my_org_ids()
- `evidence-store.ts`: pure persistence module with upsertFitEvidence (admin client, 200-char truncation, empty short-circuit, onConflict upsert) + per-pair stale-version prune
- Zero lint errors; all structural requirements verified via grep

## Task Commits

Each task was committed atomically:

1. **Task 1: Create rfp_fit_evidence migration with RLS** - `756539c` (feat)
2. **Task 2: Create evidence-store.ts helper (upsert + prune)** - `9ef56f0` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `supabase/migrations/20260607_rfp_fit_evidence.sql` - rfp_fit_evidence table + index + RLS (SELECT rfp_my_org_ids / ALL service_role)
- `lib/rfp/scoring/evidence-store.ts` - FitEvidenceRow interface + upsertFitEvidence + prune logic

## Decisions Made
- artifact_id is not a FK: vault artifacts may be deleted after scoring runs; citations must survive. This matches the research recommendation in 18-RESEARCH.md Pattern 5.
- Stale-row prune in application code (evidence-store.ts) rather than DB cascade: gives the scorer full control over when old evidence is retired; prune failure is non-fatal (stale rows are filtered by scored_version at read time).
- `as unknown as` cast for rfp_fit_evidence table access until database.types.ts is regenerated — follows the established Phase 14-04 single-owner regen pattern documented in STATE.md.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- `npx supabase db push --dry-run` showed "remote migration versions not found" for pre-existing PC platform migrations unrelated to the RFP schema. This is expected behavior for this multi-tenant project (confirmed in prior phase dry-runs). The new migration file follows the correct `<timestamp>_name.sql` format and was not skipped by the CLI.

## User Setup Required
None — no external service configuration required. Migration must be applied via `supabase db push` (or MCP apply_migration) before the Phase 18 scorer runs. No new env vars needed.

## Next Phase Readiness
- rfp_fit_evidence table definition is the data foundation Plans 18-02 through 18-04 build on
- upsertFitEvidence() is ready to be called from the Phase 18-02/18-03 cron extension once dimension breakdown and vault retrieval are wired
- No blockers for 18-02 (disqualifiers + dimension mapping)

---
*Phase: 18-explainable-fit-scoring*
*Completed: 2026-06-07*
