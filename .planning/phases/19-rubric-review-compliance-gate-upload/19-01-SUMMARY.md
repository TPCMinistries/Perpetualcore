---
phase: 19-rubric-review-compliance-gate-upload
plan: "01"
subsystem: rfp-review
tags: [rubric-extraction, claude, guardrail, migration, rls]
dependency_graph:
  requires: []
  provides: [rfp_rubric_criteria table, extractRubricCriteria service, solicitation_mode upload flag]
  affects: [app/api/rfp/proposals/[proposalId]/package/route.ts, lib/rfp/rubric/extract.ts]
tech_stack:
  added: []
  patterns:
    - Anthropic-first model chain (claude-sonnet-4-5 → haiku-4-5 → gpt-4o) from summary.ts
    - Zod schema + extractJson fence-stripping before parse (from review/generate.ts)
    - guardedLLMCall + capturedResult pattern (from review/route.ts)
    - rfp_my_org_ids() RLS pattern (from rfp_package_documents migration)
    - as unknown as cast for new table (database.types.ts regen deferred to 19-04)
key_files:
  created:
    - supabase/migrations/20260609_rfp_rubric_criteria.sql
    - lib/rfp/rubric/extract.ts
  modified:
    - app/api/rfp/proposals/[proposalId]/package/route.ts
decisions:
  - "Rubric extraction runs synchronously in package upload response (not async background) — package route already has maxDuration=90 which covers LLM call time"
  - "as unknown as cast used for rfp_rubric_criteria queries — database.types.ts regen deferred to 19-04 per established single-owner pattern"
  - "guardedLLMCall records a zero-cost session row when extractRubricCriteria returns null (chain failure) so the attempt is always ledgered"
  - "De-duplication of section_refs happens client-side before INSERT to respect UNIQUE(opp_id,section_ref) constraint — suffix (2),(3) for dupes"
metrics:
  duration: "7 min"
  completed: "2026-06-10"
  tasks_completed: 3
  files_changed: 3
---

# Phase 19 Plan 01: Rubric Criteria Table + Extraction Service + Route Wiring Summary

Structured rubric extraction foundation for REVIEW-01: `rfp_rubric_criteria` DB table with RLS, Claude-powered `extractRubricCriteria` with verbatim-quote hallucination guards, and `solicitation_mode` flag wired into the package upload route with budget gating and per-opp caching.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create and apply rfp_rubric_criteria migration | d412f8e | supabase/migrations/20260609_rfp_rubric_criteria.sql |
| 2 | Build lib/rfp/rubric/extract.ts | 6137170 | lib/rfp/rubric/extract.ts |
| 3 | Wire solicitation_mode into package upload route | 4ca5d21 | app/api/rfp/proposals/[proposalId]/package/route.ts |

## What Was Built

### Task 1 — Migration (Applied to LDC Brain AI hgxxxmtfmvguotkowxbu)

`rfp_rubric_criteria` table with:
- `opp_id` FK to rfp_opportunities (ON DELETE CASCADE) — criteria keyed per opportunity
- `package_doc_id` FK to rfp_package_documents (ON DELETE SET NULL) — tracks source doc
- `section_ref` + `criterion_text` — verbatim content fields
- `max_points` (numeric, nullable), `weight` (numeric 0-1, nullable) — scoring values
- `is_inferred` (boolean) — hallucination guard flag for derived values
- `extracted_by` (text, default `claude-sonnet-4-5`), `extracted_at` (timestamptz)
- `UNIQUE(opp_id, section_ref)` — one row per section per opp
- RLS SELECT via `rfp_my_org_ids()` pattern (users with a proposal on the opp)
- RLS INSERT `WITH CHECK (false)` — writes are service-role only
- Verified: `select count(*) from rfp_rubric_criteria` returns 0; both policies confirmed

### Task 2 — extractRubricCriteria (303 lines)

`lib/rfp/rubric/extract.ts` exports:
- `RubricCriterionSchema` (Zod) — section_ref, criterion_text, max_points, weight, is_inferred
- `RubricExtractionOutputSchema` (Zod) — criteria[], document_type, has_explicit_scoring
- `extractRubricCriteria(text, hints?)` → `RubricExtractionResult | null`

Model chain mirrors `summary.ts` exactly: `claude-sonnet-4-5` → `claude-haiku-4-5` → `gpt-4o`. Lazy `getAnthropic()`/`getOpenAI()` init. Dispatch on model id prefix `gpt-` → OpenAI, else Anthropic.

Hallucination guards in system prompt:
- `criterion_text MUST be a verbatim sentence or passage copied directly from the document`
- `is_inferred: true` when weight/max_points are derived (not stated verbatim)
- `If document contains NO evaluation criteria, return criteria: [] — do NOT invent generic federal criteria`

JSON fence-stripping via `extractJson()` before Zod parse; falls through to next model on Zod failure. Returns `null` on full chain failure — never throws. `computeCostUsd` from guardrail used for cost metadata.

### Task 3 — Package Route Wiring

Surgical extension to `app/api/rfp/proposals/[proposalId]/package/route.ts`:

- Added `solicitation_mode` and `force_re_extract` to FieldsSchema (enum strings per formData contract)
- Post-insert rubric extraction when `solicitation_mode === "true"`:
  - No opp_id → `rubric_skipped_reason: "no_opportunity_linked"`
  - Cache hit (existing rows + !force_re_extract) → return cached rows, no LLM call
  - `guardedLLMCall` wraps `extractRubricCriteria` with `capturedResult` pattern
  - `BudgetExceededError` → `rubric_skipped_reason: "budget_exceeded"` (package succeeds)
  - `null` return → `rubric_skipped_reason: "extraction_failed"`
  - On success: DELETE old rows if force_re_extract; de-dupe section_refs; INSERT via admin
  - Return `rubric_criteria` + optional `rubric_skipped_reason` alongside existing response
- Plain package imports (no solicitation_mode) unchanged
- `runtime="nodejs"` and `maxDuration=90` unchanged

## Decisions Made

1. **Synchronous extraction** — runs inline with package upload response. Route already has `maxDuration=90` (verified); LLM call adds ~2-4s, well within budget.

2. **`as unknown as` cast** for rfp_rubric_criteria table queries — database.types.ts regen deferred to 19-04 per established single-owner pattern (Phase 14-04, 17).

3. **Zero-cost ledger row on null extraction** — `guardedLLMCall` records the attempt even when the chain fails, so budget tracking is complete.

4. **Client-side section_ref de-duplication** — suffix `(2)`, `(3)` before INSERT to respect `UNIQUE(opp_id, section_ref)` without relying on ON CONFLICT behavior.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- rfp_rubric_criteria live on hgxxxmtfmvguotkowxbu: `count(*)=0`, 2 RLS policies confirmed via `supabase db query --linked`
- lib/rfp/rubric/extract.ts: 303 lines (min 120 satisfied), all 4 required exports present, MODEL_CHAIN all 3 models, `is_inferred` in schema + prompt (6 occurrences), `computeCostUsd` imported, `return null` on chain exhaustion (line 302)
- Package route: `runtime=nodejs` and `maxDuration=90` unchanged, solicitation_mode in FieldsSchema, guardedLLMCall wraps extractRubricCriteria, cache-check precedes LLM call, all failure paths use rubric_skipped_reason
- Typecheck: only pre-existing "missing node_modules" errors (identical to summary.ts, guardrail.ts); no errors in extract.ts or package route from this plan's changes

## Self-Check: PASSED

Files:
- FOUND: supabase/migrations/20260609_rfp_rubric_criteria.sql
- FOUND: lib/rfp/rubric/extract.ts
- FOUND: app/api/rfp/proposals/[proposalId]/package/route.ts (modified)

Commits:
- d412f8e — feat(19-01): create rfp_rubric_criteria migration and apply to LDC Brain AI
- 6137170 — feat(19-01): build lib/rfp/rubric/extract.ts — Claude structured rubric extraction
- 4ca5d21 — feat(19-01): wire solicitation_mode into package upload route (REVIEW-01)
