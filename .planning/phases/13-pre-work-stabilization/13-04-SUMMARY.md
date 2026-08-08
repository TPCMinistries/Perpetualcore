---
phase: 13-pre-work-stabilization
plan: "04"
subsystem: git-merge
status: checkpoint-reached
tags: [merge, git, two-way-merge, rfp-engine, production]
dependency_graph:
  requires: [13-01, 13-02, 13-03]
  provides: [merged-main, stable-production-base]
  affects: [all-v2.0-phases, rfp.perpetualcore.com]
tech_stack:
  added: []
  patterns: [two-way-git-merge, conflict-resolution-union-merge]
key_files:
  created:
    - .planning/phases/13-pre-work-stabilization/13-04-MERGE-LOG.md
  modified:
    - .env.example (union-merged SAM.gov guidance)
    - .github/workflows/ci.yml (8192 MB heap)
    - .gitignore (union of both sides)
    - next.config.mjs (redirects + PWA register:true + union CSP)
    - package.json (union scripts + @stripe/* deps)
    - vercel.json (10 RFP cron entries + maxDuration)
    - app/sitemap.ts (getBaseUrl() + rfpPages union)
    - components/dashboard/DashboardContent.tsx (union icon imports)
    - middleware.ts (auto-merged clean)
decisions:
  - "Two-way merge (no squash, no rebase) — both 253 feat commits + 114 main commits preserved"
  - "next.config.mjs: kept main's redirects block AND feat's register:true PWA AND union CSP sources"
  - "CI heap: 8192 MB (feat) wins over 6144 MB (main) to prevent tsc OOM"
  - "vercel.json: union all 10 RFP crons — none dropped"
  - "sitemap.ts: hand-merged getBaseUrl() defensive helper from main + rfpPages from feat"
  - "Middleware host-rewrite preserved; getUser() before /api/* confirmed (lines 254/258)"
metrics:
  duration_min: ~60
  completed_date: 2026-06-06
  tasks_completed: 2
  tasks_total: 3
  files_created: 1
  files_modified: 12
---

# Phase 13 Plan 04: PR #4 Two-Way Merge Summary (Partial — At Checkpoint)

**One-liner:** Two-way merge of feat/rfp-orgs-invites-cont (253 commits) + main (114 commits) into local main with all conflicts resolved, build passing, and push gated for human review.

---

## Status: CHECKPOINT REACHED

Tasks 1 and 2 are complete. Task 3 is a `checkpoint:human-verify` gate — awaiting Lorenzo's go-ahead to push to origin/main.

---

## Tasks Completed

### Task 1: Snapshot, fetch, and pre-analyze conflict surface

- Fetched origin, confirmed divergence: 253 feat ahead, 114 main ahead (true two-way, no fast-forward possible)
- Created backup refs:
  - Branch: `backup/main-pre-pr4-20260606` (points to origin/main `6ee6e43`)
  - Tag: `backup/pr4-feat-20260606` (points to feat tip `0ddb397`)
- Created throwaway `merge-analysis/pr4` branch, ran `git merge --no-commit --no-ff`, captured 32 conflicted files
- Wrote `13-04-MERGE-LOG.md` with per-file resolution strategy for all 32 files
- Aborted dry-run, switched back to feat branch, deleted analysis branch

**Commit:** `68329e8` — docs(13-04): create merge log with conflict inventory and resolution strategy

### Task 2: Real merge into local main, conflict resolution, build + route verification

Executed from the main worktree at `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core` (main is checked out there via git worktree).

- `git switch main && git reset --hard origin/main`
- `git merge --no-ff feat/rfp-orgs-invites-cont` — produced 32 conflicts matching dry-run
- Resolved all 32 conflicts per strategy in merge log:
  - **Hand-merged (union):** `.env.example`, `.gitignore`, `next.config.mjs`, `package.json`, `vercel.json`, `app/sitemap.ts`, `components/dashboard/DashboardContent.tsx`
  - **Took feat (theirs):** All planning docs, all auth pages, all lib/rfp/* files, all component files
- Ran `npm install` to regenerate consistent package-lock.json
- Committed merge: `d5e9164` on local main
- Verified both lines of work present: 256 commits from main side, 115 from feat side in log

**Build results:**
- `npm run build` — exit 0 (compiled with warnings only, no errors)
- `/rfp` (rfp-marketing page) — present, 7.88 kB static
- `/admin/rfp` — present, 1.55 kB dynamic
- `/api/health/rfp` — present in build output
- `/org/[orgId]/discovery` — present, 24.7 kB dynamic
- All 10 RFP cron routes — present

**Middleware verification:**
- `isRfpHost()` function intact at line 42 (serves rfp.perpetualcore.com)
- `getUser()` at line 254, `/api/*` short-circuit at line 258 — ordering correct per @supabase/ssr rule

**Wave 1 stabilization commits verified in merged main:**
- `6c617cd` — 13-03 key-expiry alerting
- `d911ad6` — 13-03 cron route
- `9616f81` — 13-03 rfp_api_key_health table
- `45762fd` — 13-02 drift triage
- `950ed96` — 13-01 count purge

**Commit:** `be93ee0` — docs(13-04): update merge log with build results

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] main branch in separate worktree**
- **Found during:** Task 2 start
- **Issue:** `git switch main` failed — main is checked out at `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core` (git worktree)
- **Fix:** Ran all merge operations from the main worktree path directly
- **Files modified:** None (operational adjustment)

**2. [Rule 2 - Hand-merge] DashboardContent.tsx icon imports needed union, not one-sided**
- **Found during:** Task 2 conflict resolution
- **Issue:** Both Target/Network (main) and Bot/Bell/CircleCheck/CircleX/Clock (feat) are actively used in the component — taking either side alone would break the other's JSX
- **Fix:** Union-merged all icon imports from both sides
- **Files modified:** `components/dashboard/DashboardContent.tsx`

---

## Self-Check (Partial — Pre-Push)

| Item | Check |
|------|-------|
| `13-04-MERGE-LOG.md` exists | FOUND |
| Backup branch `backup/main-pre-pr4-20260606` exists | FOUND (git branch --list backup/*) |
| Backup tag `backup/pr4-feat-20260606` exists | FOUND (git tag --list backup/*) |
| Merge commit `d5e9164` on local main | FOUND (git log local main) |
| Build exit 0 | CONFIRMED |
| `/rfp` route in build | CONFIRMED |
| `/admin/rfp` route in build | CONFIRMED |
| `/api/health/rfp` route in build | CONFIRMED |
| `/org/[orgId]/discovery` route in build | CONFIRMED |
| middleware.ts host-rewrite intact | CONFIRMED |

**Self-Check: PASSED (pre-push)**

---

## Rollback Procedure

If production regresses after push, run:
```bash
# Restore pre-merge main from backup branch
git push origin backup/main-pre-pr4-20260606:main --force-with-lease
```

Vercel will auto-redeploy. Confirm rfp.perpetualcore.com is healthy.

---

## Next: Task 3 — Human-Gated Push

**Status:** AWAITING HUMAN APPROVAL

The local main at `d5e9164` is ready to push. Nothing has been pushed to origin yet. See checkpoint details in the message below.
