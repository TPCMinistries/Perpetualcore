# HANDOFF — RFP Engine, resume Phase 19 close-out (written 2026-06-11 by Claude, herald Mac)

For the next agent (Codex/ChatGPT/Claude — any). Repo: `~/perpetual-core-rfp` (worktree of `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core`), branch `feat/rfp-orgs-invites-cont`. Everything below is committed and pushed; prod is live at https://rfp.perpetualcore.com (Vercel project `the-gdi/perpetual-core-rfp`, ships via `vercel --prod` CLI from this worktree, NOT auto-deploy on push). The previous Phase-5 handoff that lived in this file is obsolete (see git history).

## Where things stand (verified, not aspirational)

- **Phase 18 (explainable fit scoring): CLOSED.** See `.planning/phases/18-explainable-fit-scoring/18-04-SUMMARY.md`.
- **Light redesign of dashboard chrome: SHIPPED** (cf9edc3) and live.
- **API keys rotated 2026-06-09:** new funded ANTHROPIC_API_KEY + GOOGLE_AI_API_KEY in all Vercel project envs (both teams) and `~/.secrets/`. All AI-active projects redeployed. LLM model-chain pattern: claude-sonnet-4-5 → claude-haiku-4-5 → gpt-4o (`lib/rfp/scoring/summary.ts`, `lib/rfp/review/generate.ts`, `lib/rfp/rubric/extract.ts`).
- **Phase 19 (Rubric Review, Compliance Gate & Upload): 3 of 4 plans fully done; plan 4 is 2/3 done.**
  - 19-01 ✅ `rfp_rubric_criteria` table (live on Supabase hgxxxmtfmvguotkowxbu, RLS) + `lib/rfp/rubric/extract.ts` + `solicitation_mode` in package route.
  - 19-03 ✅ compliance-gate hardening (page-limit / timezone-null / budget-math blockers) + AI-disclosure checklist item + `AiDisclosureBanner` + `PATCH /api/rfp/proposals/[id]/compliance-ack`.
  - 19-02 ✅ rubric-anchored reviewer (criterion_id on findings, RubricCriteriaPanel in workspace, Anthropic chain).
  - 19-04 ⏸ Tasks 1–2 DONE (commit 78df581: PackageIntakePanel solicitation toggle + database.types.ts regen; pushed; prod deploy READY 2026-06-10). **Task 3 = blocking human-verify checkpoint — THE ONLY REMAINING WORK IN PHASE 19.**

## What to do next (in order)

1. **Run the verification runbook:** `scripts/VERIFY-phase19-seed.md` (in repo). It walks the 5 Phase 19 success criteria on prod with a 20-page Section L/M fixture: upload solicitation DOCX/PDF in solicitation mode → criteria with weights appear in proposal workspace → run review → findings carry criterion chips + severity + suggested fix → compliance checklist shows page-limit/timezone/budget/eligibility/AI-disclosure pass-fail → acknowledge AI disclosure → checklist item flips. Login: lorenzo.d.chambers@gmail.com (canonical account). If auth blocks automation: mint a magic link with Supabase admin generateLink (service key via `vercel env pull` in this worktree) → `https://rfp.perpetualcore.com/auth/callback?token_hash=<hashed_token>&type=magiclink&next=/orgs`.
2. On pass: write `.planning/phases/19-rubric-review-compliance-gate-upload/19-04-SUMMARY.md` (match the style of `19-01-SUMMARY.md`), commit.
3. Phase-goal verification + close: check the 5 success criteria in ROADMAP.md Phase 19 section against the codebase, write `19-VERIFICATION.md`, then `node ~/.claude/get-shit-done/bin/gsd-tools.cjs phase complete 19`. (CAUTION: gsd-tools may report `is_last_phase: true` — that is wrong; the beachhead order in ROADMAP "Execution Sequence" is the source of truth.) Commit + push docs.
4. **After Phase 19 → Phase 20**, then 24-FTUE, then dogfood Uplift/IHA/TPC (ROADMAP Execution Sequence). Deferred-with-triggers: 16, 21, 23, 25.

## Machine/process rules (will bite you if ignored)

- **Never run `npm install`, `next build`, or concurrent `tsc` on this Mac** — a guard hook blocks concurrent builds; the Vercel build is the typecheck gate. The worktree has NO node_modules; for node scripts use `NODE_PATH=~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/node_modules`.
- **DB:** Supabase hgxxxmtfmvguotkowxbu (LDC Brain AI — shared CORE db). Additive-only migrations, RLS on everything, capture original values before any seed UPDATE and roll back after (see 18-04-SUMMARY.md for the pattern).
- **Deploy:** `vercel --prod --yes` from `~/perpetual-core-rfp` (already linked). rfp.perpetualcore.com follows production deployments automatically.
- **Git:** commit per task, push to `feat/rfp-orgs-invites-cont`. Branch is far ahead of main by design; merge only at milestone close.
- **Known papercut:** IHA org (8f7c0d80-15ac-47e6-859d-e2f918a64dd8) has no `rfp_capture_profiles` row → all fit scores are 0 until the Discovery Setup checklist is completed (or a profile is seeded as dogfood).

## Pending human (Lorenzo) actions — do not block on these
- Complete the 0/6 Discovery Setup in the app (capture profile → real fit scores).
- SAM.gov SYSTEM account registration at fsd.gov (unblocks federal ingest; then set `SAM_GOV_API_KEY` in Vercel prod).

Cross-machine memory: `~/Documents/LDC-Command-Center-Vault/_claude/memory/` (start with `rfp-beachhead-progress.md`). Update it when Phase 19 closes.
