# Roadmap: Perpetual Core

## Overview

Milestone v1.0 Conversion Optimization takes a fully-built product and optimizes the funnel from visitor to active user. Phase 1 adds manufactured social proof to the landing page. Phase 2 improves the onboarding flow to deliver a guided aha moment. Phase 3 instruments the full funnel with analytics so every improvement is measurable.

Milestone v2.0 RFP & Proposal Engine layers a multi-tenant SaaS product on top of Perpetual Core. It automates the full capture lifecycle — discover opportunities, profile the org, draft proposals in voice, review against funder rubrics, and gate compliance before submit — starting with Uplift/IHA/Perpetual Core as internal dogfood before opening to external customers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### Milestone v1.0 — Conversion Optimization

- [x] **Phase 1: Social Proof** - Add founder credibility, comparison table, and trust signals to the landing page
- [x] **Phase 2: Onboarding Optimization** - Improve the first-use flow to deliver a guided aha moment with activation checklist (completed 2026-02-23)
- [ ] **Phase 3: Conversion Analytics** - Instrument the full funnel with event tracking, UTM attribution, and admin dashboard visualization *(deferred — see PROJECT.md)*

### Milestone v2.0 — RFP & Proposal Engine

- [ ] **Phase 4: Foundations & Salvage Port** - Schema migration, workspace/auth scaffolding ported from ldc-command-center, and external API keys provisioned
- [ ] **Phase 5: Discovery** - Always-on opportunity scanner across 6 sources with fit scoring, org setup, feed UI, and URL importer
- [ ] **Phase 6: Capture Profile** - Vault ingestion, voice fingerprinting, PII redaction, embeddings, and profile editor
- [ ] **Phase 7: Drafting Agent** - Section generation grounded in org vault, both nonprofit and for-profit conventions, with [VERIFY] markers
- [ ] **Phase 8: Reviewer Agent** - Opus 4.7 rubric critic with score, revision requests, and optional revised draft
- [ ] **Phase 9: Compliance Gate** - Pre-submit checks: page limits, formatting, attachments, budget math, eligibility, forms, and deadline buffer
- [ ] **Phase 10: Multi-Tenant Productization** - Stripe plan gating, audit logs, GHL provisioning, outbound webhooks, and public pricing page
- [ ] **Phase 11: Launch (Beta + Public)** - Dogfood gate, 15 design partners, first case study, affiliate program, and public landing page

---

## Phase Details

### Phase 1: Social Proof
**Goal**: Visitors can see credibility signals on the landing page that justify signing up
**Depends on**: Nothing (first phase)
**Requirements**: PROOF-01, PROOF-02, PROOF-03, PROOF-04
**Success Criteria** (what must be TRUE):
  1. Visitor can read a "Built By" section with Lorenzo's story, photo placeholder, and the IHA mission statement
  2. Visitor can compare Perpetual Core vs ChatGPT vs competitors in a feature table showing memory, models, RAG, agents, and pricing differentiators
  3. Visitor can see trust badges (SOC 2 ready, enterprise SSO, 99.9% uptime SLA) on the landing page
  4. Visitor can see a "trusted by X organizations" counter with industry/partner logo placeholders
**Plans:** 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — Create and integrate 4 social proof sections (founder story, comparison table, trust badges, org counter)

### Phase 2: Onboarding Optimization
**Goal**: New users reach an aha moment during their first session and know exactly what to do next
**Depends on**: Phase 1
**Requirements**: ONBD-01, ONBD-02
**Success Criteria** (what must be TRUE):
  1. New user is guided through a contextual first-chat experience that demonstrates persistent memory
  2. New user sees an onboarding checklist that tracks activation milestones (first chat, upload doc, explore agents)
  3. Completed checklist items are visually marked so the user knows what they have and have not done
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Guided first-chat aha moment (onboarding-to-chat redirect with personalized AI greeting)
- [ ] 02-02-PLAN.md — Activation checklist with 3 milestones (first chat, upload doc, explore agents)

### Phase 3: Conversion Analytics
**Goal**: Every step of the visitor-to-active-user funnel is tracked, attributed to campaigns, and visible in the admin dashboard
**Depends on**: Phase 2
**Requirements**: ANLYT-01, ANLYT-02, ANLYT-03
**Success Criteria** (what must be TRUE):
  1. Admin can see a funnel visualization showing drop-off rates at each step (page view, CTA click, signup, first chat, activation)
  2. Custom events fire correctly for all five funnel steps and appear in the tracking store
  3. UTM parameters from marketing links are captured and associated with signups in the admin dashboard
**Plans**: TBD

---

### Phase 4: Foundations & Salvage Port
**Goal**: The full `rfp_*` schema is live with tenant isolation, the workspace/auth/invite scaffolding is ported from ldc-command-center, and all external API keys are provisioned and smoke-tested
**Depends on**: Nothing — parallel to v1.0 deferred phase; only requires existing Perpetual Core auth and Supabase access
**Requirements**: FOUND-01, FOUND-02, FOUND-03, ORG-01, ORG-02
**Success Criteria** (what must be TRUE):
  1. All 11 `rfp_*` tables exist in LDC Brain AI Supabase with RLS policies that pass a tenant-isolation test suite — a user in Org A cannot read Org B's rows
  2. An authenticated user can create an org (name, type, NAICS codes) and invite a collaborator who successfully accepts via the invite flow and receives the correct role
  3. SAM.gov, Simpler.Grants.gov, Grants.gov, and SBIR.gov API keys are set in Vercel env and return non-401 responses in a smoke test script
  4. The workspace-scoped routing and accept-invite pages are live in the Perpetual Core app (ported from ldc-command-center, adapted to `rfp_orgs`)
**Plans:** 4 plans

Plans:
- [ ] 04-01-PLAN.md — rfp_* schema migration (11 tables) + RLS policies + automated tenant-isolation test suite (FOUND-01)
- [ ] 04-02-PLAN.md — RFP source env vars (SAM.gov, Simpler Grants, Grants.gov, SBIR.gov) + smoke-test script (FOUND-03)
- [ ] 04-03-PLAN.md — Org creation flow (POST /api/orgs, /orgs/new form) + workspace-scoped routing port (ORG-01, FOUND-02)
- [ ] 04-04-PLAN.md — Invite + accept-invite port from ldc-command-center, adapted to rfp_org_invites + four-role model (ORG-02, FOUND-02)

**Salvage notes (ldc-command-center):**
- Port `src/app/(auth)/accept-invite/` → org invite accept flow
- Port `src/app/(dashboard)/workspace/[workspaceId]/` → `[orgId]` scoped routing
- Reference `20241127_rfp_enhancements.sql`, `20241208_rfp_revenue_link.sql`, `20241214_rfp_ui_enhancements.sql` as schema references — do NOT run them; write fresh migrations under `rfp_*` namespace
- Existing `SAM_GOV_API_KEY` in env: lapsed (401); Lorenzo re-registers before Phase 4 can close
- ORG-01 and ORG-02 land here because org creation and invite are foundational — they must exist before any other feature can scope to a tenant

---

### Phase 5: Discovery
**Goal**: Users see a live, ranked feed of opportunities from 6 sources matched to their org, can filter and import arbitrary URLs, and receive high-fit alerts
**Depends on**: Phase 4 (rfp_orgs + schema + API keys must exist)
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, ORG-03, ORG-04
**Success Criteria** (what must be TRUE):
  1. A Vercel Cron job runs every 6 hours and new opportunities from SAM.gov, Grants.gov, Simpler.Grants.gov, and SBIR.gov appear in `rfp_opportunities` without manual intervention
  2. NY State Grants Gateway and NYC DYCD/HRA/DOE listings populate on the same cadence; if a source changes structure, a drift alert fires rather than silently missing records
  3. User opens the Discovery feed and sees opportunities ranked by fit score with amount, deadline, source, agency, and brief visible; switching the org switcher immediately rescopes the feed to the selected org
  4. User in `dual` mode sees a combined feed spanning both nonprofit and for-profit orgs they own, with mode filters available
  5. User pastes a foundation or corporate grant URL into Quick Import and the opportunity appears in the feed within 30 seconds, normalized to the standard schema
  6. User whose org scores fit ≥ 80 on a new opportunity receives a Slack, Telegram, or email notification (per their stored preference) without taking any manual action
**Plans**: TBD

**Salvage notes (ldc-command-center):**
- Port `GrantImporter.tsx` → Quick Import URL field (DISC-07); already has Tavily AI fallback for any URL
- Port `app/api/rfp/*` route handlers as base for `GET /api/opps` and `GET /api/opps/:id`; layer new fit-score logic on top
- Port SAM.gov client (already integrated in the v0 API routes) — update API key and endpoint version per spec § 4.1
- Port `RFPClient.tsx` and `RFPSidebar.tsx` → Discovery feed container and detail nav; adapt fit-score display
- ORG-03 (org switcher) and ORG-04 (dual-mode feed) land here because they are only meaningful once the Discovery feed exists to be scoped

---

### Phase 6: Capture Profile
**Goal**: Users can upload their org's vault documents, and the Capture Profile Agent extracts a voice fingerprint, capacity facts, and embeddings that power all downstream drafting
**Depends on**: Phase 4 (rfp_orgs + schema + Storage buckets); Phase 5 can run in parallel
**Requirements**: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06
**Success Criteria** (what must be TRUE):
  1. User can drag-and-drop a PDF, DOCX, or MD file onto the vault upload UI and see it appear in the artifact list with a processing status indicator
  2. After upload, the Capture Profile Agent runs and the org's profile page shows a populated voice fingerprint (register, signature phrases, do-not-use list, exemplar passages), capacity summary, and NAICS chips — without the user having to write any of it
  3. Any SSN, EIN, or full name in an uploaded document is flagged in the UI for human review and excluded from the public retrieval index
  4. A vault artifact chunk can be retrieved via pgvector cosine-similarity search — confirmed by a test query returning relevant passages from a known uploaded document
  5. User can edit any voice fingerprint field inline and save; the change persists and is reflected in subsequent draft generation
**Plans**: TBD

**Salvage notes (ldc-command-center):**
- Port `RFPUploader.tsx` → vault drag-drop upload UI (CAP-01); feeds into Compliance agent input later too
- Reference `proposal_boilerplate` migration → basis for `rfp_vault_artifacts`; add `embedding vector(1024)` column and `source_metadata` jsonb
- Existing `pdf-parse`, `docx`, `@react-pdf/renderer` packages already installed — no new dependencies needed for document parsing

---

### Phase 7: Drafting Agent
**Goal**: Users can generate vault-grounded proposal sections for any opportunity, with [VERIFY] markers for unconfirmed claims and full version history
**Depends on**: Phase 6 (vault artifacts + embeddings must exist to ground drafts); Phase 5 (opportunity linkage)
**Requirements**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04, DRAFT-05, DRAFT-06, DRAFT-07
**Success Criteria** (what must be TRUE):
  1. User clicks "Start Proposal" on any Discovery opportunity and a proposal row is created with the opportunity's metadata pre-populated — no copy-paste required
  2. User selects a section type, pastes a solicitation excerpt, and clicks Generate; a draft appears within 60 seconds citing specific vault artifacts by name, written in the org's documented voice
  3. Every claim in the draft that is not grounded in a vault artifact shows a visually distinct `[VERIFY: ...]` marker; the user cannot reach the submit button while unresolved markers exist
  4. A nonprofit user sees all six nonprofit section types available (Need Statement, Project Approach, Logic Model, Org Capacity, Evaluation Plan, Sustainability); a for-profit user sees the six for-profit types; the correct set appears based on org type
  5. User can save, edit inline, or click Regenerate on any section; each action creates a new version in `rfp_proposal_sections` and the user can navigate version history
**Plans**: TBD

**Salvage notes (ldc-command-center):**
- Port `ProposalBuilder.tsx` → proposal workspace UI; replace old drafting hook with new Claude Managed Agents call
- Port `RFPDetailView.tsx` and `RFPDetailClient.tsx` → single-proposal detail view; adapt to new `rfp_proposals` + `rfp_proposal_sections` schema
- Port `ProposalWizard.tsx` → step-through proposal creation flow (DRAFT-01)
- Port `ProposalEditor.tsx` → section-level editor; wire Save to `rfp_proposal_sections` with `version` increment
- Port `app/api/agents/proposal` and `app/api/agents/rfp` route handlers as base for `POST /api/proposals/:id/sections`; layer vault tools + system prompt from TECH-SPEC Appendix A

---

### Phase 8: Reviewer Agent
**Goal**: Users can run an Opus 4.7 critic against any drafted section and receive a rubric-cited score with revision requests before submitting
**Depends on**: Phase 7 (drafted sections must exist to review)
**Requirements**: REV-01, REV-02, REV-03, REV-04
**Success Criteria** (what must be TRUE):
  1. User pastes or selects a solicitation document and the Reviewer Agent extracts the evaluation rubric — visible as a structured list before running any review
  2. User clicks Review on a drafted section and receives a 0–100 score plus a list of revision requests, each citing the exact rubric language that the draft failed to satisfy
  3. The review optionally returns a revised draft alongside the critique; user can click Accept, edit, or discard without losing the original
  4. A Pro+ user sees the review run automatically after every Generate action, without needing to click Review manually; a Starter user sees a Review button they click on-demand
**Plans**: TBD

**Salvage notes (ldc-command-center):**
- Port `app/api/agents/rfp-analyze` route handler as the basis for the Reviewer agent endpoint (`POST /api/proposals/:id/sections/:section_id/review`); replace existing scoring logic with the Opus 4.7 rubric-critic prompt from TECH-SPEC § 4.4
- `RFPAnalysisPanel.tsx` may already do partial rubric display — port and extend for the score + revision request UI

---

### Phase 9: Compliance Gate
**Goal**: Users can run a full compliance check before submit and receive pass/fail/warn results per rule, persisted for audit
**Depends on**: Phase 7 (full proposal package must exist); Phase 8 recommended but not blocking
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08
**Success Criteria** (what must be TRUE):
  1. User uploads a compiled proposal PDF/DOCX and the Compliance Agent reports whether each section is within the solicitation's page limit — with exact counts per section
  2. The agent checks font size, line spacing, and margins and flags non-compliant sections with the specific requirement violated
  3. The agent produces a checklist of required attachments (W-9, audit, letters of support, certifications) and clearly marks which are present vs. missing
  4. The agent validates budget arithmetic: line items sum correctly, indirect rate is within the solicitation cap, and cost share is met — with a line-item breakdown of any failures
  5. User clicks Run Compliance Check and all results appear in a single dashboard view with overall pass/fail/warn status; results are stored in `rfp_compliance_checks` and remain accessible after the session ends
  6. A 24-hour-buffer deadline warning fires in the correct timezone when the proposal is within 24 hours of the solicitation deadline
**Plans**: TBD

**Salvage notes (ldc-command-center):**
- `pdf-parse`, `docx`, `@react-pdf/renderer` already installed — these power the page count, font, and margin checks (COMP-01, COMP-02) with no new dependencies
- No existing compliance agent in v0 — this agent is fully new; build from TECH-SPEC § 4.5

---

### Phase 10: Multi-Tenant Productization
**Goal**: The engine runs on Stripe-gated plans with full audit logs, GHL provisioning, outbound webhooks, and a public pricing page — ready for external customers
**Depends on**: Phases 4–9 (all engine features must be built before gating them by tier); Phase 9 is the last engine phase
**Requirements**: SAAS-01, SAAS-02, SAAS-03, SAAS-04, SAAS-05, SAAS-06, SAAS-07
**Success Criteria** (what must be TRUE):
  1. A new user who subscribes to any Stripe tier (Starter/Pro/Agency/Enterprise) gets the correct feature set enforced: a Starter user cannot create more than 1 org or 5 drafts per month; a Pro user can access Reviewer and Compliance; an Agency user can manage up to 15 client orgs
  2. Every agent call (Discovery scoring, Capture Profile, Drafting, Reviewer, Compliance) writes a row to `rfp_agent_sessions` with model, tokens, cost USD, and encrypted full prompt+response
  3. A Pro+ tenant can export all agent activity for any proposal as a single audit-trail document — downloadable as PDF or JSON — suitable for a FOIA or funder audit
  4. A new Pro+ tenant's GHL sub-account is provisioned automatically within 5 minutes of signup, without Lorenzo manually intervening
  5. A tenant with a configured webhook URL receives events for `opp.matched`, `draft.complete`, `compliance.failed`, and `proposal.submitted` within 10 seconds of the triggering action
  6. The `/pricing` page renders all four tiers with feature comparison table, FAQ section, and CTAs that route to the correct Stripe checkout
**Plans**: TBD

**Salvage notes (ldc-command-center):**
- Stripe SDK already wired in ldc-command-center — port the product/price ID patterns and adapt to the four new tier definitions (SAAS-01)
- Existing Supabase Auth workspace invite flow (ported in Phase 4) is the foundation for role enforcement in plan-gating middleware (SAAS-02)
- GHL API integration (`app/api/...` provisioning routes if they exist) — check v0 for any GHL sub-account code; if none, build fresh per TECH-SPEC § 2.2
- `GrantPipeline.tsx` pipeline stage view — may be useful for Agency-tier multi-org pipeline dashboard

---

### Phase 11: Launch (Beta + Public)
**Goal**: The engine is live for the public — dogfood gate cleared, 15 design partners onboarded, first case study published, affiliate program active, and the public landing page live
**Depends on**: Phase 10 (Stripe gating must be live before external users are onboarded); LAUNCH-01 (dogfood gate) must clear before LAUNCH-02 opens
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04, LAUNCH-05
**Success Criteria** (what must be TRUE):
  1. At least 10 real proposals for Uplift, IHA, or Perpetual Core have been submitted through the engine (not just drafted — submitted to the funder), establishing a credible dogfood track record
  2. At least 15 external design partners have active Pro accounts with the 60-day free access applied, and at least one has provided written feedback or participated in a feedback call
  3. A public case study page is live describing at least one Uplift proposal win (or meaningful outcome), with specific metrics, and with any required funder permission obtained
  4. An affiliate at `/affiliate` or a dedicated page can apply for the program, and the 25% recurring commission tracking is live in the billing system
  5. The landing page at `perpetualcore.com/engine` renders all required blocks — hero, "What you get" 3-column, "Built for both sides", how-it-works, pricing, FAQ, CTA — without broken links or placeholder text
**Plans**: TBD

**Note on dogfood gate:** LAUNCH-01 is the milestone gate between Phase 9 (engine complete) and Phase 11 opening to external users. After Phase 9 closes, Lorenzo runs the first 10 Uplift submissions through the engine. Only after LAUNCH-01 is satisfied does Phase 11 open design partner access (LAUNCH-02). This mirrors Tech-Spec Phase 6 ("First 10 Uplift submissions") as a verification loop, not an engineering phase.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 (deferred) → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

Phase 5 and Phase 6 may run partially in parallel (Discovery cron runs while vault collection happens).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Social Proof | 1/1 | Complete | 2026-02-23 |
| 2. Onboarding Optimization | 2/2 | Complete | 2026-02-23 |
| 3. Conversion Analytics | 0/TBD | Deferred | - |
| 4. Foundations & Salvage Port | 0/4 | Not started | - |
| 5. Discovery | 0/TBD | Not started | - |
| 6. Capture Profile | 0/TBD | Not started | - |
| 7. Drafting Agent | 0/TBD | Not started | - |
| 8. Reviewer Agent | 0/TBD | Not started | - |
| 9. Compliance Gate | 0/TBD | Not started | - |
| 10. Multi-Tenant Productization | 0/TBD | Not started | - |
| 11. Launch (Beta + Public) | 0/TBD | Not started | - |
