# Requirements: Perpetual Core RFP & Proposal Engine

**Defined:** 2026-06-05
**Milestone:** v2.0 — Market-Ready & Best-in-Class
**Core Value:** Move an org from discovery → qualified pursuit → draft → compliance → review → submission-ready → post-submission, better than any competitor.

## v2.0 Requirements

Grouped by category. Each maps to exactly one roadmap phase (see Traceability). Phases continue from 13.

### Foundation & Data Model (FND)

- [x] **FND-01**: A unified canonical opportunity model stores both government contracts (NAICS/PSC/set-aside/agency) and grants (CFDA/eligibility/cost-share/funder) in one queryable schema
- [x] **FND-02**: Opportunities ingested from multiple sources are normalized and deduplicated so one real opportunity appears once
- [x] **FND-03**: A pgvector HNSW index + SECURITY DEFINER match RPC enables vault retrieval at >50 docs/org without in-Node cosine
- [x] **FND-04**: Each org has an entitlement record (coverage level + per-operation quotas) independently overridable by an operator

### Discovery & Coverage (DISCO)

- [ ] **DISCO-01**: User sees a single unified feed combining government RFPs and foundation grants
- [ ] **DISCO-02**: Level 1 Federal sources (SAM.gov, Grants.gov, SBIR/STTR) ingest reliably with durable retry and health telemetry
- [ ] **DISCO-03**: Level 2 National sources (50 states + IRS 990 foundation data via ProPublica) ingest, gated by plan entitlement
- [ ] **DISCO-04**: Level 3 Global sources (EU TED, UK Find a Tender, CanadaBuys) ingest, gated by plan entitlement
- [ ] **DISCO-05**: Discovery UI shows verified counts read from `rfp_opportunities` (no static or inflated claims)
- [ ] **DISCO-06**: User can save searches and receive alerts when new matching opportunities appear
- [ ] **DISCO-07**: Each source reports health (last success, row delta, drift) against an SLA; threshold breaches alert the operator
- [ ] **DISCO-10**: The product can ingest opportunities from ANY US state via a declarative connector registry (`rfp_state_coverage`: socrata/ckan/aggregator/scrape) — adding a Socrata/CKAN state needs only a config row, not new code. Tri-state (NY, NYC, NJ) ships live from open-data APIs; ≥20 states live via generic connectors; per-state coverage status is visible. See `.planning/STATE-COVERAGE-PLAN.md` + `.planning/research/STATE-SOURCE-MAP.md`.

### Fit Scoring (SCORE)

- [ ] **SCORE-01**: Each opportunity shows a fit score with a plain-English explanation of why it fits
- [ ] **SCORE-02**: The explanation cites the org's own vault artifacts / prior wins (evidence-grounded, not black-box)
- [x] **SCORE-03**: The score breaks down by dimension (mission fit, eligibility, track record, capacity, funder relationship)
- [x] **SCORE-04**: The score flags disqualifiers (e.g., missing past-performance threshold, ineligible entity type)

### Drafting, Review & Compliance (REVIEW)

- [ ] **REVIEW-01**: System extracts the actual evaluation criteria from a solicitation (gov Section L/M; grant funder priorities) with weights
- [ ] **REVIEW-02**: A multi-agent reviewer panel scores the draft against those extracted criteria, not generic writing quality
- [ ] **REVIEW-03**: Reviewer findings anchor to draft sections with severity and a suggested fix
- [ ] **REVIEW-04**: Compliance gate v1 checks page limits, required attachments, budget math, eligibility, and deadline+timezone before submit
- [ ] **REVIEW-05**: Draft output carries an AI-use disclosure notice and the compliance gate includes an AI-disclosure checklist item (GSA GSAR 552.239-7001 / NIH)
- [ ] **REVIEW-06**: User can upload PDF/DOCX into the vault and attach solicitation documents, parsed reliably on Vercel serverless

### Submission & Amendments (SUBMIT)

- [ ] **SUBMIT-01**: User can assemble a submission packet (sections + attachments + compliance summary + audit trail)
- [ ] **SUBMIT-02**: User can record and track submission status per pursuit
- [ ] **SUBMIT-03**: System re-polls active pursuits and diffs solicitation amendments/addenda against the original capture
- [ ] **SUBMIT-04**: Material amendment changes alert the user and re-trigger compliance/fit checks

### Win/Loss Learning (LEARN)

- [ ] **LEARN-01**: User can record an outcome (won / lost / no-bid) with a short debrief per pursuit
- [ ] **LEARN-02**: Win-rate analytics surface per org (by source, funding type, and score band)

### Billing & Entitlements (BILL)

- [ ] **BILL-01**: Self-serve Stripe checkout for all tiers with trial → automatic org provisioning
- [ ] **BILL-02**: Plans map to coverage levels + quotas; entitlements enforced in app and RLS
- [ ] **BILL-03**: Usage metering uses Stripe Meters (legacy metered prices migrated before live mode)
- [x] **BILL-04**: A per-tenant AI cost ledger enforces a hard spend limit BEFORE each LLM call fires
- [ ] **BILL-05**: Transparent pricing and a risk-reversal guarantee are presented on the pricing surface

### Operator Console & Monitoring (ADMIN)

- [ ] **ADMIN-01**: Operator console shows orgs, drafts/week, reviewer runs, vault chunks, and MRR by tier
- [ ] **ADMIN-02**: Operator sees AI cost and gross margin per org, with budget alarms
- [ ] **ADMIN-03**: Operator sees source health/drift with a manual "rerun now" control
- [ ] **ADMIN-04**: `/api/health/rfp` returns JSON status (scraper last success, drift open, cron last run, error rate) wired to a status monitor
- [ ] **ADMIN-05**: Operator can toggle per-org feature flags / entitlement overrides

### Trust, Security & Legal (TRUST)

- [x] **TRUST-01**: RLS audit passes and a cross-tenant CI test (Org A cannot read Org B's data) is a required check
- [x] **TRUST-02**: Per-tenant isolation for vault + proposals is verified; no service-role misuse in user-context paths
- [x] **TRUST-03**: Legal pages are live: Terms of Service, Privacy Policy, AI-use disclosure
- [x] **TRUST-04**: Data-source ToS compliance verified; no redistribution of license-restricted data (Candid excluded; ProPublica/IRS 990 used)

### Onboarding / First-Time UX (FTUE)

- [ ] **FTUE-01**: A new org reaches first scored opportunities within one session via a ≤5-field setup (org type, mission, geography, funding types)
- [ ] **FTUE-02**: A guided checklist moves the user org → voice → vault → first draft → review
- [ ] **FTUE-03**: Every key surface (Discovery / Proposals / Vault / Voice) has a real empty state with one clear CTA toward first qualified draft

### Launch Readiness (LAUNCH)

- [ ] **LAUNCH-01**: PR #4 is merged to main and production runs from a stable main
- [ ] **LAUNCH-02**: E2E coverage exists on the draft → review → submit critical path
- [x] **LAUNCH-03**: SAM.gov system account is active with key-expiry alerting in place
- [x] **LAUNCH-04**: All inflated/static opportunity-count claims ("80k+") are removed from UI and marketing

## v2.1 Requirements (Deferred)

Tracked, not in this roadmap.

- **SCORE-05**: Fit-score recalibration learns from recorded win/loss outcomes (needs ≥5 outcomes/category)
- **LEARN-03**: Debrief themes feed back into drafting guidance
- **DISCO-08**: World Bank + UNGM global procurement (no public API today)
- **DISCO-09**: Additional state portals beyond the initial national set
- **POST-01**: Post-award financial/reporting tracking (Instrumentl parity)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-submit on the user's behalf | By design, final submission is always human — we get to submit-ready, not past it |
| Candid / Foundation Directory API integration | License prohibits AI/LLM use + redistribution; ProPublica + IRS 990 is the legally clean source |
| Post-award spend tracking | Deferred to v2.1; not required for launch |
| Native mobile app | Web-first; responsive web covers launch |
| Next.js 15 upgrade | Not required for any v2.0 feature; avoid churn |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 14 | Complete |
| FND-02 | Phase 14 | Complete |
| FND-03 | Phase 14 | Complete |
| FND-04 | Phase 14 | Complete |
| DISCO-01 | Phase 15 | Pending |
| DISCO-02 | Phase 15 | Pending |
| DISCO-03 | Phase 16 | Pending |
| DISCO-04 | Phase 16 | Pending |
| DISCO-05 | Phase 15 | Pending |
| DISCO-06 | Phase 16 | Pending |
| DISCO-07 | Phase 15 | Pending |
| DISCO-10 | Phase 16 | Pending |
| SCORE-01 | Phase 18 | Pending |
| SCORE-02 | Phase 18 | Pending |
| SCORE-03 | Phase 18 | Complete |
| SCORE-04 | Phase 18 | Complete |
| REVIEW-01 | Phase 19 | Pending |
| REVIEW-02 | Phase 19 | Pending |
| REVIEW-03 | Phase 19 | Pending |
| REVIEW-04 | Phase 19 | Pending |
| REVIEW-05 | Phase 19 | Pending |
| REVIEW-06 | Phase 19 | Pending |
| SUBMIT-01 | Phase 20 | Pending |
| SUBMIT-02 | Phase 20 | Pending |
| SUBMIT-03 | Phase 20 | Pending |
| SUBMIT-04 | Phase 20 | Pending |
| LEARN-01 | Phase 21 | Pending |
| LEARN-02 | Phase 21 | Pending |
| BILL-01 | Phase 23 | Pending |
| BILL-02 | Phase 23 | Pending |
| BILL-03 | Phase 23 | Pending |
| BILL-04 | Phase 17 | Complete |
| BILL-05 | Phase 23 | Pending |
| ADMIN-01 | Phase 24 | Pending |
| ADMIN-02 | Phase 24 | Pending |
| ADMIN-03 | Phase 24 | Pending |
| ADMIN-04 | Phase 24 | Pending |
| ADMIN-05 | Phase 24 | Pending |
| TRUST-01 | Phase 22 | Complete |
| TRUST-02 | Phase 22 | Complete |
| TRUST-03 | Phase 22 | Complete |
| TRUST-04 | Phase 22 | Complete |
| FTUE-01 | Phase 24 | Pending |
| FTUE-02 | Phase 24 | Pending |
| FTUE-03 | Phase 24 | Pending |
| LAUNCH-01 | Phase 13 | Pending |
| LAUNCH-02 | Phase 25 | Pending |
| LAUNCH-03 | Phase 13 | Complete |
| LAUNCH-04 | Phase 13 | Complete |

**Coverage:**
- v2.0 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---

## Prior Milestone — v1.0 Conversion Optimization (completed / superseded)

Retained for history. These belonged to the parent AI-OS funnel work.

- [x] PROOF-01..04 (Social Proof) — Phase 1, complete
- [x] ONBD-01, ONBD-02 (Onboarding aha + checklist) — Phase 2, complete
- [ ] ANLYT-01..03 (Conversion Analytics) — Phase 3, not started (superseded by RFP focus)

---
*Requirements defined: 2026-06-05*
*Last updated: 2026-06-05 — Traceability populated after roadmap creation (Phases 13-25)*
