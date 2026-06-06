# Salvage Audit — `ldc-command-center` (LDC Command Center)

**Status:** Archived but operational, deployed to Vercel, in active git history through late 2024.

**Repo:** `git@github.com:TPCMinistries/LDC-Command-Center.git`
**Vercel project:** `prj_TP1enSXwQhghV7h02O8QeU6bw0yv` (org `team_QC77u3MLDVxFLID7hCuF8EOy`)
**Local path:** `~/ORGANIZED/01_PROJECTS/ARCHIVED/ldc-command-center/`

This is **not a concept** — it is a partially-built v0 of the RFP & Proposal Engine. The most recent commit ("Wire ContractSearch to SAM.gov and external APIs", "Add Company Profile system with tiered AI matching") shows the same architecture pattern the new tech spec calls for: a Company Profile + RFP matching with score, plus deployed SAM.gov integration. This audit reframes the v2.0 milestone from **greenfield build** to **consolidate-and-extend**.

---

## What's already built and reusable

### A. Auth + multi-tenant scaffolding ✅ **High reuse**
- `src/app/(auth)/login/` — Supabase Auth login page
- `src/app/(auth)/accept-invite/` — workspace invitation flow
- `src/app/(dashboard)/workspace/[workspaceId]/` — workspace-scoped routing
- Migrations: `workspace_invites`, `team_collaboration`, `personal_workspaces_sharing`

**Action:** Port the workspace pattern straight into Perpetual Core. The `[workspaceId]` becomes `[orgId]` (tenant). Workspace invites become org invites. RLS isolation pattern already exists in the migrations — verify it matches the spec's `tenant_id` model and refactor where needed.

### B. RFP UI components ✅ **High reuse, light refactor**

| Component | Purpose | Status |
|-----------|---------|--------|
| `RFPClient.tsx` | RFP list view container | Reuse, adapt to new fit-score display |
| `RFPSidebar.tsx` | RFP detail nav | Reuse |
| `RFPDetailClient.tsx` + `RFPDetailView.tsx` | Single-RFP detail page | Reuse |
| `RFPAnalysisPanel.tsx` | AI analysis of an RFP | Reuse — likely already does part of what spec § 4.1 wants |
| `RFPUploader.tsx` | Upload PDF/DOCX RFP files | Reuse, feeds into Compliance agent input later |
| `GrantImporter.tsx` | URL-based grant import | **High value** — already has universal AI fallback |
| `GrantPipeline.tsx` | Pipeline stage view | Reuse for proposal/deal pipeline |
| `ProposalBuilder.tsx` | Build proposal sections | Reuse — replace its drafting hook with new Drafting Agent |
| `proposals/ProposalsClient.tsx` | Proposal list | Reuse |
| `proposals/ProposalWizard.tsx` | Step-through proposal creation | Reuse |
| `proposals/ProposalEditor.tsx` | Section-level editor | Reuse — wire Save to `rfp_proposal_sections` |

**Action:** Port these into Perpetual Core's component tree. Most need only a model-name swap (move from old client to new Claude Managed Agents API) and a data-layer swap (new `rfp_*` table names per the spec).

### C. RFP / Proposal API routes ✅ **High reuse**

| Route | Maps to new spec |
|-------|------------------|
| `app/api/rfp/*` | `GET /api/opps`, `GET /api/opps/:id` |
| `app/api/proposals/*` | `POST /api/proposals/:id/sections` |
| `app/api/agents/rfp` | Drafting Agent (§ 4.3) |
| `app/api/agents/rfp-analyze` | Discovery scoring brief (§ 4.1) or Reviewer (§ 4.4) |
| `app/api/agents/rfp-chat` | In-product chat for an RFP context |
| `app/api/agents/proposal` | Drafting Agent (§ 4.3) |

**Action:** These are the contracts the new spec already describes. Port the handler bodies, then layer the new agent system prompts (voice fingerprinting, vault-grounded, `[VERIFY]` markers) on top.

### D. Universal AI-powered RFP import ✅ **Direct reuse, big head-start**

Per `RFP_IMPORT_UPGRADE.md`, the import flow already does:
1. Try specific government APIs (SAM.gov / Grants.gov / USAspending)
2. Fall back to AI extraction via Tavily web search + Claude/GPT for ANY URL (foundations, corporate, state, international)
3. Extract title, agency, description, posted date, deadline, type, funding amount, requirements
4. Persist to the database

**This is a feature the new spec hadn't even called for yet, and it's already shipped.** Foundations don't need Candid API; users can paste any RWJF / Ford / Gates / Macarthur URL and the import works. Major margin gain — defers Candid paid plan indefinitely.

### E. Schema migrations ✅ **Partial reuse**

The relevant migrations:
- `20241127_rfp_enhancements.sql` — `proposal_boilerplate (workspace_id, section_type)` ← **this is the early vault concept; rename to `rfp_vault_artifacts` and add embedding column**
- `20241208_rfp_revenue_link.sql` — `rfp_items` with `entity_id`, `deal_id`; `deals.rfp_id`, `source_type`
- `20241214_rfp_ui_enhancements.sql` — `rfp_items.pipeline_status`, `contract_type`, `posted_date`, `deadline`, `match_score`

**Existing tables that map to spec § 3:**

| Existing | New spec | Migration plan |
|----------|----------|----------------|
| `rfp_items` | `rfp_opportunities` + `rfp_opp_matches` | Split into two tables; `match_score` becomes `fit_score`; add `win_prob`, `recommendation` |
| `proposal_boilerplate` | `rfp_vault_artifacts` | Rename, add `embedding vector`, `type`, `source_metadata` |
| `deals` | `rfp_proposals` (kind of) | Reuse `deals` for revenue tracking; new `rfp_proposals` for in-flight work |
| _(none)_ | `rfp_orgs` | New |
| _(none)_ | `rfp_capture_profiles` (with voice fingerprint) | New — this is the v2 differentiator |
| _(none)_ | `rfp_compliance_checks` | New |
| _(none)_ | `rfp_agent_sessions` | New — audit-grade requirement |

**Action:** Phase 0 schema migration is now a **rename + extend** plan, not a from-scratch design.

### F. Pre-existing infrastructure ✅ **High reuse**

| Asset | Note |
|-------|------|
| `SAM_GOV_API_KEY` in env | **The 10-day wait is gone.** Verify the key still works during Phase 0; if revoked, re-register. |
| Anthropic SDK + system prompts | Already integrated |
| OpenAI SDK | Already integrated (used as fallback / cheaper tier) |
| Tavily web search | Already integrated — powers the universal AI import |
| `pdf-parse`, `docx`, `@react-pdf/renderer` | All already installed — Compliance agent can use these |
| `rss-parser` | Already installed — useful for foundation RSS feeds |
| Stripe SDK | Already wired |
| Resend (email notifications) | Already wired |
| Twilio (SMS) | Already wired — could power Pro-tier deadline alerts |
| Google APIs (`googleapis`, `google-auth-library`) | Calendar/Drive integration possibilities |

### G. Agent infrastructure migrations ⚠️ **Read but don't reuse blindly**

- `20241127_agent_autonomy.sql`, `20241127_agent_memory.sql`
- `20241203_workflow_engine.sql`

These are an older agent pattern from before Claude Managed Agents was generally available. **Don't port these.** New spec uses Claude Managed Agents directly with sandboxed sessions and audit traces. The old agent_memory/workflow tables would conflict.

---

## What the new spec adds (not in ldc-command-center)

These are the v2 differentiators — the new build:

1. **Voice fingerprinting** (`rfp_capture_profiles.voice_fingerprint`) — none of this exists in v0
2. **Vault-grounded drafting with `[VERIFY]` markers** — v0 drafting is generic AI; new spec adds vault retrieval tool + verification flag
3. **Reviewer Sub-Agent** (Opus 4.7 critic against rubric) — new
4. **Compliance Agent** (PDF parsing for page count, font, margins; budget arithmetic; SF-424 detection) — new
5. **Multi-entity types** (`nonprofit | forprofit | dual`) — v0 is single-tenant per workspace
6. **Discovery cron worker** with per-org fit scoring fired every 6 hours — v0 has match_score but no scheduled scanner
7. **Stripe plan-gating tiers** ($299/$799/$2,499/Enterprise) — v0 has Stripe wired but no tier gating
8. **GHL sub-account provisioning per tenant** — new
9. **`rfp_agent_sessions` audit-grade logging** with full prompt/response, encrypted at rest — v0 likely has lighter logging
10. **Per-tenant encryption keys for vault** — new

---

## Reframed milestone timeline

The original tech-spec timeline assumed greenfield. With salvage:

| Phase | Original days | Revised | Reason |
|-------|---------------|---------|--------|
| 0. Foundations | 1-3 | **1-2** | SAM key already provisioned; schema is rename+extend not new |
| 1. Discovery v1 | 4-10 | **3-7** | SAM.gov integration + URL importer already work |
| 2. Capture Profile | 11-21 | 11-21 | Voice fingerprinting is genuinely new — no shortcut |
| 3. Drafting Agent v1 | 15-30 | **15-25** | UI exists; need to swap drafting backend + add vault tool |
| 4. Reviewer Sub-Agent | 25-35 | 25-35 | Genuinely new |
| 5. Compliance Agent | 30-45 | 30-45 | Genuinely new |
| 6. First 10 Uplift submissions | 40-75 | 40-75 | Lorenzo-driven, unchanged |
| 7. Multi-tenant productization | 60-90 | **55-80** | Workspace pattern + Stripe wiring + auth all exist |
| 8. External beta | 75-105 | 75-105 | Lorenzo-driven, unchanged |
| 9. Public launch | 100-120 | **95-115** | Slight pull-in |

**Net effect:** ~10-15 day pull-in on overall timeline, biggest gains in Phase 0, 1, 7.

---

## Decision: salvage strategy

Three options for how to consolidate `ldc-command-center` into Perpetual Core:

### Option 1 — Code-level port (recommended)
Copy specific files from `ldc-command-center` into Perpetual Core, refactoring as we go. Old repo stays archived. Clean history in Perpetual Core. **Best for code hygiene.**

### Option 2 — Subtree merge
Use `git subtree add` to bring `ldc-command-center` history into Perpetual Core, then prune. Preserves authorship. **Best if there's external attribution value.** Adds ~30 stale files we'd need to clean up.

### Option 3 — Read-only reference, build fresh
Keep `ldc-command-center` archived as reference; rebuild every component cleanly in Perpetual Core. **Slowest but cleanest.** Only worth doing if old code quality is genuinely too low to port — unlikely given the recent commit history shows active polish.

**Recommendation: Option 1.** Port file-by-file during the relevant phase. Phase 0 ports the workspace + auth scaffolding. Phase 1 ports `GrantImporter` and the SAM.gov client. Phase 3 ports `ProposalBuilder` + `RFPDetailView`. Each port is its own atomic commit so we can roll back any individual piece if it conflicts.

---

## Resolved (2026-05-09 conversation)

1. **Real users on deployed app?** No — Lorenzo built it, didn't actively use it. **Free hand to salvage.**
2. **Other GitHub collaborators on `TPCMinistries/LDC-Command-Center`?** None. **No heads-up needed.**
3. **SAM.gov key still works?** **No** — smoke test returned `HTTP 401 API_KEY_INVALID`. Lapsed after extended non-use. **Re-register today** (back on 10-day critical path; see `DAY-1-ACTIONS.md`).
4. **Migrate any data from the old DB?** No — any proposals/RFPs in there aren't current. **Code and schema only — start with empty data.**

## Salvage strategy (locked)

- **Code:** Port file-by-file (Option 1 from above) into Perpetual Core during the relevant phase.
- **Schema:** Read the migrations as reference; write fresh migrations under the new `rfp_*` namespace per `TECH-SPEC.md § 3`. Don't run the old migrations.
- **Data:** None. Empty start.
- **SAM.gov key:** Lorenzo re-registers; smoke test the new one in Phase 0.
- **Old `ldc-command-center` repo + Vercel deployment:** Leave alone. Don't actively decommission. If they sit dormant they cost nothing; if Lorenzo wants to cleanly archive later, that's a 5-min task post-launch.
