---
phase: quick-1-revenue-crew-wave-1
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/ops/revenue-crew.ts
  - lib/ops/capabilities/speed-to-lead.ts
  - lib/ops/capabilities/reactivation.ts
  - lib/ops/registry.ts
  - lib/ops/brief.ts
  - scripts/ops/daily-brief.ts
autonomous: true
requirements: [RC-W1-01-speed-to-lead, RC-W1-02-reactivation, RC-W1-03-wiring]

must_haves:
  truths:
    - "Running `npx tsx scripts/ops/run.ts speed-to-lead` inventories new leads from reachable Brain-DB lead tables, drafts acknowledgment emails into the vault queue, and sends NOTHING (dry-run default)"
    - "Running `npx tsx scripts/ops/run.ts reactivation` segments dormant Stripe customers across pc-studios/personal/tpc accounts and queues win-back drafts — never auto-sends"
    - "A missing table, keychain entry, or API key produces a warn/info finding and the run still completes (never crashes the sweep)"
    - "The daily Telegram brief contains a 'Revenue Crew' line sourced from both capabilities' headline findings"
    - "Every drafted/queued touch is logged to the vault touch ledger with lead id, source, and timestamp"
    - "No secret appears in any file, log, or report — keys resolve via keychain/env/.env.local only"
  artifacts:
    - path: "lib/ops/revenue-crew.ts"
      provides: "Shared Revenue Crew infra: dry-run gate, Resend key resolution, vault queue/ledger/state writers, from-address map"
      min_lines: 80
    - path: "lib/ops/capabilities/speed-to-lead.ts"
      provides: "speed-to-lead Capability (id 'speed-to-lead') — new-lead inventory + queued acknowledgments + Telegram ping"
      exports: ["speedToLead", "SPEED_TO_LEAD_HEADLINE"]
      min_lines: 100
    - path: "lib/ops/capabilities/reactivation.ts"
      provides: "reactivation Capability (id 'reactivation') — dormant Stripe customer segmentation + queued win-back drafts"
      exports: ["reactivation", "REACTIVATION_HEADLINE"]
      min_lines: 100
    - path: "lib/ops/registry.ts"
      provides: "Both capabilities registered in CAPABILITIES"
      contains: "speedToLead"
    - path: "lib/ops/brief.ts"
      provides: "revenueCrewLine in BriefInput, rendered in Telegram + markdown brief"
      contains: "revenueCrewLine"
  key_links:
    - from: "lib/ops/capabilities/speed-to-lead.ts"
      to: "public.leads / consultation_bookings / enterprise_demo_requests / contact_submissions on Brain target"
      via: "ctx.runSql with information_schema existence probe first"
      pattern: "information_schema\\.tables"
    - from: "lib/ops/capabilities/reactivation.ts"
      to: "Stripe accounts"
      via: "loadPcStudiosStripe / loadPersonalStripe / loadTpcStripe from lib/ops/pnl-sources"
      pattern: "load(PcStudios|Personal|Tpc)Stripe"
    - from: "lib/ops/revenue-crew.ts"
      to: "~/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings/"
      via: "fs writes matching portfolio-pnl/strategist OPS_DIR pattern"
      pattern: "LDC-Command-Center-Vault"
    - from: "scripts/ops/daily-brief.ts"
      to: "speed-to-lead + reactivation capabilities"
      via: "getCapability + settled(runCapability(...)) then headline extraction into revenueCrewLine"
      pattern: "getCapability\\('speed-to-lead'\\)"
---

<objective>
Revenue Crew Wave 1: two new ops-plane capabilities — `speed-to-lead` (instant lead acknowledgment, queued-not-sent by default) and `reactivation` (dormant-customer win-back drafts, never auto-sent) — registered in the ops registry, surfaced as a "Revenue Crew" line in the daily Telegram brief, writing all outcomes to the vault.

Purpose: leads currently sit unacknowledged and dormant Stripe customers are never re-touched. This puts an agent on both, inside the ratified autonomy charter (money/outbound always queues for Lorenzo).
Output: `lib/ops/revenue-crew.ts` (shared infra), two capability files, registry + brief wiring, atomic commits on `feat/ops-revenue-crew`.
</objective>

<context>
@lib/ops/types.ts               # Capability / Finding / OpsCtx contract
@lib/ops/capabilities/strategist.ts      # vault write + Telegram + degrade pattern
@lib/ops/capabilities/portfolio-pnl.ts   # Stripe loaders usage + always-current snapshot pattern
@lib/ops/capabilities/revenue-probes.ts  # probe/isolate/degrade style
@lib/ops/pnl-sources.ts         # keychain Stripe loaders (loadPcStudiosStripe/loadPersonalStripe/loadTpcStripe), usd/round2/last4
@lib/ops/registry.ts            # CAPABILITIES array
@lib/ops/brief.ts               # BriefInput + renderBriefTelegram + composeBrief
@scripts/ops/daily-brief.ts     # how capabilities feed the brief (settled() isolation, pnlHeadline pattern)
@lib/ops/telegram.ts            # sendOpsTelegram (never throws)
@lib/ops/executor.ts            # Management API runSql — read-only SQL against targets

Inventory facts (verified during planning — do not re-derive):
- NO `partner_leads` table exists in this repo. Reachable lead tables live on the Brain target (`brain`, ref hgxxxmtfmvguotkowxbu): `leads` (email, first_name, last_name, company, source, segment, status, created_at), `consultation_bookings` (full_name, email, company_name), `enterprise_demo_requests` (full_name, email, company_name), `contact_submissions`. Probe existence before reading; other ecosystem lead sources (huma/care-ops, workforce, academy) are NOT wired from this repo — emit one info finding "source not wired" and skip.
- Resend key: `process.env.RESEND_API_KEY` only (lib/email/config.ts). No keychain entry exists. Headless resolution = env → `.env.local` via dotenv, exactly like strategist.ts `resolveAnthropicKey()`.
- Vault ops dir used by ALL existing capabilities is `~/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings/` — use the same constant, not vault-root `ops-findings/`.
- Telegram: `sendOpsTelegram(BRIEF_CHAT_ID, ...)` with `BRIEF_CHAT_ID = process.env.OPS_BRIEF_CHAT_ID || '6460142816'` (strategist.ts pattern).
- Runner writes the dated findings report automatically (writeback.ts) — capabilities only need extra writes for queue/ledger/state files.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Shared Revenue Crew infra + speed-to-lead capability</name>
  <files>lib/ops/revenue-crew.ts, lib/ops/capabilities/speed-to-lead.ts</files>
  <action>
Create `lib/ops/revenue-crew.ts` — shared infra for both capabilities (no secrets in code, ever):

1. `OPS_DIR` constant = same path as portfolio-pnl.ts (`~/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings`).
2. **Two-key send gate** (the CRITICAL safety rail): `isSendArmed(templateId: string): boolean` returns true ONLY when BOTH (a) `process.env.OPS_REVENUE_CREW_SEND === 'true'` AND (b) the template's entry in an in-file `APPROVED_TEMPLATES` registry has `approved: true`. Ship ALL templates with `approved: false` and a comment: "Flip only after Lorenzo approves the template text — flipping the env var alone can never send." Result: Wave 1 physically cannot send even if the env var is set.
3. `resolveResendKey(): string | null` — env `RESEND_API_KEY`, then `loadDotenv({ path: path.join(process.cwd(), '.env.local') })` fallback, exactly like strategist's `resolveAnthropicKey()`. Never logged, never thrown on missing (return null).
4. `FROM_ADDRESSES` map keyed by property: `pc` → `sales@perpetualcore.com`, `coaching` → `lorenzo@perpetualcore.com`, `tpc` → an `@tpcmin.com` address (tpcmin.com is the ONLY domain confirmed verified in the shared Resend account — annotate that in a comment; per hard constraint, any property whose from-domain isn't confirmed verified is queue-only regardless of gate state, so encode `verified: boolean` per entry with only `tpc` true).
5. Vault writers (all `fs.appendFile`/`writeFile` with `mkdir recursive`, each wrapped so failure returns a warn Finding instead of throwing — copy strategist's posture):
   - `queueDraft(draft)` → appends a markdown block to `revenue-crew-queue.md` (fields: id, ts, capability, source, to, from, subject, body, status: QUEUED-AWAITING-LORENZO).
   - `logTouch(touch)` → appends one line to `revenue-crew-touches.md` (ts · capability · source · lead id/email-last-4 · action). Never write full raw email addresses of third parties into the touch ledger — mask local part (e.g. `j***@acme.com`).
   - `loadState()/saveState()` → `revenue-crew-state.json` in OPS_DIR: `{ speedToLead: { touchedLeadKeys: string[], lastRunIso: string|null }, reactivation: { draftedCustomerKeys: string[], lastRunIso: string|null } }`. Missing/corrupt file → fresh default state (warn finding, keep running).

Create `lib/ops/capabilities/speed-to-lead.ts` exporting `speedToLead: Capability` (`id: 'speed-to-lead'`, `label: 'SPEED TO LEAD'`, `cadence: '0 * * * *'`, `destructive: false`) and `SPEED_TO_LEAD_HEADLINE = 'Speed to Lead'`:

1. Probe which candidate tables exist on the `brain` target FIRST: `select table_name from information_schema.tables where table_schema='public' and table_name in ('leads','consultation_bookings','enterprise_demo_requests','contact_submissions')` via `ctx.runSql`. Import the brain DbTarget from `lib/ops/targets.ts` (`TARGETS.find(t => t.key === 'brain')`) or reuse `BRAIN_TARGET` from `lib/ops/deck-push.ts` if exported — check which exists and reuse, don't duplicate.
2. For each existing table (each in its own try/catch — one broken table never hides another): select rows from the last 72h (`created_at > now() - interval '72 hours'`), columns defensively via `select *` limited to 50, reading fields loosely from `Row` (email may be `email`; name may be `first_name`/`full_name`; tolerate missing columns).
3. Emit one info finding per unwired candidate source: `partner_leads (huma/care-ops)`, `RFP/Academy signups` — "source not wired from this repo — inventory only" (mirrors portfolio-pnl's explicit not-wired posture).
4. Dedupe against `state.speedToLead.touchedLeadKeys` (key = `${table}:${id||email}`). For each NEW lead:
   - Build a personalized acknowledgment from a per-source template in `APPROVED_TEMPLATES` (plain merge of first name/company; short, human, no HTML needed — text body is fine for the queue).
   - If `isSendArmed(templateId)` AND the source's from-domain is verified: send via Resend REST (`https://api.resend.com/emails`, Authorization bearer from `resolveResendKey()`); on missing key → warn finding + queue instead. (In Wave 1 this branch is unreachable because all templates ship `approved: false` — build it anyway so approval is a one-line flip.)
   - Otherwise (the default): `queueDraft(...)` with status QUEUED-AWAITING-LORENZO.
   - Either way: `logTouch(...)`, add key to state.
5. If ≥1 new lead: send ONE Telegram ping via `sendOpsTelegram(BRIEF_CHAT_ID, ...)` summarizing count + sources + "drafts queued in revenue-crew-queue.md (dry-run — nothing sent)". Telegram failure = warn finding, never throws.
6. `saveState()`, then unshift a headline finding `{ severity: 'ok', project: SPEED_TO_LEAD_HEADLINE, summary: 'N new lead(s) — N queued, 0 sent (dry-run) · M source(s) read, K skipped' }` — daily-brief extracts this by project name, same as portfolio-pnl's HEADLINE_PROJECT.

TypeScript strict throughout; no `any`. Commit: `feat(ops): add speed-to-lead capability with dry-run-default send gate`.
  </action>
  <verify>
`npm run build` passes. Then `npx tsx scripts/ops/run.ts speed-to-lead` — expect: exit 0, headline finding printed, report written to vault, `revenue-crew-queue.md`/`revenue-crew-state.json` created if new leads exist, and confirm via the run output + queue file that ZERO emails were sent (all queued). `grep -ri "re_[A-Za-z0-9]" lib/ops/` returns nothing (no hardcoded keys).
  </verify>
  <done>
speed-to-lead runs headless end-to-end in dry-run mode: inventories only tables that exist, queues acknowledgment drafts to the vault, logs touches, updates state, pings Telegram only when new leads found, and cannot send email (env flag alone is insufficient — template approval flag is false).
  </done>
</task>

<task type="auto">
  <name>Task 2: reactivation capability (dormant Stripe win-back drafts)</name>
  <files>lib/ops/capabilities/reactivation.ts</files>
  <action>
Create `lib/ops/capabilities/reactivation.ts` exporting `reactivation: Capability` (`id: 'reactivation'`, `label: 'REACTIVATION'`, `cadence: '0 9 * * 1'`, `destructive: false`) and `REACTIVATION_HEADLINE = 'Reactivation'`:

1. Load the three Stripe accounts via existing loaders from `lib/ops/pnl-sources.ts`: `loadPcStudiosStripe()` (property `pc`), `loadPersonalStripe()` (property `coaching`), `loadTpcStripe()` (property `tpc`). Each account in its own try/catch; null loader → warn finding "Source unavailable: keychain entry ... not found" (copy portfolio-pnl's exact degrade wording style) and continue.
2. Per account, READ-ONLY Stripe calls only (never a mutating endpoint): `charges.list({ limit: 100 })`. Group succeeded charges by customer email (`c.billing_details?.email || c.receipt_email`; skip charges with no email). A customer is DORMANT when their most recent succeeded charge is older than 90 days. Note `has_more` in the finding detail when the 100-charge page doesn't cover history (sampled caveat, same as portfolio-pnl's fmtChargeWindow caveat).
3. Segment dormant customers: `{ property, engine }` where engine comes from the charge's `metadata.product` tag when present (same convention as pnl-sources `collectChargeSummary`), else 'untagged'. TPC stays its own segment — ministry entity, never blended (and its win-back tone is ministry, not sales).
4. For each dormant customer NOT already in `state.reactivation.draftedCustomerKeys` (key = `${property}:${email}`): draft a 2-touch win-back sequence (touch 1: check-in referencing what they bought — engine name + months since last charge; touch 2: 7 days later, direct offer to jump on a call). Use the correct from-address for the property from `FROM_ADDRESSES`. `queueDraft(...)` both touches with status QUEUED-AWAITING-LORENZO + `logTouch(...)` + add key to state. Cap at 25 new drafts per run so a first run doesn't flood the queue (info finding when capped).
5. **NEVER auto-send — no send path exists in this capability at all** (per the ratified autonomy charter: money/outbound/pricing always queue for Lorenzo). Optional Resend-draft mirror: ONLY IF `process.env.RESEND_REVENUE_CREW_SEGMENT_ID` is set AND `resolveResendKey()` returns a key, additionally create an UNSENT Resend broadcast draft via `POST https://api.resend.com/broadcasts` (body: segment/audience id from that env var, from, subject, text; NEVER call the send/schedule endpoint). If the env var is absent (it currently is), emit one info finding "Resend draft mirror skipped — RESEND_REVENUE_CREW_SEGMENT_ID not configured; drafts queued in vault only". NOTE: Resend renamed Audiences→Segments; the wire field is `segment_id` — do not use stale `audience_id`.
6. Write an always-current `revenue-crew-reactivation.md` snapshot to OPS_DIR (mirroring portfolio-pnl's always-current file): per-segment dormant counts, drafts queued this run, total queue depth, sampled-history caveats. Wrapped in try/catch → warn finding on failure.
7. `saveState()`; unshift headline finding `{ severity: 'ok', project: REACTIVATION_HEADLINE, summary: 'N dormant customer(s) across M account(s) — K win-back draft(s) queued, 0 sent (charter: outbound queues for Lorenzo)' }`.

TypeScript strict; no `any`. Do not modify pnl-sources.ts. Commit: `feat(ops): add reactivation capability — dormant-customer win-back drafts, queue-only`.
  </action>
  <verify>
`npm run build` passes. `npx tsx scripts/ops/run.ts reactivation` — expect exit 0; for each of the three Stripe accounts either a segment result or a "Source unavailable" warn finding; `revenue-crew-reactivation.md` written; queue entries (if any dormant customers) all carry QUEUED-AWAITING-LORENZO; run output confirms 0 sends. Confirm no mutating Stripe call exists: `grep -nE "\.(create|update|del|cancel|expire)\(" lib/ops/capabilities/reactivation.ts` returns nothing (broadcast mirror uses raw fetch, and only when env-gated).
  </verify>
  <done>
reactivation runs headless: segments dormant customers from whichever of the three Stripe accounts are wired, queues capped win-back drafts to the vault with correct per-property from-addresses, writes the always-current snapshot, and contains no code path that sends email.
  </done>
</task>

<task type="auto">
  <name>Task 3: Registry + daily-brief wiring, build gate</name>
  <files>lib/ops/registry.ts, lib/ops/brief.ts, scripts/ops/daily-brief.ts</files>
  <action>
Wire the two capabilities in — touch nothing else in these files (surgical):

1. `lib/ops/registry.ts`: import `speedToLead` and `reactivation`, append both to `CAPABILITIES`.
2. `lib/ops/brief.ts`: add `revenueCrewLine: string | null` to `BriefInput`. In `renderBriefTelegram`, after the Portfolio line, render `🤝 Revenue Crew: <line>` when non-null (strip markdown chars like the pnl line does). In `composeBrief`, add a `## Revenue Crew` section after `## Portfolio P&L`: the line when present, else `- No revenue-crew run found — run \`npx tsx scripts/ops/run.ts speed-to-lead\`.` (mirror the pnl fallback style).
3. `scripts/ops/daily-brief.ts`: in step 1 (freshen the pulse), add `getCapability('speed-to-lead')` and `getCapability('reactivation')`, each run through the existing `settled(runCapability(...).then(r => r.findings), [])` isolation. Import `SPEED_TO_LEAD_HEADLINE` and `REACTIVATION_HEADLINE`; extract each capability's headline finding by project name (same pattern as `pnlHeadline`); compose `revenueCrewLine` as `"<stl summary> · <react summary>"` (whichever are present; null if neither) and pass it in `briefInput`.
4. Gate: `npm run build` must pass (repo has pre-existing tsc debt — the build is the gate, not repo-wide tsc).
5. Commit: `feat(ops): wire Revenue Crew into ops registry and daily brief`.
  </action>
  <verify>
`npm run build` passes. `npx tsx scripts/ops/run.ts speed-to-lead` still lists both new ids in the registry error path (`npx tsx scripts/ops/run.ts bogus` prints available ids including speed-to-lead and reactivation). Full smoke: `npx tsx scripts/ops/daily-brief.ts` completes, the vault operator-brief file for today contains a `## Revenue Crew` section, and the Telegram message (if token present) includes the 🤝 line. `git log --oneline -3` shows the three atomic feat(ops) commits on feat/ops-revenue-crew.
  </verify>
  <done>
Both capabilities are registered (resolvable by id, visible to runner/HUD), the daily brief renders a Revenue Crew line in both Telegram and vault markdown, build passes, and three atomic commits exist on feat/ops-revenue-crew.
  </done>
</task>

</tasks>

<verification>
- `npm run build` green on feat/ops-revenue-crew.
- `npx tsx scripts/ops/run.ts speed-to-lead` and `... reactivation` both exit 0 with headline findings, on a machine with keychain PAT + Stripe entries (this one) AND degrade to warn findings when a secret is absent (spot-check by running one with `HOME=/tmp/nohome` expectations reasoned, not required to execute).
- Vault artifacts exist after runs: `revenue-crew-queue.md` (all entries QUEUED-AWAITING-LORENZO), `revenue-crew-touches.md`, `revenue-crew-state.json`, `revenue-crew-reactivation.md`, plus the runner's dated reports.
- Zero outbound email in Wave 1: every template ships `approved: false`; reactivation has no send path; grep confirms no hardcoded keys.
- app/ routes and HQ UI untouched; no capability file other than the two new ones modified beyond registry/brief wiring.
</verification>

<success_criteria>
- Two new capabilities live in `lib/ops/capabilities/`, registered, cadenced, `destructive: false`, following the strategist/portfolio-pnl degrade-graceful posture (missing source = finding + skip, never a crash).
- Dry-run/queue mode is the hard default with a two-key gate (env var AND per-template approval flag) — Lorenzo approving templates is a one-line flip later, and nothing can send before that.
- Daily Telegram brief surfaces a "Revenue Crew" line; all outcomes land as markdown in `~/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings/`.
- TypeScript strict, `npm run build` passes, 3 atomic commits on feat/ops-revenue-crew.
</success_criteria>

<output>
After completion, create `.planning/quick/1-revenue-crew-wave-1-speed-to-lead-reacti/1-SUMMARY.md` (what shipped, queue/ledger file paths, what Lorenzo must approve to arm sending).
</output>
