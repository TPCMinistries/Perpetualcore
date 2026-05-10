---
phase: 12-studio-repositioning-v1-1
plan: "01"
subsystem: ui
tags: [nextjs, tsx, copywriting, studio, case-studies, repositioning]

# Dependency graph
requires: []
provides:
  - "Three populated case study cards on /studio/case-studies with SECTOR / CONSTRAINT / INSTALL / OUTCOME prose"
  - "STUDIO-CS-01 requirement satisfied"
affects:
  - 12-02-PLAN
  - 12-03-PLAN

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SLOTS data structure carries sector + constraint + install + outcome fields — all copy-layer changes confined to page-level data arrays"
    - "Card markup labels use text-xs font-semibold tracking-widest uppercase for all four section labels; body uses text-base leading-relaxed"

key-files:
  created: []
  modified:
    - app/studio/case-studies/page.tsx

key-decisions:
  - "All prose uses qualitative-only language — no fabricated quantitative metrics (no %, no $X, no N students placed)"
  - "Spelled-out frequency phrases avoided per plan rule (grep verified zero matches)"
  - "No client names appear — CUNY abstracted to 'community-college workforce program in New York', Nairobi parishes to 'UN-aligned humanitarian agency across East Africa', TPC to 'faith institution with a multi-state network'"
  - "OUTCOME label rendered with text-muted-foreground body for slight typographic differentiation vs INSTALL body which renders in foreground — mirrors plan spec"
  - "Slot 03 OUTCOME references Vellum knowledge registry at /products/vellum — intentional cross-link from BRAND_ARCHITECTURE §1 product list"

patterns-established:
  - "Studio case-study pattern: SLOTS array is the single source of truth for all per-card prose; markup is purely presentational"

requirements-completed:
  - STUDIO-CS-01

# Metrics
duration: 2min
completed: 2026-05-10
---

# Phase 12 Plan 01: Studio Case Studies Summary

**Three abstracted case study slots populated with operator-grade INSTALL + OUTCOME prose under PEPFAR, FERPA, and multi-jurisdiction consent regimes — NDA placeholder removed**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-10T19:15:34Z
- **Completed:** 2026-05-10T19:17:37Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Extended SLOTS array from two fields (sector + constraint) to four (sector + constraint + install + outcome) for all three slots
- Replaced the "Case study available under NDA. Ask in your intake call." placeholder block with INSTALL + OUTCOME labeled sections in card markup
- Verified zero client names, zero fabricated quantitative metrics, zero spelled-out frequency phrases across the entire file

## Task Commits

1. **Task 1: Write three abstracted case studies into the SLOTS data structure** - `6739d95` (feat)

## Files Created/Modified

- `app/studio/case-studies/page.tsx` - Extended SLOTS with install + outcome fields; replaced NDA placeholder block with two labeled sections per card

## Word Counts (INSTALL + OUTCOME per slot)

| Slot | Install Words | Outcome Words | Combined |
|------|--------------|---------------|----------|
| 01 — East Africa health workforce | 50 | 46 | 96 |
| 02 — Community-college NY workforce | 57 | 56 | 113 |
| 03 — Faith institution multi-state | 58 | 53 | 111 |

All three slots land at or above the ~100-word combined target. Slot 01 is slightly under at 96 — within normal tolerance and the prose is tight by design (offline-first failure-mode story lands cleanest in fewer words).

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| INSTALL label present | `grep -c "Install"` | 3 matches |
| OUTCOME label present | `grep -c "Outcome"` | 3 matches |
| NDA placeholder removed | `grep -c "available under NDA"` | 0 |
| Client name grep | `grep -iE "(cuny|kbcc|kingsborough|nairobi|tpc|streams of grace)"` | CLEAN |
| Fabricated metric grep | `grep -E "[0-9]+%|\$[0-9]+|[0-9]+ (students|placements)"` | CLEAN |
| Spelled-out frequency grep | `grep -iE "(once|twice|three times|...) (a|per) (day|week|month|hour)"` | CLEAN |
| Lint (file only) | `npx eslint ... page.tsx` | No errors, no warnings |

## Decisions Made

- Used qualitative-only language throughout ("stopped doing X", "compile on demand", "outlived the engagement") — no frequency counts, no percentage lifts, no dollar figures
- OUTCOME sections rendered with `text-muted-foreground` body as specified in plan to create slight typographic differentiation from INSTALL body (which renders in foreground)
- Slot 03 OUTCOME deliberately cross-links Vellum at `/products/vellum` to connect the knowledge-registry product to the real-world install — per BRAND_ARCHITECTURE §3 product map

## Deviations from Plan

None — plan executed exactly as written. The file existed on `feat/studio-repositioning` branch with the NDA stub; the current branch at session start was `feat/rfp-orgs-invites-cont`. Stashed one uncommitted change in `lib/rfp/ingest/run.ts`, switched branches, executed the task, committed, then left state clean on `feat/studio-repositioning`.

## Voice-Register Adjustments

No adjustments from draft to final. The plan provided verbatim prose for all three slots. The only authorial choice made was preserving the exact wording as provided rather than paraphrasing — the prose already matched the operator-grade direct voice register from COPY_STUDIO.md and BRAND_ARCHITECTURE §6 angle #2.

## Recommendation: Constraint Regime Tag Filter (v1.2)

**Recommendation: build it, but not in v1.1.**

A constraint-regime filter (PEPFAR / FERPA / Multi-jurisdiction / HIPAA / IRB / Offline-first) would let buyers self-identify and immediately surface the relevant slot. As the case study library grows past three slots, this becomes load-bearing. For three slots, the visual scan is fast enough that a filter adds UI complexity without meaningful benefit.

Suggested trigger: build when slot count reaches six or more. Implementation is straightforward — add a `constraints` string array to each SLOT object, render a filter pill row above the grid, and use a `useState` filter on the client side (requires converting the page to a client component or adding a lightweight filter island).

## Issues Encountered

Branch mismatch at session start (current branch was `feat/rfp-orgs-invites-cont`, plan requires `feat/studio-repositioning`). Handled by stashing the one uncommitted file and switching branches before executing any task. Not a deviation — the plan's coordination note specified the correct branch.

## Next Phase Readiness

- `/studio/case-studies` is production-ready for the `feat/studio-repositioning` branch
- Three real case study cards render with full SECTOR / CONSTRAINT / INSTALL / OUTCOME structure
- No NDA placeholder remains on the page
- Ready for 12-02 (next plan in the studio repositioning phase)

---
*Phase: 12-studio-repositioning-v1-1*
*Completed: 2026-05-10*
