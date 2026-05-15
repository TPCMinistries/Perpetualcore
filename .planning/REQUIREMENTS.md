# Requirements: Perpetual Core

**Defined:** 2026-02-23 (v1.0) · 2026-05-09 (v2.0) · 2026-05-15 (v4.0)
**Core Value:** The AI operating system brain — if this breaks, everything downstream breaks

*Note (2026-05-15): Milestone v3.0 (Studio Polish & Launch — Phase 12) is tracked in ROADMAP.md but didn't add new REQ-IDs; its scope was a polish pass over v2.0 surfaces + repositioning copy. v4.0 supersedes ANLYT-01/02/03 from v1.0 Deferred into active Phase 18.*

---

## v1.0 Requirements (Conversion Optimization — shipped)

### Social Proof

- [x] **PROOF-01**: Visitor sees "Built By" founder section with Lorenzo's story, photo placeholder, and IHA mission on landing page
- [x] **PROOF-02**: Visitor sees feature comparison table (Perpetual Core vs ChatGPT vs competitors) with clear differentiators across memory, models, RAG, agents, and pricing
- [x] **PROOF-03**: Landing page displays security/compliance trust badges (SOC 2 ready, enterprise SSO, 99.9% uptime SLA)
- [x] **PROOF-04**: Landing page shows "trusted by X organizations" counter with industry/partner logo placeholders

### Onboarding Optimization

- [x] **ONBD-01**: Existing onboarding flow analyzed and improved — guided first-use experience leads to aha moment (contextual AI chat that demonstrates persistent memory)
- [x] **ONBD-02**: New user receives onboarding checklist tracking key activation milestones (first chat, upload doc, explore agents)

### Conversion Analytics (deferred — see Deferred section)

---

## v2.0 Requirements (RFP & Proposal Engine)

Multi-tenant SaaS RFP & Proposal Engine: Discovery → Capture Profile → Drafting → Review → Compliance → Submit. Internally dogfooded on Uplift, IHA, and Perpetual Core; sold externally.

### Foundations

- [x] **FOUND-01**: Schema migration creates the full `rfp_*` namespace (`rfp_orgs`, `rfp_users`, `rfp_user_orgs`, `rfp_capture_profiles`, `rfp_vault_artifacts`, `rfp_opportunities`, `rfp_opp_matches`, `rfp_proposals`, `rfp_proposal_sections`, `rfp_compliance_checks`, `rfp_agent_sessions`) with RLS policies enforcing tenant isolation per `rfp_user_orgs`
- [ ] **FOUND-02**: Workspace + auth + accept-invite scaffolding ported from `ldc-command-center` and adapted to `rfp_orgs` multi-tenancy
- [x] **FOUND-03**: External API keys provisioned in Vercel env: SAM.gov (re-registered), Simpler.Grants.gov, plus verified Grants.gov + SBIR.gov endpoints

### Discovery

- [x] **DISC-01**: Cron worker scans SAM.gov, Grants.gov, Simpler.Grants.gov, and SBIR.gov every 6 hours; persists normalized opportunities to `rfp_opportunities`
- [ ] **DISC-02**: Per-source web scrapers for NY State Grants Gateway and NYC DYCD / HRA / DOE Discretionary listings populate `rfp_opportunities` on the same cadence with throttling and schema-drift alerting
- [ ] **DISC-03**: Per-org fit-scoring function (30% NAICS, 25% keyword alignment, 20% geo, 15% dollar-size band, 10% past-funder) writes to `rfp_opp_matches` for every active org per opportunity
- [ ] **DISC-04**: User sees Discovery feed with ranked opportunities showing fit score, win probability, amount, deadline, source, agency, brief
- [ ] **DISC-05**: User can filter Discovery feed by active org, mode (nonprofit / for-profit / dual), source, and deadline window
- [ ] **DISC-06**: User receives Slack, Telegram, or email notification when an opportunity scores fit ≥ 80 for their org (per-org notification preferences)
- [ ] **DISC-07**: User can paste any URL (foundation, corporate, state portal, international) into a "Quick Import" field; universal AI URL importer (salvaged from `ldc-command-center`) extracts and normalizes the opportunity into `rfp_opportunities`

### Org & User Setup

- [ ] **ORG-01**: Authenticated user can create an org with name, type (`nonprofit | forprofit | dual`), and NAICS codes
- [ ] **ORG-02**: User can invite collaborators to an org with role (`owner | writer | reviewer | viewer`); RLS enforces role-based read/write access
- [ ] **ORG-03**: User can switch between multiple orgs via persistent org switcher in the UI; active org scopes Discovery, Vault, Drafts, and Compliance
- [ ] **ORG-04**: User in `dual` mode sees a combined Discovery feed across both nonprofit and for-profit orgs they own

### Capture Profile

- [ ] **CAP-01**: User can upload vault documents (PDF, DOCX, MD) per org via drag-drop UI; files stored in Supabase Storage with per-tenant encryption
- [ ] **CAP-02**: Capture Profile Agent ingests uploaded vault and outputs voice fingerprint (`register`, `signature_phrases`, `do_not_use`, `exemplar_passages`), capacity summary, and NAICS-relevant facts to `rfp_capture_profiles`
- [ ] **CAP-03**: PII redaction pass runs on every document before embedding; SSNs, EINs, full names flagged for human review and excluded from public retrieval
- [ ] **CAP-04**: Vault artifacts are chunked, embedded via BGE-M3, and stored in `rfp_vault_artifacts` for pgvector cosine-similarity retrieval
- [ ] **CAP-05**: User can view per-org Capture Profile page showing voice fingerprint, capacity summary, NAICS chips, recent wins, and the artifact vault list
- [ ] **CAP-06**: User can manually edit voice fingerprint fields; quarterly auto-refresh re-extracts the fingerprint as new vault docs are added

### Drafting

- [ ] **DRAFT-01**: User can start a proposal from any opportunity in Discovery; system creates `rfp_proposals` row with `opp_id` linkage and copies relevant opportunity metadata
- [ ] **DRAFT-02**: User pastes a solicitation excerpt and selects a section type, then clicks Generate; Drafting Agent (Sonnet 4 default, Opus 4.7 for evaluation-critical sections) returns a draft grounded in the org's vault and voice
- [ ] **DRAFT-03**: Drafting Agent supports the six nonprofit section types: Need Statement, Project Approach, Logic Model, Organizational Capacity, Evaluation Plan, Sustainability
- [ ] **DRAFT-04**: Drafting Agent supports the six for-profit section types: Executive Summary, Technical Approach, Past Performance, Management Plan, Pricing Narrative, Differentiators
- [ ] **DRAFT-05**: Drafting Agent uses tools `vault_search`, `get_capacity_facts`, `get_past_wins`, and `flag_for_verification` (Claude Managed Agents runtime, sandboxed)
- [ ] **DRAFT-06**: Drafted sections include `[VERIFY: ...]` markers wherever a claim is not grounded in a vault artifact; markers are visually distinct in the UI and must be resolved before final submit
- [ ] **DRAFT-07**: User can save, edit inline, or regenerate any drafted section; all versions persist in `rfp_proposal_sections` with `version` increment

### Reviewer Sub-Agent

- [ ] **REV-01**: Reviewer Agent extracts the evaluation rubric from a pasted solicitation document
- [ ] **REV-02**: User can run Reviewer on any drafted section; agent (Opus 4.7) returns a 0–100 score plus a list of revision requests, each citing the exact rubric language
- [ ] **REV-03**: Reviewer optionally returns a revised draft alongside the critique; user can accept, edit, or discard
- [ ] **REV-04**: Reviewer runs auto-after-Drafting on Pro+ tiers, on-demand on Starter

### Compliance

- [ ] **COMP-01**: Compliance Agent checks page count per section against solicitation maximum (PDF/docx parsing)
- [ ] **COMP-02**: Compliance Agent verifies font size, line spacing, and margins against solicitation requirements
- [ ] **COMP-03**: Compliance Agent confirms required attachments are present (W-9, audit, letters of support, certifications)
- [ ] **COMP-04**: Compliance Agent validates budget arithmetic (line items sum, indirect rate within cap, cost share met)
- [ ] **COMP-05**: Compliance Agent confirms eligibility (org type, geography, prior award limits)
- [ ] **COMP-06**: Compliance Agent confirms required federal forms present and signed (SF-424, SF-424A, SF-LLL where applicable)
- [ ] **COMP-07**: Compliance Agent emits a 24-hour-buffer deadline warning in the solicitation's timezone
- [ ] **COMP-08**: User can run a full compliance check before submit; results persist in `rfp_compliance_checks` as pass/fail/warn per rule with details JSON

### Multi-Tenant SaaS

- [ ] **SAAS-01**: Stripe products configured for Starter ($299/mo), Pro ($799/mo), Agency ($2,499/mo), and Enterprise (custom annual)
- [ ] **SAAS-02**: Plan-gating middleware enforces tier limits — Starter: 1 user / 1 org / 5 drafts/mo / 10 vault docs; Pro: 5 users / 1 org / 25 drafts / unlimited vault / Reviewer + Compliance enabled; Agency: unlimited users / 15 client orgs / white-label exports; Enterprise: unlimited everything
- [ ] **SAAS-03**: Every agent call writes to `rfp_agent_sessions` with model, tokens, cost USD, and full prompt+response (encrypted at rest with per-tenant keys)
- [ ] **SAAS-04**: User can export full agent activity log for any proposal as a single audit-trail document (FOIA, OIG, or funder audit use)
- [ ] **SAAS-05**: GHL sub-account provisioning fires automatically when a new tenant signs up at Pro+ tier
- [ ] **SAAS-06**: Public pricing page at `/pricing` renders the four tiers with feature comparison, FAQ, and CTAs
- [ ] **SAAS-07**: Outbound webhooks fire on events `opp.matched`, `draft.complete`, `compliance.failed`, `proposal.submitted` to tenant's configured webhook URL

### Launch + GTM

- [ ] **LAUNCH-01**: At least 10 real proposals submitted through the engine for Uplift, IHA, or Perpetual Core (internal dogfood gate before external beta opens)
- [ ] **LAUNCH-02**: 15 external design partners onboarded with 60-day free Pro access in exchange for case-study rights and feedback
- [ ] **LAUNCH-03**: First public case study published from Uplift's dogfood wins (with funder permission where required)
- [ ] **LAUNCH-04**: Affiliate program live — capture consultants earn 25% recurring commission on referrals
- [ ] **LAUNCH-05**: Public landing page live at `perpetualcore.com/engine` with hero, "What you get" 3-column, "Built for both sides", how-it-works, pricing, FAQ, and CTA blocks per `GTM-PLAN.md § 5`

---

## v4.0 Requirements (Business Operations & Revenue Plumbing)

Goal: make perpetualcore.com a functioning business — leads captured + routed, payments verified end-to-end, calendar booking installed, subscription tier identity resolved, social proof published, funnel instrumented, industry pages cascade finished, ecosystem interop documented, SEO foundation laid, subdomain products audited.

Frame: business manager's perspective on operating perpetualcore.com as the front door for the broader IHA / Uplift / DeepFutures / TPC / Sage SaaS ecosystem.

### Lead Capture + CRM (Phase 13)

- [ ] **LEAD-01**: Every form on the marketing site (`/contact-sales`, Vellum waitlist, RFP Sentry early-list, Atlas intake, any other) is verified to deliver to a known destination — CRM, inbox, or Supabase table — with no submission silently dropped
- [ ] **LEAD-02**: New lead submission triggers an email notification to `lorenzo@perpetualcore.com` within 60 seconds with full submission payload + source page
- [ ] **LEAD-03**: Each lead row captures source page URL, UTM parameters (utm_source, utm_medium, utm_campaign), referrer, and timestamp
- [ ] **LEAD-04**: A single canonical lead destination is chosen (CRM tool — HubSpot Free, Pipedrive, or custom Supabase table + Resend pipeline) and all forms route to it
- [ ] **LEAD-05**: Lead status field (new → contacted → qualified → closed-won / closed-lost) is trackable in the canonical destination with manual update by Lorenzo

### Stripe E2E + Activation (Phase 14)

- [ ] **PAY-01**: Signup → Stripe checkout → return-to-app loop is verified end-to-end for each subscription tier (Free / $49 / $99) — including a real successful payment via Stripe test card
- [ ] **PAY-02**: Post-payment landing experience is coherent — decision documented and implemented (keep deprecated `/dashboard/*`, build new onboarding, or redirect to Sage SaaS at sage.perpetualcore.com)
- [ ] **PAY-03**: Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`) are verified to fire and correctly update Supabase tenant state
- [ ] **PAY-04**: Failed-payment recovery flow is documented: dunning emails, grace period, downgrade-to-free behavior all verified
- [ ] **PAY-05**: Every Stripe object (customer, subscription, invoice) is tagged with `metadata.product` so downstream revenue can be attributed to perpetualcore.com vs Sage SaaS vs Atlas vs other products under the same PC LLC Stripe account (`acct_1PaRTgIwAPnWjXP`)

### Calendar + Intake Flow (Phase 15)

- [ ] **INTAKE-01**: A calendar booking widget (Cal.com or SavvyCal — selection documented) is embedded on `/contact-sales` and any other "Schedule a demo" CTA destination
- [ ] **INTAKE-02**: Pre-call qualifying questions are captured before booking confirmation (organization, role, budget band, timeline, what you're hoping to learn)
- [ ] **INTAKE-03**: Lorenzo receives a calendar invite + lead-summary email within 60 seconds of every booking
- [ ] **INTAKE-04**: Confirmation email goes to the prospect with prep materials (case studies, methodology PDF, what to expect on the call)
- [ ] **INTAKE-05**: A 24-hour-before reminder + a 1-hour-before reminder are sent automatically to the prospect

### Subscription Tier Identity (Phase 16)

- [ ] **TIER-01**: A documented decision exists for what the Free/$49/$99 subscription tiers represent — Sage tiers, perpetualcore.com personal subscription, or self-serve killed entirely (decision captured in `.planning/decisions/TIER-IDENTITY.md`)
- [ ] **TIER-02**: `/pricing` copy reflects the decision — tier names match the product they belong to; no orphan "Subscription" labels with unattributed pricing
- [ ] **TIER-03**: Signup flow routes to the correct destination product (e.g. if tiers are folded into Sage, signup CTAs redirect to sage.perpetualcore.com signup)
- [ ] **TIER-04**: Stripe products/prices are renamed/migrated to match new tier identity; legacy SKUs deprecated in Stripe dashboard with metadata pointing to successors

### Social Proof + Testimonials (Phase 17)

- [ ] **PROOF-05**: At least one named client and one quantified outcome is published on the homepage above the fold (with written client permission)
- [ ] **PROOF-06**: At least one full named case study with direct quotes is published at `/studio/case-studies` (replacing or supplementing the abstracted slots)
- [ ] **PROOF-07**: Founder photo on `/about` is real (already shipped — confirm); organization counter on landing page reflects real partnerships, not placeholders
- [ ] **PROOF-08**: Press / publication / podcast mentions (if any) appear as a logo strip on homepage or `/about`

### Funnel Analytics (Phase 18)

- [ ] **ANLYT-01** (revived from v1.0): Conversion funnel tracks drop-off at each step — page view → CTA click → signup OR form submit → first activation event (chat, vellum signup, contact-sales submission, intake-call booked)
- [ ] **ANLYT-02** (revived from v1.0): UTM parameters are captured at first touch and persisted with every signup/lead record for downstream attribution
- [ ] **ANLYT-03** (revived from v1.0): Admin dashboard surfaces funnel metrics (weekly cohort, conversion rate per step, top sources by signup volume) for Lorenzo's weekly review
- [ ] **ANLYT-04**: An analytics tool is selected (PostHog self-host or cloud, Plausible, or Vercel Web Analytics + custom Supabase event log) and instrumented site-wide via a `track-event.ts` wrapper
- [ ] **ANLYT-05**: Five key business events fire as custom events: `form_submitted`, `stripe_checkout_started`, `stripe_checkout_completed`, `intake_call_booked`, `subscription_activated`

### Industry Pages Cascade (Phase 19)

- [ ] **CASCADE-01**: `/solutions/accountants` cascaded to v6 register (template applied, $X/CPA/mo tier, FAQ, 3-band cross-link, final CTA)
- [ ] **CASCADE-02**: `/solutions/agencies` cascaded to v6 register
- [ ] **CASCADE-03**: `/solutions/consulting` cascaded to v6 register
- [ ] **CASCADE-04**: `/solutions/financial-advisors` cascaded to v6 register (preserve $999/advisor/mo if applicable, SEC compliance hedge)
- [ ] **CASCADE-05**: `/solutions/it-services` cascaded to v6 register
- [ ] **CASCADE-06**: `/solutions/real-estate` cascaded to v6 register
- [ ] **CASCADE-07**: `/solutions/sales` cascaded to v6 register

### Ecosystem Interop Audit (Phase 20)

- [ ] **ECO-01**: A map of how perpetualcore.com leads route to / from other ecosystem entities (IHA, Uplift, TPC, DeepFutures, Sage SaaS, lorenzodc.com, Streams of Grace, IHA Academy) is documented in `.planning/ECOSYSTEM-INTEROP.md`
- [ ] **ECO-02**: The 10/15% giving cash-flow is traced from invoice → revenue → IHA bank transfer; documented in `.planning/GIVING-FLOW.md` with any gaps flagged for resolution
- [ ] **ECO-03**: Cross-org lead routing path is documented — e.g. theiha.org visitor wanting Perpetual Core engagement, lorenzodc.com Catalyst customer wanting Sage SaaS, DeepFutures inquiry on perpetualcore.com routed to fund pipeline
- [ ] **ECO-04**: Shared founder/identity surfaces are consistent — same headshot, bio fingerprint, link strategy — across perpetualcore.com, theiha.org, lorenzodc.com (audit + fix list)
- [ ] **ECO-05**: Sage SaaS billing operates under Perpetual Core LLC's existing Stripe account per `[[sage-saas-legal-entity]]` memory — verify metadata.product tagging is consistent, customer migration path from PC subscription → Sage SaaS is documented

### SEO + Discovery Foundation (Phase 21)

- [ ] **SEO-01**: Blog / articles infrastructure exists at `/blog` (or `/writing`) — Next.js MDX or Supabase-backed, with at least 3 published cornerstone articles at milestone close
- [ ] **SEO-02**: JSON-LD structured data (Organization, FounderPerson, Article, Service) is rendered on every public page
- [ ] **SEO-03**: `sitemap.xml` is auto-generated from routes + blog index, submitted to Google Search Console, and refreshes on every deploy
- [ ] **SEO-04**: Open Graph + Twitter Card metadata is verified on every public route (`/`, `/studio/*`, `/products/*`, `/solutions/*`, `/blog/*`, `/about`, `/engine`, `/fund`, `/institute`)
- [ ] **SEO-05**: Internal linking from industry pages → cornerstone articles is wired (each industry page references at least 1 relevant cornerstone)
- [ ] **SEO-06**: Three cornerstone articles published — topics covering one industry deep-dive (e.g. "AI for non-profits in 2026"), one competitive comparison (e.g. "Perpetual Core vs Notion AI vs the model labs"), and one methodology deep-dive (the Eight Registries explained)

### Subdomain Product Audit (Phase 22)

- [ ] **SUBDOMAIN-01**: `atlas.perpetualcore.com` audited — landing page state, conversion path documented, broken links flagged, cross-link integrity to/from main site verified
- [ ] **SUBDOMAIN-02**: `sentinel.perpetualcore.com` — same audit (Phases 1-11 BUILT per [[sentinel-project]] memory; deploy state verified)
- [ ] **SUBDOMAIN-03**: `sage.perpetualcore.com` — same audit; coordination with Sage SaaS Phase 1 (Shell Port) documented; signup flow from perpetualcore.com → sage.perpetualcore.com tested
- [ ] **SUBDOMAIN-04**: `rfp.perpetualcore.com` — same audit; coordination with v2.0 RFP Engine roadmap documented; planned launch state vs current state delta surfaced
- [ ] **SUBDOMAIN-05**: Cross-link integrity from main site → all 4 subdomains is verified — every "Visit X" CTA tested, broken or stale destinations flagged for fix

---

## Deferred

Carried forward but not in any active roadmap.

### Conversion Analytics (from v1.0 — REVIVED in v4.0 Phase 18)

- ~~**ANLYT-01**~~ — Now active in v4.0 Phase 18
- ~~**ANLYT-02**~~ — Now active in v4.0 Phase 18 (renamed ANLYT-03 in new scoping)
- ~~**ANLYT-03**~~ — Now active in v4.0 Phase 18 (renamed ANLYT-02 in new scoping)

*Resolved 2026-05-15: revived into v4.0 milestone alongside fresh analytics infrastructure work (ANLYT-04 tool selection, ANLYT-05 key events).*

### v2.x Candidates

- **WINFEE-01**: Win-fee billing — 1-3% of awarded amount on grants/contracts > $250K, capped at $50K per award (toggle per tenant)
- **WHTLBL-01**: White-label proposal exports for Agency tier (custom logo, theme, footer)
- **CAL-01**: Google Calendar two-way sync for proposal deadlines
- **SMS-01**: Twilio SMS deadline alerts (Pro+ optional)
- **SOC2-01**: SOC 2 Type I documentation package (Enterprise tier requirement)
- **CANDID-01**: Candid Foundation Directory paid-tier integration for richer foundation discovery

### v2.x Content Marketing

- **CONT-01**: Blog section with SEO-optimized articles about AI capture / proposal writing
- **CONT-02**: Case study pages (one per design partner with permission)
- **CONT-03**: Video demo embeds on landing page

---

## Out of Scope

Explicit exclusions with reasoning. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Auto-submission to funder portals | Final submit always human — protects user legally, keeps human accountability per `TECH-SPEC § 11` risk model |
| Real-time agent chat (vs. async drafting) | Async section generation matches how proposals actually get written; chat is a v3 polish item |
| Mobile native apps | Web-first; capture work happens on desktop |
| A/B testing framework | Premature — ship product, observe behavior, then test |
| Referral program (consumer) | Affiliate program (LAUNCH-04) covers the channel partner case; consumer referrals add complexity without obvious payoff pre-launch |
| Google OAuth signup | Email/password sufficient for v2.0; revisit at scale |
| Replacement of v1.0 conversion analytics | Deferred, not killed (see Deferred section) |
| Foundation Directory paid plan | Universal AI URL importer (DISC-07) covers most foundation use cases without the Candid subscription cost |

---

## Traceability

### v1.0 (shipped)

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROOF-01 | Phase 1 | Complete |
| PROOF-02 | Phase 1 | Complete |
| PROOF-03 | Phase 1 | Complete |
| PROOF-04 | Phase 1 | Complete |
| ONBD-01 | Phase 2 | Complete |
| ONBD-02 | Phase 2 | Complete |
| ANLYT-01 | Phase 3 | Deferred |
| ANLYT-02 | Phase 3 | Deferred |
| ANLYT-03 | Phase 3 | Deferred |

### v2.0 (active)

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 4 | Complete |
| FOUND-02 | Phase 4 | Pending |
| FOUND-03 | Phase 4 | Complete |
| ORG-01 | Phase 4 | Pending |
| ORG-02 | Phase 4 | Pending |
| DISC-01 | Phase 5 | Complete |
| DISC-02 | Phase 5 | Pending |
| DISC-03 | Phase 5 | Pending |
| DISC-04 | Phase 5 | Pending |
| DISC-05 | Phase 5 | Pending |
| DISC-06 | Phase 5 | Pending |
| DISC-07 | Phase 5 | Pending |
| ORG-03 | Phase 5 | Pending |
| ORG-04 | Phase 5 | Pending |
| CAP-01 | Phase 6 | Pending |
| CAP-02 | Phase 6 | Pending |
| CAP-03 | Phase 6 | Pending |
| CAP-04 | Phase 6 | Pending |
| CAP-05 | Phase 6 | Pending |
| CAP-06 | Phase 6 | Pending |
| DRAFT-01 | Phase 7 | Pending |
| DRAFT-02 | Phase 7 | Pending |
| DRAFT-03 | Phase 7 | Pending |
| DRAFT-04 | Phase 7 | Pending |
| DRAFT-05 | Phase 7 | Pending |
| DRAFT-06 | Phase 7 | Pending |
| DRAFT-07 | Phase 7 | Pending |
| REV-01 | Phase 8 | Pending |
| REV-02 | Phase 8 | Pending |
| REV-03 | Phase 8 | Pending |
| REV-04 | Phase 8 | Pending |
| COMP-01 | Phase 9 | Pending |
| COMP-02 | Phase 9 | Pending |
| COMP-03 | Phase 9 | Pending |
| COMP-04 | Phase 9 | Pending |
| COMP-05 | Phase 9 | Pending |
| COMP-06 | Phase 9 | Pending |
| COMP-07 | Phase 9 | Pending |
| COMP-08 | Phase 9 | Pending |
| SAAS-01 | Phase 10 | Pending |
| SAAS-02 | Phase 10 | Pending |
| SAAS-03 | Phase 10 | Pending |
| SAAS-04 | Phase 10 | Pending |
| SAAS-05 | Phase 10 | Pending |
| SAAS-06 | Phase 10 | Pending |
| SAAS-07 | Phase 10 | Pending |
| LAUNCH-01 | Phase 11 | Pending |
| LAUNCH-02 | Phase 11 | Pending |
| LAUNCH-03 | Phase 11 | Pending |
| LAUNCH-04 | Phase 11 | Pending |
| LAUNCH-05 | Phase 11 | Pending |

**Coverage:**
- v2.0 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0

*Note: The instructions listed 47 requirements; actual count from the file is 51 (FOUND 3 + DISC 7 + ORG 4 + CAP 6 + DRAFT 7 + REV 4 + COMP 8 + SAAS 7 + LAUNCH 5 = 51). All 51 are mapped.*

---

*Requirements defined: 2026-02-23 (v1.0) · 2026-05-09 (v2.0)*
*Last updated: 2026-05-09 — v2.0 traceability filled by roadmapper*
