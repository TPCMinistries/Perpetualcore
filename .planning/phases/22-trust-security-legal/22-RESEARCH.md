# Phase 22: Trust, Security & Legal - Research

**Researched:** 2026-06-06
**Domain:** Multi-tenant RLS auditing, service-role hygiene, CI gate wiring, legal page completeness, data-source ToS compliance
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRUST-01 | RLS audit passes and a cross-tenant CI test (Org A cannot read Org B's data) is a required check | RLS policies verified across all 30 rfp_* tables in migrations. Two existing test files cover this. CI wiring gap identified. |
| TRUST-02 | Per-tenant isolation for vault + proposals verified; no service-role misuse in user-context paths | Pattern verified: all user-facing routes call createClient() first, then createAdminClient() only for writes. One anomaly to flag. |
| TRUST-03 | Legal pages live: Terms of Service, Privacy Policy, AI-use disclosure | ToS + Privacy exist at /terms and /privacy but are generic Perpetual Core AI OS copy — not RFP-specific. No AI-use disclosure page exists. |
| TRUST-04 | Data-source ToS compliance verified; no redistribution of license-restricted data (Candid excluded; ProPublica/IRS 990 used) | Candid is catalog-blocked (status: "blocked"). No Candid API calls in code. ProPublica/IRS 990 are "planned" not yet ingested. |
</phase_requirements>

---

## Summary

Phase 22 is a security hardening and legal completeness phase that runs early in the beachhead sequence — before any second org goes live, and well before billing. The good news: the RFP engine's RLS architecture is fundamentally sound. All 30 rfp_* tables have RLS enabled. The core tenant-scoped tables (proposals, vault_artifacts, opp_matches, entitlements, capture_profiles, compliance_checks, agent_sessions, package_documents, saved_searches, submission_tasks, org_subscriptions) all use the `rfp_my_org_ids()` / `rfp_my_org_ids_with_role()` SECURITY DEFINER helpers — the correct pattern. Two public-read tables (rfp_opportunities, rfp_opportunity_canonicals/aliases) deliberately use `auth.uid() IS NOT NULL` — correct because opportunities are a shared catalog, not per-tenant data.

Two existing test files already cover cross-tenant RLS assertions: `tests/rls/rfp-tenant-isolation.test.ts` (5 assertions on vault_artifacts, orgs, opportunities) and `tests/rls/rfp-new-endpoints-tenant-isolation.test.ts` (covers proposals, org edits, billing checkout, vault upload, package import, redraft, and admin gate — 17 assertions total). Both run against the LIVE database using ephemeral users/orgs with proper cleanup. The critical gap: these tests run in `npm run test:run` (vitest excludes only `e2e/**`) but the CI `test` job has NO secrets wired for `SUPABASE_SERVICE_ROLE_KEY`, so the RLS tests fail silently in CI or are skipped. Making them a required gate means adding a separate CI job with live-DB secrets and scoping it to `tests/rls/**` only.

The service-role hygiene pattern is correct across all user-facing routes: every `app/api/rfp/**` route calls `createClient()` first to authenticate the caller via cookie session, then only uses `createAdminClient()` for multi-table writes after the auth check passes. No route reads user-tenanted data (vault chunks, proposals, entitlements) exclusively via the admin client without a prior RLS-enforced membership check. One nuance: routes like `vault/list` and `audit-trail-csv` call `createAdminClient()` for the actual data read after doing the membership proof with `createClient()`. This pattern is intentional and documented — the admin client is used because (a) it avoids embedding RLS in every write operation and (b) the auth gate is enforced explicitly in application logic before the admin read. This is the established CLAUDE.md pattern and is NOT a misuse.

Legal pages `/terms` and `/privacy` exist and are publicly accessible, but they were written for the generic Perpetual Core AI OS (references to "calendar integration," "Slack/Zoom," WhatsApp). They do not mention the RFP engine, government opportunity data, foundation grant data, or AI-use disclosure for proposal drafting. No `/ai-disclosure` or equivalent page exists. Phase 22 must update these pages to be RFP-specific and add an AI-use disclosure page. Candid is correctly blocked in the source catalog (status: "blocked", ingestMode: "licensed") and there are zero Candid API calls anywhere in the codebase. ProPublica/IRS 990 is in the catalog as "planned" — not yet ingested, so the ToS compliance review is a forward-looking documentation exercise.

**Primary recommendation:** Wire the existing RLS tests as a required CI gate with live-DB secrets, then update/create the three legal pages. The security foundation is already solid; this phase is primarily about making the gate official and the legal surface accurate.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.15 | Test runner for RLS integration tests | Already in use; RLS tests already run against live DB in this framework |
| @supabase/supabase-js | (project version) | Auth + DB client for test setup/teardown | Used in both existing RLS test files |
| GitHub Actions | - | CI execution | Already wired in `.github/workflows/ci.yml` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js static pages | - | Legal pages | Already used for /terms and /privacy |
| shadcn/ui | (project version) | Consistent legal page styling | Match existing /terms and /privacy |

### Installation
No new packages needed. All required dependencies are already installed.

---

## Architecture Patterns

### RFP Table RLS Classification (by access type)

**Fully tenant-scoped (rfp_my_org_ids() required):**
- `rfp_orgs` — SELECT scoped, INSERT open, UPDATE/DELETE owner-only
- `rfp_vault_artifacts` — full CRUD via rfp_my_org_ids
- `rfp_proposals` — full CRUD via rfp_my_org_ids_with_role
- `rfp_proposal_sections` — gated via parent proposal's org
- `rfp_compliance_checks` — gated via parent proposal's org
- `rfp_agent_sessions` — org-scoped CRUD
- `rfp_opp_matches` — org-scoped CRUD
- `rfp_entitlements` — SELECT via rfp_my_org_ids, write via service_role only
- `rfp_capture_profiles` — org-scoped CRUD
- `rfp_package_documents` — org-scoped CRUD
- `rfp_saved_searches` — org-scoped CRUD
- `rfp_saved_search_alert_log` — org-scoped via saved_search_id join
- `rfp_pursuit_decision_logs` — org-scoped CRUD
- `rfp_submission_tasks` — org-scoped via parent proposal's org
- `rfp_alert_prefs` — org-default-owner + user-override-self
- `rfp_alert_log` — user-scoped self-only
- `rfp_org_invites` — owner-all + invitee-read
- `rfp_org_subscriptions` — member read, service_role write
- `rfp_opportunity_enrichments` — auth.uid() IS NOT NULL (shared enrichments)
- `rfp_users` — SELECT own (auth.uid() = id)
- `rfp_user_orgs` — SELECT via rfp_my_org_ids

**Service-role only (users blocked, `USING (false)`):**
- `rfp_source_baseline` — internal drift tracking
- `rfp_source_drift` — internal drift tracking
- `rfp_state_coverage` — connector registry
- `rfp_api_key_health` — key expiry tracking
- `rfp_email_enrollments` — nurture sequences (service only v1)
- `rfp_email_log` — email delivery log (service only v1)

**Globally readable (any authenticated user, `USING (auth.uid() IS NOT NULL)`):**
- `rfp_opportunities` — shared catalog, no tenant ownership
- `rfp_opportunity_canonicals` — shared dedup layer
- `rfp_opportunity_aliases` — shared dedup layer

**Correctly no tenant policies (internal/admin):**
- `rfp_users` — single-user self-only access

### Pattern 1: Dual-Client Route Auth Pattern

The established and correct pattern for user-facing routes that need admin writes:

```typescript
// Source: app/api/rfp/proposals/[proposalId]/status/route.ts (and many others)

export async function PATCH(req: Request, context: ...) {
  // Step 1: Authenticate via RLS-enforced client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Step 2: Verify membership via RLS (only returns rows the user belongs to)
  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id")
    .eq("id", proposalId)
    .maybeSingle();
  if (!proposal) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Step 3: Role enforcement in app logic
  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Step 4: Admin client ONLY for the writes after auth is confirmed
  const admin = createAdminClient();
  await admin.from("rfp_proposals").update({ status: body.status }).eq("id", proposalId);
}
```

**Why this is NOT service-role misuse:** The admin client is used post-authentication, for writes only. The tenant boundary is enforced by Step 2 (RLS on the read) + Step 3 (explicit membership check), not by relying on RLS on the admin write path. This matches CLAUDE.md: "Background/server operations: ALWAYS use createAdminClient()."

### Pattern 2: Cross-Tenant Test Structure

The existing pattern in `tests/rls/rfp-tenant-isolation.test.ts`:

```typescript
// Source: tests/rls/rfp-tenant-isolation.test.ts

// Admin client (service role) for setup/teardown only
const admin = createClient(URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// User-scoped client (RLS applies)
function clientFor(accessToken: string) {
  return createClient(URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}

it("User A cannot read Org B vault artifacts", async () => {
  const c = clientFor(userA.access_token);
  const { data, error } = await c.from("rfp_vault_artifacts").select("*").eq("org_id", orgB);
  expect(error).toBeNull();  // NOT an error — RLS returns empty, not 403
  expect(data).toEqual([]);   // 0 rows — this is the isolation proof
});
```

### Pattern 3: CI Gate for RLS Tests

**Current gap:** The `test` job in `ci.yml` runs `npm run test:run` which calls `vitest run`. The vitest config includes `tests/rls/**` (node environment) but the CI job has NO secrets for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY`. The RLS tests throw an error at env-load time when secrets are missing, causing the job to fail OR (if the test file handles it) be skipped.

**Required fix:** Add a dedicated `test-rls` job to `ci.yml`:

```yaml
test-rls:
  name: Cross-Tenant RLS Gate
  runs-on: ubuntu-latest
  needs: lint-and-typecheck
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: npm
    - name: Install dependencies
      run: npm ci
    - name: Cross-tenant isolation tests (REQUIRED GATE)
      run: npx vitest run tests/rls/
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

This job runs against the LIVE LDC Brain AI database — same pattern as the existing test files. Secrets must be added to the GitHub repository: `SUPABASE_SERVICE_ROLE_KEY`. The other two are already in the build job.

**IMPORTANT — prod-DB testing concern:** The tests use `admin.auth.admin.createUser()` to create ephemeral `rls-test-*@test.local` users and delete them in `afterAll`. This creates real users in the production auth.users table for the duration of the test run (~30s). This is the accepted pattern for live-DB RLS testing (the existing tests already do this). The risk is: if CI is interrupted mid-run, orphan users may be left in auth.users. Mitigation: the email pattern `rls-*-${Date.now()}@test.local` is unique per run and not connected to real orgs after afterAll cleanup. Acceptable for beachhead scale; revisit before Phase 23 (billing live, self-serve signup).

### Pattern 4: Legal Pages — RFP-Specific Requirements

The existing `/terms` and `/privacy` pages are at the correct routes and are statically rendered Next.js pages. They just need content updates. The missing page is `/ai-disclosure`.

**Entities and context for legal copy:**
- Operator: Perpetual Core LLC (the company running the product)
- Parent mission org: Institute for Human Advancement (IHA), 501(c)(3)
- Product: RFP & Proposal Engine at rfp.perpetualcore.com
- Data processed: public government RFP data (SAM.gov, Grants.gov, SBIR, NIH, NSF); municipal open data (NYC, NJ); user-uploaded vault documents (past proposals, annual reports); LLM-generated content (Claude/OpenAI)
- Data NOT processed: Candid Foundation Directory (blocked)

**Existing /terms issues:**
- References "calendar integration," "Slack/Zoom," "WhatsApp" — not RFP product features
- Says "Perpetual Core, Inc." — correct entity is Perpetual Core LLC
- "Last updated: January 20, 2025" — must be updated
- No section about AI-generated proposal content and review by human
- No section about government data terms of use

**Existing /privacy issues:**
- References same non-RFP features
- No mention of government opportunity data sources
- No mention of vault document processing
- No mention of AI inference providers for proposal generation
- Same staleness issues

**New /ai-disclosure page:**
This is a TRUST-03 requirement. It must be publicly accessible and explain:
1. How AI is used in the product (scoring, drafting, review, compliance checking)
2. Which AI providers process data (Anthropic Claude, OpenAI)
3. That proposals are AI-assisted, not AI-submitted (human always submits)
4. Relevant compliance context: GSA GSAR 552.239-7001 applies to federal contractors using AI in solicitation responses; NIH has separate AI disclosure requirements for grant applications
5. The user's responsibility to review and verify AI-generated content before submission

**Recommended URL:** `/ai-disclosure` (new page), plus link from /terms and /privacy.

### Pattern 5: Data-Source ToS Compliance Documentation

The compliance review is a WRITTEN DOCUMENT in the repo, not a code change. Recommended location: `.planning/DATA-SOURCE-COMPLIANCE.md`

**Sources to document:**

| Source | Status | ToS URL | Key Terms | Compliant? |
|--------|--------|---------|-----------|------------|
| SAM.gov | Live | sam.gov/content/data-services | Public domain federal data, free to use, redistribution OK, no resale restriction | YES |
| Grants.gov | Live | grants.gov/web/grants/learn-grants/grant-process/grant-terminology.html | Public government data, API terms allow third-party integration | YES |
| SBIR.gov | Live | sbir.gov | Public federal data | YES |
| NIH Grants | Live | grants.nih.gov | Public data, NIH Reporter API terms | YES |
| NSF Grants | Live | new.nsf.gov | Public data | YES |
| NYC Open Data (DYCD, HRA, DOE) | Live | opendata.cityofnewyork.us/termsofuse | NYC Open Data ToS: free to use, redistribution OK, attribution required | YES |
| NJ Treasury (OpenBid) | Live | nj.gov | Public procurement data | YES (verify) |
| ProPublica Nonprofit Explorer | Planned | propublica.org/datastore/terms | IRS 990 data, API terms allow research and non-commercial display; CHECK: commercial redistribution | VERIFY |
| IRS 990 direct | Planned | irs.gov | Public domain government records | YES |
| Candid Foundation Directory | Blocked | candid.org/data-services/terms | License PROHIBITS AI/LLM use and redistribution — correctly blocked | N/A (blocked) |

**Candid confirmation:** `grep -r "candid" lib/` shows only two references — `lib/rfp/source-catalog.ts` (status: "blocked") and `lib/rfp/ingest/canonicalize.ts` (commentary/type reference only, no API call). No Candid data is ingested. This confirms TRUST-04 is partially satisfied by the existing codebase state; the compliance doc just needs to formalize it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-tenant test auth | Custom JWT generation | `admin.auth.admin.createUser()` + `anon.auth.signInWithPassword()` | Existing pattern in both RLS test files — already proven |
| CI secret injection | Bespoke secret management | GitHub Actions secrets + `${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}` | Standard CI pattern |
| Legal page templates | Custom legal framework | Update existing /terms and /privacy; add /ai-disclosure | Pages already exist and are statically rendered |
| RLS policy verification | Writing SQL audit queries | Read the migration files + run `mcp__supabase__execute_sql` advisors | All policies are in version-controlled migrations |

---

## Common Pitfalls

### Pitfall 1: Confusing "RLS enabled" with "properly scoped policy"
**What goes wrong:** A table has RLS enabled but a policy like `USING (auth.uid() IS NOT NULL)` — this means any authenticated user can read all rows.
**Why it happens:** RLS is enabled (good) but the policy is too permissive.
**How to avoid:** For the audit, distinguish between: (1) tenant-scoped via `rfp_my_org_ids()`, (2) globally readable to any authenticated user, (3) service-only via `USING (false)`. Know which category each table SHOULD be in and verify it is.
**Warning signs:** The `rfp_opportunity_enrichments` table uses `auth.uid() IS NOT NULL` — this is intentional (shared enrichments), but needs documentation that enrichments don't contain per-org data.
**Current state:** No `USING (true)` policies exist on any `rfp_*` table (verified — all `USING(true)` in migrations are on non-rfp legacy tables).

### Pitfall 2: RLS tests failing in CI without secrets
**What goes wrong:** `npm run test:run` includes `tests/rls/**` but CI job has no `SUPABASE_SERVICE_ROLE_KEY`. The test throws at env-load: "RLS test requires SUPABASE_SERVICE_ROLE_KEY".
**Why it happens:** Current CI test job was wired before RLS tests existed.
**How to avoid:** Add a separate CI job (`test-rls`) with all three Supabase secrets. Do NOT add secrets to the existing `test` job — that would also run RLS tests against prod DB on every unit-test run.
**Warning signs:** CI `test` job shows a pass but you can see the error message in logs about missing env vars, OR the test is skipped due to the throw.

### Pitfall 3: Legal pages that don't match the actual product
**What goes wrong:** `/terms` says "Slack/Zoom/WhatsApp integration" — the RFP product has none of these. Regulatory auditors or legal reviewers flag inconsistency.
**Why it happens:** Pages were written for the parent Perpetual Core AI OS, not the RFP engine.
**How to avoid:** Rewrite both pages to describe what the RFP engine actually does. Key facts to include: government data sources, vault document uploads, LLM-generated proposals, no auto-submission.
**Warning signs:** Terms reference features that don't exist in this product.

### Pitfall 4: service_role misuse masquerading as the dual-client pattern
**What goes wrong:** A route uses `createAdminClient()` to READ user-tenanted data before verifying the caller is a member of that tenant.
**Why it happens:** Developer copies the admin pattern without adding the `createClient()` auth check first.
**How to avoid:** The audit rule is: every route that returns rfp_proposals, rfp_vault_artifacts, or rfp_entitlements data to a user MUST call `createClient()` + `getUser()` first. The admin client may only be used for the write or for reads that are provably bounded by an earlier RLS check.
**Current state:** All current routes follow the correct pattern. The audit should grep for any route where `createAdminClient()` is called BEFORE `createClient()`.

### Pitfall 5: Orphan test users from interrupted CI runs
**What goes wrong:** CI runner is killed mid-run; `afterAll` doesn't execute; `rls-test-*@test.local` users persist in auth.users.
**Why it happens:** `afterAll` cleanup requires a clean test exit.
**How to avoid:** Periodically run a cleanup script that deletes `*@test.local` users older than 1 hour. Not urgent at beachhead scale — note it as a known limitation.
**Warning signs:** Growing count of `*@test.local` users in the Supabase auth dashboard.

---

## Code Examples

### Verified: Correct dual-client pattern (service-role NOT misused)
```typescript
// Source: app/api/rfp/orgs/[orgId]/vault/list/route.ts (verified lines 49-70)

// Auth gate: createClient() with RLS
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

// Membership proof via RLS — only returns rows user belongs to
const { data: membership } = await supabase
  .from("rfp_user_orgs")
  .select("role")
  .eq("org_id", orgId)
  .eq("user_id", user.id)
  .maybeSingle();
if (!membership) return NextResponse.json({ error: "not_found" }, { status: 404 });

// Admin client for data read — safe because auth is proven above
const admin = createAdminClient();
const { data: artifacts } = await admin
  .from("rfp_vault_artifacts")
  .select(...)
  .eq("org_id", orgId);
```

### Verified: RLS test structure (safe prod-DB pattern)
```typescript
// Source: tests/rls/rfp-tenant-isolation.test.ts (lines 90-172, 188-220)

// Admin only for setup/teardown
beforeAll(async () => {
  const user = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const session = await anonClient.auth.signInWithPassword({ email, password });
  // ... seed orgs and memberships via admin ...
}, 30000);

afterAll(async () => {
  await admin.from("rfp_orgs").delete().eq("id", orgA);
  await admin.auth.admin.deleteUser(userA.id);
}, 30000);

// All assertions use user-scoped client (RLS applies)
it("User A cannot read Org B vault artifacts", async () => {
  const c = clientFor(userA.access_token);
  const { data, error } = await c.from("rfp_vault_artifacts").select("*").eq("org_id", orgB);
  expect(error).toBeNull();  // RLS returns empty, not an error
  expect(data).toEqual([]);
});
```

### Verified: rfp_my_org_ids() SECURITY DEFINER helper
```sql
-- Source: supabase/migrations/20260509_rfp_rls_fix_recursion.sql
CREATE OR REPLACE FUNCTION rfp_my_org_ids()
  RETURNS uuid[]
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT array_agg(org_id) FROM rfp_user_orgs WHERE user_id = auth.uid()
$$;
```

---

## RLS Audit Findings (by table)

### Tables in scope for Phase 22 cross-tenant test
These are the tenant-scoped tables that should return 0 rows when accessed cross-tenant:

| Table | Policy Pattern | Cross-Tenant Test Needed? |
|-------|---------------|--------------------------|
| `rfp_vault_artifacts` | `rfp_my_org_ids()` | YES — existing test covers this |
| `rfp_proposals` | `rfp_my_org_ids()` | YES — existing test covers this |
| `rfp_entitlements` | `rfp_my_org_ids()` | YES — should be added |
| `rfp_opp_matches` | `rfp_my_org_ids()` | YES — should be added |
| `rfp_capture_profiles` | `rfp_my_org_ids()` | YES — should be added |
| `rfp_proposal_sections` | via parent proposal | YES — should be added |
| `rfp_compliance_checks` | via parent proposal | MEDIUM — covered implicitly |
| `rfp_agent_sessions` | `rfp_my_org_ids()` | YES — should be added |
| `rfp_package_documents` | `rfp_my_org_ids()` | YES — should be added |
| `rfp_saved_searches` | `rfp_my_org_ids()` | YES — should be added |
| `rfp_submission_tasks` | via parent proposal | MEDIUM — covered implicitly |
| `rfp_pursuit_decision_logs` | `rfp_my_org_ids()` | MEDIUM — should be added |

**Phase 22 minimum:** Add `rfp_entitlements` cross-tenant test to the existing suite. The phase goal says "proposals, vault chunks, and entitlements" as the explicit three. Treat the others as stretch.

### Tables correctly NOT tested (service-role or globally readable)
- `rfp_opportunities` — globally readable, tested in existing suite as "accessible by both orgs" (correct)
- `rfp_source_drift`, `rfp_source_baseline`, `rfp_state_coverage`, `rfp_api_key_health` — service-only, user gets 0 rows by design
- `rfp_email_enrollments`, `rfp_email_log` — service-only

### RLS gap: `rfp_orgs_insert` policy
```sql
CREATE POLICY rfp_orgs_insert ON rfp_orgs
  FOR INSERT WITH CHECK (true);
```
This is an intentional open insert (any authenticated user can create an org). This is correct for the self-service onboarding flow — users need to create their first org. The audit should document this as intentional, not a vulnerability. The SELECT/UPDATE/DELETE policies are scoped.

### No USING(true) on any rfp_* table
Confirmed: zero `USING (true)` policies on any `rfp_*` table in any migration. The USING(true) patterns found in the migrations are all on legacy non-RFP tables (sso_saml, partner_program, hybrid_billing, email_system, feature_gating, ecosystem_integration, skills_marketplace, stripe_webhook_idempotency).

---

## Service-Role Audit Findings

### Categorization of createAdminClient() usage in app/api/rfp/

**Legitimately authorized (all have prior createClient auth check):**

| Route | Admin Client Used For | Auth Check Present |
|-------|----------------------|-------------------|
| `rfp/draft/route.ts` | Multi-table proposal + section insert | YES — createClient() + getUser() + membership check |
| `rfp/orgs/[orgId]/route.ts` | Org UPDATE after owner auth | YES |
| `rfp/orgs/[orgId]/voice/from-description` | Org voice profile write | YES |
| `rfp/orgs/[orgId]/voice/train` | Voice version INSERT | YES |
| `rfp/orgs/[orgId]/vault/from-description` | Vault artifact INSERT | YES |
| `rfp/orgs/[orgId]/vault/[docId]` | Vault artifact DELETE | YES |
| `rfp/orgs/[orgId]/vault/list` | Vault artifact SELECT post-auth | YES |
| `rfp/proposals/[proposalId]/status` | Status UPDATE | YES |
| `rfp/proposals/[proposalId]/sections/[sectionId]` | Section UPDATE + audit INSERT | YES |
| `rfp/proposals/[proposalId]/review` | Review INSERT | YES |
| `rfp/proposals/[proposalId]/compliance` | Compliance check INSERT | YES |
| `rfp/proposals/[proposalId]/redraft` | Sections REPLACE | YES |
| `rfp/proposals/[proposalId]/submission-tasks` | Task INSERT/UPDATE | YES |
| `rfp/proposals/[proposalId]/export/bundle-zip` | Multi-table read for export | YES |
| `rfp/proposals/[proposalId]/export/manifest-csv` | Sections read for export | YES |
| `rfp/proposals/[proposalId]/export/audit-trail-csv` | Agent sessions read | YES |
| `rfp/proposals/[proposalId]/package` | Package doc INSERT + read | YES |

**User-facing routes that use ONLY createClient() (no admin needed):**
- `rfp/opps/route.ts` — discovery feed, RLS-enforced via rfp_opp_matches
- `rfp/orgs/[orgId]/alert-prefs` — alert preferences, full RLS
- `rfp/orgs/[orgId]/saved-searches` — saved searches, full RLS
- `rfp/orgs/[orgId]/voice/route.ts` — voice profile read, full RLS
- `rfp/orgs/[orgId]/recompute-scores` — score recompute trigger

**Background/cron routes (createAdminClient only — correct):**
These have no user session context and should never use createClient():
- `app/api/cron/**` — all cron jobs
- `app/api/webhooks/rfp-stripe/**` — webhook handler (no user session)
- `app/api/admin/rfp/**` — admin console (env-var gated, not user-context)

**Finding:** No FORBIDDEN pattern found. All user-context vault and proposal reads go through RLS-enforced paths. The audit should formalize this as a documented finding, not just pass/fail.

---

## Legal Page Gap Analysis (TRUST-03)

### /terms (app/terms/page.tsx)
**Status:** EXISTS. Content is wrong for the RFP product.
**Required changes:**
- Update product description to describe the RFP engine (not "chat capabilities, calendar, Slack, Zoom, WhatsApp")
- Correct entity name from "Perpetual Core, Inc." to "Perpetual Core LLC"
- Add section on AI-generated content in proposals (user is responsible for review before submission)
- Add section on government/public data (SAM.gov, Grants.gov, etc.) — their terms govern use of those data sources
- Update "Last updated" date to 2026
- Add link to /ai-disclosure

### /privacy (app/privacy/page.tsx)
**Status:** EXISTS. Content is wrong for the RFP product.
**Required changes:**
- Update data collection section: vault documents (PDFs/DOCX the user uploads), org profile data, proposal content
- Update "Information from Third Parties": remove Slack/Google Drive/Zoom; add government data sources and AI providers used for proposal generation
- Add: vault documents are processed by AI providers (Anthropic, OpenAI) to generate embeddings and proposal content
- Update "Last updated" date to 2026
- Add link to /ai-disclosure

### /ai-disclosure (DOES NOT EXIST — new page required)
**Status:** MISSING. Required for TRUST-03.
**Recommended URL:** `app/ai-disclosure/page.tsx` → accessible at `/ai-disclosure`
**Required sections:**
1. What AI does in this product (fit scoring, draft generation, adversarial review, compliance checking)
2. Which AI providers process your data (Anthropic Claude, OpenAI)
3. Human review requirement — AI generates, you review and submit
4. Federal compliance context (GSA GSAR 552.239-7001, NIH grant AI disclosure requirements)
5. How to opt out or control AI use
6. Data retention for AI-processed content
**Must be:** Statically rendered, publicly accessible without login

**Important:** All three pages should carry a banner: "This content is provided for informational purposes and does not constitute legal advice. Review with qualified counsel before relying on it."

---

## Data-Source ToS Compliance (TRUST-04)

### Candid status: CONFIRMED BLOCKED
- Source catalog: `status: "blocked"`, `ingestMode: "licensed"`, nextStep: "Resolve licensing/API terms before ingesting proprietary data."
- Code search: zero API calls to candid.org. The only code references are the catalog entry and a type reference in canonicalize.ts (commentary, no call).
- TRUST-04 is satisfied for Candid by existing code state.

### ProPublica / IRS 990 status: PLANNED, not yet ingested
- Source catalog: `source: "irs_990_foundations"`, `status: "planned"`, `ingestMode: "api"`
- No ProPublica API calls exist in lib/rfp/ingest yet
- ToS reference: ProPublica Nonprofit Explorer API (https://projects.propublica.org/nonprofits/api) — free to use for research; no explicit prohibition on commercial integration. IRS 990 data is public domain. Needs a documented review noting the specific API endpoint and terms accepted.
- The compliance doc should note: "ProPublica API will be integrated in Phase 16 (deferred); terms reviewed and accepted prior to integration."

### Recommended compliance document location
`.planning/DATA-SOURCE-COMPLIANCE.md` — a markdown file checked into the repo, reviewed by Lorenzo, with a declaration: "Data sources reviewed for ToS compliance as of [date]. Candid excluded."

---

## Open Questions

1. **GitHub Actions secrets: is SUPABASE_SERVICE_ROLE_KEY already in the repo secrets?**
   - What we know: Build job uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` but NOT the service role key.
   - What's unclear: Whether `SUPABASE_SERVICE_ROLE_KEY` exists as a GitHub secret (it would have been added manually).
   - Recommendation: Check GitHub repo Settings → Secrets → Actions. If missing, add it before the CI gate is wired.

2. **rfp_opportunity_enrichments: does it contain per-org data that should be scoped?**
   - What we know: Policy is `auth.uid() IS NOT NULL` (any authenticated user reads all enrichments).
   - What's unclear: Whether enrichments store per-org scoring details or are purely per-opportunity metadata.
   - Recommendation: Verify enrichment rows contain no tenant-identifying information before confirming globally-readable policy is correct.

3. **Legal pages: is there an existing legal counsel relationship for review?**
   - What we know: ToS references `legal@perpetualcore.com` — the email address exists in the template.
   - What's unclear: Whether the pages need counsel sign-off before going live.
   - Recommendation: Mark all updated legal pages as "DRAFT — pending counsel review" with a visible banner until reviewed. TRUST-03 requires pages to be "publicly accessible" — it does not require them to be counsel-reviewed. Ship draft pages, pursue review as a follow-on.

4. **ProPublica ToS: commercial use clause?**
   - What we know: ProPublica API is free and publicly accessible; IRS 990 data is public domain.
   - What's unclear: Whether ProPublica's nonprofit explorer API terms explicitly allow commercial SaaS integration vs. research/journalism use.
   - Recommendation: Read https://projects.propublica.org/nonprofits/api terms explicitly and document the finding in DATA-SOURCE-COMPLIANCE.md before Phase 16 actually ingests this data. For Phase 22, the compliance doc notes "to be reviewed prior to Phase 16 integration."

---

## Sources

### Primary (HIGH confidence)
- `/supabase/migrations/20260509_rfp_rls_fix_recursion.sql` — canonical RLS policy definitions for core tenant tables
- `/supabase/migrations/20260527_rfp_submission_tasks.sql` — submission_tasks table and policies
- `/supabase/migrations/20260520_rfp_org_subscriptions.sql` — org_subscriptions RLS
- `/supabase/migrations/20260520_rfp_email_enrollments.sql` — email tables service-only RLS
- `/supabase/migrations/20260604_rfp_opportunity_canonicals.sql` — canonicals globally-readable policy
- `/supabase/migrations/20260606_rfp_entitlements.sql` — entitlements policies
- `/supabase/migrations/20260510_rfp_state_city_drift.sql` — source tables service-only USING(false)
- `/tests/rls/rfp-tenant-isolation.test.ts` — existing cross-tenant test implementation
- `/tests/rls/rfp-new-endpoints-tenant-isolation.test.ts` — existing endpoint isolation tests
- `/lib/supabase/server.ts` — createClient / createAdminClient helpers
- `/lib/rfp/source-catalog.ts` — Candid blocked status, ProPublica planned status
- `/.github/workflows/ci.yml` — current CI configuration (no RLS job, no service-role secret)
- `/vitest.config.ts` — test runner config (RLS tests in node environment, not excluded)
- `/app/terms/page.tsx` — existing ToS page (content verified as RFP-inappropriate)
- `/app/privacy/page.tsx` — existing Privacy page (content verified as RFP-inappropriate)

### Secondary (MEDIUM confidence)
- All remaining `supabase/migrations/*rfp*.sql` files — cross-referenced to confirm RLS enabled + no USING(true) on any rfp_* table
- All `app/api/rfp/**/*.ts` routes — grep-verified for createClient/createAdminClient ordering

---

## Metadata

**Confidence breakdown:**
- RLS table inventory: HIGH — sourced directly from migration files; all 30 tables accounted for
- Service-role audit: HIGH — sourced from grep of all app/api/rfp routes; pattern confirmed across 17 user-facing routes
- CI gate wiring: HIGH — CI YAML read directly; gap is concrete and actionable
- Legal page gaps: HIGH — both pages read directly; AI-use disclosure absence confirmed by file search
- Candid exclusion: HIGH — source catalog + code grep; no API calls found
- ProPublica ToS: MEDIUM — catalog status and terms URL identified; actual terms reading deferred to compliance doc

**Research date:** 2026-06-06
**Valid until:** 2026-07-06 (30 days — RLS and legal pages are stable; CI config changes are low-churn)
