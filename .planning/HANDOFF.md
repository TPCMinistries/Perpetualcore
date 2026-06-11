# HANDOFF — RFP Engine Phase 20 In Progress

**Updated:** 2026-06-11
**Repo:** `~/perpetual-core-rfp`
**Branch:** `feat/rfp-orgs-invites-cont`
**Prod:** `https://rfp.perpetualcore.com`
**DB:** LDC Brain AI / Supabase project `hgxxxmtfmvguotkowxbu`

## Status

Phase 19 is closed. Phase 20 is now in progress.

The last production deployment from Phase 19 is:

```text
dpl_8xnvTW5qLYeXc3CPuiocvQuJK4ui
```

That deployment includes a closeout fix in `app/api/rfp/proposals/[proposalId]/package/route.ts`: the route now passes `solicitation_mode` and `force_re_extract` into `FieldsSchema.safeParse(...)`. Before that fix, the UI toggle submitted the values but the route never entered the rubric extraction branch.

## Phase 20 Current State

Plans 20-01 and 20-03/04 are complete.

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

Verification:

- Submission unit tests passed: 5 files / 13 tests.
- Focused RLS status test passed: `PATCH status='no_bid'`.
- Amendment unit test passed: `tests/unit/rfp-amendment-diff.test.ts`.
- Touched-file ESLint passed for amendment files/routes/UI.
- Runtime import check passed for amendment modules/routes.
- Live DB table/RLS verification passed for amendment tables.
- Full RLS file has unrelated drift: older submitted-status test now hits submit-readiness gate `409`; package/redraft tests hit 5s timeout.
- `npm run type-check` was stopped after 5+ minutes with no diagnostics while `tsc` was still active.

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
Phase 20 — Submission Tracking & Amendments
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

Finish Phase 20-02:

- Verify submission bundle/manifest/audit/export flow as a coherent packet.
- Polish any remaining packet UX gaps.
- Then close Phase 20 and move to Phase 24-FTUE per beachhead sequence.

## Open Human Tasks

- SAM.gov system account registration at `fsd.gov`; then set `SAM_GOV_API_KEY` in Vercel prod.
- Discovery Setup checklist remains a Lorenzo/operator onboarding task for real org fit scores.
