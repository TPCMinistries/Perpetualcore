# Project: Perpetual Core

## Overview

- **Description:** AI Operating System for Lorenzo. Personal AI brain with chat, documents, contacts, agents, workflows, voice memos, and billing. Powers the entire ecosystem. Now also the host platform for The Perpetual Core LLC's commercial product line, beginning with the RFP & Proposal Engine.
- **Core value:** The AI operating system brain — if this breaks, everything downstream breaks
- **Tier:** CORE
- **Database:** LDC Brain AI (Supabase)
- **Stack:** Next.js 15, Tailwind, shadcn/ui, Supabase, Claude + OpenAI, Stripe, Vercel
- **Path:** ~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core

## Constraints

- TypeScript strict, createAdminClient() for all server ops, CORE tier = maximum caution
- All `rfp_*` tables must namespace cleanly inside the existing schema; RLS policies enforce tenant isolation per `rfp_user_orgs`
- New product code must coexist with existing OS features without breaking validated requirements

## Validated Requirements (Already Built)

### Core OS (pre-GSD)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Chat interface with AI (Claude + OpenAI) | Done |
| 2 | Document management with RAG vector search | Done |
| 3 | Contact management | Done |
| 4 | Agent runtime (E2B sandbox, Browserless) | Done |
| 5 | Voice memo transcription + intelligence (Plaud AI integration) | Done |
| 6 | Custom skills CRUD | Done |
| 7 | Stripe billing with 6-tier plans + overage metering | Done |
| 8 | Admin dashboard with revenue metrics | Done |
| 9 | Transactional emails via Resend | Done |
| 10 | Error boundaries on all sections | Done |
| 11 | E2E test coverage | Done |

### Milestone v1.0 — Conversion Optimization (shipped 2026-02-23)

- ✓ **PROOF-01** — Founder credibility section on landing page
- ✓ **PROOF-02** — Feature comparison table vs ChatGPT/competitors
- ✓ **PROOF-03** — Trust badges (SOC 2, SSO, uptime)
- ✓ **PROOF-04** — "Trusted by X organizations" counter
- ✓ **ONBD-01** — Guided first-chat aha moment
- ✓ **ONBD-02** — Activation checklist (first chat, upload, agents)

## Deferred (carried forward)

- **ANLYT-01/02/03** — Conversion funnel analytics (v1.0 Phase 3, never shipped). Deferred until post-launch when RFP Engine drives real funnel traffic worth analyzing. Will revisit in v2.x or v3.0.

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-22 | GSD initialized (brownfield) | Adopting structured planning for future milestones |
| 2026-02-23 | Milestone v1.0: Conversion Optimization | Product built, now needs to convert visitors → users → active users |
| 2026-02-23 | Aha moment = guided first chat | Lowest friction, demos persistent memory + multi-model intelligence |
| 2026-02-23 | Social proof = manufactured | No real user base yet — use founder credibility, ChatGPT comparison, trust badges |
| 2026-05-09 | Milestone v2.0: RFP & Proposal Engine | First commercial product under The Perpetual Core LLC; wedge into AI-Native Capture Operations category; dogfooded on Uplift/IHA/Perpetual pipelines |
| 2026-05-09 | Defer ANLYT-01/02/03 to post-launch | Conversion analytics need real traffic; ship RFP Engine first, instrument later |
| 2026-05-09 | Salvage from `ldc-command-center` | Prior built-but-unused v0 contains reusable RFP UI, agents, schema, API integrations; port file-by-file rather than rebuild |
| 2026-05-09 | RFP Engine lives inside Perpetual Core repo | Spec confirms `rfp_*` table prefix on existing schema; brand house consolidation; one auth, one billing |

## Current Milestones (Parallel)

Three milestones running concurrently from 2026-05-15. Coordinated via agent teams + `cs` worktrees to avoid file conflicts. Lead session does cross-cutting work and review; teammates own milestone-specific phases.

### v4.0 — Business Operations & Revenue Plumbing (NEW)

**Goal:** Make perpetualcore.com a functioning business, not just a brochure. Wire lead capture → CRM, verify Stripe end-to-end, install calendar booking, decide subscription tier identity, add social proof, instrument funnel analytics, finish industry cascade, audit ecosystem interop, build SEO foundation, audit subdomain products. Framed from a business manager's perspective on operating the site as the front door for the broader IHA / Uplift / DeepFutures / TPC / Sage SaaS ecosystem.

**Phases:** 13-22 (10 phases — see ROADMAP.md). Rough sequencing 13 → 14 → 15/16 (parallel) → 17/18 (parallel) → 19/20/21/22 (parallel).

**Target features:**
- Lead capture audit + CRM wire-up (test every form, route to inbox/CRM)
- Stripe end-to-end + post-signup activation experience (decide what the dashboard becomes)
- Calendar booking + intake flow (Cal.com / SavvyCal on /contact-sales)
- Subscription tier identity (Free / $49 / $99 currently orphaned — rebrand or kill)
- Social proof + testimonials (named client + quantified outcome)
- Funnel analytics — revive ANLYT-01/02/03 from v1.0 deferred (PostHog / Plausible + UTM)
- Industry pages cascade — remaining 7 verticals to v6 register
- Ecosystem interop audit — how PC interops with IHA, Uplift, TPC, DeepFutures, Sage SaaS; cross-org lead routing; 10/15% giving cash-flow trace
- SEO/discovery foundation — blog infra, sitemap, structured data, 3 cornerstone articles
- Subdomain product audit — atlas/sentinel/sage/rfp.perpetualcore.com functionality, conversion paths, cross-link integrity

**Parallelization notes:**
- v4.0 BizOps phases touch marketing surface, lead pipelines, billing — coordinate with v3.0 Studio Polish (Phase 12 still partial).
- v2.0 RFP Engine work in `lib/rfp/`, `app/(rfp-marketing)/`, `components/rfp/`, `app/api/cron/` — separate territory, low conflict risk.

### v3.0 — Studio Polish & Launch (ACTIVE — partial)

**Goal:** Polish the Studio Repositioning sprint (rebased and merged as `feat/studio-repositioning`) into ship-ready state. The v6 register + 5 industry verticals + Sage reposition + product subdomain wiring are shipped through commit `9e8edd5` but Phase 12 plans for case studies, Atlas Discovery, IHA↔PC links, and Vellum waitlist remain partially open.

**Open work:**
- Phase 12 closeouts (Vellum 6-signup Stripe test verification → close STUDIO-VW-01; IHA cross-brand commit `0194213` push)

### v2.0 — RFP & Proposal Engine (ACTIVE)

**Goal:** Ship a multi-tenant SaaS RFP & Proposal Engine — discovers federal, state, city, and foundation opportunities; ingests an org's vault to extract a voice fingerprint; drafts proposal sections grounded in past wins; reviews against funder rubrics; runs a compliance gate before submit. Internally dogfooded on Uplift, IHA, and Perpetual Core; sold externally to nonprofits, mission-driven for-profits, and capture agencies.

**Target features:**
- Discovery agent across SAM.gov, Grants.gov, Simpler Grants, NY State, NYC DYCD/HRA/DOE, SBIR.gov (foundations via universal AI URL importer salvaged from `ldc-command-center`)
- Capture Profile agent — ingest vault, extract voice fingerprint, populate per-org capacity facts
- Drafting agent — vault-grounded section generation with `[VERIFY]` markers; nonprofit and for-profit conventions
- Reviewer sub-agent — Opus-tier critic scoring against funder rubric
- Compliance agent — page limits, attachments, budget math, SF-424 detection, deadline timezone handling
- Multi-entity types — `nonprofit | forprofit | dual` (operator) with NAICS-aware fit scoring
- Multi-tenant SaaS shell — Stripe plan gating ($299 / $799 / $2,499 / Enterprise), org switcher, audit-grade `rfp_agent_sessions` logging
- Public landing page + first 15 design partners onboarded; first published case study from Uplift dogfood

**Research:** Pre-staged in `.planning/research/rfp-engine/` (TECH-SPEC.md, GTM-PLAN.md, PROTOTYPE.md, VAULT-CHECKLIST.md, DAY-1-ACTIONS.md, SALVAGE-AUDIT.md). Treated as ground truth — skipping the 4-researcher parallel research step.

## Milestones

- **v1.0** — Conversion Optimization (shipped, ANLYT-* deferred)
- **v2.0** — RFP & Proposal Engine (active)

## Links

- Supabase Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
- MCP: `supabase`
- Salvage source: `~/ORGANIZED/01_PROJECTS/ARCHIVED/ldc-command-center/` (repo: `TPCMinistries/LDC-Command-Center`)
- Vercel project: `prj_TP1enSXwQhghV7h02O8QeU6bw0yv` (legacy, low priority)

---
*Last updated: 2026-05-09 — milestone v2.0 opened*
