# HANDOFF — RFP Engine Phase 24 In Progress

**Updated:** 2026-06-11
**Repo:** `~/perpetual-core-rfp`
**Branch:** `feat/rfp-orgs-invites-cont`
**Prod:** `https://rfp.perpetualcore.com`
**DB:** LDC Brain AI / Supabase project `hgxxxmtfmvguotkowxbu`

## Status

Phase 19 and Phase 20 are closed. Phase 24 is in progress.

The last production deployment from Phase 19 is:

```text
dpl_8xnvTW5qLYeXc3CPuiocvQuJK4ui
```

That deployment includes a closeout fix in `app/api/rfp/proposals/[proposalId]/package/route.ts`: the route now passes `solicitation_mode` and `force_re_extract` into `FieldsSchema.safeParse(...)`. Before that fix, the UI toggle submitted the values but the route never entered the rubric extraction branch.

## Phase 20 Closed State

All Phase 20 plans are complete.

Implemented locally and applied to live DB:

- `PATCH /api/rfp/proposals/[proposalId]/status` accepts `no_bid`.
- Live Supabase constraint `rfp_proposals_status_check` accepts `draft`, `submitted`, `won`, `lost`, `no_bid`, and legacy `withdrawn`.
- Proposal/pursuit UI renders `no_bid` and legacy `withdrawn` as `No-bid`.
- Proposals list No-bid filter includes both `no_bid` and legacy `withdrawn`.
- Readiness treats `no_bid` as closed.
- Live Supabase amendment tables exist with RLS:
  - `rfp_solicitation_snapshots`
  - `rfp_solicitation_amendments`
- `/api/cron/rfp-amendment-monitor` scans active proposal-backed pursuits and creates baseline snapshots/diffs.
- `/api/rfp/opps/[id]/amendments` and `/api/rfp/opps/[id]` expose recent amendments through tenant-scoped reads.
- Discovery detail pane renders recent solicitation amendments.
- Material amendments create a critical submission task plus a pursuit decision-log risk entry.
- Submission bundle is verified as a coherent packet:
  - proposal DOCX
  - submission manifest CSV
  - compliance CSV
  - packet CSV
  - readiness JSON
  - audit trail CSV
  - missing-artifact notes when readiness artifacts do not exist yet

Verification:

- Submission unit tests passed: 5 files / 13 tests.
- Focused RLS status test passed: `PATCH status='no_bid'`.
- Amendment unit test passed: `tests/unit/rfp-amendment-diff.test.ts`.
- Touched-file ESLint passed for amendment files/routes/UI.
- Runtime import check passed for amendment modules/routes.
- Live DB table/RLS verification passed for amendment tables.
- Submission bundle/manifest tests passed.
- Full RLS file has unrelated drift: older submitted-status test now hits submit-readiness gate `409`; package/redraft tests hit 5s timeout.
- `npm run type-check` was stopped after 5+ minutes with no diagnostics while `tsc` was still active.

## Phase 24 Current State

Completed 24-01 / ADMIN-04 JSON hardening:

- `/api/health/rfp` now returns `scraper_last_success`.
- `/api/health/rfp` now returns `cron_24h` with runs, successes, warnings, failures, `error_rate`, `error_rate_percent`, latest run, and latest success.
- Existing `open_drift_events` and `last_cron` fields are preserved.
- Endpoint remains public and aggregate-only for uptime/status polling.

Verification:

- `npm run test:run -- tests/unit/rfp-health-monitoring.test.ts` passed, 3 tests.
- Focused ESLint passed for health route/helper/test.
- Direct route smoke with `.env.local` loaded returned HTTP `200` and showed `cron_24h` present.
- Live data currently reports degraded due to `24` unresolved source-drift events.

Completed 24-02 / FTUE-01..03 code:

- New org setup is now five fields: name, type, mission, geography, funding types.
- The setup payload is stored into `rfp_orgs.capacity_summary`.
- Initial post-create scoring still runs through `createOrgWithOwner`.
- Onboarding state now includes `profile_complete`.
- Discovery checklist now follows profile → voice → vault → match → draft → reviewer/export, with visible step CTAs.
- Discovery, Proposals, Vault, and Voice empty states all point toward the first qualified draft path.
- Vault page copy now matches current support for PDF/DOCX extraction and drafter retrieval.

Verification:

- Focused ESLint passed for touched FTUE files.
- Runtime import checks passed for touched client/server modules.
- Local dev server smoke to `/orgs/new` redirected unauthenticated users to login with no page or console errors.
- Production deploy `dpl_DrP1M1S6epZWn4Ug1nSV8xiKNEak` is Ready and aliased to `https://rfp.perpetualcore.com`.
- Production health endpoint includes `scraper_last_success` and `cron_24h`; status is degraded due to `24` open drift events.

Completed 24-03 / ADMIN-03 code:

- Federal and state/city ingest orchestrators accept source filters.
- `/admin/rfp` Source scale readiness has a Rerun action for supported automated sources.
- Reruns log to `cron_executions` as `rfp-manual-source-rerun:{source}` and then revalidate `/admin/rfp` plus `/api/health/rfp`.
- Unsupported sources show `No runner`.

Verification:

- `npm run test:run -- tests/unit/rfp-admin-source-rerun.test.ts` passed, 3 tests.
- Focused ESLint passed.
- Runtime import check passed with local env loaded.

## Verification Evidence

See:

- `.planning/phases/19-rubric-review-compliance-gate-upload/19-04-SUMMARY.md`
- `.planning/phases/19-rubric-review-compliance-gate-upload/19-VERIFICATION.md`

Verified on production:

- 20-page DOCX solicitation upload parsed `12,161` chars without timeout.
- Rubric extraction returned 4 weighted Section M criteria: 40/25/20/15 points.
- Proposal workspace rendered the Evaluation Rubric panel with all 4 criteria.
- Reviewer used `claude-sonnet-4-5`, loaded `rubric_criteria_count=4`, and produced criterion-anchored findings with severity plus concrete `suggestion` text.
- Compliance gate returned expected blockers/signals: `deadline-timezone=missing`, `budget-math=needs_review`, `ai-disclosure=needs_review`, `page-limit=met`.
- AI disclosure acknowledgment flipped `ai-disclosure` to `met` and persisted `ai_disclosure_acknowledged=true`.
- Cached re-upload returned the same 4 criteria IDs; DB count stayed 4.
- Seeded production data was rolled back to zero across criteria, package docs, sections, proposal, checks, tasks, and agent sessions.

## Current Plan

Continue current phase per beachhead sequence:

```text
Phase 24 — Operator Console, Monitoring & FTUE
```

Do not follow `gsd-tools` numeric next-phase output if it points elsewhere. The source of truth is ROADMAP "Execution Sequence":

```text
13 → 14 → 22 → 17 → 18 → 19 → 20 → 24-FTUE → dogfood Uplift/IHA/TPC
```

## Standing Rules

- `/db-safe` behavior for every Supabase operation.
- Use `createAdminClient()` for background/server writes; user-facing reads must preserve RLS unless an existing dual-client route explicitly authorizes then switches.
- Deploy RFP with `vercel --prod --yes` from this worktree/project only.
- Do not deploy this app to the `ai-os-platform` Vercel project.
- Avoid concurrent `tsc` or local builds; Vercel build is the deployment gate for this worktree.
- Remove `.env.verification` and `/tmp/p19-cookies.txt` after verification runs.

## Next Engineering Step

Continue Phase 24 admin cost/margin/budget/entitlement work or authenticated FTUE E2E. Remaining ADMIN-04 task is external uptime/status monitor wiring.

## Open Human Tasks

- SAM.gov system account registration at `fsd.gov`; then set `SAM_GOV_API_KEY` in Vercel prod.
- Discovery Setup checklist remains a Lorenzo/operator onboarding task for real org fit scores.
