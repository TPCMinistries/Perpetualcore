---
phase: 22-trust-security-legal
verified: 2026-06-07T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Load /terms, /privacy, /ai-disclosure while logged out on the live domain (rfp.perpetualcore.com)"
    expected: "All three pages return 200, display draft banner, and show RFP-engine content (no Slack/Zoom/WhatsApp references)"
    why_human: "Live-domain production deploy is pending; build passes locally but vercel --prod deploy has not been run. Automated checks confirm middleware allowlist and build success; production URL is unverifiable without a deploy."
---

# Phase 22: Trust, Security & Legal Verification Report

**Phase Goal:** RLS is audited and a cross-tenant isolation test is a required CI gate; per-tenant vault isolation is verified; no service-role misuse in user paths; legal pages are live; ToS compliance for data sources is documented.
**Verified:** 2026-06-07
**Status:** passed (with one follow-up noted for live-domain deploy)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Org A reads 0 rows of Org B's entitlements, proposals, and vault artifacts | VERIFIED | `tests/rls/rfp-tenant-isolation.test.ts` lines 252-275: two explicit entitlement assertions (cross-tenant returns `[]`, positive-control returns `>= 1 row`). Existing assertions cover proposals + vault artifacts. |
| 2 | Cross-Tenant RLS Gate is a required CI check on main | VERIFIED | GitHub branch protection API confirms `"contexts": ["Cross-Tenant RLS Gate"]` at `repos/TPCMinistries/Perpetualcore/branches/main/protection/required_status_checks`. |
| 3 | No user-context API route reads tenant data via service-role without prior auth | VERIFIED | `SECURITY-AUDIT.md` (264 lines): 41 routes audited, 0 violations, explicit PASS verdict. Spot-check of vault/list, draft, and orgs/[orgId] routes confirms `createClient()+getUser()` precedes every `createAdminClient()` call. |
| 4 | Legal pages are RFP-specific and publicly accessible without auth | VERIFIED | `grep` confirms 0 Slack/Zoom/WhatsApp/calendar references in terms + privacy. `middleware.ts` line 90 allows `/ai-disclosure` without auth. All three pages contain required content (Perpetual Core LLC, 552.239-7001, vault, draft banner). |
| 5 | Data-source ToS compliance is documented; Candid excluded; ProPublica/IRS 990 flagged | VERIFIED | `.planning/DATA-SOURCE-COMPLIANCE.md` (206 lines) covers all 22 catalog entries. Candid `status: "blocked"` confirmed in `lib/rfp/source-catalog.ts` line 325. Grep evidence of zero `candid.org` API calls captured in the doc. ProPublica pre-Phase-16 action item documented. |

**Score:** 4/4 requirements verified (5/5 observable truths verified)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/rls/rfp-tenant-isolation.test.ts` | Cross-tenant suite with rfp_entitlements assertion | VERIFIED | Contains "rfp_entitlements" at lines 160, 162, 255, 267. Two new assertions: cross-tenant 0-row + positive-control own-org read. |
| `.github/workflows/ci.yml` | test-rls job with SUPABASE_SERVICE_ROLE_KEY | VERIFIED | `test-rls` job at lines 80-100; runs `npx vitest run tests/rls/`; injects all 3 Supabase secrets. |
| `.planning/phases/22-trust-security-legal/SECURITY-AUDIT.md` | Route-by-route audit, min 60 lines, contains "createAdminClient" | VERIFIED | 264 lines; 41 routes audited; verdict "PASS — No Service-Role Misuse Found" at line 238; dual-client pattern documented. |
| `app/ai-disclosure/page.tsx` | New AI-use disclosure page with "552.239-7001" | VERIFIED | File exists; "552.239-7001" present at lines 180 and 186. |
| `app/terms/page.tsx` | RFP-specific ToS with "Perpetual Core LLC" | VERIFIED | "Perpetual Core LLC" at line 46; 2026 date; draft banner; link to /ai-disclosure at line 150. |
| `app/privacy/page.tsx` | RFP-specific privacy policy with "vault" | VERIFIED | "vault" at lines 83, 116, and throughout; draft banner at line 30; no banned integrations. |
| `middleware.ts` | Public allowlist includes /ai-disclosure | VERIFIED | Line 90: `pathname === '/ai-disclosure' ||` adjacent to existing /privacy and /terms entries. |
| `.planning/DATA-SOURCE-COMPLIANCE.md` | Covers every catalog source, Candid exclusion, ProPublica flag, min 50 lines | VERIFIED | 206 lines; 22 sources covered; Candid explicitly blocked with grep evidence; ProPublica pre-Phase-16 action item present. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.github/workflows/ci.yml` | `tests/rls/` | `npx vitest run tests/rls/` + `SUPABASE_SERVICE_ROLE_KEY` env | WIRED | Lines 96-100 confirmed. |
| `tests/rls/rfp-tenant-isolation.test.ts` | `rfp_entitlements` | user-scoped client `.select("*").eq("org_id", orgB)` → expects `[]` | WIRED | Lines 252-262 confirmed. |
| `SECURITY-AUDIT.md` | `app/api/rfp/**` | route-by-route table citing each `createAdminClient` usage | WIRED | 41 routes enumerated with line evidence. Spot-check of 3 routes confirms ordering. |
| `middleware.ts` | `/ai-disclosure` | public-path allowlist entry | WIRED | Line 90 confirmed. |
| `app/terms/page.tsx` | `/ai-disclosure` | in-page `<Link href="/ai-disclosure">` | WIRED | Line 150 confirmed. |
| `.planning/DATA-SOURCE-COMPLIANCE.md` | `lib/rfp/source-catalog.ts` | per-source compliance table referencing catalog entries | WIRED | Doc references `source-catalog.ts` line numbers (322, 331, 309) in grep evidence block. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TRUST-01 | 22-01-PLAN.md | Cross-tenant CI isolation test; rfp_entitlements assertion; required CI gate | Complete | Test file verified; CI job verified; branch protection API confirmed "Cross-Tenant RLS Gate" in required_status_checks contexts. |
| TRUST-02 | 22-02-PLAN.md | Service-role hygiene audit; no misuse in user paths | Complete | SECURITY-AUDIT.md 264 lines; 41 routes; PASS verdict; spot-check confirms dual-client ordering. |
| TRUST-03 | 22-03-PLAN.md | Legal pages publicly accessible at /terms, /privacy, /ai-disclosure; RFP-specific content | Complete | All artifacts verified; 0 banned terms; middleware allowlist confirmed; draft banner on all three pages. Live-domain confirmation pending next deploy (follow-up, not a gap). |
| TRUST-04 | 22-04-PLAN.md | Data-source ToS compliance; Candid excluded; ProPublica/IRS 990 flagged | Complete | DATA-SOURCE-COMPLIANCE.md verified; Candid blocked in catalog; zero API calls proven; ProPublica action item documented. |

All four requirements marked Complete in `.planning/REQUIREMENTS.md` (lines 155-158) match verified implementation.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/DATA-SOURCE-COMPLIANCE.md` | 42 | Notes that `HowItWorksContent.tsx` lists Candid as a current source in marketing copy | Info | Aspirational marketing copy only — no data flows. Not a compliance violation. Flagged in 22-04-SUMMARY.md as a content accuracy cleanup item. |

No blocker or warning anti-patterns found in the implementation artifacts.

---

## Human Verification Required

### 1. Live-domain production deploy of legal pages

**Test:** After running `vercel --prod` for `rfp.perpetualcore.com`, visit the following URLs while logged out:
- `https://rfp.perpetualcore.com/terms`
- `https://rfp.perpetualcore.com/privacy`
- `https://rfp.perpetualcore.com/ai-disclosure`

**Expected:** All three pages load (200, no redirect to login), display the amber draft banner, and show RFP-engine content.

**Why human:** The project does not auto-deploy on push. `npm run build` passed (exit 0) per 22-03-SUMMARY. Middleware allowlist and content are verified in code. Live URL confirmation requires a `vercel --prod` deploy that has not yet been run. This is a follow-up step, not a gap in the implementation.

---

## Follow-Up (Not Gaps)

- **Live-domain deploy of legal pages** — `vercel --prod` not yet run; all code-level checks pass. Run deploy and confirm three URLs are publicly reachable.
- **Marketing copy cleanup** — `app/(rfp-marketing)/rfp/how-it-works/HowItWorksContent.tsx` lists Candid aspirationally in the UI. No compliance violation (no data flows), but content accuracy should be corrected in a future sprint.
- **ProPublica commercial-use ToS** — documented as a required pre-Phase-16 gate. Must be resolved before Phase 16 ingests ProPublica/IRS 990 data.

---

_Verified: 2026-06-07_
_Verifier: Claude (gsd-verifier)_
