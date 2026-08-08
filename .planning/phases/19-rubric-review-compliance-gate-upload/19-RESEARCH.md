# Phase 19: Rubric Review, Compliance Gate & Upload — Research

**Researched:** 2026-06-09
**Domain:** Multi-agent adversarial review, structured rubric extraction, compliance gate hardening, PDF/DOCX upload on Vercel serverless
**Confidence:** HIGH — derived almost entirely from reading the actual codebase; prior-milestone decisions honored

---

## Summary

Phase 19 builds on substantial existing infrastructure. There is already a working Reviewer Agent v1 (`lib/rfp/review/generate.ts` + `rubric.ts`), a full compliance/capture-readiness pipeline (`lib/rfp/compliance/generate.ts`), an `rfp_package_documents` table with PDF/DOCX extraction via `pdf-parse` v2 and `mammoth`, and an `/ai-disclosure` legal page (Phase 22). This phase extends these primitives rather than replacing them. The key net-new work is: (1) structured rubric extraction from uploaded solicitation documents into a new `rfp_rubric_criteria` table and visible UI in the proposal workspace, (2) upgrading the reviewer from a generic GPT-4o pass to a rubric-anchored multi-criterion panel using the Anthropic model chain (Sonnet/Haiku + gpt-4o fallback), (3) hardening the compliance gate to explicitly check page limits/attachments/budget math/eligibility/deadline+timezone and surface a pass/fail checklist with an AI-disclosure line item the user must acknowledge, and (4) wiring the vault upload-file route to also accept solicitation documents for rubric extraction.

The most important discovery is that **`pdf-parse` v2 is already in production and working** — the prior course-correction to use `unpdf` was for an older version with a `canvas` native dep that breaks on Vercel. The current codebase already resolved this by upgrading to `pdf-parse` v2, which is configured in `next.config.mjs` as working without special webpack config. Do NOT migrate to `unpdf`; the existing `pdf-parse` v2 + `mammoth` stack is correct. `maxDuration = 90` is already set on upload routes, which handles 20-page documents without timeout.

The second key discovery is that `scoring_criteria` strings already flow from `lib/rfp/package/extract.ts` into the drafter (`lib/rfp/draft/generate.ts:161`) via the `PackageExtraction.scoring_criteria[]` field — but they are **deterministic regex-extracted sentences**, not structured `{criterion_text, weight, section_ref}` objects. REVIEW-01 requires true structured extraction (with weights) via Claude Structured Outputs + Zod, stored as `rfp_rubric_criteria` rows. This is a new capability layered on top of the existing extraction, not a replacement.

The compliance gate (`lib/rfp/compliance/generate.ts`) is deterministic and already checks deadline, format, attachment, budget, eligibility, and submission requirements. Phase 19 must harden it to: (a) check page_limits against a `{limit, current_pages}` comparison (currently `page_limits` is only extracted as strings, not enforced), (b) add an explicit `ai_disclosure` line item in the `PacketChecklistArtifact` that must be `met` status for gate to pass, and (c) verify deadline timezone is never `null` (currently flagged as warn, Phase 19 makes this a `fail` blocker per PITFALLS.md Pitfall 4).

**Primary recommendation:** Extend existing surfaces (rubric.ts → add `rubric_criteria[]`, compliance/generate.ts → add hardened checks + ai_disclosure item), add `rfp_rubric_criteria` table + Claude extraction service, and wire all through the existing guardrail. Keep pdf-parse v2 as-is.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVIEW-01 | Extract actual evaluation criteria (Section L/M for gov; funder priorities for grants) with weights from uploaded solicitation | New `lib/rfp/rubric/extract.ts` using Claude Structured Outputs + Zod schema; stores to new `rfp_rubric_criteria` table; criteria visible in proposal workspace; feeds REVIEW-02 |
| REVIEW-02 | Multi-agent reviewer panel scores draft against extracted criteria, not generic writing quality | Extends existing `ReviewerInput` in `rubric.ts` to include `rubric_criteria[]`; upgrades `generate.ts` from GPT-4o-only to Anthropic model chain (Sonnet → Haiku → gpt-4o fallback); per-criterion scoring via multi-pass |
| REVIEW-03 | Reviewer findings anchor to draft sections with severity and suggested fix | Already implemented in `ReviewerFinding.section_type + severity + suggestion`; Phase 19 adds `criterion_id` FK to `rfp_rubric_criteria` when rubric criteria are available |
| REVIEW-04 | Compliance gate v1 checks page limits, required attachments, budget math, eligibility, and deadline+timezone; pass/fail checklist visible before submit | Existing gate in `lib/rfp/compliance/generate.ts`; Phase 19 hardens: page_limit numerical enforcement, timezone null = `fail` (not `warn`), budget math = explicit `[BUDGET]` marker count, ai_disclosure checklist item |
| REVIEW-05 | AI-use disclosure notice in draft output + ai_disclosure checklist line item in compliance gate (GSA GSAR 552.239-7001 / NIH); user must acknowledge | `/ai-disclosure` page already shipped (Phase 22); Phase 19 adds: (1) disclosure banner in draft output UI, (2) `ai_disclosure` item in `PacketChecklistArtifact` with `status: needs_review` until user explicitly acknowledges |
| REVIEW-06 | User can upload PDF or DOCX solicitation document on Vercel serverless; parsed into vault chunks without timeout on 20-page doc | `/vault/upload-file` + `/proposals/[id]/package` already ship this for vault and package docs respectively; `pdf-parse` v2 + `mammoth` + `maxDuration=90` confirmed working; Phase 19 adds a solicitation-specific flow that routes extracted text to rubric extraction instead of vault chunking |
</phase_requirements>

---

## Existing Infrastructure Inventory (HIGH confidence — read directly)

### What Already Exists and Works (DO NOT REBUILD)

| Component | File | Current State | Phase 19 Action |
|-----------|------|---------------|-----------------|
| Reviewer Agent v1 | `lib/rfp/review/generate.ts` | GPT-4o only; generic rubric | Extend: add Anthropic chain, accept `rubric_criteria[]` |
| Reviewer types + prompt | `lib/rfp/review/rubric.ts` | `ReviewerInput`, `ReviewerResult`, `ReviewerFinding`, REVIEWER_SYSTEM_PROMPT | Extend `ReviewerInput` to add `rubric_criteria?: RubricCriterion[]`; update prompt |
| Review API route | `app/api/rfp/proposals/[proposalId]/review/route.ts` | Calls `guardedLLMCall`, persists to `rfp_proposal_sections` as `reviewer_findings_v1` | Load `rfp_rubric_criteria` for the opp before calling reviewer |
| ReviewerFindingsPanel | `components/rfp/ReviewerFindingsPanel.tsx` | Renders severity-grouped findings | Add rubric criterion label when `criterion_id` is present |
| Compliance gate | `lib/rfp/compliance/generate.ts` | `buildComplianceMatrix`, `buildPacketChecklist`, `buildBidNoBid`; deterministic, zero AI cost | Harden: page limit enforcement, ai_disclosure item, timezone-null = fail |
| Compliance types | `lib/rfp/compliance/types.ts` | `RequirementCategory`, `PacketChecklistArtifact`, `ComplianceMatrixArtifact` | Add `ai_disclosure` to `PacketChecklistItem.id` variants; no schema change needed |
| Compliance API route | `app/api/rfp/proposals/[proposalId]/compliance/route.ts` | Zero-cost session write to `rfp_agent_sessions` | No route change needed; just pass new compliance output |
| Package extract | `lib/rfp/package/extract.ts` | Deterministic; `scoring_criteria: string[]`; already extracts page_limits, deadline_timezone | Scoring criteria strings become input hint to Claude extraction but do NOT replace structured rubric |
| Package upload route | `app/api/rfp/proposals/[proposalId]/package/route.ts` | PDF+DOCX upload → `rfp_package_documents` → `extractPackageRequirements` | Phase 19 adds a `solicitation_mode` flag so the same upload also triggers rubric extraction |
| Vault upload-file route | `app/api/rfp/orgs/[orgId]/vault/upload-file/route.ts` | PDF+DOCX → `uploadDocument` (chunk+embed pipeline) | REVIEW-06 requires solicitation PDFs also feed vault; use existing route or extend package route |
| PDF parsing | `pdf-parse` v2 (`^2.4.4`) | Works on Vercel serverless; dynamic import; `maxDuration=90` already set | **Keep as-is.** `unpdf` migration not needed. |
| DOCX parsing | `mammoth` (`^1.11.0`) | `mammoth.extractRawText({ buffer })` | Keep as-is. |
| AI guardrail | `lib/rfp/ai/guardrail.ts` | `guardedLLMCall`, `checkBudget`, `recordCost`, `RFP_MODEL_RATES` | All new LLM calls MUST go through `guardedLLMCall`. Add Anthropic model rates if missing. |
| Model chain | `lib/rfp/scoring/summary.ts` | `anthropic → haiku → gpt-4o` fallback chain established | Reuse exact same pattern for rubric extraction + reviewer upgrade |
| AI disclosure page | `app/ai-disclosure/page.tsx` | Live at `/ai-disclosure`; covers fit scoring, draft generation, review | Add "Rubric Extraction" to the AI use list in this page |

### What Does NOT Exist Yet (Must Build)

| Component | Purpose |
|-----------|---------|
| `lib/rfp/rubric/extract.ts` | Claude Structured Outputs + Zod to extract `RubricCriterion[]` from solicitation text |
| `lib/rfp/rubric/adversarial.ts` | Multi-criterion reviewer panel that scores each criterion separately |
| `rfp_rubric_criteria` table + migration | Persistent storage for extracted rubric criteria per opp |
| `rubric_criteria` field in `ReviewerInput` | Extend existing type; new criteria-anchored prompt logic |
| AI disclosure checklist item | In `buildPacketChecklist` — `{id: "ai-disclosure", label: "...", status: "needs_review"}` |
| Draft output disclosure banner | UI component in proposal workspace signaling AI-generated content |
| Solicitation upload flow | Route/UI that accepts a solicitation PDF and triggers rubric extraction (vs vault chunking) |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pdf-parse` | `^2.4.4` | PDF text extraction on Vercel serverless | **Already installed and working in production**; v2 resolves canvas native dep issue |
| `mammoth` | `^1.11.0` | DOCX → raw text | Already installed; `extractRawText({ buffer })` is the correct API |
| `@anthropic-ai/sdk` | existing | Claude API for rubric extraction + reviewer upgrade | Already wired via `lib/rfp/scoring/summary.ts` pattern |
| `openai` | existing | gpt-4o last-resort fallback in model chain | Already wired; keep as fallback only |
| `zod` | existing | Structured output validation | Already used in `rubric.ts` for ReviewerModelOutputSchema |
| `guardedLLMCall` | internal | Phase 17 cost guardrail | MANDATORY for all LLM calls in Phase 19 |

### Vercel Serverless Constraints (confirmed from codebase)
- `export const runtime = "nodejs"` — required on upload routes (pdf-parse needs Node.js runtime)
- `export const maxDuration = 90` — already set on upload routes; sufficient for 20-page PDF parse + embedding
- Vercel request body limit: **4.5 MB** (important for direct PDF upload without chunked streaming)
- Existing upload routes cap files at **20 MB** via file.size check — this exceeds the 4.5 MB request body limit. The existing routes work because `req.formData()` uses streaming internally on Vercel Pro/Enterprise; on Hobby tier this may fail for >4.5 MB. The existing pattern is already deployed and working per STATE.md, so keep as-is but document the 4.5 MB body limit as a known constraint.

### Model Selection (from summary.ts pattern — HIGH confidence)
| Model | Use Case | Cost Estimate |
|-------|----------|---------------|
| `claude-sonnet-4-5` | Rubric extraction (primary) | ~$0.05-0.15 per extraction (10K input tokens typical) |
| `claude-haiku-4-5` | Rubric extraction (fallback) | ~$0.005-0.015 per extraction |
| `gpt-4o` | Last-resort fallback (existing pattern) | ~$0.10-0.25 per extraction |
| `claude-sonnet-4-5` | Adversarial reviewer (primary) | ~$0.20-0.60 per review (20K input tokens with criteria) |
| `claude-haiku-4-5` | Adversarial reviewer (fallback) | ~$0.02-0.06 per review |
| `gpt-4o` | Reviewer last-resort fallback | ~$0.15-0.40 per review |

**Note:** The current reviewer uses only GPT-4o at `$0.10-0.25/run`. Upgrading to Sonnet primary increases cost slightly but improves criterion-anchored scoring quality. Keep `guardedLLMCall` gating.

---

## Architecture Patterns

### Pattern 1: Extend `ReviewerInput` — Add `rubric_criteria[]` (HIGH confidence)

**What:** The existing `ReviewerInput` interface in `lib/rfp/review/rubric.ts` gets an optional `rubric_criteria?: RubricCriterion[]` field. When present, the system prompt is augmented with the criteria list and the model is asked to score each criterion separately.

**When to use:** Every time an opp has `rfp_rubric_criteria` rows. Falls back gracefully to v1 behavior (generic review) when criteria are absent — this is the correct backward-compatible pattern.

```typescript
// Extension to lib/rfp/review/rubric.ts
export interface RubricCriterion {
  id: string;              // rfp_rubric_criteria.id (UUID)
  section_ref: string;     // e.g. "Section M.3", "Funder Priority: Health Equity"
  criterion_text: string;  // verbatim extracted text
  max_points: number | null;
  weight: number | null;   // 0-1 normalized weight
}

// Extended ReviewerInput
export interface ReviewerInput {
  opportunity: { ... };  // unchanged
  sections: Array<{ ... }>;  // unchanged
  rubric_criteria?: RubricCriterion[];  // NEW — optional
}
```

The `ReviewerFinding` type gets an optional `criterion_id?: string` field so rubric-anchored findings can reference the specific criterion they address.

### Pattern 2: Claude Structured Outputs for Rubric Extraction (HIGH confidence)

**What:** `lib/rfp/rubric/extract.ts` uses the Anthropic SDK's `messages.create()` call with a Zod schema to extract structured `RubricCriterion[]` from solicitation text. Mirrors the existing `ReviewerModelOutputSchema` pattern.

```typescript
// lib/rfp/rubric/extract.ts
const RubricCriterionSchema = z.object({
  section_ref: z.string(),     // "Section M.3" or "Funder Priority: X"
  criterion_text: z.string(),  // verbatim quote from the solicitation
  max_points: z.number().nullable(),
  weight: z.number().nullable(),
  is_inferred: z.boolean(),    // true if weight/points were inferred, not stated
});

const RubricExtractionOutputSchema = z.object({
  criteria: z.array(RubricCriterionSchema).max(30),
  document_type: z.enum(["federal_rfp", "federal_grant", "foundation_grant", "state_rfp", "other"]),
  has_explicit_scoring: z.boolean(),
});
```

**Hallucination guard (PITFALLS.md Pitfall 6):** After extraction, each criterion must include `is_inferred: true` if the weight/max_points was derived rather than stated. The UI renders an "inferred" badge on these. The prompt must instruct: "for each criterion listed, include the verbatim sentence from the document that supports it; if no sentence supports the weight/points value, set is_inferred: true."

**Extraction prompt approach:** Two-pass for federal RFPs (Section L = instructions, Section M = evaluation criteria). Single pass for grants. The prompt should explicitly instruct the model to look for Section L/M headers or funder priority sections by exact section title.

### Pattern 3: `rfp_rubric_criteria` Table (NEW — architecture doc pattern)

This table does not exist yet. It must be created in a new migration.

```sql
-- supabase/migrations/20260609_rfp_rubric_criteria.sql
CREATE TABLE IF NOT EXISTS public.rfp_rubric_criteria (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid        NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  package_doc_id  uuid        REFERENCES rfp_package_documents(id) ON DELETE SET NULL,
  section_ref     text        NOT NULL,  -- "Section M.3" or "Funder Priority: Health Equity"
  criterion_text  text        NOT NULL,
  max_points      numeric,
  weight          numeric,               -- 0-1 normalized weight, if stated
  is_inferred     boolean     NOT NULL DEFAULT false,
  extracted_by    text        NOT NULL DEFAULT 'claude-sonnet-4-5',
  extracted_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id, section_ref)           -- one row per section per opp
);

-- RLS: readable by users whose org has a proposal on this opp
CREATE POLICY rfp_rubric_criteria_select ON public.rfp_rubric_criteria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rfp_proposals p
      JOIN rfp_user_orgs uo ON uo.org_id = p.org_id
      WHERE p.opp_id = rfp_rubric_criteria.opp_id
        AND uo.user_id = auth.uid()
    )
  );
-- Service-role only for INSERT/UPDATE/DELETE
CREATE POLICY rfp_rubric_criteria_insert ON public.rfp_rubric_criteria
  FOR INSERT WITH CHECK (false);
-- (service-role bypasses; this blocks authenticated inserts)
```

**RLS design decision:** Criteria are global to the opp (not per-org), but should only be readable by users who have a proposal on that opp. This balances privacy with the fact that criteria come from public solicitations.

### Pattern 4: Compliance Gate Hardening (HIGH confidence — reading generate.ts)

The existing `buildPacketChecklist` in `lib/rfp/compliance/generate.ts` already emits `PacketChecklistItem[]`. Phase 19 adds three hardened checks:

**1. Page limit enforcement:**
```typescript
// Current: packageSummary returns page_limits as string[] (extracted sentences)
// Phase 19: parse numeric limits from those strings for comparison
function parsePageLimit(limits: string[]): number | null {
  for (const s of limits) {
    const m = s.match(/(?:not exceed|maximum of?|limit[^\d]*)\s*(\d+)\s*page/i);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}
// Then: estimate current_pages from proposal word count (avg 250 words/page)
// If current_pages > limit: status = "missing" (blocker)
```

**2. AI disclosure checklist item (REVIEW-05):**
```typescript
{
  id: "ai-disclosure",
  label: "AI-use disclosure reviewed",
  status: "needs_review",  // Always needs_review — user must manually acknowledge
  notes: "This proposal was drafted with AI assistance. Federal agencies (GSA GSAR 552.239-7001) and some grant funders require disclosure. Review the solicitation's AI-use policy at /ai-disclosure before submitting.",
}
```
This item is ALWAYS `needs_review` — it cannot auto-advance to `met`. The compliance gate overall status must remain at least `warn` as long as this item is `needs_review`. The user acknowledges by marking it via a new API endpoint (`PATCH /api/rfp/proposals/[id]/compliance-ack`).

**3. Deadline timezone hardening:**
```typescript
// Current behavior: deadline_timezone: null → warn
// Phase 19 behavior: deadline_timezone: null AND deadline exists → fail (blocker item)
{
  id: "deadline-timezone",
  label: "Deadline timezone verified",
  status: packageSummary.deadline_timezone ? "needs_review" : "missing",
  notes: packageSummary.deadline_timezone
    ? `Timezone: ${packageSummary.deadline_timezone}. Confirm against the original posting.`
    : "Deadline timezone could not be extracted. Check the original solicitation — a missed timezone can cause a missed deadline."
}
```

### Pattern 5: Solicitation Upload Flow (NEW — separate from vault upload)

The existing `/vault/upload-file` route writes to `rfp_vault_artifacts` (embedding pipeline). The existing `/proposals/[id]/package` route writes to `rfp_package_documents` (requirements extraction). Phase 19 needs a third path: solicitation upload → **rubric extraction** → `rfp_rubric_criteria` rows + visible workspace UI.

**Decision (from ARCHITECTURE.md Pattern 3):** Reuse the package upload route with a new `solicitation_mode: true` flag rather than creating a third upload route. When `solicitation_mode = true`:
1. Run `extractPackageRequirements` (existing, for the compliance gate)
2. Also run `extractRubricCriteria` (new) → insert `rfp_rubric_criteria` rows
3. Return both `extraction` (package requirements) and `rubric_criteria` (structured criteria)

The UI shows extracted criteria inline in the proposal workspace Rubric panel.

### Pattern 6: Reviewer Upgrade — Criteria-Anchored Scoring

When `rubric_criteria` are available, the reviewer system prompt is augmented:

```
[Append to REVIEWER_SYSTEM_PROMPT when criteria present]

The solicitation evaluation rubric has been extracted below. Each finding MUST
reference at least one criterion by criterion_id when applicable. Score each
criterion as part of your findings. Findings with no criterion match use
category "alignment_with_rubric" with criterion_id: null.

Rubric criteria:
{criteria.map(c => `[${c.id}] ${c.section_ref}: ${c.criterion_text} (${c.max_points ?? '?'} pts)`).join('\n')}
```

The `ReviewerFinding` type gains `criterion_id?: string` — optional, present only when anchored to a specific rubric row.

**Model upgrade:** Replace the hard-coded `const MODEL = "gpt-4o"` in `generate.ts` with the Anthropic-first model chain from `summary.ts`. The chain is: `claude-sonnet-4-5` → `claude-haiku-4-5` → `gpt-4o`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom parser | `pdf-parse` v2 (already installed) | Already production-tested on this codebase; v2 has no canvas dep |
| DOCX text extraction | Custom parser | `mammoth.extractRawText` (already installed) | Already production-tested; handles tables, headings, lists |
| JSON schema enforcement on model output | String parsing | Zod schema + `ReviewerModelOutputSchema` pattern | Already established in `rubric.ts`; same pattern for rubric extraction |
| Per-tenant cost gating | Inline checks | `guardedLLMCall` from `lib/rfp/ai/guardrail.ts` | Phase 17 requirement; not optional |
| Rubric findings storage | New `rfp_rubric_reviews` table | `rfp_proposal_sections` with `section_type = 'adversarial_review_v1'` | Reuse established pattern (Pattern 3 in ARCHITECTURE.md) |

---

## Common Pitfalls

### Pitfall 1: Rebuilding pdf-parse → unpdf (ALREADY RESOLVED)
**What goes wrong:** Prior planning notes said "unpdf" was required because `pdf-parse` had a `canvas` native dep that broke on Vercel. Someone follows that note and tries to migrate.
**Why it doesn't apply:** The codebase already upgraded to `pdf-parse` v2 (`^2.4.4`), which removed the native canvas dependency. `next.config.mjs` has a comment confirming this: "pdf-parse v2 works with standard bundling." Migration to `unpdf` would be churn with no benefit.
**How to avoid:** Keep `pdf-parse` v2. The existing `dynamic import` pattern in `upload-file/route.ts` is correct.

### Pitfall 2: Hallucinated Rubric Criteria (PITFALLS.md Pitfall 6)
**What goes wrong:** Claude extracts rubric criteria that don't exist in the uploaded solicitation. A user submits a proposal scored against hallucinated criteria.
**How to avoid:** (1) Verbatim quote requirement in the extraction prompt. (2) `is_inferred: boolean` on every criterion — weight/max_points that were inferred get flagged. (3) UI shows a "verify against source" badge on `is_inferred: true` items. (4) Extraction never claims criteria when none are found — returns empty array rather than inventing generic federal criteria.

### Pitfall 3: Reviewer Finding Without Criterion Anchor (REVIEW-03 gap)
**What goes wrong:** Phase 19 adds rubric criteria but the reviewer continues to produce generic findings like "improve alignment with funder goals" without mapping to specific `criterion_id` values. REVIEW-03 requires findings anchored to draft sections with severity.
**How to avoid:** The prompt explicitly enumerates criteria by ID and instructs the reviewer: "for each criterion in the rubric, produce at least one finding if the draft does not address it, using that criterion's ID in criterion_id field."

### Pitfall 4: AI Disclosure Item Auto-Advancing to `met`
**What goes wrong:** The compliance gate auto-calculates item status from proposal content. The AI disclosure item mistakenly auto-advances to `met` because the proposal mentions "AI" or "disclosure" in the text.
**How to avoid:** The `ai-disclosure` checklist item is hardcoded to `status: "needs_review"` until explicitly acknowledged. It has no auto-status logic. Acknowledgment requires a separate user action (a new `PATCH` endpoint or a toggle in the UI that POSTs the ack).

### Pitfall 5: Timezone Null Downgraded to Warn Instead of Fail (PITFALLS.md Pitfall 4)
**What goes wrong:** Deadline timezone extraction returns null → the item stays at `warn` not `fail` → the compliance gate overall is `warn` not `fail` → user proceeds to submit without verifying the deadline timezone → misses the deadline.
**How to avoid:** In `buildPacketChecklist`, when `deadline_timezone` is null AND a deadline exists: `status = "missing"` (blocker, not warn). This makes the compliance gate `overall_status = "fail"` until resolved.

### Pitfall 6: Rubric Extraction on Every Review Trigger
**What goes wrong:** The review API route calls rubric extraction every time a review is triggered, even when criteria are already stored in `rfp_rubric_criteria`. This doubles costs and latency.
**How to avoid:** Check `rfp_rubric_criteria` for the opp before calling extraction. Only extract when no rows exist yet (or explicitly requested via `force_re_extract: true` param). Cache is per `(opp_id, package_doc_id)` — re-extracting when a new solicitation version is uploaded is correct behavior.

### Pitfall 7: Vercel Request Body Size > 4.5 MB
**What goes wrong:** A federal solicitation PDF is 8 MB. The Vercel request body limit is 4.5 MB. The upload fails with a 413 before the route handler even runs.
**How to avoid:** The existing routes check `file.size > MAX_FILE_BYTES (20MB)` but this is an application-level check. The Vercel platform limit of 4.5 MB on the request body may cut in earlier on Hobby tier. For Vercel Pro/Enterprise (which this project uses per billing), the limit is higher. Keep the `20 MB` application cap but document this constraint. The `maxDuration = 90` setting prevents timeout but does not affect body size limits.

---

## Code Examples

Verified patterns from the existing codebase:

### PDF Extract (from `/vault/upload-file/route.ts`)
```typescript
// Source: app/api/rfp/orgs/[orgId]/vault/upload-file/route.ts
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf")) {
    const mod = await import("pdf-parse");
    type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;
    const parse: PdfParseFn =
      (mod as unknown as { default?: PdfParseFn }).default ??
      (mod as unknown as PdfParseFn);
    const result = await parse(buffer);
    return result.text ?? "";
  }
  if (file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }
  throw new Error(`unsupported_file_type:${file.type || "unknown"}:${file.name}`);
}
// Always normalize after extraction:
const cleaned = text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
```

### guardedLLMCall wrapper (from review route)
```typescript
// Source: app/api/rfp/proposals/[proposalId]/review/route.ts
let capturedReview: ReviewerResult | undefined;
await guardedLLMCall(proposal.org_id, async () => {
  const result = await generateReview({ opportunity: opp, sections: draftedSections });
  capturedReview = result;
  return {
    agent: REVIEWER_AGENT,
    model: result.model,
    tokensIn: result.tokens_in,
    tokensOut: result.tokens_out,
    costUsd: result.cost_usd,
    sessionId: result.session_id,
    proposalId: proposal.id,
  };
});
```

### Anthropic model chain (from summary.ts)
```typescript
// Source: lib/rfp/scoring/summary.ts — use exact same pattern
const MODEL_PRIMARY = 'claude-sonnet-4-5';
const MODEL_FALLBACK = 'claude-haiku-4-5';
const MODEL_OPENAI_FALLBACK = 'gpt-4o';
const MODEL_CHAIN = [MODEL_PRIMARY, MODEL_FALLBACK, MODEL_OPENAI_FALLBACK];
// Dispatch on model id: gpt-* → OpenAI client, else → Anthropic client
// Returns null on any failure; caller handles gracefully
```

### Storing adversarial review result as rfp_proposal_sections row
```typescript
// Source: app/api/rfp/proposals/[proposalId]/review/route.ts
// Pattern: reviewer_findings_v1 — use same for adversarial_review_v1
const ADVERSARIAL_REVIEW_SECTION_TYPE = "adversarial_review_v1";
await admin.from("rfp_proposal_sections").insert({
  proposal_id: proposal.id,
  section_type: ADVERSARIAL_REVIEW_SECTION_TYPE,
  content: JSON.stringify(adversarialResult),
  version: 1,
  last_drafted_by_agent_at: new Date().toISOString(),
});
```

### Compliance zero-cost audit log (from compliance route)
```typescript
// Source: app/api/rfp/proposals/[proposalId]/compliance/route.ts
await adminDb.from("rfp_agent_sessions").insert({
  proposal_id: proposal.id,
  org_id: proposal.org_id,
  agent: "compliance_v1",
  session_id: `capture_readiness:${Date.now().toString(36)}`,
  model: "deterministic",
  tokens_in: 0,  tokens_out: 0,  cost_usd: 0,
});
```

---

## Plan Structure Recommendation

Based on the codebase state and requirements, Phase 19 should be split into 4 plans:

| Plan | Work | Requirements |
|------|------|--------------|
| **19-01** | DB migration (`rfp_rubric_criteria` table + RLS) + `lib/rfp/rubric/extract.ts` (Claude extraction + Zod schema) + wire into package upload route (`solicitation_mode`) | REVIEW-01 |
| **19-02** | Extend `ReviewerInput` + prompt to accept `rubric_criteria[]`; upgrade `generate.ts` to Anthropic model chain; load criteria in review route; add `criterion_id` to `ReviewerFinding`; RubricCriteria UI panel in proposal workspace | REVIEW-02, REVIEW-03 |
| **19-03** | Compliance gate hardening: page limit enforcement, ai_disclosure checklist item (always `needs_review`), deadline_timezone null → fail; new `PATCH .../compliance-ack` endpoint; AI disclosure banner in draft output UI | REVIEW-04, REVIEW-05 |
| **19-04** | Solicitation upload UI in proposal workspace (dedicated "Import Solicitation" flow distinct from vault upload); verification: upload 20-page PDF → criteria extracted → visible in workspace; trigger review → criteria-anchored findings; compliance gate shows ai_disclosure item | REVIEW-06, all verification |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pdf-parse` v1 (canvas dep → Vercel fail) | `pdf-parse` v2 (no native deps) | Already resolved before this session | **Do not migrate to `unpdf`** — v2 is correct |
| GPT-4o only for reviewer | Anthropic-first chain (Sonnet → Haiku → gpt-4o) | Phase 18 set the pattern in `summary.ts` | Reviewer upgrade is straightforward model swap |
| Generic reviewer prompt (no rubric) | Rubric-anchored multi-criterion scoring | Phase 19 NEW | Core value unlock |
| Compliance gate as advisory warn | Compliance gate as submission blocker (fail status) | Phase 19 tightening | Timezone null + ai_disclosure = hard blockers |

---

## Open Questions

1. **Compliance acknowledgment UX — implicit vs explicit**
   - What we know: The `ai-disclosure` checklist item should require explicit user acknowledgment
   - What's unclear: Should ack be a separate API call (`PATCH /compliance-ack`) or a checkbox state stored client-side until gate is re-run?
   - Recommendation: Store ack in `rfp_proposals` as `ai_disclosure_acknowledged: boolean` (additive column). Compliance gate reads this column. Simple, persistent, no extra table.

2. **Solicitation upload UI location**
   - What we know: There are already two upload flows (vault upload form, package import). Adding a third "solicitation" upload could confuse users.
   - What's unclear: Should solicitation upload be a tab in the package import UI or a distinct surface in the workspace?
   - Recommendation: Extend the existing package import tab with a `mode: "solicitation"` toggle. Solicitation mode extracts rubric criteria AND runs package requirements extraction. Same UI, new backend behavior.

3. **Rubric criteria RLS — per-opp vs per-org**
   - What we know: Criteria come from public solicitations, so they're not org-confidential. But the RLS check needs context.
   - What's unclear: Should anyone with a proposal on the opp see criteria, or should it be the same org as the proposal?
   - Recommendation: Any user with a proposal on the opp can read the criteria (not org-scoped). This is the least restrictive correct policy and avoids complexity. See SQL above.

4. **Rubric extraction on package import vs separate trigger**
   - What we know: The package import already runs on solicitation documents. Adding rubric extraction as a side effect of package import is the cleanest UX.
   - What's unclear: Should rubric extraction be synchronous (inline with package import response) or async (background, shows "Extracting rubric…" state)?
   - Recommendation: Synchronous for now. The LLM call for extraction is ~2-4 seconds. Package import already has `maxDuration = 90`. Return criteria in the import response alongside `extraction`.

---

## Sources

### Primary (HIGH confidence — read directly from codebase)
- `lib/rfp/review/rubric.ts` — ReviewerInput, ReviewerResult, REVIEWER_SYSTEM_PROMPT, Zod schemas
- `lib/rfp/review/generate.ts` — GPT-4o single pass, cost calculation, JSON extraction
- `app/api/rfp/proposals/[proposalId]/review/route.ts` — guardedLLMCall pattern, findings persistence
- `lib/rfp/compliance/generate.ts` — full compliance gate implementation
- `lib/rfp/compliance/types.ts` — type definitions
- `app/api/rfp/proposals/[proposalId]/compliance/route.ts` — route pattern, zero-cost audit log
- `lib/rfp/package/extract.ts` — deterministic extraction, scoring_criteria field
- `app/api/rfp/proposals/[proposalId]/package/route.ts` — package upload route, PDF/DOCX parsing
- `app/api/rfp/orgs/[orgId]/vault/upload-file/route.ts` — vault upload, maxDuration=90 confirmed
- `lib/rfp/vault/upload.ts` — uploadDocument pipeline (chunk+embed)
- `lib/rfp/ai/guardrail.ts` — guardedLLMCall, RFP_MODEL_RATES, BudgetExceededError
- `lib/rfp/scoring/summary.ts` (first 80 lines) — Anthropic→Haiku→gpt-4o model chain pattern
- `lib/rfp/import/extract.ts` — Anthropic primary/fallback, note: NOT guarded (no org_id)
- `app/ai-disclosure/page.tsx` — confirms /ai-disclosure is live, covers fit scoring + drafting + review
- `components/rfp/ReviewerFindingsPanel.tsx` — rendering pattern for findings
- `.planning/REQUIREMENTS.md` — REVIEW-01..REVIEW-06 definitions
- `.planning/STATE.md` — Phase 18 CLOSED; Anthropic key now funded; model-chain fallback locked in
- `.planning/ROADMAP.md` — Phase 19 success criteria verbatim
- `.planning/research/PITFALLS.md` — Pitfall 4 (timezone), Pitfall 6 (hallucinated rubric), Pitfall 12 (AI disclosure)
- `.planning/research/ARCHITECTURE.md` — Pattern 3 (rfp_proposal_sections reuse), Phase D build order
- `package.json` — confirmed: pdf-parse v2.4.4, mammoth 1.11.0, pdfjs-dist 5.x, pdf2json 4.x

### Secondary (MEDIUM confidence — inferred from pattern observation)
- `next.config.mjs` comment: "pdf-parse v2 works with standard bundling" — confirms v2 Vercel compatibility
- `supabase/migrations/20260601_rfp_package_documents.sql` — confirms rfp_package_documents exists; rfp_rubric_criteria does NOT exist yet

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — read directly from package.json + working routes
- Architecture: HIGH — patterns derived from reading actual implementation files
- Pitfalls: HIGH — timezone/hallucination from official docs in PITFALLS.md; pdf-parse from next.config comment
- Open questions: MEDIUM — design choices that need a human decision; recommendations given

**Research date:** 2026-06-09
**Valid until:** 2026-07-09 (30 days; stable libraries; Anthropic model names may change)
