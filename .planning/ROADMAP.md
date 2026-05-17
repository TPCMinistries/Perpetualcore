# Roadmap: Perpetual Core

## Overview

Milestone v1.0 Conversion Optimization takes a fully-built product and optimizes the funnel from visitor to active user. Phase 1 adds manufactured social proof to the landing page. Phase 2 improves the onboarding flow to deliver a guided aha moment. Phase 3 instruments the full funnel with analytics so every improvement is measurable.

Milestone v2.0 RFP & Proposal Engine layers a multi-tenant SaaS product on top of Perpetual Core. It automates the full capture lifecycle — discover opportunities, profile the org, draft proposals in voice, review against funder rubrics, and gate compliance before submit — starting with Uplift/IHA/Perpetual Core as internal dogfood before opening to external customers.

Milestone v4.0 Business Operations & Revenue Plumbing makes perpetualcore.com a functioning business. Lead capture is verified and routed. Stripe is tested end-to-end. Calendar booking is installed. Subscription tiers get a real identity. Social proof moves from placeholder to named client. Funnel analytics revive the deferred ANLYT work. Remaining 7 industry pages cascade to the v6 register. Ecosystem interop is documented. SEO and blog infrastructure are laid. Subdomain products are audited.

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

### Milestone v3.0 — Studio Polish & Launch

The v3.0 milestone polishes the Studio Repositioning sprint (rebased and ready to merge as 25 commits on `feat/studio-repositioning`) into ship-ready state. Strategy + 5 copy docs + 3 build sessions landed 2026-05-10; v3.0 closes the gaps the build agents flagged.

- [ ] **Phase 12: Studio Repositioning v1.1** - Real abstracted case studies, Atlas Discovery audit landing page, IHA↔PC bidirectional links, Vellum early-access waitlist, MERGE_PLAN.md deferred items closed

### Milestone v4.0 — Business Operations & Revenue Plumbing

- [ ] **Phase 13: Lead Capture + CRM** - Audit every form on the marketing site, route all submissions to a canonical CRM with email alerts and UTM attribution
- [ ] **Phase 14: Stripe E2E + Activation** - Verify the full signup → checkout → return loop for all tiers, confirm webhook handlers, and define post-payment destination
- [ ] **Phase 15: Calendar + Intake Flow** - Embed calendar booking on /contact-sales with qualifying pre-questions, confirmation email, and automated reminders
- [ ] **Phase 16: Subscription Tier Identity** - Document and implement a decision on what Free/$49/$99 tiers represent; rename Stripe products accordingly
- [ ] **Phase 17: Social Proof + Testimonials** - Publish at least one named client and quantified outcome on the homepage; add one full case study to /studio/case-studies
- [ ] **Phase 18: Funnel Analytics** - Select and instrument an analytics tool site-wide; revive ANLYT-01/02/03; track five key business events
- [ ] **Phase 19: Industry Pages Cascade** - Cascade remaining 7 industry verticals (/solutions/*) to v6 register with pricing band, FAQ, and cross-links
- [ ] **Phase 20: Ecosystem Interop Audit** - Document cross-org lead routing, giving cash-flow trace, shared identity surfaces, and Sage SaaS billing coordination
- [ ] **Phase 21: SEO + Discovery Foundation** - Build blog infrastructure, publish 3 cornerstone articles, add JSON-LD + sitemap + OG metadata across all public routes
- [ ] **Phase 22: Subdomain Product Audit** - Audit atlas/sentinel/sage/rfp.perpetualcore.com for landing page state, conversion paths, and cross-link integrity

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
**Plans:** 2/4 plans executed

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
**Plans:** 2/7 plans complete

Plans:
- [x] 05-01-PLAN.md — Federal Discovery ingestion: SAM.gov + Grants.gov + Simpler.Grants.gov + SBIR.gov cron + normalizer (DISC-01)
- [x] 05-02-PLAN.md — State/city scrapers: NY State + NYC DYCD/HRA/DOE with throttling + structure-drift alerting (DISC-02)
- [ ] 05-03-PLAN.md — Fit scoring engine (30/25/20/15/10) + AI summary + async recompute on capture-profile change (DISC-03)
- [ ] 05-04-PLAN.md — Discovery feed UI: split-pane list/detail + filter pills + OrgSwitcher in dashboard chrome (DISC-04, DISC-05, ORG-03)
- [ ] 05-05-PLAN.md — Quick Import: persistent URL bar + 4-step inline progress + needs-review fallback (DISC-07)
- [ ] 05-06-PLAN.md — Dual-mode feed: union of orgs with Mode filter + scoring-org row badges (ORG-04)
- [ ] 05-07-PLAN.md — Alert delivery: rfp_alert_prefs + email/Telegram/Discord channels + 5/day cap + settings UI (DISC-06)

**Salvage notes (ldc-command-center):**
- Port `GrantImporter.tsx` → Quick Import URL field (DISC-07); already has Tavily AI fallback for any URL
- Port `app/api/rfp/*` route handlers as base for `GET /api/opps` and `GET /api/opps/:id`; layer new fit-score logic on top
- Port SAM.gov client (already integrated in the v0 API routes) — update API key and endpoint version per spec § 4.1
- Port `RFPClient.tsx` and `RFPSidebar.tsx` → Discovery feed container and detail nav; adapt fit-score display
- ORG-03 (org switcher) and ORG-04 (dual-mode feed) land here because they are only meaningful once the Discovery feed exists to be scoped

**Phase 5 deviation note:** CONTEXT.md decision substitutes Discord for Slack at MVP (Lorenzo's call — workforce nonprofits and SBIR teams collaborate in Discord). Slack support is deferred to a follow-up integration phase per `.planning/phases/05-discovery/deferred-items.md` (SLACK-CHANNEL-INTEGRATION).

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

### Phase 12: Studio Repositioning v1.1
**Goal**: Polish the studio repositioning sprint into ship-ready state — real abstracted case studies on `/studio/case-studies` (no fabricated metrics), Atlas Discovery audit landing page on the studio site, IHA↔PC bidirectional link audit, Vellum early-access waitlist with Stripe-ready capture flow, and MERGE_PLAN.md deferred items closed.
**Depends on**: `feat/studio-repositioning` merged to main (or branched off if pre-merge); browser QA + counsel review of compliance hedging completed for the base 25-commit sprint
**Requirements**: STUDIO-CS-01, STUDIO-AD-01, STUDIO-LK-01, STUDIO-VW-01, STUDIO-PL-01
**Success Criteria** (what must be TRUE):
  1. `/studio/case-studies` renders 3 real abstracted case study cards (Sector + Constraint + Install + Outcome structure, ~100 words each, no client names, no fabricated metrics) replacing the "Case study available under NDA" stubs
  2. `/products/atlas-discovery` landing page renders with hero, what's-included, intake form, $5,000–$15,000 productized-audit pricing band, and is reachable from the `/products/atlas` by-invitation page
  3. Bidirectional IHA↔PC links verified post-deploy: theiha.org SUSTAIN pillar resolves to perpetualcore.com/engine; perpetualcore.com `/about` + `/engine` resolve to theiha.org with proper rel attributes; both link directions test green from prod
  4. `/products/vellum` has a working early-access waitlist: email + tier preference (Operator $49 / Team $249) capture, persistence in `vellum_early_access` Supabase table, Stripe-ready intent flow (signup intent or deposit, not full checkout); at least 5 internal test signups complete without errors
  5. MERGE_PLAN.md deferred items closed: navbar consolidated to one canonical `<Navbar/>` component everywhere (no per-page implementations), all stale "© 2024" footers bumped to 2026 (verified by grep returning zero matches), mobile responsiveness verified at 375 / 768 / 1024 on every new repositioning page, logo decision documented (real logo wired or "PC" placeholder accepted for v1)
**Plans:** 5/6 plans executed

Plans:
- [ ] 12-01-PLAN.md — Real abstracted case studies on /studio/case-studies (STUDIO-CS-01)
- [ ] 12-02-PLAN.md — /products/atlas-discovery audit landing page + cross-link from /products/atlas (STUDIO-AD-01)
- [ ] 12-03-PLAN.md — IHA↔Perpetual Core bidirectional link audit (STUDIO-LK-01)
- [x] 12-04-PLAN.md — Vellum waitlist data layer: Supabase migration + early-access endpoint + Stripe setup_intent + Resend email (STUDIO-VW-01)
- [ ] 12-05-PLAN.md — Vellum waitlist UI: EarlyAccessForm + /admin/vellum-waitlist + 5-signup verification (STUDIO-VW-01)
- [ ] 12-06-PLAN.md — Deferred-items closure: navbar consolidation, year audit, mobile QA, logo decision (STUDIO-PL-01)

---

### Phase 13: Lead Capture + CRM
**Goal**: Every form on perpetualcore.com delivers its submission to a known destination, Lorenzo receives email alerts within 60 seconds, and every lead is attributed to a source with UTM parameters
**Depends on**: Nothing within v4.0 — can run in parallel with all other milestones; first in v4.0 sequence because no business automation is meaningful without capturing leads
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05
**Success Criteria** (what must be TRUE):
  1. Lorenzo receives an email at `lorenzo@perpetualcore.com` within 60 seconds when any form on the marketing site is submitted (/contact-sales, Vellum waitlist, RFP Sentry early-list, Atlas intake, or any other), and the email contains the full submission payload plus the source page URL
  2. Each lead record in the canonical destination captures utm_source, utm_medium, utm_campaign, referrer, and timestamp — visible without querying the database directly
  3. A single canonical lead destination is chosen and documented; all forms route to it with no submission silently dropped (verified by a test submission from each form)
  4. Lorenzo can update a lead's status (new → contacted → qualified → closed-won / closed-lost) in the canonical destination without opening a code editor
**Plans**: TBD

**Coordination notes:**
- Low conflict risk with v2.0 (RFP Engine) or v3.0 (Studio Polish)
- The `/contact-sales` form and Atlas intake form already exist from Phase 12 (12-02-PLAN.md wired `/products/atlas-discovery` intake to `sales_contacts` table) — audit rather than rebuild
- LEAD-03 UTM attribution prepares data that Phase 18 (ANLYT) will consume; design the schema column names here so Phase 18 doesn't require a migration

---

### Phase 14: Stripe E2E + Activation
**Goal**: The complete signup → Stripe checkout → return-to-app loop is verified for every tier, webhooks correctly update Supabase state, and the post-payment destination is decided and implemented
**Depends on**: Phase 13 (LEAD work reveals current state of CTAs and signup flows, informing what needs to be fixed here); can partially run in parallel
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):
  1. A real Stripe test card completes the Free/$49/$99 signup loop and lands the user at a coherent, intentional post-payment destination — not a blank dashboard or 404
  2. All five Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`) fire in test mode and the corresponding Supabase tenant state updates are verified by direct DB inspection
  3. A simulated failed payment triggers documented dunning behavior: the user receives a recovery email, a grace period is respected, and a non-paying account downgrades to free after the grace window
  4. Every Stripe customer, subscription, and invoice created under the PC LLC account (`acct_1PaRTgIwAPnWjXP`) carries a `metadata.product` tag so revenue can be attributed by product in the Stripe dashboard — verified for at least one test transaction per product (perpetualcore.com, Sage SaaS, Atlas)

**Coordination notes:**
- Coordinate with Sage SaaS Phase 1 (Shell Port) on Stripe product/price ID naming: both PC and Sage SaaS share the same Stripe account (`acct_1PaRTgIwAPnWjXP`); `metadata.product` tagging strategy (PAY-05) must be agreed before either phase runs Stripe migrations
- PAY-02 post-payment destination decision is a prerequisite for Phase 16 (TIER-03); document the decision in `.planning/decisions/TIER-IDENTITY.md` so Phase 16 can reference it
- No conflict with v2.0 RFP Engine Stripe code — v2.0 uses separate Stripe products ($299/$799/$2,499/Enterprise); PAY-05 metadata tagging applies to both without code conflict

---

### Phase 15: Calendar + Intake Flow
**Goal**: A qualified prospect can book a call with Lorenzo directly from the marketing site, with pre-call questions, confirmation materials, and automated reminders handled without manual intervention
**Depends on**: Phase 13 (lead destination canonical — intake bookings should route to the same CRM); Phase 14 can run in parallel
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05
**Success Criteria** (what must be TRUE):
  1. A prospect visits `/contact-sales` (or any "Schedule a demo" CTA destination), completes a pre-booking qualification form (org, role, budget band, timeline, goal), and successfully books a time slot — without emailing Lorenzo manually
  2. Lorenzo receives a calendar invite and a lead-summary email within 60 seconds of every booking, with the pre-call qualifying answers included
  3. The prospect receives a confirmation email with prep materials (case study, methodology PDF, what to expect) immediately after booking
  4. The prospect receives a 24-hour reminder and a 1-hour reminder automatically, without Lorenzo manually sending them

**Coordination notes:**
- Low file-conflict risk with v2.0 or v3.0
- Cal.com or SavvyCal selection decision should be documented in `.planning/decisions/CALENDAR-TOOL.md`
- If Cal.com is selected, prefer Cal.com embed (not redirect) to keep the user on perpetualcore.com for conversion tracking

---

### Phase 16: Subscription Tier Identity
**Goal**: The Free/$49/$99 subscription tiers on perpetualcore.com have a documented, implemented identity — users who sign up arrive at a product that matches what was advertised, with no orphaned "Subscription" labels
**Depends on**: Phase 14 (PAY-02 post-payment destination decision feeds directly into TIER-03 routing decision)
**Requirements**: TIER-01, TIER-02, TIER-03, TIER-04
**Success Criteria** (what must be TRUE):
  1. A written decision document exists at `.planning/decisions/TIER-IDENTITY.md` stating what the three tiers represent (Sage SaaS tiers, PC personal OS tiers, or self-serve killed) — with rationale
  2. The `/pricing` page copy matches the decision: tier names, descriptions, and feature bullets accurately reflect the product a buyer is purchasing; no copy reads "Subscription" without a product name
  3. A user who clicks any "Get Started" or "Subscribe" CTA and completes the flow arrives at the correct destination product — if tiers are Sage, the flow routes to sage.perpetualcore.com; if PC OS, the user lands in the PC dashboard
  4. Legacy Stripe SKUs that no longer map to the new identity are deprecated in the Stripe dashboard with `metadata.successor_price_id` pointing to the current price

**Coordination notes:**
- TIER-04 Stripe SKU migration must coordinate with PAY-05 (Phase 14) metadata tagging — sequence: PAY-05 tagging first, then TIER-04 deprecation
- If tiers fold into Sage SaaS, coordinate with Sage SaaS Phase 1 on signup URL and Stripe product configuration before TIER-03 routing is committed

---

### Phase 17: Social Proof + Testimonials
**Goal**: At least one named client with a quantified outcome is visible above the fold on the homepage, and one full case study with direct quotes is published — replacing placeholders with real evidence
**Depends on**: Nothing within v4.0 — can run in parallel once Phase 13 is underway (lead capture context helps identify who to ask for testimonials); independent of Stripe and calendar work
**Requirements**: PROOF-05, PROOF-06, PROOF-07, PROOF-08
**Success Criteria** (what must be TRUE):
  1. A visitor to the homepage can read at least one named client testimonial with a specific quantified outcome (e.g. "saved X hours/week" or "won $X in grants") above the fold — not behind a scroll or click
  2. A full case study is published at `/studio/case-studies` with a client name, direct quotes, challenge/approach/outcome structure, and written client permission on file
  3. The "trusted by X organizations" counter and org logos on the homepage reflect real partnerships; the founder photo on `/about` is a real, current photo — no placeholders
  4. Any press, podcast, or publication mentions that exist appear as a logo strip on the homepage or `/about` page (if none exist, this criterion is marked N/A and documented)

**Coordination notes:**
- Phase 17 feeds Phase 18 (ANLYT): once real social proof is live, the analytics events `form_submitted` and `stripe_checkout_started` become meaningful to measure conversion impact
- No file-conflict risk with v2.0 or v3.0

---

### Phase 18: Funnel Analytics
**Goal**: An analytics tool is live site-wide tracking the full visitor → lead → customer funnel, five key business events fire correctly, and Lorenzo has a weekly dashboard showing conversion rates and top acquisition sources
**Depends on**: Phases 13–17 should be underway or complete so the funnel events are meaningful; Phase 15 (intake booking) and Phase 13 (form submit) produce the events being tracked
**Requirements**: ANLYT-01, ANLYT-02, ANLYT-03, ANLYT-04, ANLYT-05
**Success Criteria** (what must be TRUE):
  1. Lorenzo can open a dashboard (PostHog, Plausible, Vercel Web Analytics, or equivalent) and see a funnel visualization showing drop-off rates from page view → CTA click → form submit or signup → first activation event
  2. All five custom business events fire correctly in the selected analytics tool: `form_submitted`, `stripe_checkout_started`, `stripe_checkout_completed`, `intake_call_booked`, `subscription_activated` — verifiable by triggering each action in a browser and seeing the event appear in the analytics dashboard within 60 seconds
  3. UTM parameters from a test campaign link are captured at first touch and associated with the resulting signup or lead record in Supabase — visible in the admin dashboard without a SQL query
  4. The admin dashboard surfaces weekly funnel metrics: cohort conversion rate per step, top sources by signup volume — ready for Lorenzo's weekly review

**Note on ANLYT-01/02/03 revival:** These requirements were deferred from v1.0 Phase 3 and are now active in v4.0 Phase 18. The v4.0 scoping adds ANLYT-04 (tool selection + `track-event.ts` wrapper) and ANLYT-05 (five key events) as prerequisites that the v1.0 deferred scope assumed would already exist. Phase 18 closes v1.0 Phase 3 permanently.

**Coordination notes:**
- No file-conflict risk with v2.0 RFP Engine territory (`lib/rfp/`, `app/(rfp-marketing)/`, `app/api/cron/`)
- Analytics instrumentation touches marketing pages and the signup/checkout flow — coordinate with Phase 14 (Stripe) to ensure `stripe_checkout_started` fires before the Stripe redirect, not after

---

### Phase 19: Industry Pages Cascade
**Goal**: All 7 remaining `/solutions/*` industry verticals are cascaded to the v6 register — same template, pricing band, FAQ, and cross-links as the 5 verticals shipped in v3.0
**Depends on**: Phase 12 (v3.0 Studio Repositioning v1.1) establishes the v6 register template that all cascade pages must match; v6 template must be finalized before cascade begins
**Requirements**: CASCADE-01, CASCADE-02, CASCADE-03, CASCADE-04, CASCADE-05, CASCADE-06, CASCADE-07
**Success Criteria** (what must be TRUE):
  1. All 7 pages (`/solutions/accountants`, `/solutions/agencies`, `/solutions/consulting`, `/solutions/financial-advisors`, `/solutions/it-services`, `/solutions/real-estate`, `/solutions/sales`) render without errors, match the v6 register template (pricing band, FAQ block, 3-band cross-link, final CTA), and link to at least one relevant SEO cornerstone article (Phase 21)
  2. `/solutions/financial-advisors` retains the $999/advisor/mo pricing and SEC compliance hedge language if applicable — pricing decision documented in the page's frontmatter or a comment
  3. A grep or automated check confirms no `/solutions/*` page is still on a pre-v6 template (no stale hero text, no missing pricing band)

**Coordination notes:**
- Phase 19 touches `app/solutions/*` — coordinate with any open v3.0 Studio Polish work still on the `feat/studio-repositioning` branch to avoid merge conflicts
- Phase 19 links to Phase 21 cornerstone articles; if Phase 21 runs in parallel, stub the article URLs first and update cross-links after publish
- This phase is independent of v2.0 RFP Engine territory; no conflict risk

---

### Phase 20: Ecosystem Interop Audit
**Goal**: The cross-org relationships between perpetualcore.com and the broader ecosystem are documented — lead routing paths, giving cash-flow trace, shared identity surfaces, and Sage SaaS billing coordination
**Depends on**: Phase 14 (PAY-05 Stripe metadata tagging informs ECO-05 Sage SaaS billing coordination); otherwise independent
**Requirements**: ECO-01, ECO-02, ECO-03, ECO-04, ECO-05
**Success Criteria** (what must be TRUE):
  1. `.planning/ECOSYSTEM-INTEROP.md` exists and maps how leads route to and from perpetualcore.com across all 8 ecosystem entities (IHA, Uplift, TPC, DeepFutures, Sage SaaS, lorenzodc.com, Streams of Grace, IHA Academy) — including the "theiha.org visitor wanting PC engagement" and "DeepFutures inquiry on PC" routing scenarios
  2. `.planning/GIVING-FLOW.md` traces the 10/15% giving cash-flow from invoice → revenue → IHA bank transfer; any gap (missing step, undocumented trigger, unverified transfer) is flagged with a resolution action item
  3. A single audit document confirms that Lorenzo's headshot, bio fingerprint, and link strategy are consistent (or flags the delta) across perpetualcore.com, theiha.org, and lorenzodc.com
  4. Sage SaaS billing under the PC LLC Stripe account is confirmed consistent with `metadata.product` tagging from Phase 14 (PAY-05); the customer migration path from a PC subscription to Sage SaaS is documented

**Coordination notes:**
- Phase 20 is a documentation-and-audit phase — zero file-conflict risk with v2.0 or v3.0 code
- ECO-05 requires PAY-05 (Phase 14) to be complete or at least decided before the Sage SaaS billing coordination can be documented accurately
- Outputs (ECOSYSTEM-INTEROP.md, GIVING-FLOW.md) live in `.planning/` — no production code changes

---

### Phase 21: SEO + Discovery Foundation
**Goal**: perpetualcore.com has a blog/articles infrastructure with 3 cornerstone articles published, JSON-LD structured data on every public page, an auto-generated sitemap, and verified OG metadata across all routes
**Depends on**: Phase 19 (industry pages need cross-links wired to cornerstone articles — parallel is fine if stubs are placed first); otherwise independent
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06
**Success Criteria** (what must be TRUE):
  1. A blog or articles section exists at `/blog` (or `/writing`) — navigable from the main site nav — with at least 3 published cornerstone articles visible without authentication
  2. Google Search Console confirms `sitemap.xml` is submitted and the index includes marketing routes (`/`, `/studio/*`, `/products/*`, `/solutions/*`, `/blog/*`, `/about`, `/engine`, `/fund`, `/institute`)
  3. A spot-check of 5 arbitrary public routes using a browser extension or `curl` confirms JSON-LD structured data (Organization, FounderPerson, Article where applicable, Service) is present and valid
  4. Open Graph and Twitter Card metadata is verified on every public route — a share to social media produces a correct title, description, and image preview (not a blank card or the site default)
  5. Each of the 7 industry pages links to at least 1 relevant cornerstone article in its body content

**Coordination notes:**
- `/blog` infrastructure may introduce new Next.js routes — no conflict with v2.0 RFP Engine routes (`app/(rfp-marketing)/`, `lib/rfp/`)
- Phase 21 runs in parallel with Phase 19; stub article URLs first, then update cross-links after publish

---

### Phase 22: Subdomain Product Audit
**Goal**: All four subdomain products (atlas, sentinel, sage, rfp.perpetualcore.com) are audited for landing page state, conversion path integrity, and cross-link health from the main site
**Depends on**: Phases 13–21 can inform what the audit finds, but the audit itself is independent — can run at any point in v4.0
**Requirements**: SUBDOMAIN-01, SUBDOMAIN-02, SUBDOMAIN-03, SUBDOMAIN-04, SUBDOMAIN-05
**Success Criteria** (what must be TRUE):
  1. A written audit report (`.planning/SUBDOMAIN-AUDIT.md`) exists for each of the four subdomains covering: current landing page state (live / placeholder / broken), conversion path (sign up / contact / waitlist — does it work?), and cross-link integrity to/from main site
  2. Every "Visit X" CTA on the main site that points to a subdomain resolves correctly — no 404s, no redirect loops, no stale destinations; broken CTAs are flagged with a fix action item
  3. `sage.perpetualcore.com` signup flow from perpetualcore.com is tested end-to-end and the coordination with Sage SaaS Phase 1 (Shell Port) is documented — including what changes when Sage SaaS Phase 1 completes
  4. `sentinel.perpetualcore.com` deploy state is verified (Phases 1–11 are built per memory note); if not yet deployed, the gap between built state and live state is flagged as a blocker

**Coordination notes:**
- Phase 22 is an audit-and-documentation phase — no production code changes except fixing broken CTAs on the main site
- Coordination with Sage SaaS Phase 1 (Shell Port) is documentation-level: note what will change when that phase runs, so the audit isn't invalidated
- `rfp.perpetualcore.com` audit coordinates with v2.0 Phase 11 (Launch) timeline — document planned vs. current state delta, not a blocker for this phase

---

## Progress

**Execution Order:**
v1.0/v2.0/v3.0: Phases execute in numeric order: 1 → 2 → 3 (deferred) → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

v4.0 sequencing: 13 → 14 → 15/16 (parallel) → 17/18 (parallel) → 19/20/21/22 (parallel)

Phase 5 and Phase 6 may run partially in parallel (Discovery cron runs while vault collection happens).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Social Proof | 1/1 | Complete | 2026-02-23 |
| 2. Onboarding Optimization | 2/2 | Complete | 2026-02-23 |
| 3. Conversion Analytics | 0/TBD | Deferred | - |
| 4. Foundations & Salvage Port | 2/4 | In Progress|  |
| 5. Discovery | 2/7 | In Progress | - |
| 6. Capture Profile | 0/TBD | Not started | - |
| 7. Drafting Agent | 0/TBD | Not started | - |
| 8. Reviewer Agent | 0/TBD | Not started | - |
| 9. Compliance Gate | 0/TBD | Not started | - |
| 10. Multi-Tenant Productization | 0/TBD | Not started | - |
| 11. Launch (Beta + Public) | 0/TBD | Not started | - |
| 12. Studio Repositioning v1.1 | 5/6 | In Progress|  |
| 13. Lead Capture + CRM | 0/TBD | Not started | - |
| 14. Stripe E2E + Activation | 0/TBD | Not started | - |
| 15. Calendar + Intake Flow | 0/TBD | Not started | - |
| 16. Subscription Tier Identity | 0/TBD | Not started | - |
| 17. Social Proof + Testimonials | 0/TBD | Not started | - |
| 18. Funnel Analytics | 0/TBD | Not started | - |
| 19. Industry Pages Cascade | 0/TBD | Not started | - |
| 20. Ecosystem Interop Audit | 0/TBD | Not started | - |
| 21. SEO + Discovery Foundation | 0/TBD | Not started | - |
| 22. Subdomain Product Audit | 0/TBD | Not started | - |
