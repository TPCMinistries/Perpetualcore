---
phase: 22-trust-security-legal
plan: 04
subsystem: compliance
tags: [tos, data-sources, compliance, candid, propublica, irs-990, sam-gov, grants-gov]

# Dependency graph
requires:
  - phase: 22-trust-security-legal
    provides: Research identifying Candid exclusion, ProPublica planned status, all catalog sources

provides:
  - Written ToS compliance review for every registered source in lib/rfp/source-catalog.ts
  - Formal Candid exclusion declaration with code-level grep evidence
  - ProPublica/IRS 990 pre-Phase-16 action item documented

affects: [16-sources-expansion, 23-billing-live, phase-22-trust-security-legal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DATA-SOURCE-COMPLIANCE.md as the per-source ToS compliance register for new sources"
    - "Grep evidence pattern: capture full command + output in compliance docs for audit traceability"

key-files:
  created:
    - .planning/DATA-SOURCE-COMPLIANCE.md
  modified: []

key-decisions:
  - "Candid exclusion confirmed by code grep (zero API calls) — marketing copy in HowItWorksContent.tsx lists Candid aspirationally but no data flows; that copy should be cleaned up in a future sprint"
  - "ProPublica/IRS 990 flagged as pre-Phase-16 action: read propublica.org/nonprofits/api terms for commercial-use clause before integration"
  - "All 22 catalog entries covered including planned/blocked sources — compliance table is complete, not just live sources"

patterns-established:
  - "Compliance doc lives in .planning/; re-review triggered by any source moving from planned to live or when a new source is added to the catalog"

requirements-completed: [TRUST-04]

# Metrics
duration: 2min
completed: 2026-06-06
---

# Phase 22 Plan 04: Data-Source ToS Compliance Review Summary

**Per-source ToS compliance review for all 22 catalog entries confirming Candid excluded with grep proof and ProPublica/IRS 990 flagged as planned with pre-Phase-16 action item**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-07T03:55:38Z
- **Completed:** 2026-06-07T03:57:44Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created `.planning/DATA-SOURCE-COMPLIANCE.md` (206 lines) covering all 22 sources registered in `lib/rfp/source-catalog.ts`
- Confirmed Candid exclusion with `grep -rin "candid.org"` output showing zero API calls (only the blocked catalog entry and aspirational UI copy)
- Confirmed ProPublica/IRS 990 status "planned" with zero ingest code; flagged commercial-use ToS review as a required pre-Phase-16 action

## Task Commits

1. **Task 1+2: Create data-source ToS compliance review** - `2f4c1a3` (docs)

## Files Created/Modified

- `.planning/DATA-SOURCE-COMPLIANCE.md` — Per-source compliance table for all 22 catalog entries, Candid exclusion declaration, ProPublica pre-Phase-16 action item, redistribution stance, review cadence

## Decisions Made

- Candid marketing copy in `app/(rfp-marketing)/rfp/how-it-works/HowItWorksContent.tsx` (3 lines listing Candid as a current source) is aspirational and does not represent live ingest. Noted as a content accuracy cleanup item, not a compliance violation.
- ProPublica commercial-use clause is unresolved — flagged as pre-Phase-16 gate. Direct IRS 990 bulk download (public domain, no ToS) noted as the fallback path.
- All 22 catalog entries covered, including planned and blocked entries, so the doc stays valid as sources are activated.

## Deviations from Plan

None — plan executed exactly as written. Documentation deliverable only; no code changes, no ingestion, no schema change.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- TRUST-04 is satisfied. Phase 22 plans 22-01 through 22-03 (RLS CI gate, service-role audit, legal pages) remain to complete Phase 22.
- Before Phase 16 begins: ProPublica API terms must be reviewed and this document updated with the commercial-use finding.
- Marketing copy in `HowItWorksContent.tsx` should remove Candid from the current-source list in a future content sprint.

---
*Phase: 22-trust-security-legal*
*Completed: 2026-06-06*
