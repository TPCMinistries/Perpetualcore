---
phase: 18-explainable-fit-scoring
plan: "02"
subsystem: scoring
tags: [scoring, disqualifiers, dimensions, pure-functions, tdd, SCORE-03, SCORE-04]
dependency_graph:
  requires: []
  provides: [SCORE-03, SCORE-04]
  affects: [lib/rfp/scoring/recompute.ts, lib/rfp/scoring/disqualifiers.ts, lib/rfp/scoring/dimensions.ts]
tech_stack:
  added: []
  patterns: [tdd-red-green, pure-functions, conditional-null-guard]
key_files:
  created:
    - lib/rfp/scoring/disqualifiers.ts
    - lib/rfp/scoring/disqualifiers.test.ts
    - lib/rfp/scoring/dimensions.ts
    - lib/rfp/scoring/dimensions.test.ts
  modified:
    - lib/rfp/enrichment/generate.ts
decisions:
  - "checkDisqualifiers is conditional on non-null typed fields — null/empty input always produces zero flags (Pitfall 2)"
  - "dual org type is not auto-disqualified by SBA set-aside — only nonprofit is explicitly excluded"
  - "eligibility_types string matching uses /\\bsmall businesses?\\b/i (plural form) to match the ELIGIBILITY_RULES pattern"
  - "mapToDimensions: funder_relationship combines past_funder (1/3) + geo (2/3) weighted — reflects their 10%/20% component weights"
  - "vault boost for mission_fit: up to +15 points (min(15, vaultHitCount × 5)), clamped to 100"
  - "matchEligibilityLabel re-exported from disqualifiers.ts for potential future use in dimensions"
metrics:
  duration: "5 min"
  completed: "2026-06-07"
  tasks_completed: 5
  files_changed: 5
---

# Phase 18 Plan 02: Disqualifiers + Dimensions Pure Functions Summary

Two pure scoring functions built test-first: `checkDisqualifiers()` (SCORE-04 ineligible-opportunity detection) and `mapToDimensions()` (SCORE-03 five labeled dimension breakdown), both conditional on non-null typed fields to prevent false positives on sparse pre-Phase-15 data.

## Objective

Build `checkDisqualifiers()` and `mapToDimensions()` as deterministic pure functions with no DB/AI dependencies, ready for Plan 03 cron integration. TDD approach: RED → GREEN for each function.

## What Was Built

### checkDisqualifiers (SCORE-04)

`lib/rfp/scoring/disqualifiers.ts` — pure function with 3 categories of checks:

1. **Set-aside code check**: `SBA`, `SDVOSB`, `8A`, `WOSB`, `HUBZone`, `EDWOSB` + `org.type === 'nonprofit'` → hard eligibility flag. `dual` orgs are not auto-disqualified.
2. **eligibility_types mismatch**: small-business text vs nonprofit → hard flag; nonprofit-only text vs forprofit → hard flag.
3. **NAICS gap**: opp has NAICS but org has none → soft flag; no overlap → soft flag.

Every check is guarded: `null`/empty fields skip entirely. This is the SCORE-04 success criterion — no false positives on pre-Phase-15 sparse rows.

Pre-step: exported `ELIGIBILITY_RULES` from `generate.ts` (bare `const` → `export const`).

### mapToDimensions (SCORE-03)

`lib/rfp/scoring/dimensions.ts` — maps existing `ScoreBreakdown` 5 components to 5 SCORE-03 labeled dimensions:

| Dimension | Source | Notes |
|-----------|--------|-------|
| `mission_fit` | `keyword.score × 100` + vault boost | +5 per vault hit, capped at +15 |
| `eligibility` | `naics.score × 100` | Clamped to 0 on hard disqualifier |
| `track_record` | `past_funder.score × 100` | Label includes matched funder name |
| `capacity` | `dollar_band.score × 100` | Plain-English tier label |
| `funder_relationship` | `past_funder (1/3) + geo (2/3)` | Weighted by original 10%/20% components |

## Tests

- `disqualifiers.test.ts`: 11 cases — all pass
- `dimensions.test.ts`: 6 cases — all pass
- Combined: 17/17 pass
- TypeScript: `npx tsc --noEmit` — clean

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Small businesses plural form in regex**
- **Found during:** GREEN phase for checkDisqualifiers
- **Issue:** `isSmallBusinessEligibilityText` used `/\bsmall business\b/i` which didn't match the plural "Small businesses" in eligibility_types strings
- **Fix:** Changed to `/\bsmall businesses?\b/i` to match both singular and plural
- **Files modified:** `lib/rfp/scoring/disqualifiers.ts`
- **Commit:** included in `feat(18-02): implement checkDisqualifiers pure fn` (8772974)

None other — plan executed as written.

## Self-Check

Files created:
- lib/rfp/scoring/disqualifiers.ts ✓
- lib/rfp/scoring/disqualifiers.test.ts ✓
- lib/rfp/scoring/dimensions.ts ✓
- lib/rfp/scoring/dimensions.test.ts ✓

Files modified:
- lib/rfp/enrichment/generate.ts ✓ (ELIGIBILITY_RULES exported)

Commits:
- abf121a: test(18-02): add failing tests for checkDisqualifiers
- 8772974: feat(18-02): implement checkDisqualifiers pure fn
- a79b97e: test(18-02): add failing tests for mapToDimensions
- 4f70f9c: feat(18-02): implement mapToDimensions pure fn

## Self-Check: PASSED
