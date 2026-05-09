# Requirements: Perpetual Core

**Defined:** 2026-02-23 (v1.0) · 2026-05-09 (v2.0)
**Core Value:** The AI operating system brain — if this breaks, everything downstream breaks

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

- [ ] **FOUND-01**: Schema migration creates the full `rfp_*` namespace (`rfp_orgs`, `rfp_users`, `rfp_user_orgs`, `rfp_capture_profiles`, `rfp_vault_artifacts`, `rfp_opportunities`, `rfp_opp_matches`, `rfp_proposals`, `rfp_proposal_sections`, `rfp_compliance_checks`, `rfp_agent_sessions`) with RLS policies enforcing tenant isolation per `rfp_user_orgs`
- [ ] **FOUND-02**: Workspace + auth + accept-invite scaffolding ported from `ldc-command-center` and adapted to `rfp_orgs` multi-tenancy
- [ ] **FOUND-03**: External API keys provisioned in Vercel env: SAM.gov (re-registered), Simpler.Grants.gov, plus verified Grants.gov + SBIR.gov endpoints

### Discovery

- [ ] **DISC-01**: Cron worker scans SAM.gov, Grants.gov, Simpler.Grants.gov, and SBIR.gov every 6 hours; persists normalized opportunities to `rfp_opportunities`
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

## Deferred

Carried forward but not in any active roadmap.

### Conversion Analytics (from v1.0)

- **ANLYT-01**: Custom events track full funnel: page view → CTA click → signup → first chat → activation
- **ANLYT-02**: Admin dashboard displays conversion funnel visualization with drop-off rates
- **ANLYT-03**: UTM parameter tracking captures marketing campaign attribution

*Reason: needs real funnel traffic to be meaningful. Revisit post-RFP-Engine launch.*

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

Updated during roadmap creation. Empty for v2.0 until roadmapper runs.

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

### v2.0 (active — pending roadmap)

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 → LAUNCH-05 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 47 total
- Mapped to phases: 0 (pending roadmapper)
- Unmapped: 47 ⚠ (until roadmap created)

---

*Requirements defined: 2026-02-23 (v1.0) · 2026-05-09 (v2.0)*
*Last updated: 2026-05-09 — v2.0 requirements added*
