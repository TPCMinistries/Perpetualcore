# Project: Perpetual Core

## Overview

- **Description:** AI Operating System for Lorenzo. Personal AI brain with chat, documents, contacts, agents, workflows, voice memos, and billing. Powers the entire ecosystem.
- **Core value:** The AI operating system brain — if this breaks, everything downstream breaks
- **Tier:** CORE
- **Database:** LDC Brain AI (Supabase)
- **Stack:** Next.js 15, Tailwind, shadcn/ui, Supabase, Claude + OpenAI, Stripe, Vercel
- **Path:** ~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core

## Constraints

- TypeScript strict, createAdminClient() for all server ops, CORE tier = maximum caution

## Validated Requirements (Already Built)

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

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-22 | GSD initialized (brownfield) | Adopting structured planning for future milestones |
| 2026-02-23 | Milestone v1.0: Conversion Optimization | Product built, now needs to convert visitors → users → active users |
| 2026-02-23 | Aha moment = guided first chat | Lowest friction, demos persistent memory + multi-model intelligence |
| 2026-02-23 | Social proof = manufactured | No real user base yet — use founder credibility, ChatGPT comparison, trust badges |

## Current Milestone: v2.0 RFP Engine — Market-Ready & Best-in-Class

**Goal:** Make the Perpetual Core RFP & Proposal Engine the single best AI RFP/grant capture product on the market — beating Cleatus, Granted.ai, Instrumentl, GovWin, GovDash — and 100% market-ready for paid launch.

**Decided scope (owner, locked):**
- **Sequencing:** Aggressive — harden the current product to ship quality AND build the signature differentiators in the same milestone.
- **Signature differentiators (all committed):**
  1. Unified gov RFP + foundation grant discovery in ONE feed (the seam no competitor owns).
  2. Cited, evidence-based fit scoring grounded in the org's own vault/track record (explains WHY, strong/weak, cites prior wins + peer funder behavior).
  3. Adversarial rubric review — reviewer panel scores drafts against the ACTUAL solicitation evaluation criteria (gov Section L/M) AND funder priorities, not generic quality.
  4. Closed-loop submission — packet assembly + submission tracking + amendment/addendum diffing against the original solicitation.
  5. Win/loss learning loop — ingest outcomes to improve future fit-scoring + drafts.
  6. Transparent pricing + risk-reversal guarantee as positioning.
- **Discovery coverage = tiered levels** (map to pricing tiers + phased rollout):
  - **Level 1 — Federal:** SAM.gov, Grants.gov, SBIR/STTR.
  - **Level 2 — National:** all 50 states + foundations/990.
  - **Level 3 — Global:** EU TED, UK Contracts Finder, Canada, World Bank/UN/global development grants + international foundations.
  - Each level ships with a source-health SLA + transparent verified counts (no fake "80k+" claims).

**Market-ready ship gates (all must be true to call v2.0 done):**
- Reliable Level-1 discovery with source-health SLA + honest counts
- Stripe live billing + self-serve trial → provision for all tiers
- Security/RLS audit passed + per-tenant isolation verified
- Legal pages live (ToS, privacy, AI-use disclosure)
- Operator admin console (orgs, drafts, AI cost/org, drift, MRR)
- Monitoring + `/api/health/rfp` + status page
- Onboarding that gets a new org to first qualified draft fast
- Compliance gate v1
- PR #4 merged to main with prod stable
- E2E coverage on the draft → review → submit critical path

## Milestones

- **v1.0** — Conversion Optimization (parent AI OS funnel work; superseded by RFP focus)
- **v2.0** — RFP Engine: Market-Ready & Best-in-Class (active)

## Links

- Supabase Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
- MCP: `supabase`
