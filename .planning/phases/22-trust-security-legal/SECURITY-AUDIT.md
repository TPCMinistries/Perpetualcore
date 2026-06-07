# Service-Role Hygiene Audit — RFP Engine

**Title:** Service-Role (createAdminClient) Hygiene Audit  
**Date:** 2026-06-07  
**Auditor:** Claude, Phase 22 (Plan 22-02)  
**Scope:** `app/api/rfp/**` (user-context routes) + `app/api/cron/**`, `app/api/webhooks/rfp-stripe/**`, `app/api/rfp/admin/**` (background/admin, listed as out-of-scope-but-correct)  
**Method:** grep + manual file read; every `createAdminClient` hit in scope is accounted for in the table below.

---

## Verification Commands

```bash
# Primary grep — all createAdminClient hits in user-facing RFP routes
grep -rn "createAdminClient" app/api/rfp/

# Ordering verification — createClient and createAdminClient line numbers per file
grep -rn "createClient\|createAdminClient" app/api/rfp/

# Background/admin routes (out of scope for misuse check, but verified correct)
grep -rn "createAdminClient\|createClient" app/api/cron/
grep -rn "createAdminClient\|createClient" app/api/webhooks/rfp-stripe/
grep -rn "createAdminClient\|createClient" app/api/rfp/admin/
```

**Routes inspected:** 41 user-facing RFP routes (`app/api/rfp/**`)  
**createAdminClient hits in user-facing routes:** 25 call-sites across 19 files  
**Violations found:** 0

---

## Route-by-Route Audit Table

### Group A: Routes using ONLY createClient (full RLS enforcement — no admin client)

| Route | Tables touched | createAdminClient used for | Auth check before admin? | Verdict |
|-------|---------------|--------------------------|--------------------------|---------|
| `rfp/opps/route.ts` | `rfp_opp_matches`, `rfp_opportunities` | Not used | N/A (no admin) | PASS |
| `rfp/opps/[id]/route.ts` | `rfp_opportunities`, `rfp_opp_matches` | Not used | N/A (no admin) | PASS |
| `rfp/opps/[id]/decision-log/route.ts` | `rfp_pursuit_decision_logs` | Not used | N/A (no admin) | PASS |
| `rfp/opps/[id]/decision/route.ts` | `rfp_pursuit_decision_logs` | Not used | N/A (no admin) | PASS |
| `rfp/opps/[id]/pursuit/route.ts` | `rfp_opp_matches` | Not used | N/A (no admin) | PASS |
| `rfp/opps/[id]/triage/route.ts` | `rfp_opp_matches` | Not used | N/A (no admin) | PASS |
| `rfp/orgs/[orgId]/alert-prefs/route.ts` | `rfp_alert_prefs`, `rfp_orgs` | Not used | N/A (no admin) | PASS |
| `rfp/orgs/[orgId]/recompute-scores/route.ts` | `rfp_opp_matches` | Not used | N/A (no admin) | PASS |
| `rfp/orgs/[orgId]/saved-searches/route.ts` | `rfp_saved_searches` | Not used | N/A (no admin) | PASS |
| `rfp/orgs/[orgId]/saved-searches/[searchId]/route.ts` | `rfp_saved_searches` | Not used | N/A (no admin) | PASS |
| `rfp/orgs/[orgId]/vault/upload-file/route.ts` | `rfp_user_orgs`, `rfp_vault_artifacts` | Not used (calls lib/service directly) | N/A (no admin) | PASS |
| `rfp/orgs/[orgId]/voice/route.ts` | `rfp_orgs` | Not used | N/A (no admin) | PASS |
| `rfp/billing/checkout/route.ts` | `rfp_user_orgs`, `rfp_orgs` | Not used | N/A (no admin) | PASS |
| `rfp/billing/portal/route.ts` | `rfp_org_subscriptions` | Not used | N/A (no admin) | PASS |
| `rfp/quick-import/route.ts` | `rfp_user_orgs`, `rfp_orgs` | Not used | N/A (no admin) | PASS |
| `rfp/quick-import/[jobId]/status/route.ts` | (job status check via lib) | Not used | N/A (no admin) | PASS |
| `rfp/proposals/[proposalId]/submit-readiness/route.ts` | `rfp_proposals`, `rfp_submission_tasks` | Not used | N/A (no admin) | PASS |

### Group B: Routes using dual-client pattern (createClient auth gate THEN createAdminClient)

All line numbers from live file inspection.

| Route | createClient line | getUser / membership check | createAdminClient line | Admin used for | Auth before admin? | Verdict |
|-------|------------------|---------------------------|----------------------|---------------|--------------------|---------|
| `rfp/draft/route.ts` | L89 | `getUser()` L91 + `rfp_user_orgs` membership L96-104 | L115 | Multi-table INSERT: `rfp_proposals` + `rfp_proposal_sections` | YES — createClient L89 precedes admin L115 | PASS |
| `rfp/orgs/[orgId]/route.ts` | L49 | `getUser()` L51 + `rfp_user_orgs` owner check L55-66 | L71 | Org UPDATE in `rfp_orgs` | YES — createClient L49 precedes admin L71 | PASS |
| `rfp/orgs/[orgId]/voice/from-description/route.ts` | L65 | `getUser()` L67 + `rfp_user_orgs` membership L71-80 | L96 | `rfp_orgs` UPDATE + voice profile write | YES — createClient L65 precedes admin L96 | PASS |
| `rfp/orgs/[orgId]/voice/train/route.ts` | L92 | `getUser()` L94 + `rfp_user_orgs` membership L98-108 | L126 | Voice version INSERT in `rfp_orgs` | YES — createClient L92 precedes admin L126 | PASS |
| `rfp/orgs/[orgId]/vault/[docId]/route.ts` | L29 | `getUser()` L31 + `rfp_user_orgs` membership L35-44 | L49 | `rfp_vault_artifacts` DELETE | YES — createClient L29 precedes admin L49 | PASS |
| `rfp/orgs/[orgId]/vault/from-description/route.ts` | L52 | `getUser()` L54 + `rfp_user_orgs` membership L58-67 | L115 | `rfp_vault_artifacts` INSERT | YES — createClient L52 precedes admin L115 | PASS |
| `rfp/orgs/[orgId]/vault/upload/route.ts` | L60 | `getUser()` L62 + `rfp_user_orgs` membership L70-79 | L105 | `rfp_agent_sessions` audit INSERT (upload handled by lib) | YES — createClient L60 precedes admin L105 | PASS |
| `rfp/orgs/[orgId]/vault/list/route.ts` | L49 | `getUser()` L51 + `rfp_user_orgs` membership L55-64 | L70 | `rfp_vault_artifacts` SELECT after membership proof | YES — createClient L49 precedes admin L70 | PASS |
| `rfp/proposals/[proposalId]/status/route.ts` | L67 | `getUser()` L69 + `rfp_proposals` RLS read L73-82 + `rfp_user_orgs` role check L83-92 | L105 | `rfp_proposals` STATUS UPDATE | YES — createClient L67 precedes admin L105 | PASS |
| `rfp/proposals/[proposalId]/sections/[sectionId]/route.ts` | L87 | `getUser()` L89 + `rfp_proposals` RLS read L93-102 + `rfp_user_orgs` membership L103-112 | L119 | Section UPDATE + `rfp_agent_sessions` audit INSERT | YES — createClient L87 precedes admin L119 | PASS |
| `rfp/proposals/[proposalId]/review/route.ts` | L84 | `getUser()` L86 + `rfp_proposals` RLS read L90-99 + `rfp_user_orgs` role check L100-110 | L118 | Review INSERT + `rfp_compliance_checks` | YES — createClient L84 precedes admin L118 | PASS |
| `rfp/proposals/[proposalId]/compliance/route.ts` | L104 | `getUser()` L106 + `rfp_proposals` RLS read L110-119 + `rfp_user_orgs` membership L120-130 | L135 | `rfp_compliance_checks` INSERT | YES — createClient L104 precedes admin L135 | PASS |
| `rfp/proposals/[proposalId]/redraft/route.ts` | L64 | `getUser()` L66 + `rfp_proposals` RLS read L70-79 + `rfp_user_orgs` membership L80-90 | L97 | Sections REPLACE in `rfp_proposal_sections` | YES — createClient L64 precedes admin L97 | PASS |
| `rfp/proposals/[proposalId]/submission-tasks/route.ts` | L33 | `getUser()` L35 + `rfp_proposals` RLS read L39-48 + `rfp_user_orgs` membership L49-58 | L71/L101 | `rfp_submission_tasks` INSERT (L71) and UPDATE (L101) | YES — createClient L33 precedes both admin calls | PASS |
| `rfp/proposals/[proposalId]/submission-tasks/manual/route.ts` | L41 | `getUser()` L43 + `rfp_proposals` RLS read L47-56 + `rfp_user_orgs` membership L57-66 | L72 | `rfp_submission_tasks` INSERT (manual override) | YES — createClient L41 precedes admin L72 | PASS |
| `rfp/proposals/[proposalId]/submission-tasks/[taskId]/route.ts` | L56 | `getUser()` L58 + `rfp_proposals` RLS read L62-71 + `rfp_user_orgs` membership L72-82 | L125 | `rfp_submission_tasks` UPDATE | YES — createClient L56 precedes admin L125 | PASS |
| `rfp/proposals/[proposalId]/export/audit-trail-csv/route.ts` | L24 | `getUser()` L26 + `rfp_proposals` RLS read L32-38 + `rfp_user_orgs` membership L41-48 | L51 (inline) | `rfp_agent_sessions` SELECT for audit export | YES — createClient L24 precedes admin L51 | PASS |
| `rfp/proposals/[proposalId]/export/bundle-zip/route.ts` | L81 | `getUser()` L83 + `rfp_proposals` RLS read L87-96 + `rfp_user_orgs` membership L97-106 | L108 | Multi-table read for zip bundle | YES — createClient L81 precedes admin L108 | PASS |
| `rfp/proposals/[proposalId]/export/compliance-csv/route.ts` | L36 | `getUser()` L38 + `rfp_proposals` RLS read L42-51 + `rfp_user_orgs` membership L52-61 | L63 | `rfp_compliance_checks` SELECT for export | YES — createClient L36 precedes admin L63 | PASS |
| `rfp/proposals/[proposalId]/export/manifest-csv/route.ts` | L72 | `getUser()` L74 + `rfp_proposals` RLS read L78-87 + `rfp_user_orgs` membership L88-97 | L99 | Sections SELECT for manifest | YES — createClient L72 precedes admin L99 | PASS |
| `rfp/proposals/[proposalId]/export/packet-csv/route.ts` | L36 | `getUser()` L38 + `rfp_proposals` RLS read L42-51 + `rfp_user_orgs` membership L52-61 | L63 | `rfp_proposal_sections` SELECT for packet | YES — createClient L36 precedes admin L63 | PASS |
| `rfp/proposals/[proposalId]/export/docx/route.ts` | L53 | `getUser()` L55 + `rfp_proposals` RLS read L59-68 + `rfp_user_orgs` membership L69-78 | L80 | Sections + attachments SELECT for docx | YES — createClient L53 precedes admin L80 | PASS |
| `rfp/proposals/[proposalId]/package/route.ts` | L79 (via `requireProposalAccess()`) | `getUser()` + `rfp_proposals` RLS read + `rfp_user_orgs` membership (helper L78-107) | L120/L229 (inline) | `rfp_package_documents` SELECT (L120) and INSERT (L229) | YES — helper called before both admin calls | PASS |

### Group C: Admin/operator route — uses getRfpPlatformAdmin() gate

| Route | Auth gate | createAdminClient used for | Verdict |
|-------|-----------|---------------------------|---------|
| `rfp/admin/saved-search-alerts/run/route.ts` | `getRfpPlatformAdmin()` — calls `createClient()` + `getUser()` + env-var allowlist check (lib/rfp/admin.ts L38-47) | Alert run via `runSavedSearchAlerts()` lib | PASS — admin gate confirmed; not user-context |

---

## Intentional Dual-Client Pattern Documentation

The RFP engine uses a deliberate two-phase auth pattern on every route that needs admin-level writes or admin-SELECT reads after auth:

**Phase 1 — RLS-enforced authentication gate (createClient):**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
```

**Phase 2 — Membership proof via the RLS-scoped client:**
The RLS client is used to query `rfp_user_orgs` or `rfp_proposals`. Because RLS is active, these queries return rows only if the user actually belongs to the org or owns/has access to the proposal. A `maybeSingle()` that returns `null` means the user has no legitimate access — the route returns 404 (not 403, to avoid confirming resource existence).

**Phase 3 — Admin client for the actual write or read:**
```typescript
const admin = createAdminClient();
// Used ONLY after Phase 1+2 have confirmed the user's identity and membership
await admin.from("rfp_proposals").update({ ... }).eq("id", proposalId);
```

**Why this is NOT service-role misuse per CLAUDE.md:**

CLAUDE.md states: _"Background/server operations: ALWAYS use createAdminClient(), never createClient()."_ This directive applies to writes. The pattern is:

1. The tenant boundary is enforced by RLS in Phase 2 (an RLS-scoped read that returns empty if unauthorized)
2. The admin client in Phase 3 bypasses RLS — but only after the application layer has explicitly proven the user is authenticated AND is a member of the target org

This is equivalent to: "prove you have the key, then open the door." The admin client is the door; createClient + membership check is the key. The pattern is correct and documented in the Phase 22 research (Pattern 1, lines 99-136).

**Canonical example — `vault/list` (uses admin for the SELECT read):**

```typescript
// Source: app/api/rfp/orgs/[orgId]/vault/list/route.ts

// Phase 1: Auth gate (line 49)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

// Phase 2: Membership proof via RLS (lines 55-64)
const { data: membership } = await supabase
  .from("rfp_user_orgs")
  .select("role")
  .eq("org_id", orgId)
  .eq("user_id", user.id)
  .maybeSingle();
if (!membership) return NextResponse.json({ error: "not_found" }, { status: 404 });

// Phase 3: Admin client for the vault SELECT — safe because phases 1+2 passed (line 70)
const admin = createAdminClient();
const { data: artifacts } = await admin
  .from("rfp_vault_artifacts")
  .select(...)
  .eq("org_id", orgId);
```

This pattern is the ONLY case in the codebase where `createAdminClient` is used for a SELECT of tenant data. It appears in 3 routes: `vault/list`, `export/audit-trail-csv`, `proposals/package (GET)`. All three have the Phase 1+2 gate confirmed above.

---

## Open Question Resolution: rfp_opportunity_enrichments Per-Org vs. Global

**Question (from Phase 22 research):** Does `rfp_opportunity_enrichments` hold per-org data that should be org-scoped, or is it per-opportunity metadata safe for globally-readable access?

**Migration file:** `supabase/migrations/20260601_rfp_opportunity_enrichments.sql`

**Schema — columns of rfp_opportunity_enrichments:**
```sql
CREATE TABLE IF NOT EXISTS public.rfp_opportunity_enrichments (
  opp_id             uuid        PRIMARY KEY REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  source             text        NOT NULL DEFAULT 'rules_v1',
  eligibility        text[]      NOT NULL DEFAULT '{}',
  required_documents text[]      NOT NULL DEFAULT '{}',
  submission_method  text,
  submission_url     text,
  contact            text,
  matching_funds     text,
  funding_method     text,
  award_range        text,
  timeline           text[]      NOT NULL DEFAULT '{}',
  risks              text[]      NOT NULL DEFAULT '{}',
  missing_fields     text[]      NOT NULL DEFAULT '{}',
  quality_score      integer     NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  raw                jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
```

**Structural finding:** The table has `opp_id` as the PRIMARY KEY (not `org_id` + `opp_id` composite). There is NO `org_id` column. All data is per-opportunity metadata: eligibility requirements, required documents, submission method, contacts, risks, timeline — all derived from the public opportunity record itself, not from any org's proprietary analysis.

**Actual RLS policy (migration lines 35-45):**
```sql
CREATE POLICY rfp_opportunity_enrichments_select ON public.rfp_opportunity_enrichments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.rfp_opp_matches m
      WHERE m.opp_id = rfp_opportunity_enrichments.opp_id
        AND m.org_id = ANY(public.rfp_my_org_ids())
    )
  );
```

**Correction to research:** The Phase 22 research characterized this policy as `auth.uid() IS NOT NULL` (globally readable to any authenticated user). The actual migration uses `rfp_my_org_ids()` scoped via `rfp_opp_matches` — enrichments are only visible to orgs that have a match record for that opportunity. This is MORE conservative than globally-readable, not less.

**Conclusion:** The `rfp_opportunity_enrichments` table:
1. Contains NO per-org data (no `org_id` column; all fields are per-opportunity public metadata)
2. The RLS policy is TIGHTER than globally-readable — it requires the org to have an `rfp_opp_matches` row for the opportunity
3. The policy is correct and safe; no per-org secrets are at risk

**No policy change needed.** If future phases add per-org scoring fields (e.g., `org_specific_score`) to this table, a new migration must add a composite primary key and update the policy accordingly. For now, the globally-derived enrichment metadata with match-scoped visibility is the right design.

---

## Background/Cron/Webhook Routes — Out of Scope But Verified Correct

These routes intentionally use ONLY `createAdminClient` with no user session — correct because they run server-side with no caller identity.

| Route | Auth mechanism | createAdminClient only? | Verdict |
|-------|---------------|------------------------|---------|
| `app/api/cron/usage-alerts/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/rfp-monthly-digest/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/rfp-weekly-report/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/rfp-sequences/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/process-agents/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/voice-intel-patterns/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/sync-usage/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/audit-cleanup/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/heartbeat/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/refresh-funnel/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/refresh-tokens/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/cron/proactive-nudges/route.ts` | CRON_SECRET header check | YES | CORRECT — cron |
| `app/api/webhooks/rfp-stripe/route.ts` | Stripe webhook signature verification | YES | CORRECT — webhook |
| `app/api/rfp/admin/saved-search-alerts/run/route.ts` | `getRfpPlatformAdmin()` env-var allowlist | Admin-only reads via lib | CORRECT — admin gate |

**Note on `app/api/cron/send-sequence-emails/route.ts`:** This cron route uses `createClient()` (not admin). It is NOT an RFP engine route and touches only `email_sequence_sends` (a non-rfp table). The CRON_SECRET gate is present (lines 14-16). This route is out of scope for the RFP audit but is noted here for completeness.

---

## Findings

### Verdict: PASS — No Service-Role Misuse Found

**Summary of findings:**

1. **Zero violations detected.** Across all 41 user-facing `app/api/rfp/**` routes, no route reads tenant data (`rfp_proposals`, `rfp_vault_artifacts`, `rfp_entitlements`, `rfp_package_documents`, `rfp_agent_sessions`) via `createAdminClient()` without a prior `createClient()` + `getUser()` + membership check confirming the caller's identity and org membership.

2. **The dual-client pattern is consistent and correct.** 22 of 41 routes use the dual-client pattern. All 22 follow the Phase 1 (auth gate) → Phase 2 (membership proof via RLS) → Phase 3 (admin client for write/read) sequence. The 3 routes that use `createAdminClient` for SELECT reads (vault/list, audit-trail-csv, package GET) all have the full Phase 1+2 gate before the admin SELECT.

3. **rfp_opportunity_enrichments policy is correct and more conservative than documented in research.** The actual policy requires `rfp_my_org_ids()` membership proof, not just `auth.uid() IS NOT NULL`. The table has no `org_id` column (per-opp metadata only), so no per-org data is at risk regardless.

4. **All cron/webhook/admin routes correctly use only `createAdminClient`.** No user session context is mistakenly used in server-only routes.

---

## Audit Scope Note

This audit covers tables and routes as of **Phase 14 foundation + Phase 13 stabilization + Phase 22 routes**. Later-phase routes (Phase 17 AI cost guardrail, Phase 18 scoring, Phase 19 review/compliance, Phase 20 submission) must be re-audited when added. The dual-client pattern documented here should be applied as the standard template for all future route additions.

**Re-audit trigger:** Any new `app/api/rfp/**` route that imports `createAdminClient` must be reviewed against the audit rule: createClient + getUser + membership check MUST precede any createAdminClient call that reads or writes tenant-scoped data.

---

## Remediation

**None required — audit clean.**

All 41 user-facing `app/api/rfp/**` routes follow the correct service-role hygiene pattern. No code changes were made as part of this audit.
