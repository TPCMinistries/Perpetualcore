---
phase: 19-rubric-review-compliance-gate-upload
plan: "02"
subsystem: rfp-review
tags: [rubric-anchored-review, anthropic-chain, criterion-id, reviewer-upgrade, workspace-panel]
dependency_graph:
  requires:
    - 19-01: rfp_rubric_criteria table + extractRubricCriteria service
    - 19-03: AiDisclosureBanner wired in proposals page (preserved as-is)
  provides:
    - RubricCriterion type + rubric_criteria on ReviewerInput
    - criterion_id on ReviewerFinding + ReviewerFindingSchema
    - buildRubricPromptAddendum exported helper
    - Anthropic-first model chain in generate.ts (sonnet-4-5 → haiku-4-5 → gpt-4o)
    - rfp_rubric_criteria loaded in review route (criteria-anchored or v1-generic fallback)
    - RubricCriteriaPanel workspace panel with weights and inferred badges
    - criterion_id → section_ref chip in ReviewerFindingsPanel
  affects:
    - 19-04: verification pass; workspace now shows rubric + criterion-anchored findings
tech_stack:
  added: []
  patterns:
    - Anthropic-first model chain (claude-sonnet-4-5 → haiku-4-5 → gpt-4o) from summary.ts
    - Lazy getAnthropic()/getOpenAI() init identical to summary.ts
    - Per-model try/null/fall-through chain; throw only on full exhaustion (preserves 502 route contract)
    - criterion_id sanitization: unknown ids → null, finding kept (never dropped)
    - as-unknown-as cast for rfp_rubric_criteria table (database.types.ts regen deferred to 19-04)
key_files:
  created:
    - components/rfp/RubricCriteriaPanel.tsx
  modified:
    - lib/rfp/review/rubric.ts
    - lib/rfp/review/generate.ts
    - app/api/rfp/proposals/[proposalId]/review/route.ts
    - components/rfp/ReviewerFindingsPanel.tsx
    - app/(dashboard)/org/[orgId]/proposals/[proposalId]/page.tsx
decisions:
  - "Anthropic-first model chain (sonnet → haiku → gpt-4o) replaces hard-coded gpt-4o; preserves throw-on-full-chain-failure contract so route returns 502 on retry"
  - "criterion_id: z.string().nullable().optional() in Zod schema — no UUID format enforcement; malformed echo from model sets id to null at post-parse time, finding retained"
  - "Rubric criteria loaded in review route via createAdminClient (not re-extracted — Pitfall 6); zero criteria = v1 generic behavior"
  - "RubricCriteriaPanel returns null when criteria.length === 0 — workspace only shows panel when criteria exist"
  - "criterion_id chip in ReviewerFindingsPanel uses id→section_ref map (O(1)); unknown criterion_ids render as today (no chip, no error)"
  - "database.types.ts regen deferred to 19-04 (single-owner pattern); as-unknown-as cast used for rfp_rubric_criteria queries"
metrics:
  duration: "5 min"
  completed: "2026-06-10"
  tasks_completed: 3
  files_changed: 5
---

# Phase 19 Plan 02: Rubric-Anchored Reviewer + Anthropic Model Chain + Criteria Workspace Panel Summary

Reviewer upgraded from generic GPT-4o pass to rubric-anchored Anthropic-first model chain (claude-sonnet-4-5 → haiku-4-5 → gpt-4o) with per-criterion findings (criterion_id), extracted rubric visible in proposal workspace via RubricCriteriaPanel with weights and is_inferred hallucination-guard badges.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend reviewer types + prompt; upgrade generate.ts to Anthropic chain | 7e91ff4 | lib/rfp/review/rubric.ts, lib/rfp/review/generate.ts |
| 2 | Load rubric criteria in the review route | bea7dcd | app/api/rfp/proposals/[proposalId]/review/route.ts |
| 3 | RubricCriteriaPanel + criterion labels in findings + workspace wiring | 81a657c | components/rfp/RubricCriteriaPanel.tsx (new), components/rfp/ReviewerFindingsPanel.tsx, app/(dashboard)/org/[orgId]/proposals/[proposalId]/page.tsx |

## What Was Built

### Task 1 — Reviewer Types + Prompt + generate.ts Model Chain Upgrade

**rubric.ts** (backward-compatible extensions):
- `RubricCriterion` interface exported: `{ id, section_ref, criterion_text, max_points, weight }`
- `rubric_criteria?: RubricCriterion[]` added to `ReviewerInput` (optional, backward compat)
- `criterion_id?: string | null` added to `ReviewerFinding` and `ReviewerFindingSchema` (z.string().nullable().optional() — no UUID enforcement per plan spec)
- `buildRubricPromptAddendum(criteria)` exported: enumerates criteria as `[id] section_ref: text (pts, weight)` with per-criterion scoring instructions
- `buildReviewerUserPrompt` appends rubric block when `rubric_criteria?.length > 0`
- JSON shape in REVIEWER_SYSTEM_PROMPT updated to document `criterion_id` field

**generate.ts** (full model chain upgrade):
- `MODEL_CHAIN = ["claude-sonnet-4-5", "claude-haiku-4-5", "gpt-4o"]` replaces `const MODEL = "gpt-4o"`
- Lazy `getAnthropic()`/`getOpenAI()` init identical to summary.ts pattern
- Dispatch on model id prefix: `gpt-*` → OpenAI (`response_format: json_object`), else → Anthropic (`messages.create`)
- Per-model failure (API error, empty content, JSON/Zod parse failure) → fall through; only full chain exhaustion throws
- `computeCostUsd(model, tokensIn, tokensOut)` from guardrail replaces local `PRICE_PER_M_*` constants
- Post-parse: `sanitizeCriterionId` maps unknown ids to null (finding kept); only runs when rubric_criteria provided
- `model` in returned `ReviewerResult` is the model that actually succeeded

### Task 2 — Review Route Rubric Loading

Surgical extension to `app/api/rfp/proposals/[proposalId]/review/route.ts`:
- After opp load, fetches `rfp_rubric_criteria` rows for `proposal.opp_id` via `createAdminClient`
- `as unknown as "rfp_opportunities"` cast (database.types.ts regen deferred to 19-04)
- Passes `rubric_criteria: criteria.length > 0 ? criteria : undefined` into `generateReview`
- Zero criteria → v1 generic behavior (backward compatible, Pitfall 6 respected)
- No import of extract.ts (no extraction triggered from review path)
- Response includes `rubric_criteria_count: criteria.length` for UI distinction

### Task 3 — RubricCriteriaPanel + Criterion Chips + Workspace Wiring

**RubricCriteriaPanel.tsx** (111 lines, new):
- Props: `criteria: Array<{ id, section_ref, criterion_text, max_points, weight, is_inferred }>`
- Renders titled panel ("Evaluation Rubric") with each criterion: section_ref as mono uppercase, criterion_text as body, weight as % and/or pts
- Amber "inferred — verify against source" badge when `is_inferred: true` (Pitfall 2 UI guard)
- Returns null when `criteria.length === 0` — workspace only shows panel when criteria exist
- Zinc-palette / font-mono-label aesthetic matches SubmissionReadinessPanel + ReviewerFindingsPanel

**ReviewerFindingsPanel.tsx** (surgical extension):
- New optional `criteria?: CriterionForPanel[]` prop (default `[]`)
- Builds `criterionMap: Map<id, section_ref>` for O(1) lookup
- When finding has `criterion_id` in the map: renders emerald chip with section_ref next to severity badge
- Unknown/absent criterion_id renders exactly as before (no chip, no error)

**proposals/[proposalId]/page.tsx** (surgical):
- `RubricCriteriaRow` interface + `rubricCriteria` array
- Fetches `rfp_rubric_criteria` rows when `proposal.opp_id` is set (RLS SELECT allows it)
- `RubricCriteriaPanel` rendered directly above `ReviewerFindingsPanel` when criteria.length > 0
- `criteria={rubricCriteria}` passed into top-level `ReviewerFindingsPanel`
- Section-level `ProposalSectionEditor` `findings` prop unchanged (criterion chips labeling in top panel only, no prop drilling — documented per plan spec)

## Decisions Made

1. **No UUID enforcement on criterion_id** — `z.string().nullable().optional()` allows the model to echo any string; unknown IDs are sanitized to null at post-parse time with the finding retained. Prevents hard Zod failures on slightly malformed model echoes.

2. **Post-parse sanitization not pre-parse filtering** — We keep every finding, only null-ing the criterion_id when it doesn't match. This preserves reviewer output quality while preventing bad criterion links.

3. **criteria prop defaults to empty array** — ReviewerFindingsPanel accepts `criteria?: CriterionForPanel[]` with default `[]`, making it backward compatible. Existing call sites without criteria render identically.

4. **Section-level criterion chips not threaded** — ProposalSectionEditor's `findings` prop receives section-specific `ReviewerFinding[]` but no `criteria` prop. The criterion_id → section_ref resolution only occurs in the top-level ReviewerFindingsPanel. This avoids prop drilling through ProposalSectionEditor → SectionFindings and is documented in the summary per plan spec.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- generate.ts: `MODEL_CHAIN` with all 3 model ids confirmed, `computeCostUsd` imported, `criterion_id` in ReviewerFindingSchema, `buildRubricPromptAddendum` exported and called in `buildReviewerUserPrompt`, no `PRICE_PER_M_INPUT` reference
- review route: selects from `rfp_rubric_criteria`, passes `rubric_criteria` into `generateReview`, no import of extract.ts
- RubricCriteriaPanel: 111 lines (min 40), `is_inferred` badge, empty returns null
- proposals page: `RubricCriteriaPanel` imported and rendered, `criteria` passed to `ReviewerFindingsPanel`
- Typecheck: only pre-existing "missing node_modules" errors (Cannot find module 'react'/'next'/'@anthropic-ai/sdk'/'openai'/'zod', JSX 'any' elements) identical to 19-01 and 19-03 pattern. No new errors from this plan's changes. Vercel build is the gate.

## Self-Check: PASSED

Files:
- FOUND: lib/rfp/review/rubric.ts
- FOUND: lib/rfp/review/generate.ts
- FOUND: components/rfp/RubricCriteriaPanel.tsx
- FOUND: app/api/rfp/proposals/[proposalId]/review/route.ts
- FOUND: app/(dashboard)/org/[orgId]/proposals/[proposalId]/page.tsx (modified)

Commits:
- 7e91ff4 — feat(19-02): extend reviewer types + prompt for rubric anchoring; upgrade generate.ts to Anthropic chain
- bea7dcd — feat(19-02): load rubric criteria in review route (REVIEW-02)
- 81a657c — feat(19-02): RubricCriteriaPanel + criterion chips in findings + workspace wiring (REVIEW-01/03)
