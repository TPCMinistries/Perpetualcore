# Vault Collection Checklist

The Capture Profile Agent (Phase 2) needs each org's documented track record so it can extract a voice fingerprint, populate `rfp_vault_artifacts`, and ground every drafted proposal in real artifacts. **This is the single biggest determinant of output quality.** Generic AI without this corpus would produce generic prose. With it, the engine sounds like the org has sounded for years.

## Go / no-go bar per org

| Bar | What it means | What unlocks |
|-----|---------------|--------------|
| **Minimum viable (MV)** | 3 past wins + 1 capacity statement + 3 partner letters | Voice fingerprint v0; Drafting agent can produce credible Need Statement, Approach, Org Capacity |
| **Production grade (PG)** | 8-12 past wins (mix of funders) + 990s + audit + 5+ partner letters + 3+ logic models + 3+ eval plans | All sections produce strong drafts; voice fingerprint is stable; Reviewer agent works well |
| **Best-in-class (BIC)** | PG + losing proposals (yes, really) + funder rubrics + reviewer comments | Win-probability calibration improves; engine learns what loses, not just what wins |

**Phase 2 goes live at MV per org. Backfill toward PG happens during Phase 3-5 in parallel.**

---

## Per-org collection lists

### 1. Uplift Communities (nonprofit)

**Type:** Workforce dev nonprofit · **Database:** Uplift Opps (`fbgmkqpxaaxbndhdbpzt`) · **NAICS:** 611430, 624310, 621399

**Past wins (target: 8)** — most likely already in Drive/Gmail
- [ ] DYCD CRED Healthcare Workforce — full proposal + award letter
- [ ] DYCD CRED earlier years — any prior cycle proposals
- [ ] Kingsborough Community College partnership MOU (the document)
- [ ] HRA / NYC City Council discretionary submissions (any successful)
- [ ] Foundation grants for healthcare workforce work — any
- [ ] State workforce funding — Workforce Development Institute, NY State Dept of Labor

**Capacity & program documents (target: 4)**
- [ ] Healthcare Workforce Logic Model (the visual + narrative)
- [ ] Capacity statement / Statement of Qualifications (any version)
- [ ] Org chart with credentials of leadership and instructors
- [ ] Curriculum maps for CNA / CMAA / EHR / CST / Pharmacy Tech tracks

**Partner letters & MOUs (target: 5)**
- [ ] KCC partnership MOU
- [ ] Healthcare employer letters of support (any clinical placement partners)
- [ ] Faith-based / community referral partner letters
- [ ] Other educational institution partnerships

**Compliance & financial (target: 3)**
- [ ] Most recent 990
- [ ] Most recent audit
- [ ] W-9 + IRS determination letter

**Outcomes data (gold)**
- [ ] Cohort completion rates (per track, last 2 years)
- [ ] Job placement rates and average wage
- [ ] Credential pass rates (CNA exam, CMAA, etc.)

**Where to look first:** Lorenzo's Gmail (search: "DYCD" + "proposal"), Google Drive (Uplift folder), Sarah's records, KCC Foundation board files.

---

### 2. Institute for Human Advancement (nonprofit)

**Type:** International dev / education / health nonprofit · **NAICS:** 611710, 624190, 813219

**Past wins (target: 6)** — pipeline is younger; quality > quantity
- [ ] UNDP dialogue (April 2026) — concept note + acceptance
- [ ] Kenya 2026 Delegation — concept note + funding documents
- [ ] IHA Academy launch — any donor / grant letters
- [ ] ISfTeH partnership documents
- [ ] Any seed funding awards from foundations

**Capacity & program documents (target: 5)**
- [ ] IHA Academy 5-Pillar Curriculum Framework
- [ ] KAIA AI companion product description / demo script
- [ ] Theory of change document
- [ ] Geographic footprint document (Kenya, NYC, where else)
- [ ] Leadership bios — Lorenzo + Sarah + advisors

**Partner letters & MOUs (target: 5)**
- [ ] TPC Ministries collaboration
- [ ] ISfTeH (International Society for Telemedicine and eHealth) partnership
- [ ] Kenya delegation host institutions
- [ ] Any UN / UNDP / UNESCO correspondence
- [ ] Faith-based partner letters

**Compliance & financial (target: 3)**
- [ ] 990 (if filed; if not, Form 1023 / determination letter)
- [ ] Most recent financials
- [ ] W-9 + IRS determination letter

**Voice exemplars (critical for IHA)** — IHA has a distinctive register: dignified, frames work as human flourishing, leans on systems-level theory of change
- [ ] 3 paragraphs from past concept notes that feel most "IHA voice"
- [ ] Lorenzo's published essays / LinkedIn posts that sound the way IHA writes

**Where to look first:** IHA Drive, Lorenzo's email (UNDP, ISfTeH threads), Sarah's records, the IHA Academy launch documents.

---

### 3. The Perpetual Core (for-profit)

**Type:** AI/SaaS · **NAICS:** 541511, 518210, 541512

**Past performance (target: 5)** — for-profit "wins" = paid contracts and shipped products
- [ ] Perpetual Core SaaS — current paying customer info (anonymized OK)
- [ ] Herald AI agent stack — case study or deployment doc
- [ ] IHA Global Health platform — build summary + outcomes
- [ ] Voice Intelligence platform (Plaud integration) — case study
- [ ] OpenClaw Phase 1+2 deployment — technical writeup
- [ ] Any consulting engagements with concrete outcomes

**Capability documents (target: 5)**
- [ ] Tech stack summary (Next.js / Vercel / Supabase / Claude / OpenAI / pgvector)
- [ ] Multi-tenant SaaS architecture document
- [ ] Security & compliance posture (encryption, RLS, audit logging)
- [ ] MCP integration capabilities
- [ ] Claude Managed Agents production experience

**Differentiators (federal-relevant)**
- [ ] SBIR eligibility documentation (small business status, ownership, US-based)
- [ ] DUNS / SAM.gov registration status (or pending)
- [ ] CAGE code (if registered)
- [ ] Cybersecurity certifications (SOC 2 in progress, NIST-aligned, etc.)

**Voice exemplars** — Perpetual Core's voice is: technical, results-driven, frames AI as infrastructure, confident without hype
- [ ] 3 paragraphs from product docs / pitch decks that capture the voice
- [ ] Sales/marketing copy already written (landing pages, emails)

**Compliance & financial**
- [ ] LLC formation docs
- [ ] EIN / W-9
- [ ] Most recent financials (for federal eligibility — even pre-revenue numbers)

**Where to look first:** This codebase (perpetual-core/), Herald docs, IHA Global Health Phase 1-2 build, the GTM plan we just staged.

---

## Suggested folder structure

When ready, drop files here:

```
.planning/research/rfp-engine/vault-staging/
├── uplift/
│   ├── wins/              # Past proposals (PDF/DOCX)
│   ├── capacity/          # Capacity statements, logic models, org charts
│   ├── partners/          # MOUs and letters of support
│   ├── compliance/        # 990, audit, W-9, determination letter
│   └── outcomes/          # Data tables, completion stats, placement rates
├── iha/
│   └── (same structure)
└── perpetual-core/
    └── (same structure)
```

The Capture Profile Agent (Phase 2) reads from `vault-staging/<org>/`, extracts text, redacts PII, embeds via BGE-M3, and writes to `rfp_vault_artifacts` with the `org_id` set. After ingestion, files move to Supabase Storage with per-tenant encryption.

---

## How to fast-track collection

If digging up files org by org is slow, three accelerators:

1. **Email search blasts** — One-time inbox searches with these patterns, save results to per-org folders:
   - `subject:proposal OR subject:RFP has:attachment from:me`
   - `subject:award OR subject:congratulations has:attachment`
   - `(MOU OR memorandum OR partnership) has:attachment`
2. **Shared drives** — Audit `IHA-Org/`, `Uplift Communities/`, `Perpetual Core/` Drive folders for anything with "proposal", "grant", "RFP", "capacity", "logic model" in the name.
3. **Ask Sarah and Achumboro** — They likely have versions you don't. Sarah for IHA + Perpetual Core; Achumboro for Uplift ops files.

A weekend of inbox + Drive archeology likely covers 70% of the MV bar across all three orgs.

---

## Note on losing proposals

Counterintuitively, **the engine gets smarter from your losses**. If you have unsuccessful submissions, include them with a `rfp_vault_artifacts.type = 'lost_proposal'` tag. The Reviewer agent's calibration improves dramatically when it can see what didn't work alongside what did.

This is opt-in per org and not required for MV.
