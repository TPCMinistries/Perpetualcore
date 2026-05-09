---
phase: 04-foundations-salvage-port
plan: "01"
subsystem: rfp-schema-rls
tags:
  - database
  - rls
  - multi-tenant
  - pgvector
  - supabase
dependency_graph:
  requires: []
  provides:
    - rfp_* schema (11 tables) in LDC Brain AI
    - Tenant-isolation RLS via rfp_user_orgs membership
    - rfp_my_org_ids() SECURITY DEFINER helper functions
    - vector(1024) embedding column on rfp_vault_artifacts
  affects:
    - All downstream phases (Discovery, Capture, Drafting, Reviewer, Compliance, SaaS)
    - Any service that writes to LDC Brain AI (hgxxxmtfmvguotkowxbu)
tech_stack:
  added:
    - pgvector 0.8.0 (already installed, now referenced in schema)
    - SECURITY DEFINER SQL functions for RLS (rfp_my_org_ids et al.)
  patterns:
    - Membership-table RLS pattern (rfp_user_orgs as single source of truth)
    - SECURITY DEFINER helper functions to break RLS self-referential recursion
    - Separate schema and RLS migrations for atomic rollback isolation
key_files:
  created:
    - supabase/migrations/20260509_rfp_schema.sql
    - supabase/migrations/20260509_rfp_rls_policies.sql
    - supabase/migrations/20260509_rfp_rls_fix_recursion.sql
    - tests/rls/rfp-tenant-isolation.test.ts
  modified:
    - vitest.config.ts
decisions:
  - SECURITY DEFINER helper functions used instead of inline rfp_user_orgs subqueries to prevent infinite recursion
  - 3 separate migration files (schema, RLS, RLS fix) for clean atomic rollback isolation
  - node vitest environment for tests/rls/** to avoid jsdom overhead on network-bound tests
  - rfp_compliance_checks and rfp_proposal_sections gated via parent rfp_proposals (no org_id denorm)
metrics:
  duration: "7 minutes"
  completed: "2026-05-09"
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 1
---

# Phase 4 Plan 1: RFP Schema + RLS Tenant Isolation Summary

**One-liner:** 11-table `rfp_*` schema with SECURITY DEFINER RLS via `rfp_user_orgs` membership, proven by 6/6 passing vitest isolation tests against live LDC Brain AI.

---

## What Was Built

### Schema (Task 1)

All 11 `rfp_*` tables created in LDC Brain AI (hgxxxmtfmvguotkowxbu) via additive `CREATE TABLE IF NOT EXISTS` migration:

| Table | Key columns | Notes |
|-------|------------|-------|
| `rfp_orgs` | `id, name, type, naics[], voice_fingerprint, capacity_summary` | Tenant root; `updated_at` trigger |
| `rfp_users` | `id (→ auth.users), email, role` | Profile mirror; auth source is auth.users |
| `rfp_user_orgs` | `user_id, org_id, role` | **RLS anchor table**; PK on (user_id, org_id) |
| `rfp_capture_profiles` | `org_id, version, profile_json, voice_examples[]` | Unique on (org_id, version) |
| `rfp_vault_artifacts` | `org_id, type, title, body, embedding vector(1024)` | ivfflat index with lists=100; BGE-M3 dimension |
| `rfp_opportunities` | `source, source_id, title, agency, amount, deadline` | Global (no org_id); unique on (source, source_id) |
| `rfp_opp_matches` | `opp_id, org_id, fit_score, win_prob` | Per-org match scores; unique on (opp_id, org_id) |
| `rfp_proposals` | `org_id, opp_id, title, status, due_date` | Status: draft→submitted→awarded/lost; `updated_at` trigger |
| `rfp_proposal_sections` | `proposal_id, section_type, content, version` | Index on proposal_id |
| `rfp_compliance_checks` | `proposal_id, check_type, status (pass/fail/warn)` | Pre-submit validation |
| `rfp_agent_sessions` | `proposal_id, org_id, agent, tokens, cost_usd` | Denormalized org_id for RLS; encrypted prompt/response |

**pgvector:** Extension confirmed at v0.8.0. `embedding vector(1024)` column on `rfp_vault_artifacts` with `ivfflat` index (`lists=100`, `vector_cosine_ops`).

**Triggers:** `rfp_set_updated_at()` PLPGSQL function applied to `rfp_orgs` and `rfp_proposals` before UPDATE.

### RLS Policies (Task 2 + Bug Fix)

All 11 tables have RLS enabled. Policy model:

**Helper functions (SECURITY DEFINER, bypasses RLS recursion):**
- `rfp_my_org_ids()` — returns `uuid[]` of orgs the current user belongs to
- `rfp_my_org_ids_with_role(roles text[])` — filtered by role array
- `rfp_my_owned_org_ids()` — shortcut for owner-only orgs

**Policy matrix:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `rfp_orgs` | member | any auth (API enforces owner insert) | owner | owner |
| `rfp_users` | self | self | self | self |
| `rfp_user_orgs` | own OR org-owner | self OR org-owner | — | self OR org-owner |
| `rfp_capture_profiles` | member | owner/writer/reviewer | owner/writer | owner |
| `rfp_vault_artifacts` | member | owner/writer/reviewer | owner/writer | owner |
| `rfp_opportunities` | any auth | — (service_role only) | — | — |
| `rfp_opp_matches` | member | owner/writer/reviewer | owner/writer | owner |
| `rfp_proposals` | member | owner/writer/reviewer | owner/writer | owner |
| `rfp_proposal_sections` | via proposal | via proposal | via proposal | via proposal |
| `rfp_compliance_checks` | via proposal | via proposal | via proposal | via proposal |
| `rfp_agent_sessions` | member | owner/writer/reviewer | owner/writer | owner |

### Test Suite (Task 3)

`tests/rls/rfp-tenant-isolation.test.ts` — 6 vitest cases, runs against live LDC Brain AI.

**Test results: 6/6 PASS**

| Test | Result |
|------|--------|
| User A cannot read Org B vault artifacts | PASS |
| User A reads only their own Org A vault artifacts | PASS |
| User A cannot insert into Org B | PASS |
| User A cannot update Org B rows | PASS |
| User B sees their org but not Org A in rfp_orgs | PASS |
| rfp_opportunities globally readable for both users | PASS |

Ephemeral test users (`rls-test-*@test.local`) cleaned up after run — confirmed via `auth.users` query.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Infinite recursion in rfp_user_orgs RLS policies**

- **Found during:** Task 3 (test execution), error code `42P17`
- **Issue:** The `rfp_user_orgs_select` policy referenced `rfp_user_orgs` itself in its `USING` clause. PostgreSQL evaluates RLS on every access to the table — including inside subqueries in other policies — causing infinite recursion whenever a user queried `rfp_vault_artifacts` or `rfp_orgs`.
- **Fix:** Created `rfp_my_org_ids()`, `rfp_my_org_ids_with_role()`, and `rfp_my_owned_org_ids()` as `SECURITY DEFINER` functions. These run as the function owner (bypassing RLS entirely on `rfp_user_orgs`) and return arrays of org UUIDs. All 37 policies were dropped and recreated using `= ANY(rfp_my_org_ids())` pattern instead of inline subqueries.
- **Files modified:** `supabase/migrations/20260509_rfp_rls_fix_recursion.sql` (new file)
- **Commit:** `3da1b48`

**2. [Rule 2 - Missing] vitest environment override for integration tests**

- **Found during:** Task 3 (test authoring)
- **Issue:** The global vitest config uses `jsdom` environment, which is inappropriate for tests making real HTTP calls to Supabase. The global `setup.ts` also mocks `NEXT_PUBLIC_SUPABASE_URL` to `https://test.supabase.co`.
- **Fix:** Added `environmentMatchGlobs: [["tests/rls/**", "node"]]` to `vitest.config.ts`. The test file loads real env from `.env.local` directly via `loadEnvLocal()` helper, bypassing the mock.
- **Files modified:** `vitest.config.ts`
- **Commit:** `3da1b48`

---

## Service Role Key Usage Warning

The test suite uses `SUPABASE_SERVICE_ROLE_KEY` for:
1. `admin.auth.admin.createUser()` — creating ephemeral test users
2. `admin.from('rfp_orgs').insert()` — seeding test data bypassing RLS
3. `admin.auth.admin.deleteUser()` — teardown

**The service role key is NEVER committed to git.** It is read from `.env.local` at runtime. CI must supply it as a secret environment variable. Do NOT add it to `vitest.config.ts` or any committed file.

---

## Key Decisions Made

1. **SECURITY DEFINER pattern for RLS**: Chose SECURITY DEFINER helper functions over alternatives (materialized view, denormalized columns) because: (a) no schema change needed, (b) functions are stable (cached per transaction), (c) cleanest pattern for Postgres RLS with self-referential membership tables.

2. **3 migration files instead of 2**: The bug was found after Task 2 was committed. Created a fix migration rather than amending the original to preserve the migration chain integrity.

3. **node environment for tests/rls/**: The `jsdom` environment adds unnecessary DOM overhead and the global `setup.ts` mocks conflict with live database tests. Node environment is correct for server-side integration tests.

4. **rfp_compliance_checks and rfp_proposal_sections via parent proposal**: These tables lack an `org_id` column, so RLS gates them via a subquery through `rfp_proposals`. This matches the relational integrity model and avoids denormalization.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `supabase/migrations/20260509_rfp_schema.sql` exists | FOUND |
| `supabase/migrations/20260509_rfp_rls_policies.sql` exists | FOUND |
| `supabase/migrations/20260509_rfp_rls_fix_recursion.sql` exists | FOUND |
| `tests/rls/rfp-tenant-isolation.test.ts` exists | FOUND |
| `vitest.config.ts` modified | FOUND |
| `.planning/phases/04-foundations-salvage-port/04-01-SUMMARY.md` exists | FOUND |
| Commit `c73dc00` (Task 1: schema) | FOUND |
| Commit `de9af68` (Task 2: RLS policies) | FOUND |
| Commit `3da1b48` (Task 3: test suite + recursion fix) | FOUND |
| All 11 rfp_* tables in LDC Brain AI | VERIFIED |
| Zero rls_disabled_in_public advisors | VERIFIED |
| 6/6 vitest isolation tests pass | VERIFIED |
