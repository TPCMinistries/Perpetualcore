# Roadmap: Perpetual Core RFP & Proposal Engine

## Overview

Milestone v1.0 Conversion Optimization shipped Phases 1-2 (Phase 3 superseded by RFP focus). Milestone v2.0 "RFP Engine — Market-Ready & Best-in-Class" runs Phases 13-24. It opens with a stabilization phase that de-risks the codebase before any feature work begins, then builds the load-bearing data foundation, tiered discovery, AI-cost guardrails, explainable scoring, adversarial review with compliance gating, submission tracking, win/loss learning, a security hard gate, live billing, the operator console, first-time UX, and a final E2E launch gate. Every phase delivers a coherent, independently verifiable capability.

## Milestones

- [x] **v1.0 Conversion Optimization** — Phases 1-2 (shipped 2026-02-23; Phase 3 superseded)
- [ ] **v2.0 RFP Engine — Market-Ready & Best-in-Class** — Phases 13-24 (active)

## Execution Sequence — BEACHHEAD-FIRST (overrides strict numeric order, 2026-06-06)

We build depth-over-breadth toward a **design-partner-ready** beachhead (workforce/health CBOs, NY/NJ-metro, dogfooded by Uplift/IHA/TPC) — NOT a 50-state self-serve SaaS first. Full ambition is preserved in `VISION.md` with revisit triggers; nothing is abandoned.

**ACTIVE PATH (in this order):**
1. **Phase 13** — Stabilize (merge PR #4, fix dev tooling, one repo/deploy)
2. **Phase 14** — Canonical data foundation
3. **Phase 22** — Trust/Security (RLS audit + cross-tenant test) — pulled early; gate for any 2nd org
4. **Phase 17** — AI cost guardrail
5. **Phase 18** — Explainable fit scoring (the moat)
6. **Phase 19** — Adversarial review + compliance gate (win-the-bid depth)
7. **Phase 20** — Submission tracking (enough to submit a real bid)
8. **Phase 24 (FTUE slice)** — onboarding good enough for a design partner
9. **→ DOGFOOD:** run live Uplift/IHA/TPC bids; win 2-3. *(Beachhead "done".)*

**DEFERRED — parked in `VISION.md` with triggers (do NOT build until trigger fires):**
- **Phase 16 breadth** (all-50 states, global) → trigger: ≥10 requests for states beyond NY/NJ. *(Framework already built; coverage is config rows.)*
- **Phase 23** self-serve billing + public signup → trigger: ≥3 partners say "I'd pay" + security passed
- **Phase 21** win/loss recalibration → trigger: ≥5 outcomes per category
- **Phase 25** public launch / GTM → trigger: ≥3 published case studies

Beachhead coverage uses what's ALREADY live: federal (SAM/Grants.gov/NIH/NSF) + NYC + NJ-Treasury + foundations. No new discovery breadth needed to win the first bids.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3 …): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)
- ⏸ = DEFERRED per beachhead sequencing above; spec preserved, revisit trigger in `VISION.md`

<details>
<summary>v1.0 Conversion Optimization (Phases 1-2) — SHIPPED 2026-02-23</summary>

- [x] **Phase 1: Social Proof** - Add founder credibility, comparison table, and trust signals to the landing page
- [x] **Phase 2: Onboarding Optimization** - Improve the first-use flow to deliver a guided aha moment with activation checklist

</details>

### v2.0 RFP Engine — Market-Ready & Best-in-Class

- [x] **Phase 13: Pre-Work Stabilization** - Merge PR #4 (pushed to origin/main d5e9164, 2026-06-06, prod 200/no regression), purged inflated counts, SAM.gov key wired + expiry alert armed, drift resolved ✓ COMPLETE
- [x] **Phase 14: Canonical Data Foundation** - Unified opportunity model, dedup, entitlement table, pgvector HNSW match RPC (completed 2026-06-06)
- [ ] **Phase 15: Level-1 Federal Discovery** - SAM.gov/Grants.gov/SBIR ingest with durable jobs, source-health SLA, verified live counts
⏸ - [ ] **Phase 16: Extended Discovery (Levels 2 & 3) + Saved Searches** - Declarative all-50-state connector framework (any state via config row), tri-state live, IRS 990 foundations, global sources, gated by entitlement; saved search alerts
- [ ] **Phase 17: AI Cost Guardrail** - Per-tenant AI cost ledger with hard spend limit enforced before every LLM call
- [ ] **Phase 18: Explainable Fit Scoring** - Vault-grounded fit scores with dimension breakdown, disqualifier flags, and cited evidence
- [ ] **Phase 19: Rubric Review, Compliance Gate & Upload** - Adversarial reviewer panel, rubric extraction, compliance gate v1, AI-use disclosure, PDF/DOCX upload
- [ ] **Phase 20: Submission Tracking & Amendments** - Submission packet assembly, status tracking, amendment diffing, change alerts
⏸ - [ ] **Phase 21: Win/Loss Learning** - Outcome recording, debrief, win-rate analytics by source/type/score band
- [ ] **Phase 22: Trust, Security & Legal** - RLS audit, cross-tenant CI gate, per-tenant vault isolation, legal pages live (4 plans planned 2026-06-06)
⏸ - [ ] **Phase 23: Live Billing & Entitlements** - Stripe live mode, self-serve trial → provisioning, Meters migration, transparent pricing
- [ ] **Phase 24: Operator Console, Monitoring & FTUE** - Admin console, /api/health/rfp, status monitor, first-time UX (≤5-field setup → first scored opps, guided checklist, real empty states)
⏸ - [ ] **Phase 25: Launch Gate** - E2E coverage on draft → review → submit critical path; production stable

## Phase Details

### Phase 13: Pre-Work Stabilization
**Goal**: The codebase is safe to build on — PR #4 merged to main, no inflated claims in the UI, SAM.gov system account re-registered with expiry alerting in place, and all 18 source-drift events resolved
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: LAUNCH-01, LAUNCH-03, LAUNCH-04
**Success Criteria** (what must be TRUE):
  1. `git log origin/main` shows the PR #4 branch commits and production is running from main without regression
  2. No page or marketing surface displays a static or inflated opportunity count ("80k+" or any hardcoded number); counts are either dynamic or absent
  3. SAM.gov system account registration is submitted and a calendar alert exists for the 90-day key expiry cycle
  4. All 18 open source-drift events are resolved or triaged with a clear owner and ETA
**Plans**: 4 plans
- [ ] 13-01-PLAN.md — Purge inflated/static opportunity counts (80k+) from admin/marketing surfaces [LAUNCH-04]
- [ ] 13-02-PLAN.md — Triage all 18 open rfp_source_drift events: classify, resolve quick ones, owner+ETA for the rest [LAUNCH-04]
- [ ] 13-03-PLAN.md — SAM.gov key-expiry alerting (code) + system-account registration handoff + 90-day calendar alert [LAUNCH-03]
- [ ] 13-04-PLAN.md — Safe two-way merge of PR #4 → main with backup, conflict pre-analysis, build/route verify, gated push + rollback [LAUNCH-01]

### Phase 14: Canonical Data Foundation
**Goal**: A single unified schema stores both government contracts and foundation grants; opportunities are deduplicated; each org has a queryable entitlement record; and the pgvector HNSW RPC is live and callable
**Depends on**: Phase 13
**Requirements**: FND-01, FND-02, FND-03, FND-04
**Success Criteria** (what must be TRUE):
  1. A single `rfp_opportunities` table (or equivalent unified view) returns both contract and grant records with all required fields (NAICS/PSC/set-aside for contracts; CFDA/eligibility/cost-share/funder for grants) queryable from a single call
  2. Ingesting the same opportunity twice from two sources results in one row, not two — dedup is verifiable with a script or test
  3. `SELECT match_vault_docs(org_id, query_embedding, 50)` returns results without scanning in Node; the HNSW index is confirmed via `\d rfp_opportunities_embedding_idx` or equivalent
  4. Each org row in `rfp_entitlements` carries coverage level and per-operation quotas; an operator SQL update overrides a single org without affecting others
**Plans**: 4 plans (4/4 COMPLETE — Phase 14 DONE 2026-06-06)
- [x] 14-01-PLAN.md — Add 7 typed contract/grant columns + GIN indexes + backfill to rfp_opportunities [FND-01]
- [x] 14-02-PLAN.md — Swap ivfflat→HNSW + match_vault_docs SECURITY DEFINER RPC + retrieve.ts wiring [FND-03]
- [x] 14-03-PLAN.md — Create rfp_entitlements table + RLS + Stripe webhook tier→coverage upsert [FND-04]
- [x] 14-04-PLAN.md — Dedup verification (unit test + live-DB script) + database.types.ts regen [FND-02]

### Phase 15: Level-1 Federal Discovery
**Goal**: Federal opportunities from SAM.gov, Grants.gov, and SBIR/STTR ingest reliably on a durable job cadence; the discovery feed shows live counts; source health is reported and alerts the operator on SLA breach
**Depends on**: Phase 14
**Requirements**: DISCO-01, DISCO-02, DISCO-05, DISCO-07
**Success Criteria** (what must be TRUE):
  1. Opening the Discovery feed shows a unified list of government contracts and grants with a count pulled live from `rfp_opportunities`, not a static string
  2. A simulated source failure (e.g., toggling the SAM.gov cron off) is detected within the SLA window and fires an operator alert
  3. An ingest run completes, retries on transient failure, and records last-success timestamp and row-delta in the source-health table — visible in logs or a query
  4. All three Level-1 sources (SAM.gov, Grants.gov, SBIR/STTR) have at least one successful ingest run recorded in production
**Plans**: TBD

### Phase 16: Extended Discovery (Levels 2 & 3) + Saved Searches
**Goal**: A declarative state-connector framework gives the product the ability to ingest ANY US state; tri-state (NY/NYC/NJ) + ≥20 states ship live via generic open-data connectors; National (IRS 990 foundations) and global (EU TED, UK, CanadaBuys) sources ingest and gate by entitlement; users can save searches and receive alerts. See `.planning/STATE-COVERAGE-PLAN.md`.
**Depends on**: Phase 15
**Requirements**: DISCO-03, DISCO-04, DISCO-06, DISCO-10
**Success Criteria** (what must be TRUE):
  1. The `rfp_state_coverage` registry exists; a new Socrata/CKAN state is onboarded by inserting a config row (no new code) — verifiable by adding one state and seeing its opportunities ingest
  2. Tri-state (NY, NYC, NJ) returns real open opportunities from open-data APIs, and the fragile NY/NYC scrapers are retired; ≥20 states show `status = live`
  3. A user on a Level-2 plan sees state + foundation results (Level-1 sees an upgrade prompt); Level-3 adds EU TED, UK, CanadaBuys in one feed; per-state coverage status is visible
  4. A user can save a search filter set (keyword + geography + funding type) and receive an alert when a new matching opportunity appears — verifiable by seeding a matching opp and checking delivery
**Plans**: TBD

### Phase 17: AI Cost Guardrail
**Goal**: Every LLM-backed operation is gated by a per-tenant budget check; no LLM call fires when a tenant has exceeded their hard spend limit; cost is ledgered in real time
**Depends on**: Phase 14 (entitlement table), Phase 15 (first LLM context)
**Requirements**: BILL-04
**Success Criteria** (what must be TRUE):
  1. Setting a test org's AI budget to $0.00 and triggering any LLM call (scoring, drafting, review) returns a clear budget-exceeded error — the LLM call is never made, confirmed by zero token usage in logs
  2. A successful LLM call records cost (input tokens × rate + output tokens × rate) in the per-tenant ledger row within the same request lifecycle
  3. After cumulative spend crosses the configured limit mid-session, the next LLM call is blocked — the user sees an actionable message, not a 500 error
**Plans**: TBD

### Phase 18: Explainable Fit Scoring
**Goal**: Every opportunity in the feed has a fit score grounded in the org's vault artifacts; the score explains WHY across five dimensions, flags disqualifiers, and cites specific prior wins or vault evidence
**Depends on**: Phase 14 (HNSW RPC), Phase 15 (discovery data), Phase 17 (AI cost guardrail active)
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04
**Success Criteria** (what must be TRUE):
  1. Clicking an opportunity shows a fit score (0-100 or equivalent) with a plain-English summary of why the org fits or does not fit
  2. The explanation cites at least one vault artifact (prior proposal, award, annual report) by name and links or previews the excerpt it drew from
  3. The score panel breaks down into at least five labeled dimensions (mission fit, eligibility, track record, capacity, funder relationship) each with a sub-score or rating
  4. At least one disqualifier check (e.g., past-performance threshold not met, entity type ineligible) surfaces as a flagged warning when applicable — verifiable by testing against an ineligible opp
**Plans**: TBD

### Phase 19: Rubric Review, Compliance Gate & Upload
**Goal**: Proposals are scored against the actual solicitation rubric by a multi-agent panel; a compliance gate blocks premature submission; AI-use is disclosed; users can upload and parse solicitation PDFs and DOCX files
**Depends on**: Phase 18 (scoring live), Phase 14 (vault model), Phase 17 (AI cost guardrail)
**Requirements**: REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04, REVIEW-05, REVIEW-06
**Success Criteria** (what must be TRUE):
  1. Uploading a federal solicitation PDF extracts Section L/M evaluation criteria (or grant funder priorities) with associated weights — visible in the proposal workspace
  2. Triggering a review run produces reviewer-panel scores anchored to specific draft sections, each with a severity label and a suggested fix — not generic grammar feedback
  3. The compliance gate explicitly checks page limits, required attachments, budget math, eligibility, and deadline+timezone and surfaces a pass/fail checklist the user can see before submitting
  4. Draft output includes an AI-use disclosure notice, and the compliance checklist includes an AI-disclosure line item (GSA GSAR 552.239-7001 / NIH) that the user must acknowledge
  5. A user can upload a PDF or DOCX solicitation document on Vercel serverless and have it parsed into vault chunks without timeout or truncation on a 20-page document
**Plans**: TBD

### Phase 20: Submission Tracking & Amendments
**Goal**: Users assemble a submission packet and track it through its lifecycle; the system monitors live solicitations for amendments and re-triggers compliance and fit checks when material changes appear
**Depends on**: Phase 19 (compliance gate live)
**Requirements**: SUBMIT-01, SUBMIT-02, SUBMIT-03, SUBMIT-04
**Success Criteria** (what must be TRUE):
  1. A user can assemble a submission packet (sections + attachments + compliance summary + full audit trail) and export or review it as a coherent unit before submitting externally
  2. A user can mark a pursuit with a submission status (draft, submitted, awarded, lost, no-bid) and see the current status at a glance on the Proposals list
  3. The system re-polls a tracked solicitation, detects an amendment, diffs it against the original capture, and surfaces the diff to the user within the SLA window
  4. A material amendment (e.g., deadline extension, scope change) triggers a notification to the user and re-queues compliance and fit rechecks — verifiable by seeding an amendment event
**Plans**: TBD

### Phase 21: Win/Loss Learning
**Goal**: Users record pursuit outcomes; win-rate analytics surface patterns by source, funding type, and score band so the org can learn what to pursue more of
**Depends on**: Phase 20 (pursuit lifecycle complete)
**Requirements**: LEARN-01, LEARN-02
**Success Criteria** (what must be TRUE):
  1. A user can open a closed pursuit, select an outcome (won / lost / no-bid), write a short debrief note, and save it — the outcome is visible on the pursuit record
  2. The analytics view shows win rate broken down by at least three dimensions (source, funding type, score band) with counts and percentages, drawing from real recorded outcomes
**Plans**: TBD

### Phase 22: Trust, Security & Legal
**Goal**: RLS is audited and a cross-tenant isolation test is a required CI gate; per-tenant vault isolation is verified; no service-role misuse in user paths; legal pages are live; ToS compliance for data sources is documented
**Depends on**: Phase 14 (entitlements table exists). Pulled EARLY per beachhead sequencing — this is the HARD GATE before any second org goes live (and before Phase 23 billing). Audit scopes to tables/routes that exist NOW (Phase 14 + Phases 04/05/13 routes); later-phase tables are added to the CI test as they ship.
**Requirements**: TRUST-01, TRUST-02, TRUST-03, TRUST-04
**Success Criteria** (what must be TRUE):
  1. A CI test that authenticates as Org A and attempts to read Org B's proposals, vault chunks, and entitlements returns 0 rows (not an error, not data) — this test is a required check in the pipeline
  2. A code audit confirms no user-context API route calls the service-role Supabase client; all user-facing vault and proposal reads go through RLS-enforced paths
  3. Terms of Service, Privacy Policy, and AI-use disclosure pages are publicly accessible at known URLs on the live domain
  4. A documented ToS-compliance review confirms that ProPublica/IRS 990 data is used lawfully and that no Candid data is ingested
**Plans**: 4 plans
- [ ] 22-01-PLAN.md — Cross-tenant RLS test gate: add rfp_entitlements assertion + required test-rls CI job (+ secret human-action) [TRUST-01]
- [x] 22-02-PLAN.md — Documented service-role hygiene audit (route-by-route, dual-client pattern, enrichments check) [TRUST-02]
- [ ] 22-03-PLAN.md — Rewrite /terms + /privacy for RFP engine, create public /ai-disclosure page, allowlist in middleware [TRUST-03]
- [ ] 22-04-PLAN.md — DATA-SOURCE-COMPLIANCE.md: per-source ToS review + Candid exclusion + ProPublica pre-Phase-16 flag [TRUST-04]

### Phase 23: Live Billing & Entitlements
**Goal**: Stripe live mode is active; any visitor can self-serve into a trial that auto-provisions their org; plans map to coverage levels enforced in app and RLS; legacy metered prices are migrated to Stripe Meters; transparent pricing and a risk-reversal guarantee are live on the pricing page
**Depends on**: Phase 22 (Trust/Security hard gate passed)
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-05
**Success Criteria** (what must be TRUE):
  1. A net-new visitor can click "Start trial," complete Stripe checkout in live mode, and land in a provisioned org — no manual step required from the operator
  2. A Level-1 plan user cannot access Level-2 discovery results; attempting to do so shows an upgrade prompt — the gate is enforced by entitlement, not only UI hiding
  3. Usage metering reads from Stripe Meters (not legacy metered prices); upgrading or downgrading a plan correctly adjusts the entitlement record within the same billing cycle
  4. The public pricing page shows tier names, prices, coverage levels, and a risk-reversal guarantee with no contradictions between what is listed and what the system actually enforces
**Plans**: TBD

### Phase 24: Operator Console, Monitoring & FTUE
**Goal**: Operators can see org health, AI cost/margin, source drift, and revenue at a glance; the health endpoint is wired to a status monitor; a new org reaches first scored opportunities in one session via ≤5-field setup; every key surface has a real empty state
**Depends on**: Phase 23 (billing live, full feature set complete)
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, FTUE-01, FTUE-02, FTUE-03
**Success Criteria** (what must be TRUE):
  1. An operator opening the admin console can see, on one screen: active org count, drafts/week, reviewer runs, vault chunk counts, and MRR grouped by tier
  2. The admin console shows AI cost and gross margin per org; an operator can set a budget alarm that fires when a specific org's spend crosses a threshold
  3. An operator can see source health (last success, row delta, drift status) and trigger a manual "rerun now" for any source — the rerun result is visible within 60 seconds
  4. `GET /api/health/rfp` returns JSON with scraper last-success, drift-open count, cron last-run, and error rate — and this endpoint is wired to an uptime or status-page monitor
  5. A brand-new org completes ≤5-field setup (org type, mission, geography, funding types) and sees their first scored opportunities in the same session — no additional config required
  6. Every major empty state (Discovery empty, Proposals empty, Vault empty, Voice empty) shows a real CTA guiding the user toward their first qualified draft
**Plans**: TBD

### Phase 25: Launch Gate
**Goal**: The full critical path from draft → review → submit is covered by E2E tests; production is stable on main; v2.0 is ready to call done
**Depends on**: Phase 24 (all prior phases complete)
**Requirements**: LAUNCH-02
**Success Criteria** (what must be TRUE):
  1. An automated E2E test (Playwright or equivalent) walks draft → compliance review → submission packet assembly → submission status update and passes without manual intervention
  2. The E2E suite runs on CI and blocks merge to main on failure
  3. Production is running from main and the last deployment has no critical errors in logs or the health endpoint — the operator can confirm this by checking `/api/health/rfp`
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Social Proof | v1.0 | 1/1 | Complete | 2026-02-23 |
| 2. Onboarding Optimization | v1.0 | 2/2 | Complete | 2026-02-23 |
| 3. Conversion Analytics | v1.0 | 0/TBD | Superseded | - |
| 13. Pre-Work Stabilization | 3/4 | In Progress|  | - |
| 14. Canonical Data Foundation | 3/4 | Complete    | 2026-06-06 | - |
| 15. Level-1 Federal Discovery | v2.0 | 0/TBD | Not started | - |
| 16. Extended Discovery + Saved Searches | v2.0 | 0/TBD | Not started | - |
| 17. AI Cost Guardrail | v2.0 | 0/TBD | Not started | - |
| 18. Explainable Fit Scoring | v2.0 | 0/TBD | Not started | - |
| 19. Rubric Review, Compliance Gate & Upload | v2.0 | 0/TBD | Not started | - |
| 20. Submission Tracking & Amendments | v2.0 | 0/TBD | Not started | - |
| 21. Win/Loss Learning | v2.0 | 0/TBD | Not started | - |
| 22. Trust, Security & Legal | 4/4 | Complete |  | - |
| 23. Live Billing & Entitlements | v2.0 | 0/TBD | Not started | - |
| 24. Operator Console, Monitoring & FTUE | v2.0 | 0/TBD | Not started | - |
| 25. Launch Gate | v2.0 | 0/TBD | Not started | - |
