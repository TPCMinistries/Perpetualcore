# HANDOFF — RFP Engine Phase 19: finish the verification, close the phase
*(updated 2026-06-11 ~04:30 UTC by Claude/herald; supersedes all earlier versions — git history has them)*

**For: ChatGPT / Codex / any agent.** Repo `~/perpetual-core-rfp` (worktree of `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core`), branch `feat/rfp-orgs-invites-cont`, HEAD `ed24a53`, fully pushed. Prod: https://rfp.perpetualcore.com — **a fresh deployment from ed24a53 went READY 2026-06-11 ~04:28 UTC and includes ALL Phase 19 code.** (An earlier deploy was stale and lacked the rubric branch — already fixed; if rubric fields are missing from API responses, redeploy with `vercel --prod --yes` from this worktree.)

## Status: Phase 19 is one verification session from closed

Plans 19-01/02/03 ✅ complete. 19-04 tasks 1–2 ✅ (toggle + types regen + deploy). Remaining = the human-verify checkpoint (verification already STARTED — partial results below), then docs + phase close.

### Verification progress so far (by Claude, 2026-06-11)

| Check | Status |
|---|---|
| SC5 — 20-page DOCX parses on prod serverless | ✅ VERIFIED — 27,087 chars extracted in ~1.5s, no timeout; `deadline_timezone: null` captured |
| V1 — rubric criteria extracted into `rfp_rubric_criteria` | ⏳ RETRY NEEDED — failed only because prod was stale; fresh deploy is live, re-run the upload |
| V2 — criteria visible in workspace | ⏳ pending |
| V3 — review findings carry criterion_id + severity + suggested fix | ⏳ pending |
| V4 — compliance blockers (page-limit / timezone-null / budget-math / ai-disclosure) | ⏳ pending |
| V5 — AI-disclosure acknowledge flips checklist | ⏳ pending |
| V6 — re-upload uses cache (still 4 criteria rows, no dup) | ⏳ pending |

### Test seeds ALREADY IN PROD DB (use these; roll back when done)

```
ORG_ID       = 8f7c0d80-15ac-47e6-859d-e2f918a64dd8   (Institute For Human Advancement)
OPP_ID       = aef63b76-a316-4d1e-a3b9-033c22b6c44a   (test opp, also used in Phase 18)
PROPOSAL_ID  = 91b2a255-64eb-41cc-820c-84d17cfb4709   (seeded by Claude — DELETE in rollback)
SECTION_ID   = bd1b8c18-1c22-4a89-b229-22cd956a1d0f   (narrative section w/ 3 [BUDGET] markers — DELETE in rollback)
PACKAGE_DOC_IDS (2 so far, both rollback): 1bb7b3c4-3c35-4653-ac41-c6e9249ab6ac, f8d9ee73-b49d-4ce2-bdad-189a1e912a4a
FIXTURE      = /tmp/phase19-section-lm-fixture.docx (11.9KB, on herald Mac; if gone, regenerate: 20-page DOCX w/ Section L.1 15-page limit, Section M.1–M.4 criteria worth 40/25/20/15 pts, deadline "December 15, 2026 5:00 PM" with NO timezone, 3 [BUDGET] markers)
```

## Step-by-step completion plan

### 0. Auth (headless — no password needed)
```bash
cd ~/perpetual-core-rfp
vercel env pull .env.verification --environment production --yes   # gitignored; delete after
link=$(NODE_PATH=~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/node_modules node --env-file=.env.verification -e '
const { createClient } = require("@supabase/supabase-js");
(async () => { const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await a.auth.admin.generateLink({ type: "magiclink", email: "lorenzo.d.chambers@gmail.com" });
console.log("https://rfp.perpetualcore.com/auth/callback?token_hash=" + data.properties.hashed_token + "&type=magiclink&next=/orgs"); })();' | tail -1)
jar=/tmp/p19-cookies.txt; rm -f "$jar"
curl -s -L -c "$jar" -b "$jar" -o /dev/null "$link"   # jar now holds an authed session
```

### 1. V1 — upload fixture, expect rubric extraction (REVIEW-01)
```bash
curl -s -b "$jar" --max-time 120 -X POST \
  -F "mode=upload" -F "title=Phase 19 Test Fixture — Section L/M" -F "solicitation_mode=true" \
  -F "file=@/tmp/phase19-section-lm-fixture.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
  "https://rfp.perpetualcore.com/api/rfp/proposals/91b2a255-64eb-41cc-820c-84d17cfb4709/package"
```
Expect response keys to include `rubric_criteria` (≈4 entries, section_refs M.1–M.4, points 40/25/20/15) and no `rubric_skipped_reason`. Confirm in DB: `select id, section_ref, max_points, is_inferred from rfp_rubric_criteria where opp_id = '<OPP_ID>';` — record the 4 ids for rollback. NOTE: this creates a 3rd package_doc row — add its id to the rollback list.

### 2. V3 — review run (REVIEW-02/03)
`curl -s -b "$jar" -X POST --max-time 120 "https://rfp.perpetualcore.com/api/rfp/proposals/<PROPOSAL_ID>/review?org_id=<ORG_ID>"` (check route's exact query contract in `app/api/rfp/proposals/[proposalId]/review/route.ts` — POST, returns JSON w/ findings + `rubric_criteria_count`). Expect: findings[] where some carry `criterion_id` matching the V1 ids, every finding has severity + suggested fix, model used is `claude-*`. Findings are response-only (no findings table — the old runbook's V3 SQL is obsolete; rollback step 3 there is a no-op).

### 3. V4 — compliance gate (REVIEW-04)
POST `https://rfp.perpetualcore.com/api/rfp/proposals/<PROPOSAL_ID>/compliance` (cookie jar; read route for body contract — may need package/checklist params). Expect checklist items: `page-limit` (vs 15-page limit from Section L.1), `deadline-timezone` = FAIL/missing (fixture has no tz), `budget-math` (3 [BUDGET] markers), `ai-disclosure` = needs_review.

### 4. V5 — acknowledge AI disclosure (REVIEW-05)
`curl -s -b "$jar" -X PATCH -H "content-type: application/json" -d '{"acknowledged":true}' "https://rfp.perpetualcore.com/api/rfp/proposals/<PROPOSAL_ID>/compliance-ack"` (check zod body in compliance-ack/route.ts — it requires literal true). Re-run compliance → `ai-disclosure` flips to met. SQL confirm: `ai_disclosure_acknowledged = true` on the proposal.

### 5. V6 — cache check
Re-run the step-1 upload WITHOUT `force_re_extract`. Expect cached criteria returned, DB still has exactly 4 rows for the opp (not 8). (Adds a 4th package_doc row — rollback it too.)

### 6. ROLLBACK (required — leave prod clean)
`scripts/VERIFY-phase19-seed.md` has the base statements. ADDITIONS because the proposal itself was seeded:
```sql
delete from rfp_rubric_criteria where opp_id = 'aef63b76-a316-4d1e-a3b9-033c22b6c44a';
delete from rfp_package_documents where proposal_id = '91b2a255-64eb-41cc-820c-84d17cfb4709';
delete from rfp_proposal_sections where proposal_id = '91b2a255-64eb-41cc-820c-84d17cfb4709';
delete from rfp_proposals where id = '91b2a255-64eb-41cc-820c-84d17cfb4709';
```
Verify all four return 0 rows on re-select. Also `rm -f ~/perpetual-core-rfp/.env.verification /tmp/p19-cookies.txt`.

### 7. Close the phase
1. Write `.planning/phases/19-rubric-review-compliance-gate-upload/19-04-SUMMARY.md` (style of 19-01-SUMMARY.md; include the verification table above with final results + the stale-deploy incident).
2. Verify phase goal vs the 5 success criteria in ROADMAP Phase 19 → write `19-VERIFICATION.md` (status: passed if all green).
3. `node ~/.claude/get-shit-done/bin/gsd-tools.cjs phase complete 19` (ignore any `is_last_phase:true` — beachhead order in ROADMAP "Execution Sequence" is source of truth; next is Phase 20, then 24-FTUE, then dogfood).
4. Commit + push all docs to `feat/rfp-orgs-invites-cont`.
5. Append a dated update to `~/Documents/LDC-Command-Center-Vault/_claude/memory/rfp-beachhead-progress.md` (if EPERM, note it in the commit message instead — vault sync sometimes locks files).

## Standing machine/process rules
- NO `npm install` / `next build` / concurrent `tsc` locally (guard hook enforces; Vercel build is the gate). Worktree has no node_modules → `NODE_PATH=~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/node_modules` for scripts.
- DB = Supabase `hgxxxmtfmvguotkowxbu` (shared CORE — additive-only, capture-then-rollback for any seed).
- Deploy = `vercel --prod --yes` from this worktree only (NOT ai-os-platform — that's perpetualcore.com).
- LLM chain everywhere: claude-sonnet-4-5 → claude-haiku-4-5 → gpt-4o; keys rotated + funded 2026-06-09.

## Lorenzo's open human tasks (don't block on these)
- Discovery Setup 0/6 checklist (capture profile → real fit scores; all scores are 0 until then).
- SAM.gov system account registration at fsd.gov → then set SAM_GOV_API_KEY in Vercel prod.
