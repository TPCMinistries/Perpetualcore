# 13-04 Merge Log — feat/rfp-orgs-invites-cont → main

**Date:** 2026-06-06
**Executor:** Claude Sonnet (13-04 plan)
**Type:** Two-way merge — BOTH sides preserved (no squash, no rebase)

---

## Divergence Confirmation

| Metric | Count |
|--------|-------|
| feat/rfp-orgs-invites-cont commits ahead of origin/main | 253 |
| origin/main commits ahead of HEAD | 114 |
| Merge type | TRUE two-way (not fast-forward) |

- origin/main tip: `6ee6e43` (account/handoff work — "Add handoff task sync action")
- feat branch tip: `0ddb397` (config.json commit, includes Wave 1 stabilization)

Wave 1 stabilization commits confirmed on feat branch:
- `6c617cd` — docs(13-03): SAM.gov key-expiry alerting plan
- `d911ad6` — feat(13-03): rfp-key-expiry-check cron route + Vercel schedule
- `9616f81` — feat(13-03): rfp_api_key_health table + key-expiry helper
- `45762fd` — docs(13-02): drift triage register + DB annotation
- `950ed96` — docs(rfp-13-01): purge-inflated-counts plan — LAUNCH-04

---

## Backup Refs Created

| Ref Type | Name | Points To |
|----------|------|-----------|
| Branch | `backup/main-pre-pr4-20260606` | origin/main tip (`6ee6e43`) |
| Tag | `backup/pr4-feat-20260606` | feat branch tip (`0ddb397`) |

Rollback command (if merge regresses production):
```bash
git push origin backup/main-pre-pr4-20260606:main --force-with-lease
```

---

## Conflict Inventory (from dry-run on throwaway branch)

Total conflicted files: 32

### Config / Tooling Files

| File | Strategy | Rationale |
|------|----------|-----------|
| `.env.example` | Hand-merge — KEEP BOTH sides | feat adds RFP alert env keys + SAM.gov system account guidance; main has simpler SAM_GOV_API_KEY; keep feat's extended comments + union env vars |
| `.github/workflows/ci.yml` | Take FEAT (ours) | feat bumps NODE heap to 8192 MB (needed for tsc on large codebase); main is 6144 MB; keep 8192 to prevent CI OOM |
| `.gitignore` | Hand-merge — KEEP BOTH sides | feat adds `.claude/worktrees/`; main adds `supabase/.temp/` and `.branches/`; union of both |
| `next.config.mjs` | Hand-merge — KEEP BOTH sides | main adds redirects block (industry→solutions 301s) + Crisp chat CSP domains; feat has `register: true` PWA + Vercel Analytics CSP (`va.vercel-scripts.com`); merge: keep main's redirects, union CSP sources, keep `register: true` from feat |
| `package.json` | Hand-merge — KEEP BOTH sides | feat adds `test:e2e:rfp-auth` script, `seed:rfp-demo`, `types:supabase`; main adds `@stripe/react-stripe-js` + `@stripe/stripe-js` deps; union both scripts + deps |
| `package-lock.json` | Regenerate after package.json merge | Run `npm install` after hand-merging package.json to produce consistent lock |
| `vercel.json` | Hand-merge — KEEP BOTH sides | feat adds 10 RFP cron entries + maxDuration config for discovery routes; main has leaner set; keep ALL cron entries from feat + main |

### Planning / Docs Files

| File | Strategy | Rationale |
|------|----------|-----------|
| `.planning/HANDOFF.md` | Take FEAT (ours) | feat contains current Wave 1 work; main's version predates stabilization |
| `.planning/PROJECT.md` | Take FEAT (ours) | feat has v2.0 decisions, phase 13 context; main's version has older decisions from account/handoff work — hand-merge to preserve both |
| `.planning/REQUIREMENTS.md` | Take FEAT (ours) | feat has full v2.0 req IDs; main may have older version |
| `.planning/ROADMAP.md` | Take FEAT (ours) | feat has 13-phase v2.0 roadmap; preserve with any main updates |
| `.planning/STATE.md` | Take FEAT (ours) | current execution state is on feat branch |
| `.planning/config.json` | Take FEAT (ours) | committed on feat with research:true |
| `.planning/phases/05-discovery/deferred-items.md` | Take FEAT (ours) | feat-side file, main may not have it |
| `.planning/repositioning/AGENT_LOG.md` | Take FEAT (ours) | repositioning work is on feat branch |
| `.planning/repositioning/BRAND_ARCHITECTURE.md` | Take FEAT (ours) | repositioning docs are feat-side |

### Auth Pages

| File | Strategy | Rationale |
|------|----------|-----------|
| `app/(auth)/accept-invite/page.tsx` | Take FEAT (ours) | feat has AuthShell wrapper for RFP host-aware chrome (dark+emerald on rfp.*); main has simpler Suspense wrapper; KEEP feat version — it's more complete |
| `app/(auth)/login/page.tsx` | Take FEAT (ours) | feat has enhanced login with host-aware redirects; main has older version |
| `app/(auth)/signup/page.tsx` | Take FEAT (ours) | feat has enhanced signup; main has older version |
| `app/orgs/new/page.tsx` | Take FEAT (ours) | feat has AuthShell wrapper for RFP host-aware chrome |

### Dashboard / Org Routes

| File | Strategy | Rationale |
|------|----------|-----------|
| `app/(dashboard)/org/[orgId]/layout.tsx` | Take FEAT (ours) | feat has updated auth comments + visual system notes; functionally identical but feat's version is current |
| `app/(dashboard)/org/[orgId]/page.tsx` | Take FEAT (ours) | feat redirects to /discovery (correct post-login target); main had stub for Phase 5 |

### API Routes

| File | Strategy | Rationale |
|------|----------|-----------|
| `app/api/cron/rfp-discovery-federal/route.ts` | Take FEAT (ours) | feat adds federal-register + NIH + NSF sources, scoring recompute, cron logging; main has trimmed version |

### Sitemap

| File | Strategy | Rationale |
|------|----------|-----------|
| `app/sitemap.ts` | Take FEAT (ours) | feat has RFP subdomain entries (rfp.perpetualcore.com); main has getBaseUrl() defensive helper; hand-merge: keep feat's RFP subdomain entries AND main's getBaseUrl() helper |

### Components

| File | Strategy | Rationale |
|------|----------|-----------|
| `components/dashboard/DashboardContent.tsx` | Take FEAT (ours) | feat has Bell/CircleCheck/CircleX/Clock icons + Alert component; main has ArrowRight/Target/Network; hand-merge icon imports |
| `components/rfp/CreateOrgForm.tsx` | Take FEAT (ours) | feat redirects to /org/[orgId]/discovery (correct RFP target after org creation); main redirects to /org/[orgId] |
| `components/rfp/NaicsAssistantModal.tsx` | Take FEAT (ours) | feat adds handleAddEveryRecommendation + dark-mode color classes; main has lighter colors |

### Lib Files

| File | Strategy | Rationale |
|------|----------|-----------|
| `lib/auth/actions.ts` | Take FEAT (ours) | feat adds getRequestOrigin() for subdomain-aware auth redirects (rfp.perpetualcore.com support) + safeAuthNext() — CRITICAL for RFP host |
| `lib/rfp/ingest/normalize.ts` | Take FEAT (ours) | feat imports from source-catalog (centralized enum); main has inline type union — feat is newer, cleaner |
| `lib/rfp/ingest/run.ts` | Take FEAT (ours) | feat adds federal-register, NIH, NSF fetchers + canonicalization; main has trimmed 4-source version |
| `lib/rfp/ingest/scrape/drift.ts` | Take FEAT (ours) | feat adds typed getRfpClient() helper with explanatory comment; main uses raw `createAdminClient() as any` |
| `lib/rfp/invites.ts` | Take FEAT (ours) | feat has cleaner types (no `as any` casts); more production-ready |
| `lib/rfp/orgs.ts` | Take FEAT (ours) | feat adds sequence enrollment + scoring recompute on org creation; main has older version with explicit `as any` casts |
| `lib/rfp/sources.ts` | Take FEAT (ours) | feat adds `fed_register` source + BASE_URL; main has trimmed 4-source version |

---

## Middleware Safety Note

`middleware.ts` merged CLEANLY (no conflict). Git auto-merged it. The RFP host-rewrite block was confirmed present on feat side and did not conflict with main's changes (main's UTM/analytics changes were in a different section). Post-merge, verify:
1. `isRfpHost()` function still present
2. getUser() refresh runs before `/api/*` short-circuit
3. Cookie scope set to apex domain in production

---

## Migration Files

No migration conflicts detected. Both sides' migration files are in distinct directories/filenames. All migrations from both branches are preserved.

---

## Build Results

| Check | Result |
|-------|--------|
| `npm run build` | PASS (exit 0, compiled with warnings only) |
| `/rfp` marketing page | PASS — `/rfp` (7.88 kB, static) present in build |
| `app/admin/rfp/page.tsx` | PASS — `/admin/rfp` (1.55 kB, dynamic) present |
| `app/api/health/rfp/route.ts` | PASS — `/api/health/rfp` present in build |
| `app/(dashboard)/org/[orgId]/discovery` | PASS — `/org/[orgId]/discovery` (24.7 kB, dynamic) |
| All RFP cron routes | PASS — 10 cron routes all in build output |
| Middleware RFP host-rewrite | PASS — `isRfpHost()` present, getUser() at line 254 before /api short-circuit at line 258 |
| Wave 1 stabilization commits | PASS — 13-01/02/03 commits all reachable from merged main |
| Merge commit SHA | `d5e9164` |

---

## Rollback Procedure

If production regresses after push:
```bash
# Option 1: Restore pre-merge main from backup branch
git push origin backup/main-pre-pr4-20260606:main --force-with-lease

# Option 2: Revert the merge commit on main
git revert -m 1 <merge-commit-sha>
git push origin main
```

Vercel will auto-deploy whichever commit is pushed to main. Confirm rfp.perpetualcore.com is healthy after rollback.
