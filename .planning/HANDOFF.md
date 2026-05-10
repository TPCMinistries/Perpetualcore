# Phase 5 Discovery — Mid-Execution Handoff

**Author:** previous orchestrator session
**Date:** 2026-05-10
**Status:** Wave 1 in flight; Waves 2–4 + verification pending
**Project:** Perpetual Core — `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core`

> **You are reading this because:** the previous session wrote up state and the user `/clear`ed for fresh context. Pick up where it left off. Lorenzo's preference is autonomous execution — keep going, don't ask permission for things already decided.

---

## Where we are

**Milestone:** v2.0 — RFP & Proposal Engine
**Phase 5: Discovery** — 7 plans planned + verified, executing wave-by-wave.

| Wave | Plans | Status |
|------|-------|--------|
| 1 | 05-01 (federal ingestion), 05-02 (state/city scrapers + drift) | **IN FLIGHT** when handoff written |
| 2 | 05-03 (fit scoring engine + AI summary + async recompute) | pending |
| 3 | 05-04 (feed UI + OrgSwitcher), 05-05 (Quick Import) | pending — both `wave_critical: true` |
| 4 | 05-06 (dual-mode), 05-07 (alerts: email + Telegram + Discord) | pending |

After Wave 4: spawn `gsd-verifier`, then `gsd-tools phase complete 5` to mark phase done and advance roadmap.

---

## Project orientation (1-minute scan)

**Stack:** Next.js 14.2.33, Supabase (LDC Brain AI = `hgxxxmtfmvguotkowxbu`), pgvector, Vercel hosting, Vercel Cron, Upstash Redis, Resend, Sentry, framer-motion 12, shadcn/ui, lucide-react, tsx for scripts.

**DB:** Tables prefixed `rfp_*` already exist (Phase 04). RLS uses SECURITY DEFINER helper `rfp_my_org_ids()` to avoid recursion. Apply new migrations via Supabase MCP `apply_migration` to project `hgxxxmtfmvguotkowxbu`.

**Server vs user clients:**
- `createAdminClient()` from `@/lib/supabase/server` — for cron/server/background ONLY
- `createClient()` (request-scoped, cookies-bound) from `@/lib/supabase/server` — for everything user-facing (preserves RLS)
- **NEVER** use `createAdminClient` in feed reads — bypasses tenant isolation

**Env var gotchas:**
- Resend sender = `RESEND_FROM_EMAIL` (NOT `RESEND_FROM`). Domain `perpetualcore.com` not yet verified — alert fallback chain: `RFP_ALERT_FROM_EMAIL ?? RESEND_FROM_EMAIL ?? 'noreply@perpetualcore.com'`
- Upstash creds: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (already set, used by `lib/rate-limit/index.ts`)
- SBIR.gov endpoint defunct — see `.planning/phases/04-foundations-salvage-port/deferred-items.md` (`SBIR-ENDPOINT-UPDATE`)

**Branch:** `main` (no GSD branching for this phase). All commits prefixed `feat(05-NN):` or `chore(05-NN):`. Atomic per task.

**Dev server:** flaky. Port 3001 for perpetual-core, 3000 for sentinel (separate project, leave alone). Restart command:
```bash
cd ~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core
PATH="/Users/lorenzodaughtry-chambers/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH" PORT=3001 \
/usr/bin/nohup /opt/homebrew/bin/npm run dev > /tmp/perpetual-core-dev.log 2>&1 </dev/null &
```

**Lorenzo's preferences (memory):**
- Be aggressive, don't ask permission for things already decided
- Use agent teams for big builds
- Use Vercel/Supabase MCP tools to verify state before guessing
- No "successfully demoed" overclaiming — only state what's actually true

---

## Locked decisions for Phase 5 (CONTEXT.md)

Read `.planning/phases/05-discovery/05-CONTEXT.md` for full text. Key locks:

- **Feed view:** split layout (list left, detail pane right). Full fit reasoning visible.
- **Fit format:** `"94 · Strong fit"` (number + tier). Color: `≥90` emerald-300, `70–89` zinc-300, `<70` zinc-500.
- **Reasoning:** BOTH chips ("NAICS match · Capacity OK · 3 prior wins · Workable deadline") AND a 1–2 sentence AI summary. Null summary → "No summary generated."
- **Recompute:** async on capture-profile change.
- **Quick Import:** persistent input bar in feed header. Live 4-step inline progress (Fetching → Parsing → Scoring → Done). Save raw + flag on partial fail. PDFs/DOCX same pipeline. Status backed by Upstash Redis (NOT a Map — Vercel lambdas are stateless across invocations).
- **Alert channels at MVP:** email + Telegram + Discord. **NOT Slack.**
- **Alert prefs:** per-org default + per-user override (`rfp_alert_prefs` table; user row trumps org row).
- **Threshold:** default ≥80, user-tunable 60–100, frequency cap 5/day with batched digest fallback.
- **Alert content:** compact line for Telegram/Discord; email gets reasoning chips + AI summary inline.
- **Discovery feed UI lives at:** `app/(dashboard)/org/[orgId]/discovery/` (NOT under `app/(rfp-marketing)/`).
- **Visual mood:** dark zinc-950, mono-uppercase eyebrows, italic Georgia accents — same as `/rfp/*` marketing.

**DEFERRED (do NOT implement in Phase 5):** Slack, bulk paste / CSV import, quiet hours / DND, in-app notification center, snooze/dismiss on opps, user-tunable scoring weights, score history / deltas.

---

## What to do RIGHT NOW

### Step 1: Check Wave 1 status

```bash
cd ~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core
ls -1 .planning/phases/05-discovery/*-SUMMARY.md 2>/dev/null
git log --oneline -20 2>&1 | grep -E "feat\(05-0[12]\)"
```

Expected when Wave 1 succeeded:
- `05-01-SUMMARY.md` and `05-02-SUMMARY.md` exist
- ~6+ commits prefixed `feat(05-01):` and `feat(05-02):`
- New migration files in `supabase/migrations/20260510_*.sql`
- New cron handlers under `app/api/cron/` or similar

If Wave 1 hasn't completed: `TaskList` may show in-progress agents, OR the previous session may have lost track. Search recent commits — if 05-01/02 commits are landing in real time, agents are still working; wait. If no commits in 30+ min and no SUMMARY files: spawn fresh execute-plan agents using the prompts below (idempotent — skip-if-summary-exists).

### Step 2: Spot-check Wave 1

For each completed plan:
1. SUMMARY.md exists in `.planning/phases/05-discovery/`
2. First 2 files from `key-files.created` exist on disk (`ls` them)
3. `git log --oneline | grep "feat(05-0X)"` returns ≥1 commit
4. `grep -l "Self-Check: FAILED" .planning/phases/05-discovery/*.md` returns nothing

If any check fails: surface to Lorenzo; do NOT auto-retry — he'll decide.

### Step 3: Spawn Wave 2

Once Wave 1 spot-checks pass, spawn ONE agent for 05-03:

```
Agent({
  description: "Execute plan 05-03 Fit scoring",
  subagent_type: "gsd-executor",
  run_in_background: true,
  prompt: <see WAVE-2-PROMPT below>
})
```

### Step 4: Wave 3 (after Wave 2 SUMMARY exists)

Spawn TWO agents in parallel:
- `gsd-executor` for 05-04 (Feed UI + OrgSwitcher) — `wave_critical: true`, expect long run
- `gsd-executor` for 05-05 (Quick Import) — `wave_critical: true`, Upstash Redis required

Before spawning Wave 3, restart the dev server (UI changes will trigger HMR; you'll want it up):
```bash
PATH="/Users/lorenzodaughtry-chambers/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH" PORT=3001 \
/usr/bin/nohup /opt/homebrew/bin/npm run dev > /tmp/perpetual-core-dev.log 2>&1 </dev/null &
```

### Step 5: Wave 4 (after Wave 3 SUMMARYs exist)

Parallel: 05-06 (dual-mode) + 05-07 (alerts).

### Step 6: Verify + close phase

```
Agent({
  description: "Verify Phase 5",
  subagent_type: "gsd-verifier",
  prompt: <see VERIFY-PROMPT below>
})
```

If `## VERIFICATION PASSED`:
```bash
node /Users/lorenzodaughtry-chambers/.claude/get-shit-done/bin/gsd-tools.cjs phase complete 5
node /Users/lorenzodaughtry-chambers/.claude/get-shit-done/bin/gsd-tools.cjs commit "docs(phase-05): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md .planning/phases/05-discovery/*-VERIFICATION.md
```

If `## ISSUES FOUND` or `gaps_found`: surface to Lorenzo, offer `/gsd:plan-phase 5 --gaps` (don't auto-trigger — gap closure deserves a human checkpoint).

---

## WAVE-2-PROMPT (paste verbatim into the Agent call)

```
<objective>
Execute plan 05-03 of phase 05-discovery for the Perpetual Core project.

Project root: `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core`

Commit each task atomically. Create 05-03-SUMMARY.md when done. Update STATE.md and ROADMAP.md plan progress at the end.
</objective>

<execution_context>
@/Users/lorenzodaughtry-chambers/.claude/get-shit-done/workflows/execute-plan.md
@/Users/lorenzodaughtry-chambers/.claude/get-shit-done/templates/summary.md
@/Users/lorenzodaughtry-chambers/.claude/get-shit-done/references/checkpoints.md
@/Users/lorenzodaughtry-chambers/.claude/get-shit-done/references/tdd.md
</execution_context>

<files_to_read>
- /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/phases/05-discovery/05-03-PLAN.md
- /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/phases/05-discovery/05-CONTEXT.md
- /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/phases/05-discovery/05-01-SUMMARY.md (depends on this)
- /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/phases/05-discovery/05-02-SUMMARY.md (depends on this)
- /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/STATE.md
- /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/CLAUDE.md
</files_to_read>

<critical_rules>
- Branch: main. All commits prefixed `feat(05-03):` or `chore(05-03):`. Atomic per task.
- DB migrations: `supabase/migrations/20260510_rfp_scoring.sql` — apply via Supabase MCP `apply_migration` to project hgxxxmtfmvguotkowxbu.
- Use `rfp_my_org_ids()` SECURITY DEFINER helper for RLS on org-scoped tables.
- Server/cron paths use `createAdminClient()` from `@/lib/supabase/server`. Feed reads use request-scoped `createClient()` (preserves RLS).
- TS strict, no `any`. No new npm deps without justification.
- Empty capture profile case: return score=50 with chip array padded to length 4 using source-tier fallback ('Federal'/'NYC'/'Foundation'/'Other source'). Non-pending path also pads to 4.
- Async recompute on capture-profile change: queue or unawaited promise pattern (Next 14 has no `after()`; use `void recomputeAllForOrg(...)`).
- Skip alerts on `recomputeAllForOrg` — alerts only fire on cron-discovered new opps.
- AI summary: 1-2 sentences via Anthropic SDK. Null on failure → renderer shows 'No summary generated.'
</critical_rules>

<success_criteria>
- All tasks in 05-03-PLAN.md executed and committed atomically
- All `must_haves.truths` verified
- All `must_haves.artifacts` exist with min_lines/contains satisfied
- DB migration applied + committed
- 05-03-SUMMARY.md created
- STATE.md + ROADMAP.md plan progress updated via gsd-tools
- `npm run lint` and typecheck pass before final commit
</success_criteria>
```

---

## WAVE-3-PROMPT-PARALLEL (spawn TWO agents simultaneously)

For 05-04 (Feed UI + OrgSwitcher) and 05-05 (Quick Import). Same shape as Wave 2 but reference the right plan + extra rules.

### 05-04 specific rules
- Discovery feed lives at `app/(dashboard)/org/[orgId]/discovery/` — NOT in rfp-marketing route group.
- DetailPane MUST render BOTH chips AND AI summary; null summary shows literal text "No summary generated."
- Server prefetch in `page.tsx` uses request-scoped `createClient` from `@/lib/supabase/server` — NEVER `createAdminClient`.
- FitScoreChip renders `"94 · Strong fit"` — number + tier label inline.
- Filter pills above feed: Source, Deadline (7d/30d/all), Min amount. Sort: fit desc.
- Plan flagged `wave_critical: true` — long execution expected; don't get spooked by 12 file mods.

### 05-05 specific rules
- Persistent input bar in the feed header — always visible.
- Live 4-step inline progress UI: ○ Fetching → ○ Parsing → ○ Scoring → ● Done. Mono type, emerald checks. Match the visual rhyme with the marketing site's "Live Capture Feed" tile in `app/(rfp-marketing)/rfp/page.tsx`.
- Job state via Upstash Redis ONLY. NO Map fallback. Reference `lib/rate-limit/index.ts` for client construction.
- Next 14 has no `after()` API — use fire-and-forget unawaited promise (`void runQuickImport(...)`). Document in code comment.
- Save-raw-+-flag on partial parse failure (`Needs review` badge in feed row).
- PDF/DOCX URLs use the same scrape pipeline; do NOT route to vault.
- Plan flagged `wave_critical: true`.

Body of each prompt mirrors Wave 2 prompt with plan number swapped + critical_rules above.

---

## WAVE-4-PROMPT-PARALLEL (spawn TWO agents simultaneously)

For 05-06 (Dual-mode) and 05-07 (Alerts).

### 05-06 specific rules
- `mode='all'` for dual users union nonprofit + forprofit org IDs they own.
- Empty `dual_org_ids` → return `{ rows: [], next_cursor: null, empty_reason: 'no_member_orgs' }`. DiscoveryClient renders empty state with /orgs/new CTA.
- Mode pill (`Nonprofit | For-profit | All`) appears only for users whose active org is `dual` mode.

### 05-07 specific rules
- Alert channels at MVP: email + Telegram + Discord. **NO Slack** — explicitly skipped per CONTEXT.md.
- New table `rfp_alert_prefs` with `(org_id, user_id NULL)` for org default and `(org_id, user_id NOT NULL)` for user override; user-row trumps org-row.
- Threshold default ≥80, user-tunable 60–100. Frequency cap 5/day per channel; if more, batch into single digest.
- Alert content: compact line for Telegram/Discord (`94 · Strong fit · {title} · ${amount} · deadline {date} · open →`); email gets reasoning chips + AI summary inline.
- Resend env: `RFP_ALERT_FROM_EMAIL ?? RESEND_FROM_EMAIL ?? 'noreply@perpetualcore.com'`. Domain not yet verified — fallback gracefully to console.log when send fails.
- Settings UI for alert prefs lives under `app/(dashboard)/org/[orgId]/settings/alerts/`.

---

## VERIFY-PROMPT (after Wave 4 completes)

```
Verify phase 5 (Discovery) goal achievement against the actual codebase.

Project root: /Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core
Phase directory: .planning/phases/05-discovery/

Phase Goal (verbatim from ROADMAP.md):
"Users see a live, ranked feed of opportunities from 6 sources matched to their org, can filter and import arbitrary URLs, and receive high-fit alerts."

Phase requirement IDs (every one MUST be accounted for in REQUIREMENTS.md traceability):
DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, ORG-03, ORG-04

For each PLAN.md in the phase directory, cross-reference its `must_haves` against actual code/DB state. Use Supabase MCP to query LDC Brain (project hgxxxmtfmvguotkowxbu) for new tables, RLS policies, and any seed data. Check files exist with min_lines/contains expectations.

Things to specifically verify:
- Vercel cron entries exist in vercel.json with 6h cadence
- New tables (rfp_source_baseline if present, rfp_alert_prefs) have RLS enabled
- No `RESEND_FROM` references — only `RESEND_FROM_EMAIL`
- 05-05 Quick Import uses Upstash Redis, NOT module-scope Map
- 05-04 Discovery feed at app/(dashboard)/org/[orgId]/discovery/ (NOT rfp-marketing)
- Alert channels: email, Telegram, Discord — NO Slack code path

Create VERIFICATION.md at .planning/phases/05-discovery/05-VERIFICATION.md with frontmatter `status: passed | human_needed | gaps_found` and detailed must-haves vs reality table.
```

---

## After Phase 5 verification passes

```bash
cd ~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core
node /Users/lorenzodaughtry-chambers/.claude/get-shit-done/bin/gsd-tools.cjs phase complete 5
node /Users/lorenzodaughtry-chambers/.claude/get-shit-done/bin/gsd-tools.cjs commit "docs(phase-05): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md .planning/phases/05-discovery/*-VERIFICATION.md
```

Then `/gsd:progress` to route to Phase 6 (Capture Profile).

---

## Off-roadmap inheritance from this session

Things shipped today that aren't tracked in any plan but may matter:

- **`rfp.perpetualcore.com` subdomain** — host-based middleware in `middleware.ts` rewrites root → `/rfp` for that host. Cookie domain set to `.perpetualcore.com` in production for cross-subdomain SSO. Domain attached to Vercel project `ai-os-platform` via direct API POST (CLI was blocked by cross-team scope). TXT verification on `_vercel.perpetualcore.com` may still be PENDING — check `https://api.vercel.com/v6/domains/perpetualcore.com?teamId=team_QC77u3MLDVxFLID7hCuF8EOy` if needed.
- **Marketing pages live at `app/(rfp-marketing)/rfp/*`:** sales (`page.tsx`), pricing, trust, how-it-works. Editorial dark mood (zinc-950 + emerald + Georgia italic). All routes serve 200 locally. Uncommitted as of mid-session — should commit at some point.
- **Vercel team consolidation pending:** `perpetualcore.com` apex registered in `the-gdi` team; `ai-os-platform` project lives in `gdi-727dc440` team. Every future subdomain addition will need TXT verification until consolidated. Recommend: transfer project to `the-gdi` during a low-traffic window. See `.planning/phases/04-foundations-salvage-port/marketing-surface-addendum.md`.
- **Lorenzo's `/orgs/new` always shows the create form** — returning users with an existing org will create a duplicate. Add a redirect-to-existing-org check at some point (small follow-up, not phase-scoped).
- **Resend domain `perpetualcore.com` not yet verified** — alert emails will fall through to console.log fallback until DNS is set up. Owner: Lorenzo.

---

## Recent commits for context

```
fe169ee docs(05): plan phase 5 discovery (7 plans, 4 waves)
3118e17 docs(05): capture phase 5 discovery context
65ca868 feat(04-04): add accept-invite page + AcceptInviteForm client component
da74644 feat(04-04): add lib/rfp/invites.ts + three invite API routes
b24e7f1 feat(04-04): add rfp_org_invites migration with RLS and auto-accept trigger
847dfcd feat(04-03): port workspace layout to app/(dashboard)/org/[orgId]/
302fca7 feat(04-03): add /orgs/new page + CreateOrgForm client component
1973f09 feat(04-03): create lib/rfp/orgs.ts + POST/GET /api/orgs
```

---

## TaskList state at handoff

```
#14 [in_progress] Commit Phase 5 plans + execute Wave 1
#15 [pending]     Wave 2: Execute 05-03 Fit scoring engine
#16 [pending]     Wave 3: Execute 05-04 Feed UI + 05-05 Quick Import
#17 [pending]     Wave 4: Execute 05-06 Dual-mode + 05-07 Alerts
#18 [pending]     Verify Phase 5 + mark complete
```

When fresh session picks up: mark #14 complete (or in_progress) based on Wave 1 spot-check, advance through 15-18 as you go.

---

## Key file paths cheatsheet

```
.planning/ROADMAP.md
.planning/REQUIREMENTS.md
.planning/STATE.md
.planning/phases/04-foundations-salvage-port/   (Phase 4 — done, summaries written today)
.planning/phases/05-discovery/                  (Phase 5 — current)
  ├── 05-CONTEXT.md     (locked decisions)
  ├── 05-01-PLAN.md ... 05-07-PLAN.md
  ├── 05-NN-SUMMARY.md  (executor writes these)
  ├── deferred-items.md
  └── 05-VERIFICATION.md  (verifier writes after Wave 4)
app/(dashboard)/org/[orgId]/  (workspace, includes /discovery target for 05-04)
app/(rfp-marketing)/rfp/      (marketing, off-roadmap, uncommitted)
app/api/cron/                 (cron handlers go here for Vercel)
app/api/orgs/                 (existing org endpoints from Phase 4)
lib/rfp/                      (sources.ts, orgs.ts, invites.ts — extend; new: scoring.ts, ingestion/, alerts/)
lib/supabase/server.ts        (createClient + createAdminClient)
lib/email/index.ts:74         (RESEND_FROM_EMAIL — actual env var)
lib/rate-limit/index.ts       (Upstash Redis precedent)
middleware.ts                 (host-based rewrite + cookie domain logic)
supabase/migrations/           (new: 20260510_rfp_*.sql for Phase 5)
vercel.json                    (cron schedules)
```

---

## If something is unclear

Re-read in this order:
1. `.planning/phases/05-discovery/05-CONTEXT.md` — locked user decisions
2. `.planning/phases/05-discovery/05-NN-PLAN.md` — what to build
3. `.planning/research/rfp-engine/TECH-SPEC.md` — agent architecture, scoring weights, tool calls
4. `CLAUDE.md` (project root) — coding rules
5. `~/CLAUDE.md` (global) — Lorenzo's preferences

If still stuck after reading those: ask Lorenzo a tight, specific question. Don't speculate.
