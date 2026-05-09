# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** The AI operating system brain — if this breaks, everything downstream breaks
**Current focus:** v2.0 RFP & Proposal Engine — Phase 4 (Foundations & Salvage Port)

## Current Position

**Milestone:** v2.0 RFP & Proposal Engine
**Phase:** 4 of 11 (Phase 4: Foundations & Salvage Port)
**Plan:** 1 of 4 complete (04-01: rfp_* schema + RLS)
**Status:** In progress — Phase 4 Plan 1 complete; Plans 2-4 remaining
**Progress:** [██████░░░░] 57%

Last activity: 2026-05-09 — 04-01 complete: 11 rfp_* tables + tenant-isolation RLS + 6/6 vitest tests passing

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 2
- Average duration: 8 min
- Total execution time: 16 min

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-social-proof | 1 | 7 min | 7 min |
| 02-onboarding-optimization | 2 | 62 min | 31 min |

**v2.0 velocity:** 1 plan completed, 7 min avg

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 04-foundations-salvage-port | P01 | 7 min | 3 | 5 |

## Accumulated Context

### Decisions (carried from v1.0)

Decisions are logged in PROJECT.md Key Decisions table. Notable carries:

- ANLYT-01/02/03 deferred — conversion analytics revisit post-launch
- All four landing page social proof components shipped using named exports (PROOF-04 → PROOF-02 → PROOF-01 page order)
- Onboarding checklist lives in dashboard layout.tsx (every page, not only overview)

### v2.0 Decisions

- Milestone v2.0: RFP & Proposal Engine — first commercial product under The Perpetual Core LLC
- Skip parallel research — pre-staged research in `.planning/research/rfp-engine/` is ground truth
- Salvage from `ldc-command-center` — port file-by-file during the relevant phase (Option 1 from SALVAGE-AUDIT.md); each port is an atomic commit
- SAM.gov key lapsed (smoke test 2026-05-09 returned 401) — Lorenzo re-registers; ~10-day wait gates federal-contract Discovery only
- Federal-grant Discovery (Grants.gov, SBIR, Simpler Grants) unblocks earlier — does not require SAM.gov
- LAUNCH-01 (10 internal dogfood proposals) is a milestone gate between Phase 9 completion and Phase 11 opening to external design partners — not an engineering phase
- ORG-01 and ORG-02 placed in Phase 4 (not Phase 5) because org creation and invite are foundational infrastructure; all engine features scope to a tenant
- ORG-03 and ORG-04 placed in Phase 5 because the org switcher and dual-mode feed are only meaningful once the Discovery feed exists
- Phase 5 (Discovery) and Phase 6 (Capture Profile) can partially overlap — cron runs while vault docs are being collected
- No auto-submission ever — final submit is always human (legal protection + TOS)

### Pending Todos

- (Lorenzo, today) Re-register SAM.gov API key under The Perpetual Core LLC — ~10-day wait
- (Lorenzo, today) Generate Simpler.Grants.gov API key (5 min) — needed to close FOUND-03
- (Lorenzo, this week) Vault collection per `VAULT-CHECKLIST.md` for Uplift, IHA, Perpetual Core — gates Phase 6
- Replace FounderStory photo placeholder with Lorenzo's real headshot (carried from v1.0)
- Swap industry logo placeholders in SocialProofBanner with real partner logos as partnerships signed (carried from v1.0)

### Blockers/Concerns

- SAM.gov key lapsed — federal-contract leg of Discovery (DISC-01 partial) waits ~10 business days; Grants.gov, SBIR, and Simpler Grants unblock Phase 5 earlier
- Vault docs not yet collected — Phase 6 (Capture Profile) gated on MV-bar document collection per `VAULT-CHECKLIST.md`

## Session Continuity

Last session: 2026-05-09
Stopped at: Completed 04-01-PLAN.md (rfp_* schema + RLS + vitest tenant isolation suite 6/6 pass)
Resume file: None
Next action: Execute 04-02-PLAN.md (next plan in Phase 4)

### v2.0 Phase 4 Key Decisions

- SECURITY DEFINER helper functions (`rfp_my_org_ids` et al.) break RLS recursion on `rfp_user_orgs` — all 37 policies use array membership pattern
- `rfp_proposal_sections` and `rfp_compliance_checks` gated via parent `rfp_proposals` subquery (no org_id denorm) — keeps relational integrity
- 3 migration files (schema, RLS policies, RLS fix) — atomic rollback isolation; never amend committed migrations
- vitest `environmentMatchGlobs` for `tests/rls/**` → node environment (not jsdom) for live DB integration tests
