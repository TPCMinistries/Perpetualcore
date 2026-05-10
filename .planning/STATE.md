# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** The AI operating system brain — if this breaks, everything downstream breaks
**Current focus:** v2.0 RFP & Proposal Engine — Phase 5 (Discovery)

## Current Position

**Milestone:** v2.0 RFP & Proposal Engine
**Phase:** 5 of 11 (Phase 5: Discovery)
**Plan:** 3 of 7 complete (05-03: Fit-scoring engine + AI summary + async recompute)
**Status:** In progress — Phase 4 closed; Phase 5 Plans 01–03 complete; Plans 04–07 remaining
**Progress:** [█████░░░░░] 50%

Last activity: 2026-05-10 — 05-03 complete: Fit-scoring engine wired end-to-end. 30/25/20/15/10 weighted score (NAICS/keyword/geo/dollar-band/past-funder) + 4-chip parity contract + 1-2 sentence AI summary (claude-sonnet-4-5 primary, claude-haiku-4-5 fallback) writes to rfp_opp_matches. Both crons hand off ingested opps to scoring (non-fatal on failure). POST /api/rfp/orgs/[orgId]/recompute-scores endpoint provides 202-Accepted async refresh for Phase 6 capture-profile mutations (fire-and-forget via `void recompute(...).catch(log)` since Next 14 lacks `after()`). DISC-03 closed.

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

**v2.0 velocity:** 5 plans completed (Phase 4 P01–P02, Phase 5 P01–P03)

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 04-foundations-salvage-port | P01 | 7 min | 3 | 5 |
| 04-foundations-salvage-port | P02 | 14 min | 3 | 8 |
| 05-discovery | P01 | ~25 min | 3 | 9 |
| 05-discovery | P02 | ~120 min (2 sessions) | 3 | 13 |
| 05-discovery | P03 | ~95 min (2 sessions) | 3 | 6 |

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

Last session: 2026-05-10
Stopped at: Completed 05-03-PLAN.md (fit-scoring engine: 30/25/20/15/10 weights + chip-count parity + AI summary with sonnet-4.5/haiku-4.5 fallback + recompute orchestrators + cron hand-off + async per-org POST endpoint)
Resume file: None
Next action: Execute 05-04-PLAN.md — Feed UI (ranked list + detail pane, infinite scroll, filter pills, fit-score chip)

### v2.0 Phase 5 Key Decisions (Plan 03)

- Weights frozen at 30/25/20/15/10 (NAICS / keyword / geo / dollar-band / past-funder) per TECH-SPEC §4.1; user-tunable weights deferred to Phase 7/10
- Tier thresholds frozen at 90 Strong / 70 Good / 50 Marginal / <50 Weak; tierFor() helper in weights.ts
- Chip-count parity contract: scoreOpportunity ALWAYS returns chips.length === 4. Non-pending rows pad with source-tier fallback (Federal / NY State / NYC / Foundation / Other source); profile-pending rows fill 4 slots deterministically. FeedRow.tsx renders chips[0..3] with zero index guards
- Profile-pending fallback returns fit_score=50 with 'Profile pending' chip — sits in Marginal tier so user sees the row but knows profile isn't dialed in yet
- AI model lineup: claude-sonnet-4-5 primary, claude-haiku-4-5 fallback. ~80 max_tokens cap. Profile-pending case returns literal sentinel; no AI call paid for
- generateFitSummary never throws — every error path (rate limit, network, missing key, empty response) returns null. Caller persists null; FeedRow shows "No summary generated."
- scored_version increments by 1 on every (opp, org) upsert — cache key for AI summary + freshness signal for feed (05-04)
- Cron scoring hand-off wrapped in try/catch; scoring failure is non-fatal — ingest already landed. Response body includes scored:{scored,orgs}|{error}
- recomputeAllForOrg scopes to live opps (deadline IS NULL OR > now()); AI summaries OFF by default. When off, upsert omits summary column so existing prose is preserved
- Recompute endpoint uses `void recompute(...).catch(log)` fire-and-forget — Next 14.x lacks the stable after() API. Idempotent on (opp_id, org_id) so serverless interruption is safe
- 404 (not 403) on non-member orgId — prevents probing for valid org IDs
- Alerts skipped on recomputeAllForOrg path; alerts only fire on cron-discovered new opps (05-07 will subscribe to opp-match INSERTs from cron hand-off)
- Local asyncPool helper (no p-limit dep); concurrency=3 for AI calls, 5-8 for pure scoring
- Federal run.ts: applied the same `{ from: (table: string) => any }` admin client narrowing that run-state-city.ts uses — closes a TS2589/TS2769 gap surfaced by scoped tsc

### v2.0 Phase 5 Key Decisions (Plan 02)

- Regex-bounded HTML extraction over cheerio/jsdom for state/city scrapers — keeps Vercel cold-start fast and avoids a heavy dep for sources that render server-side
- count_anomaly threshold = 50% drop from rolling 3-run baseline; deliberately blunt to avoid noise from normal weekly variance while still catching parser breakage
- Rolling baseline self-heals: recordBaseline runs on every successful scrape, so legitimate long-term shrinks re-establish a new baseline within 3 cron ticks
- Drift = signal, not gate — count_anomaly fires alongside upsert; records always land. Silent breakage is the failure mode being prevented
- Throttled alert emails: at most 1 per (source, reason) per 24h via SELECT-on-insert. Drift rows always persisted regardless of email outcome
- RESEND_FROM_EMAIL fallback chain: RFP_ALERT_FROM_EMAIL ?? RESEND_FROM_EMAIL ?? noreply@perpetualcore.com. Falls through to [DRIFT-ALERT-FALLBACK] console log when Resend rejects (domain unverified)
- Service-only RLS via USING(false) on rfp_source_drift + rfp_source_baseline. Only service_role can read/write. Admin UI in Phase 10
- Local OpportunityInput shape in scrape/types.ts (mirrors but doesn't import from 05-01's normalize.ts) — avoids commit-ordering coupling
- 30-minute offset cron: federal at `0 */6`, state/city at `30 */6` — spreads function-execution load across the hour
- rfp_opportunities source CHECK constraint extended additively to include 'nyc_hra' and 'nyc_doe' (DYCD already permitted by Phase 4 schema)
- Wave 1 commit-granularity deviation: parallel-session executor consolidated Tasks 2+3 into wip(rfp) commits to keep branch clean during handoff. Deliverables functionally complete; SUMMARY documents the deviation

### v2.0 Phase 5 Key Decisions (Plan 01)

- SBIR.gov endpoint RESOLVED: official host is `api.www.sbir.gov`, path `/public/api/solicitations` (per the docs page). Legacy `www.sbir.gov/api/solicitations.json` is permanently 404 post-Drupal-10. CSV bulk path also 404. Phase 04 SBIR-ENDPOINT-UPDATE is closed.
- SBIR API in maintenance as of 2026-05-10 (HTTP 429 with explicit maintenance message). Treated as soft-skip; self-heals when API recovers — no code change needed. Tracked as Phase 05 SBIR-API-MAINTENANCE.
- Federal ingest soft-skip semantics: missing API key OR endpoint maintenance returns `[]` + console log, never throws. `Promise.allSettled` orchestrator means one source's failure never aborts the run.
- Cron `/api/cron/rfp-discovery-federal` on `0 */6 * * *` (every 6h UTC) — bearer-secret auth using existing CRON_SECRET. Idempotent upsert on (source, source_id) refreshes `last_seen_at` on every run.
- `needs_review = true` on Simpler Grants partial rows (missing close_date AND award_ceiling AND agency) — feed UI surfaces them for human cleanup rather than dropping data. Aligns with CONTEXT.md "save raw + flag" decision.
- Rate-limit posture: 200 records/source/run cap (2 paginated pages of 100). Stays well under SAM.gov free-tier 1k/day limit.

### v2.0 Phase 4 Key Decisions (carried)

- SECURITY DEFINER helper functions (`rfp_my_org_ids` et al.) break RLS recursion on `rfp_user_orgs` — all 37 policies use array membership pattern
- `rfp_proposal_sections` and `rfp_compliance_checks` gated via parent `rfp_proposals` subquery (no org_id denorm) — keeps relational integrity
- 3 migration files (schema, RLS policies, RLS fix) — atomic rollback isolation; never amend committed migrations
- vitest `environmentMatchGlobs` for `tests/rls/**` → node environment (not jsdom) for live DB integration tests
- Simpler Grants auth header is X-API-Key per TECH-SPEC §4.1 (not X-Auth as in plan body); to be confirmed when Lorenzo generates the key
- BASE_URLS fallback const in sources.ts guards against Zod parse failure in standalone scripts where Supabase keys are absent from shell
