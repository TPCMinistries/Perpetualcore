# Research Summary — v2.0 RFP & Proposal Engine

This is a thin index. The detailed research lives in `.planning/research/rfp-engine/` and is treated as ground truth.

## Pre-staged research (read these for full context)

| File | What it contains |
|------|------------------|
| `rfp-engine/SEED.md` | Milestone kickoff prompt and architecture decisions |
| `rfp-engine/TECH-SPEC.md` | Engineering specification — data model (§ 3), agent specs (§ 4), API contracts (§ 5), build sequence (§ 6), security/audit (§ 7) |
| `rfp-engine/GTM-PLAN.md` | Pricing tiers, sales motion, landing copy, success metrics |
| `rfp-engine/SALVAGE-AUDIT.md` | **Critical:** `ldc-command-center` reusable assets — RFP UI components, agents, API routes, workspace + auth scaffolding, schema, env keys. Port file-by-file during the relevant phase. |
| `rfp-engine/PROTOTYPE.md` | UI prototype notes — three views (Discovery, Capture Profile, Drafting), color/typography, salvage path |
| `rfp-engine/VAULT-CHECKLIST.md` | Per-org doc collection bars (MV / PG / BIC) for Capture Profile phase input |
| `rfp-engine/DAY-1-ACTIONS.md` | External dependencies — SAM.gov re-registration (10-day wait), Simpler Grants key, NAICS verification, domain decision |

## Stack additions (from tech spec § 2.2)

Beyond the existing Perpetual Core stack:
- **Claude Managed Agents** — sandboxed agent runtime for Drafting, Reviewer, Compliance ($0.08/session-hour, observability built in)
- **pdf-parse + docx parsers** — Compliance Agent input parsing (already installed via salvage)
- **rss-parser** — foundation RSS feeds (already installed)
- **Tavily** — web search backing the universal AI URL importer (already installed)
- **GHL API** — sub-account provisioning per Pro+ tenant
- **Vercel Cron** — 6-hour Discovery cadence

## Feature categories (from tech spec § 1.1)

1. Foundations — schema + salvage port + env
2. Discovery — opportunity scanning across 6 sources + URL importer
3. Org & User Setup — multi-tenant orgs with type and roles
4. Capture Profile — vault ingestion, voice fingerprinting, embedding
5. Drafting — section generation grounded in vault, both nonprofit and for-profit conventions
6. Reviewer Sub-Agent — Opus rubric critic
7. Compliance — pre-submit gate (page/font/budget/forms/deadline)
8. Multi-Tenant SaaS — Stripe gating, audit logs, GHL, webhooks
9. Launch + GTM — dogfood, design partners, case study, affiliate, public landing

## Build order (from tech spec § 6, 9 phases over ~120 days)

The build sequence is dogfood-first: each phase is pressure-tested on Uplift / IHA / Perpetual Core's own pipeline before exposing to external customers. Phase 6 (first 10 Uplift submissions) is the gate between "engine works" and "open to design partners."

## Watch out for (from tech spec § 11 + GTM § 8)

- **Hallucinated stats in drafts** — mitigated by `[VERIFY]` markers + vault-only citation rule + Reviewer gate
- **RFP source structure changes** — per-source parser modules + weekly canary scrape + drift alerts
- **SAM.gov rate limit (1K/day free tier)** — cache aggressively; queue and throttle
- **Customer voice drift** — quarterly Capture Profile refresh + user-facing voice editor
- **Federal compliance liability** — TOS disclaimer + final human submit gate + no auto-submission
- **Multi-tenant data leak** — RLS test suite on every deploy + per-tenant encryption keys
- **SAM.gov key already lapsed** (smoke test 2026-05-09) — Lorenzo re-registering today; ~10-day wait gates federal-contract Discovery only (Grants/SBIR/Simpler unblocks earlier)

## Salvage from `ldc-command-center` (reframes timeline)

`SALVAGE-AUDIT.md` is mandatory reading before phasing. Ports save ~10–15 days across the build:

- Workspace + auth + accept-invite UI
- 9 RFP UI components (RFPClient, RFPSidebar, RFPDetailView, RFPAnalysisPanel, RFPUploader, GrantImporter, GrantPipeline, ProposalBuilder + 3 proposal components)
- 4 RFP/proposal agent API routes
- Universal AI URL importer (Tavily-backed; works on any URL)
- Schema migrations as reference (rename + extend, do not run as-is)
- All Anthropic / OpenAI / Tavily / Stripe / Resend / Twilio / Google API integrations already installed and configured

**Reuse pattern:** port file-by-file during the relevant phase, not all at once. Phase 0 ports auth + workspace. Phase 1 ports `GrantImporter` and SAM.gov client. Phase 3 ports `ProposalBuilder` + `RFPDetailView`. Each port = atomic commit.
