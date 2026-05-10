# RFP & Proposal Engine — Milestone Seed

This directory is the research seed for the **v2.0 milestone: RFP & Proposal Engine** of Perpetual Core.

## What this milestone is

A multi-tenant SaaS product layered on top of Perpetual Core that automates the full capture lifecycle:
**Discover** opportunities → **Profile** the org → **Draft** proposals in voice → **Review** against rubric → **Compliance gate** before submit.

Sold to nonprofits, mission-driven for-profits, and consulting agencies. First commercial product released under the Perpetual Core brand. Internally dogfooded on Uplift, IHA, and Perpetual Core's own pipelines.

Target: 2,500 paying customers within 24 months. Conservative path to ~$25M ARR.

## Source documents (read these before planning)

| File | What it is |
|------|-----------|
| `TECH-SPEC.md` | Engineering specification — data model, agent specs, API contracts, build sequence. **This is the executable spec.** |
| `GTM-PLAN.md` | Go-to-market — positioning, pricing, sales motion, landing page copy, success metrics |
| `PROTOTYPE.md` | UI prototype notes; full source in `source-docs/perpetual-core-rfp-engine-prototype.jsx` |
| `SALVAGE-AUDIT.md` | **READ THIS FIRST** — `ldc-command-center` is a deployed v0 of this product. Working RFP UI, agents, schema, SAM.gov key all already exist. The milestone reframes from greenfield-build to consolidate-and-extend. |
| `VAULT-CHECKLIST.md` | Per-org checklist for the documents Phase 2 needs (Capture Profile Agent input) |
| `DAY-1-ACTIONS.md` | External dependencies — short list now that SAM.gov key is already provisioned |
| `source-docs/*.docx` | Originals — keep for human reference and design-partner sharing |

## How the 9 phases in the tech spec map to this milestone

The tech spec already broke this into 9 phases (Phase 0–9 in spec § 6). The GSD roadmap mirrors them 1:1:

| GSD Phase | Tech-Spec Phase | Days | Outcome |
|-----------|-----------------|------|---------|
| 1 | 0. Foundations | 1–3 | API keys, schema migration, Stripe products configured |
| 2 | 1. Discovery v1 | 4–10 | Cron worker, scoring fn, notifications, internal dashboard |
| 3 | 2. Capture Profile (3 internal orgs) | 11–21 | Vault upload UI, Capture Profile Agent, voice fingerprints persisted |
| 4 | 3. Drafting Agent v1 | 15–30 | Sonnet 4 agent, vault tool, pgvector retrieval, draft UI |
| 5 | 4. Reviewer Sub-Agent | 25–35 | Opus critic, rubric extractor, revision loop |
| 6 | 5. Compliance Agent | 30–45 | PDF parsing, page-count, budget math, SF-424 detector |
| 7 | 6. First 10 Uplift submissions | 40–75 | Real proposals shipped, win-rate tracked |
| 8 | 7. Multi-tenant productization | 60–90 | Stripe gating, org switcher, GHL provisioning, audit logs, public pricing page |
| 9 | 8+9. External beta + public launch | 75–120 | 15 design partners, case study, affiliate program, pricing live |

## Non-negotiable architecture decisions (from tech spec)

- **Lives inside Perpetual Core repo** — `rfp_` table prefix on the existing schema in LDC Brain AI Supabase
- **Multi-tenant via RLS** — `tenant_id` on every row, policy enforces `user_orgs` membership
- **Three entity types** — `nonprofit | forprofit | dual` (a `dual` operator like Lorenzo manages both at once)
- **Claude Managed Agents** — sandboxed runtime, observability built in, $0.08/session-hour
- **Model routing** — Sonnet 4 default, Opus 4.7 for high-stakes (Reviewer agent, evaluation-critical sections)
- **Vault-grounded drafting** — every claim cites a real artifact; `[VERIFY: ...]` markers for anything unverified
- **No auto-submission** — final submit is always human (legal protection + customer trust)
- **Audit-grade logging** — full agent activity log per proposal, exportable for FOIA / OIG / funder audit

## Coordination with v1.0 milestone

v1.0 Conversion Optimization is mid-flight: Phase 3 (Conversion Analytics) is still TBD/not started. Two clean options:
1. **Ship v1.0 Phase 3 first** (1–2 weeks), then start v2.0 cleanly
2. **Run v1.0 Phase 3 in parallel** as a small side track while v2.0 ramps

Either is fine. The v2.0 build does not depend on Phase 3 of v1.0.

## Important: salvage from `ldc-command-center`

The `~/ORGANIZED/01_PROJECTS/ARCHIVED/ldc-command-center/` repo is a partially-built v0 of this product. It includes:
- Working SAM.gov integration (key already provisioned in env)
- Universal AI-powered RFP URL importer (works on any URL, not just gov sites)
- 9 RFP UI components and 3 proposal components
- 4 RFP-related API routes including agent endpoints
- Workspace + multi-tenant + auth scaffolding
- Schema for `rfp_items`, `proposal_boilerplate`, `deals.rfp_id`

**See `SALVAGE-AUDIT.md` for the full inventory and the recommended port strategy (file-by-file during the relevant phase). The phase timeline pulls in ~10-15 days because of this prior work.**

## What kicks off this milestone

After research staged, run:
```
/gsd:new-milestone v2.0 "RFP & Proposal Engine"
```
Hand the orchestrator this prompt:

> Use `.planning/research/rfp-engine/` as the seed. Read `SALVAGE-AUDIT.md` first — this is not a greenfield build. The 9-phase build sequence in `TECH-SPEC.md § 6` is the roadmap; translate to GSD phase format and adjust each phase to incorporate the relevant ports from `ldc-command-center`. Do not re-plan from scratch.
