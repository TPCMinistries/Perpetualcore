# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-05)

**Core value:** Move an org from discovery → qualified pursuit → draft → compliance → review → submission-ready → post-submission, better than any competitor.
**Current focus:** v2.0 re-sequenced BEACHHEAD-FIRST (2026-06-06) — see `VISION.md` + ROADMAP "Execution Sequence". Active path: 13(stabilize) → 14 → 22(security) → 17 → 18(scoring) → 19(review/compliance) → 20 → 24-FTUE → dogfood Uplift/IHA. Deferred w/ triggers: 16(all-50/global), 21, 23, 25. Real bottleneck: foundation/tooling (broken worktree node_modules; PR#4 unpushed).

## Current Position

Phase: 13 of 25 (Pre-Work Stabilization)
Plan: 4 of 4 in current phase (13-01 + 13-02 + 13-03 complete; 13-04 at checkpoint — awaiting push approval)
Status: In progress — Phase 13, Plan 04 at human-verify checkpoint (pre-push)
Last activity: 2026-06-06 — 13-04 merge complete locally (d5e9164), build passing, awaiting push to origin/main

Progress: [█░░░░░░░░░] ~8% (v2.0 phases — Phase 13 of 13 phases in v2.0)

## Performance Metrics

**Velocity (v1.0 baseline):**
- Total plans completed: 3
- Average duration: 23 min
- Total execution time: 69 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-social-proof | 1 | 7 min | 7 min |
| 02-onboarding-optimization | 2 | 62 min | 31 min |

**Recent Trend:**
- Last 3 plans: 7 min, 9 min, 53 min
- Trend: Variable (build-heavy plans take longer)

*Updated after each plan completion*
| Phase 13-pre-work-stabilization P01 | 15 | 2 tasks | 1 files |
| Phase 13 P02 | 4 | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.0 scope locked: unified gov+grant discovery, vault-grounded scoring, adversarial rubric review, closed-loop submission, win/loss learning, transparent billing
- BILL-04 (AI cost guardrail) is Phase 17, before first LLM-heavy feature (scoring) — hard constraint
- TRUST/Security (Phase 22) is a hard gate before billing goes live (Phase 23) — per research SUMMARY
- Phase 13 is mandatory pre-work: merge PR #4, purge inflated counts, SAM.gov re-registration (10-day wait)
- Candid/Foundation Directory excluded (license prohibits AI/LLM use) — ProPublica + IRS 990 is the clean path
- Discovery is tiered (L1=federal, L2=national+foundations, L3=global) gated by entitlement, not hardcoded
- [Phase 13-pre-work-stabilization]: Indexed tile tone and operator action driven by indexedCoveragePercent (relative), not hardcoded 80000 raw count — LAUNCH-04
- [Phase 13]: All 18 rfp_source_drift events retrospectively classified: 4 stale-URL, 14 parser-break; ny_state portal session timeout confirmed structural gap (not transient)
- [Phase 13]: nyc_doe has zero baseline recovery rows — source effectively offline until Phase 15 URL audit
- [Phase 13-pre-work-stabilization]: Alert de-dup: 7-day window on last_alerted_at prevents daily re-spam; 21-day threshold gives 6-day buffer over SAM.gov's 15-day renewal window
- [Phase 13-04]: Two-way merge strategy chosen (no squash): 253 feat commits + 114 main commits preserved; next.config.mjs hand-merged with union CSP + main's redirects + feat's PWA register:true
- [Phase 13-04]: Merge commit d5e9164 on local main — verified build exit 0, all 4 key RFP routes present, middleware host-rewrite intact, getUser() before /api/* confirmed

### Pending Todos

- Replace FounderStory photo placeholder with Lorenzo's real headshot (from v1.0)
- Swap industry logo placeholders in SocialProofBanner with real partner logos (from v1.0)
- Submit SAM.gov system account re-registration (Day-1 action, unblocks L1 federal ingest)
- Set up 90-day calendar alert for SAM.gov key expiry before Phase 13 closes

### Blockers/Concerns

- [Phase 13] SAM.gov system account registration has a ~10-day wait; kick off immediately so it doesn't block Phase 15 federal ingest. Grants.gov/SBIR can proceed in parallel.
- [Phase 13 - RESOLVED LOCALLY] PR #4 merge complete on local main (d5e9164, build PASS) — push to origin/main awaiting human approval. Run `git push origin main` from the perpetual-core worktree after reviewing the checkpoint.

## Session Continuity

Last session: 2026-06-06
Stopped at: 13-04-PLAN.md Task 3 checkpoint — merge complete locally, push not yet executed
Resume file: None (reply "push approved" to push, then confirm Vercel deploy + rfp.perpetualcore.com health)
