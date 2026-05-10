# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** The AI operating system brain — if this breaks, everything downstream breaks
**Current focus:** v2.0 RFP & Proposal Engine — Phase 5 (Discovery)

## Current Position

**Milestone:** v2.0 RFP & Proposal Engine
**Phase:** 5 of 11 (Phase 5: Discovery)
**Plan:** 1 of 7 complete (05-01: Federal Discovery ingestion)
**Status:** In progress — Phase 4 closed; Phase 5 Plan 01 complete; Plans 02-07 remaining
**Progress:** [████░░░░░░] 40%

Last activity: 2026-05-10 — 12-05 checkpoint (Tasks 1-3 of 4 complete): EarlyAccessForm with Stripe Elements + 3DS-resume logic built (f2bfb61); /products/vellum updated with #early-access section + unconditional IHA hyperlink, STUDIO-LK-01 closed (1c0bd3a); /admin/vellum-waitlist server component with auth gate + CSV export built (051ecc0). Task 4 awaiting Lorenzo 6-signup Stripe test verification before STUDIO-VW-01 can close.

Previous: 2026-05-10 — 12-02 complete (studio repositioning, Atlas Discovery): /products/atlas-discovery page with hero/what's-included/pricing/intake form; cross-links from /products/atlas and footer; /api/contact-sales extended with optional product field + createAdminClient() switch; sales_contacts table created in LDC Brain AI Supabase (was missing from remote); dual-filter routing (product='atlas-discovery' OR message ILIKE '%Atlas Discovery intake%') verified live.

Previous: 2026-05-10 — 05-01 complete: federal Discovery cron live (SAM.gov + Grants.gov + Simpler.Grants.gov + SBIR.gov), 6h cadence on /api/cron/rfp-discovery-federal, idempotent upsert keyed on (source, source_id), soft-skip on missing keys / endpoint maintenance. SBIR.gov endpoint resolved (api.www.sbir.gov/public/api/solicitations) — currently in maintenance, self-heals.

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
| 04-foundations-salvage-port | P02 | 14 min | 3 | 8 |
| 05-discovery | P01 | ~25 min | 3 | 9 |
| Phase 12-studio-repositioning-v1-1 P01 | 2 | 1 tasks | 1 files |
| Phase 12-studio-repositioning-v1-1 P03 | 18 | 2 tasks | 4 files |
| 12-studio-repositioning-v1-1 | P04 | 9 min | 3 | 4 |
| Phase 12-studio-repositioning-v1-1 P02 | 10 | 3 tasks | 6 files |
| Phase 12-studio-repositioning-v1-1 P05 | pending | 3 tasks | 5 files |

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
Stopped at: 12-05-PLAN.md Task 4 checkpoint (human-verify) — Tasks 1-3 committed, awaiting Stripe test signups verification
Resume file: None
Next action: After Lorenzo completes Task 4 verification (6 test signups at /products/vellum#early-access), continue with STUDIO-VW-01 closure. Then execute remaining Phase 12 plans.

### Phase 12 Studio Repositioning Key Decisions (Plan 05)

- @stripe/stripe-js + @stripe/react-stripe-js installed (Rule 3 auto-fix — missing Stripe Elements client packages, not previously in package.json)
- Admin page uses server-component auth pattern via checkAdminAccess() from lib/admin/checkAdmin.ts; CSV export extracted to VellumWaitlistClient.tsx (client component) to avoid "use client" on whole page
- IHA hyperlinks use single-line attr format (href + rel on same line) to satisfy grep-based STUDIO-LK-01 verification check pattern
- STUDIO-LK-01 vellum coverage: unconditional IHA hyperlinks added to /products/vellum 10% callout (two instances, commit 1c0bd3a) — plan explicitly owned this edit; closed

### Phase 12 Studio Repositioning Key Decisions (Plan 04)

- Email template returns HTML string, not JSX — matches existing codebase pattern (sendEmail helpers in lib/email/index.ts)
- 30% mission-driven discount sourced from BRAND_ARCHITECTURE.md §8 Lorenzo's locks (2026-05-10); hardcoded string, not parameterized
- Stripe apiVersion "2024-12-18.acacia" used to match existing repo convention; Stripe v19 type mismatch is pre-existing, deferred for upgrade pass
- Migration applied via `supabase db query --linked` (not db push) because remote migration history was ahead of local; on-disk .sql is repo source of truth
- vellum_early_access is append-only — no UPDATE/DELETE policies; app dedupes by email + most-recent on read

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
