# Technical Build Specification — Perpetual Core RFP & Proposal Engine

**Multi-entity proposal, RFP, and grant capture platform**
Prepared for: Lorenzo Daughtry-Chambers (Founder & CEO, IHA / CEO, The Perpetual Core LLC)
Audience: Claude Code (engineering execution agent)
May 2026 · v1.0

---

## 1. Executive Summary

The Perpetual Core RFP & Proposal Engine is a multi-tenant SaaS product built and owned by The Perpetual Core LLC, the technology company in Lorenzo Daughtry-Chambers' venture stack. The Engine automates discovery, drafting, and compliance for proposals, RFPs, and grants, serving both nonprofit and for-profit entities through a single architecture. Internally, it powers Uplift Communities, the Institute for Human Advancement, and The Perpetual Core itself. Externally, it is sold to other 501(c)(3) organizations, mission-driven for-profits, and consulting agencies that manage capture for multiple clients.

This document is the engineering specification for Claude Code to execute. Every section is implementation-ready: data models, API contracts, agent prompts, and deployment paths are spelled out. The product targets 2,500 paying customers within 24 months at a blended ARPU sufficient to clear $20M ARR, while simultaneously expanding Uplift's own contract pipeline through dogfooding.

### 1.1 What we are building

- **Discovery Agent** — always-on opportunity scanner across SAM.gov, Grants.gov, NY State Grants Gateway, NYC DYCD, foundation directories, and SBIR.gov
- **Capture Profile Agent** — ingests an org's past wins, capacity statements, partner letters, financials, and leadership bios; outputs a structured org profile and voice fingerprint
- **Drafting Agent** — generates section-level drafts (Need Statement, Approach, Logic Model, Org Capacity, Eval Plan, Sustainability for nonprofits; Executive Summary, Technical Approach, Past Performance, Management Plan, Pricing Narrative, Differentiators for for-profits) grounded in the org's vault and voice
- **Reviewer Sub-Agent** — grades drafts against the solicitation's evaluation rubric and requests revisions before returning to the user
- **Compliance Agent** — pre-submit gate: page limits, font size, margins, required attachments, budget math, eligibility, due dates and timezones
- **Multi-tenant SaaS shell** — Stripe plan-gating, GHL sub-account provisioning, audit logs, role-based access

### 1.2 Why this hits the $20M target

Three revenue legs, each independently large:
- **Direct SaaS** — Starter ($299/mo), Pro ($799/mo), Agency ($2,499/mo), Enterprise ($25K–$75K/yr). 2,500 Pro customers = $24M ARR.
- **Win fees** — optional 1–3% of awards over $250K. A single $5M HHS award returns $50K–$150K.
- **Uplift contract expansion** — dogfooding the engine on Uplift's own pipeline conservatively unlocks $1M–$10M in additional contract revenue per year, independent of SaaS.

---

## 2. System Architecture

### 2.1 High-level diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  PERPETUAL CORE RFP & PROPOSAL ENGINE                    │
│                  (deployed on Vercel + Supabase)                         │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────────┐
        │                         │                             │
   DISCOVERY                  DRAFTING                     COMPLIANCE
   (cron, always-on)          (Managed Agents)             (pre-submit)
        │                         │                             │
        ▼                         ▼                             ▼
   ┌────────────┐         ┌────────────────┐           ┌──────────────┐
   │ SAM.gov    │         │ Org Voice Vault│           │ Page limits  │
   │ Grants.gov │         │ Past wins,     │           │ Required     │
   │ NY State   │         │ partner ltrs,  │           │ forms        │
   │ DYCD/HRA   │         │ logic models,  │           │ Eligibility  │
   │ Candid     │         │ tech specs     │           │ Budget math  │
   │ SBIR.gov   │         │                │           │ Attachments  │
   └────────────┘         │ + Master Bldg  │           └──────────────┘
                          │   Kit registries│
                          └────────────────┘
```

Three agents, one shared org context layer, three external surfaces.

### 2.2 Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 App Router, React, Tailwind | Already in Perpetual Core stack |
| Backend API | Next.js Route Handlers + Edge Functions | Same repo, no extra infra |
| Database | Supabase Postgres + pgvector | Org vault embeddings live here |
| Auth | Supabase Auth + Row-Level Security | Multi-tenant isolation built in |
| Agent runtime | Claude Managed Agents (Anthropic) | Sandboxed, $0.08/session-hour |
| Model routing | Sonnet 4 default, Opus 4.7 for high-stakes | Cost-tier control |
| Embeddings | BGE-M3 via local on Herald, fallback Voyage | Already in your RAG stack |
| Billing | Stripe + plan-gating middleware | Existing |
| Provisioning | GHL sub-account API per tenant | Existing |
| Discovery cron | Vercel Cron + queue worker | 6-hour scan cadence |
| File storage | Supabase Storage (buckets per tenant) | RFP PDFs, partner letters, exports |
| Observability | Anthropic agent traces + Logflare | Required for audit-grade |

### 2.3 Multi-tenancy model

Every record carries a `tenant_id` (the Org's UUID). Row-Level Security policies enforce that a user can only read and write rows whose `tenant_id` is in their assigned org list. Each tenant is one of three entity types: `nonprofit`, `forprofit`, or `dual` (an operator like Lorenzo who manages both).

```sql
CREATE POLICY tenant_isolation ON proposals
  USING (tenant_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));
```

---

## 3. Data Model

All tables prefix with `rfp_` to namespace cleanly inside the existing Perpetual Core schema. Tables map directly onto the Master Building Kit registry pattern.

### 3.1 Core tables

| Table | Key columns | Purpose |
|-------|------------|---------|
| `rfp_orgs` | `id, name, type (nonprofit\|forprofit\|dual), naics[], voice_fingerprint, capacity_summary` | Tenant root |
| `rfp_users` | `id, email, role (owner\|writer\|reviewer\|viewer)` | User accounts |
| `rfp_user_orgs` | `user_id, org_id, role` | Many-to-many; supports agencies |
| `rfp_capture_profiles` | `org_id, version, profile_json, voice_examples[]` | Org profile snapshots |
| `rfp_vault_artifacts` | `id, org_id, type, title, body, embedding (vector), source_metadata` | Past wins, partner letters, etc. |
| `rfp_opportunities` | `id, source, source_id, title, agency, type, amount, deadline, raw_json, posted_at` | Discovered opportunities |
| `rfp_opp_matches` | `opp_id, org_id, fit_score, win_prob, recommendation, scored_at` | Org-specific match scores |
| `rfp_proposals` | `id, org_id, opp_id, title, status, due_date, owner_user_id` | A proposal in progress |
| `rfp_proposal_sections` | `id, proposal_id, section_type, content, version, last_drafted_by_agent_at` | Section drafts |
| `rfp_compliance_checks` | `id, proposal_id, check_type, status, details_json` | Pre-submit validation |
| `rfp_agent_sessions` | `id, proposal_id, agent (discovery\|drafting\|reviewer\|compliance), session_id, cost_usd, tokens` | Audit trail |

### 3.2 Voice fingerprint structure

Stored on `rfp_orgs.voice_fingerprint` as JSON. The Capture Profile Agent populates this once and refreshes quarterly.

```json
{
  "register": "warm-evidence-based",
  "signature_phrases": ["family-sustaining wages", "community-rooted"],
  "avg_sentence_length": 18,
  "opens_with_data": true,
  "theory_of_change_lang": "systems-level",
  "do_not_use": ["synergy", "leverage"],
  "exemplar_passages": ["<3 short past-win paragraphs>"]
}
```

---

## 4. Agent Specifications

### 4.1 Discovery Agent

- **Trigger:** Vercel Cron every 6 hours per active source
- **Inputs:** All active org capture profiles
- **Outputs:** Rows in `rfp_opportunities` and `rfp_opp_matches`
- **Model:** Haiku 4.5 for scoring, Sonnet 4 for natural-language brief

**Sources and endpoints**

| Source | Endpoint | Auth | Rate limit |
|--------|----------|------|-----------|
| SAM.gov Opportunities | `api.sam.gov/prod/opportunities/v2/search` | API key in query | 1,000/day free |
| Grants.gov | `api.grants.gov/v1/api/search2` | None for search | Generous |
| Simpler Grants | `api.simpler.grants.gov/v1/opportunities/search` | X-API-Key header | 60/min, 10K/day |
| NY State Grants Gateway | Web scrape (no public API) | Cookie session | Throttle 1/min |
| NYC DYCD / HRA / DOE | Web scrape Discretionary listings | None | Throttle 1/min |
| Candid Foundation Directory | `api.candid.org/funder-search` | API key, paid plan | Per plan |
| SBIR.gov | `www.sbir.gov/api/solicitations.json` | None | Generous |

**Scoring logic**

For each new opportunity, run a fit-score function for every active org:

```
fit_score = (
    0.30 * naics_overlap
  + 0.25 * keyword_alignment_with_capacity
  + 0.20 * geo_match
  + 0.15 * dollar_size_in_band
  + 0.10 * past_win_in_same_funder_or_program
) * 100
```

If `fit_score ≥ 80`, generate a 1-paragraph brief via Sonnet 4 and notify the org owner via Slack/Telegram/email per their preferences.

### 4.2 Capture Profile Agent

- **Trigger:** Manual on org onboarding; quarterly auto-refresh
- **Inputs:** Uploaded vault: past proposals, 990s, audits, partner letters, leadership bios, capacity statements
- **Outputs:** `rfp_capture_profiles` row + populated `rfp_vault_artifacts` with embeddings
- **Model:** Opus 4.7 for voice extraction; Haiku 4.5 for chunking and embedding

**System prompt skeleton**

```
You analyze an organization's documents and extract a Capture Profile.
Your outputs MUST be JSON conforming to the schema in section 3.2.
Rules:
  1. Only assert facts present in the documents. Never infer.
  2. For voice, extract 3 exemplar paragraphs that capture the org's
     register most clearly, plus 5-10 signature phrases.
  3. Identify do-not-use words by what is conspicuously absent in their
     winning prose.
  4. Flag any inconsistencies across documents for human review.
```

### 4.3 Drafting Agent

- **Trigger:** User clicks Generate in the UI
- **Inputs:** Solicitation excerpt, target section, org capture profile, vault retrieval results
- **Outputs:** `rfp_proposal_sections` row
- **Model:** Sonnet 4 default. Opus 4.7 for sections > 5 pages or evaluation-critical.
- **Runtime:** Claude Managed Agents (sandboxed, observability built in)
- **System prompt:** see Appendix A

**Tool use**

- `vault_search(query, k)` → returns top-k chunks from `rfp_vault_artifacts` via pgvector cosine similarity
- `get_capacity_facts(category)` → returns structured capacity data (cohort sizes, partners, certifications)
- `get_past_wins(funder, program)` → returns prior wins matching context, for credibility paragraphs
- `flag_for_verification(claim)` → emits a `[VERIFY]` marker the human must resolve before submit

### 4.4 Reviewer Sub-Agent

- **Trigger:** After Drafting Agent returns; or on-demand from UI
- **Inputs:** Draft section, solicitation excerpt, evaluation rubric (extracted from solicitation)
- **Outputs:** Score 0-100, list of revision requests, optional revised draft
- **Model:** Opus 4.7 — this is the high-stakes critic

**System prompt skeleton**

```
You are a federal grant/RFP reviewer. You score the draft against the
evaluation rubric provided. Be brutal but specific. For each revision
request, cite the exact rubric language and propose a concrete fix.
```

### 4.5 Compliance Agent

- **Trigger:** User clicks Run Compliance Check
- **Inputs:** Full proposal package, solicitation requirements
- **Outputs:** Pass/fail per rule; `rfp_compliance_checks` rows
- **Model:** Sonnet 4 with deterministic Python tools

**Checks**

- Page count per section vs. solicitation max
- Font size, line spacing, margins (parse the PDF/docx)
- Required attachments present (W-9, audit, letters of support, etc.)
- Budget arithmetic: line items sum, indirect rate within cap, cost share met
- Eligibility: org type, geography, prior award limits
- Due date in solicitation timezone, with 24-hour buffer warning
- Required forms (SF-424, SF-424A, SF-LLL, etc.) present and signed

---

## 5. API Contracts

All endpoints are Next.js Route Handlers under `app/api/`. Authenticated via Supabase JWT in `Authorization` header. Tenant resolved from JWT claims.

### 5.1 Opportunities

```
GET  /api/opps                     ?org_id=&min_fit=80
GET  /api/opps/:id
POST /api/opps/:id/dismiss
POST /api/opps/:id/start-proposal  → creates rfp_proposals row
```

### 5.2 Capture Profile

```
GET  /api/orgs/:id/profile
POST /api/orgs/:id/profile/refresh
POST /api/orgs/:id/vault          (multipart upload)
GET  /api/orgs/:id/vault          (list)
```

### 5.3 Drafting

```
POST /api/proposals/:id/sections
  body: { section_type, solicitation_excerpt }
  returns: { section_id, content, citations[] }
POST /api/proposals/:id/sections/:section_id/review
  returns: { score, revisions[], optional_revised_content }
```

### 5.4 Compliance

```
POST /api/proposals/:id/compliance-check
  returns: { overall: pass|fail|warn, checks[] }
```

### 5.5 Webhooks (outbound)

```
POST {tenant_webhook_url}
  events: opp.matched, draft.complete, compliance.failed, proposal.submitted
```

---

## 6. Build Sequence

The sequence is designed so Lorenzo can dogfood every phase on Uplift before opening it to external customers.

| Phase | Days | Deliverables | Owner |
|-------|------|--------------|-------|
| 0. Foundations | 1-3 | API keys (SAM, Grants, Simpler Grants); Supabase schema migration; Stripe products configured | Claude Code |
| 1. Discovery v1 | 4-10 | Cron worker, scoring fn, Slack/Telegram notifications, internal dashboard | Claude Code |
| 2. Capture Profile (Uplift, IHA, Perpetual) | 11-21 | Vault upload UI; Capture Profile Agent; voice fingerprints persisted; 3 internal orgs onboarded | Claude Code + Lorenzo |
| 3. Drafting Agent v1 | 15-30 | Sonnet 4 system prompt; vault tool; pgvector retrieval; UI for section draft | Claude Code |
| 4. Reviewer Sub-Agent | 25-35 | Opus 4.7 critic; rubric extractor; revision loop | Claude Code |
| 5. Compliance Agent | 30-45 | PDF parsing, page-count, budget math; SF-424 detector | Claude Code |
| 6. First 10 Uplift submissions | 40-75 | Submit 10-15 real proposals using the engine; track win rate | Lorenzo |
| 7. Multi-tenant productization | 60-90 | Stripe gating, org switcher, GHL provisioning, audit logs, public pricing page | Claude Code |
| 8. External beta (15 design partners) | 75-105 | Onboard 15 nonprofits + for-profits referred by Lorenzo's network | Lorenzo + Sarah |
| 9. Public launch + case study | 100-120 | Uplift case study published; pricing live; affiliate program live | Lorenzo + Sarah |

---

## 7. Security and Audit

- All agent calls logged to `rfp_agent_sessions` with model, tokens, cost, and full prompt+response (encrypted at rest)
- Vault documents encrypted in Supabase Storage with per-tenant keys
- PII redaction pass on any document before embedding (names, SSNs, EINs flagged for review)
- Tenant isolation enforced via RLS, verified by automated test suite on every deploy
- Export of all agent activity for any proposal, in case of FOIA or audit request — this is a real selling point for federal contractors

---

## 8. Unit Economics

| Tier | Price/mo | Avg sessions | Claude cost | Gross margin |
|------|---------|--------------|-------------|--------------|
| Starter | $299 | 12 | ~$30 | ~90% |
| Pro | $799 | 60 | ~$150 | ~81% |
| Agency | $2,499 | 200 | ~$500 | ~80% |
| Enterprise | $2,500-$6,250/mo | Unlimited | Variable | ~75% |

---

## 9. Appendix A — Drafting Agent Master Prompt

```
You are an expert proposal/RFP/grant writer for {{org_name}}, a
{{org_type}} entity.

ORG VOICE: {{voice_fingerprint.register}}
SIGNATURE PHRASES: {{voice_fingerprint.signature_phrases}}
DO NOT USE: {{voice_fingerprint.do_not_use}}

ORG CAPACITY:
{{capacity_summary}}

RECENT WINS:
{{wins[]}}

VAULT (ground truth — only cite from here):
{{vault_chunks_retrieved_via_rag}}

RULES:
  1. Write in the org's documented voice.
  2. Cite past wins by name where they support a claim.
  3. Do NOT fabricate stats, partners, or outcomes.
     Use [VERIFY: ...] for anything not in the vault.
  4. Match the convention for the entity type:
     - Nonprofit: Need → Approach → Outcomes
     - For-profit: Understanding → Approach → Differentiators
  5. Length: tight. 2-4 paragraphs unless the section requires more.
  6. No placeholder headers like [Section Title]. Just the content.

Now draft the {{section_type}} section in response to:
"""{{solicitation_excerpt}}"""
```

---

## 10. Appendix B — Source Inventory

Maintained as a living JSON config at `config/discovery_sources.json`. Each source has: `name, type (api|scrape), endpoint, auth, schedule, parser_module, fields_mapping`.

---

## 11. Appendix C — Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Hallucinated stats in drafts | `[VERIFY]` markers; vault-only citation rule; reviewer agent gate |
| RFP source structure changes | Per-source parser module; weekly canary scrape; alerts on schema drift |
| SAM.gov rate limit | Cache aggressively; bulk extracts endpoint for backfill; queue and throttle |
| Customer voice drift | Quarterly Capture Profile refresh; user-facing voice editor |
| Federal compliance liability | Disclaimer in TOS; final human submit gate; no auto-submission |
| Multi-tenant data leak | RLS test suite on every deploy; per-tenant encryption keys |

---

## 12. Sign-off and Next Action

**Claude Code:** confirm receipt of this spec, ask any clarifying questions, then begin Phase 0 (Foundations) immediately. Target Phase 0 complete in 72 hours.

**Lorenzo:** provide Uplift, IHA, and Perpetual Core vault documents (past proposals, capacity statements, partner letters) in `/vault` directories named per-org so Phase 2 can begin in parallel with Phase 1.

— END OF TECHNICAL SPECIFICATION —
