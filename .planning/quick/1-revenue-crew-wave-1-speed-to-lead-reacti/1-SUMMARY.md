---
phase: quick-1-revenue-crew-wave-1
plan: 1
subsystem: ops-plane
tags: [revenue-crew, speed-to-lead, reactivation, resend, stripe, telegram, autonomy-charter]
requires: [lib/ops/types.ts, lib/ops/pnl-sources.ts, lib/ops/deck-push.ts, lib/ops/telegram.ts, lib/ops/runner.ts]
provides:
  - speed-to-lead capability (hourly cadence, dry-run default)
  - reactivation capability (weekly cadence, queue-only, no send path)
  - shared revenue-crew infra (two-key send gate, vault queue/ledger/state)
  - Revenue Crew line in daily Telegram + vault brief
affects: [lib/ops/registry.ts, lib/ops/brief.ts, scripts/ops/daily-brief.ts]
tech-stack:
  added: []
  patterns: [two-key send gate, degrade-graceful findings, always-current vault snapshot, settled() brief isolation]
key-files:
  created:
    - lib/ops/revenue-crew.ts
    - lib/ops/capabilities/speed-to-lead.ts
    - lib/ops/capabilities/reactivation.ts
  modified:
    - lib/ops/registry.ts
    - lib/ops/brief.ts
    - scripts/ops/daily-brief.ts
decisions:
  - "Two-key send gate: OPS_REVENUE_CREW_SEND env var AND per-template approved:true — Wave 1 ships every template approved:false, so nothing can send"
  - "Only tpcmin.com marked verified in FROM_ADDRESSES; pc/coaching from-domains queue-only until Resend verification is confirmed"
  - "Reactivation cap: 25 new customer sequences per run (each = 2 queued touches); reactivation has zero send code paths"
  - "Draft cap counts customers (2-touch sequences), not individual queue entries"
metrics:
  duration: ~55 min (across a session-limit restore)
  tasks: 3
  files: 6
completed: 2026-07-14
---

# Quick Task 1: Revenue Crew Wave 1 (speed-to-lead + reactivation) Summary

Two new queue-only ops capabilities — hourly lead acknowledgment drafts and weekly dormant-Stripe-customer win-back drafts — wired into the registry and daily brief, with a two-key send gate that ships physically unable to send.

## What Shipped

**`lib/ops/revenue-crew.ts`** — shared infra:
- `isSendArmed(templateId)`: true ONLY when `OPS_REVENUE_CREW_SEND === 'true'` AND the template's `APPROVED_TEMPLATES` entry has `approved: true`. All 8 templates ship `approved: false`.
- `resolveResendKey()`: env → `.env.local` via dotenv (strategist pattern). Never logged, never thrown.
- `FROM_ADDRESSES`: `pc` → sales@perpetualcore.com (verified: false), `coaching` → lorenzo@perpetualcore.com (verified: false), `tpc` → lorenzo@tpcmin.com (verified: true — the only confirmed-verified domain in the shared Resend account). Unverified domains are queue-only regardless of gate state.
- Vault writers (all degrade to warn findings, never throw): `queueDraft` → `revenue-crew-queue.md`, `logTouch` → `revenue-crew-touches.md` (third-party emails masked, e.g. `e***@gmail.com`), `loadState`/`saveState` → `revenue-crew-state.json`.

**`lib/ops/capabilities/speed-to-lead.ts`** (`speed-to-lead`, cadence `0 * * * *`):
- Probes `information_schema.tables` on the Brain target first; reads only tables that exist (`leads`, `consultation_bookings`, `enterprise_demo_requests` exist; `contact_submissions` does not → info + skip).
- 72h window, `select *` limit 50, loose field reads, each table isolated.
- Dedupes via state keys `${table}:${id||email}`; queues per-source acknowledgment drafts as QUEUED-AWAITING-LORENZO; logs masked touches; one Telegram ping when new leads land.
- Send branch exists but is unreachable in Wave 1 (all templates unapproved + pc domain unverified).
- Info findings for unwired sources: `partner_leads (huma/care-ops)`, `RFP/Academy signups`.

**`lib/ops/capabilities/reactivation.ts`** (`reactivation`, cadence `0 9 * * 1`):
- Loads pc/coaching/tpc Stripe accounts via existing pnl-sources loaders, each isolated with "Source unavailable" degrade.
- Read-only `charges.list({limit:100})`; dormant = last succeeded charge >90 days; segments by `{property, engine}` (engine from `metadata.product`, else `untagged`); TPC never blended, ministry-tone templates.
- Queues 2-touch win-back sequences (touch 2 annotated "send 7 days after touch 1"), capped at 25 customers/run, deduped by `${property}:${email}`.
- **No send path exists in this capability.** Optional Resend broadcast DRAFT mirror is gated on `RESEND_REVENUE_CREW_SEGMENT_ID` (not set → info finding, currently the case) and uses the `segment_id` wire field; never calls send/schedule.
- Writes always-current `revenue-crew-reactivation.md` snapshot.

**Wiring** — both registered in `CAPABILITIES`; `revenueCrewLine` in `BriefInput`; 🤝 line in Telegram render; `## Revenue Crew` section in the vault brief; daily-brief runs both through `settled()` isolation and extracts headlines by project name.

## Verification Output (actual)

`npx tsx scripts/ops/run.ts speed-to-lead` → exit 0:
```
SPEED TO LEAD: worst=info · 0 critical · 0 warn
[ok] Speed to Lead: 0 new lead(s) — 0 queued, 0 sent (dry-run) · 3 source(s) read, 1 skipped
```

`npx tsx scripts/ops/run.ts reactivation` → exit 0 (first run):
```
[ok] Reactivation: 10 dormant customer(s) across 3 account(s) — 10 win-back draft(s) queued, 0 sent (charter: outbound queues for Lorenzo)
```
Second run queued 0 (dedupe held); queue depth stayed at 20 entries, all `QUEUED-AWAITING-LORENZO`.

`npx tsx scripts/ops/daily-brief.ts` → exit 0, `brief → telegram ✓`, operator-brief-2026-07-14.md contains:
```
## Revenue Crew
- 0 new lead(s) — 0 queued, 0 sent (dry-run) · 3 source(s) read, 1 skipped · 10 dormant customer(s) across 3 account(s) — 0 win-back draft(s) queued, 0 sent (charter: outbound queues for Lorenzo)
```

Safety greps: `grep -ri "re_[A-Za-z0-9]" lib/ops/` → nothing; `grep -nE "\.(create|update|del|cancel|expire)\(" lib/ops/capabilities/reactivation.ts` → nothing. `npm run build` green (pre-existing `app/error.tsx` warning only).

## Vault Artifacts

All in `~/dev/LDC-Command-Center-Vault/_claude/memory/ops-findings/`:
- `revenue-crew-queue.md` — 20 drafts (10 customers × 2 touches: 1 coaching, 9 tpc), every entry QUEUED-AWAITING-LORENZO
- `revenue-crew-touches.md` — masked touch ledger
- `revenue-crew-state.json` — dedupe state
- `revenue-crew-reactivation.md` — always-current segmentation snapshot
- `speed-to-lead-2026-07-14.md`, `reactivation-2026-07-14.md` — runner's dated reports

## What Lorenzo Must Do to Arm Sending (both keys required)

1. Review each template's text in `APPROVED_TEMPLATES` (`lib/ops/revenue-crew.ts`) and flip its `approved: false` → `true` — per template, only for text you've blessed.
2. Set `OPS_REVENUE_CREW_SEND=true` in the runtime env.
3. For pc/coaching sends: verify `perpetualcore.com` in the shared Resend account, then flip `verified: false` → `true` in `FROM_ADDRESSES`. Until then those properties stay queue-only even with both gate keys turned.

Reactivation never sends regardless — its drafts are dispatched by you from the vault queue (or via a Resend broadcast draft if you configure `RESEND_REVENUE_CREW_SEGMENT_ID`).

## Deviations from Plan

None - plan executed exactly as written. (Task 1's smoke ran via a scratchpad `runCapability` harness because registry wiring is Task 3 by design; re-verified through `scripts/ops/run.ts` after Task 3.)

## Commits

- `7bea015` feat(ops): add speed-to-lead capability with dry-run-default send gate
- `046b59b` feat(ops): add reactivation capability — dormant-customer win-back drafts, queue-only
- `eeaf8ee` feat(ops): wire Revenue Crew into ops registry and daily brief

## Self-Check: PASSED

- All 3 created files exist (395/292/368 lines — all above min_lines)
- All 3 task commits present: 7bea015, 046b59b, eeaf8ee
- No hardcoded keys in lib/ops/; no mutating Stripe calls in reactivation.ts
