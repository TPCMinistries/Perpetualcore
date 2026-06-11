# HANDOFF — RFP Engine Phase 19 Closed → Next Phase 20

**Updated:** 2026-06-11
**Repo:** `~/perpetual-core-rfp`
**Branch:** `feat/rfp-orgs-invites-cont`
**Prod:** `https://rfp.perpetualcore.com`
**DB:** LDC Brain AI / Supabase project `hgxxxmtfmvguotkowxbu`

## Status

Phase 19 is closed. All six REVIEW requirements are complete and production-verified.

The final production deployment is:

```text
dpl_8xnvTW5qLYeXc3CPuiocvQuJK4ui
```

That deployment includes a closeout fix in `app/api/rfp/proposals/[proposalId]/package/route.ts`: the route now passes `solicitation_mode` and `force_re_extract` into `FieldsSchema.safeParse(...)`. Before that fix, the UI toggle submitted the values but the route never entered the rubric extraction branch.

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

Next phase per beachhead sequence:

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

## Open Human Tasks

- SAM.gov system account registration at `fsd.gov`; then set `SAM_GOV_API_KEY` in Vercel prod.
- Discovery Setup checklist remains a Lorenzo/operator onboarding task for real org fit scores.
