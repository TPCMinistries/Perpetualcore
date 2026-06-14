# Phase 17: AI Cost Guardrail - Research

**Researched:** 2026-06-07
**Domain:** Per-tenant LLM cost ledger + pre-call budget enforcement
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-04 | A per-tenant AI cost ledger enforces a hard spend limit BEFORE each LLM call fires | Schema design (rfp_entitlements + new monthly_ai_budget_usd column + rfp_agent_sessions as ledger), wrapper function pattern, atomic check-record flow, BudgetExceededError typed error, RLS via rfp_my_org_ids() |
</phase_requirements>

---

## Summary

Phase 14 shipped `rfp_entitlements` with four nullable quota columns (`monthly_score_quota`, `monthly_draft_quota`, `monthly_review_quota`, `monthly_vault_mb`) but deliberately deferred the AI spend limit and enforcement middleware. Phase 17 closes that gap. The key structural discovery: **`rfp_agent_sessions` already exists as the per-call cost ledger** — it has `org_id`, `cost_usd`, `tokens_in`, `tokens_out`, `model`, `agent`, and `created_at` columns, is already RLS-protected via `rfp_my_org_ids()`, and is already written by every LLM-backed route. Phase 17 does NOT need a new ledger table. It needs: (1) one new `monthly_ai_budget_usd` column on `rfp_entitlements`, (2) a `guardedLLMCall()` wrapper in `lib/rfp/ai/guardrail.ts` that checks spend against that limit before any call and records cost after, and (3) insertion of that wrapper at every RFP-namespace LLM call site.

There are **9 distinct LLM call sites** in the RFP namespace. Seven are user-facing (gated by request-scoped auth) and two are cron/background (no user context). The background scoring calls (`generateFitSummary` via `scoreNewOpportunitiesForAllActiveOrgs`) run per-org in a cron loop — they must also be guarded per org. All 9 call sites already return token counts and cost estimates; the wrapper captures those post-call and inserts into `rfp_agent_sessions`.

**Primary recommendation:** Add `monthly_ai_budget_usd numeric` to `rfp_entitlements` via additive migration, write `lib/rfp/ai/guardrail.ts` with `guardedLLMCall(orgId, operation, fn)`, insert it at all 9 call sites (5 routes + 2 lib functions), and add a typed `BudgetExceededError` that routes translate to HTTP 402 with an actionable JSON body.

---

## Standard Stack

### Core (already in repo — no new installs)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@anthropic-ai/sdk` | ^0.67.0 | Anthropic Claude calls (scoring summary, import extract) | Already in package.json |
| `openai` | ^6.5.0 | OpenAI GPT-4o + embeddings calls (draft, review, voice, vault, naics) | Already in package.json |
| `@supabase/supabase-js` | (project version) | DB read/write for budget check + ledger insert | Already wired |

No new packages. This phase is pure infrastructure wrapping existing SDKs.

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
lib/rfp/ai/
└── guardrail.ts        # guardedLLMCall() + BudgetExceededError + cost constants

supabase/migrations/
└── 20260607_rfp_ai_budget.sql   # ADD COLUMN monthly_ai_budget_usd to rfp_entitlements

tests/unit/
└── rfp-ai-guardrail.test.ts    # vitest unit tests for all 3 success criteria
```

### Pattern 1: guardedLLMCall Wrapper

**What:** A single async wrapper that (a) checks current month spend against the org's `monthly_ai_budget_usd` limit BEFORE calling the LLM function, (b) throws `BudgetExceededError` if over limit, (c) calls the function, (d) inserts a `rfp_agent_sessions` row with cost in the same request lifecycle.

**When to use:** Every RFP-namespace LLM call. All 9 call sites MUST route through this.

**Signature:**
```typescript
// lib/rfp/ai/guardrail.ts

export class BudgetExceededError extends Error {
  readonly code = "BUDGET_EXCEEDED" as const;
  readonly orgId: string;
  readonly spentUsd: number;
  readonly limitUsd: number;
  constructor(orgId: string, spentUsd: number, limitUsd: number) {
    super(`AI budget exceeded: $${spentUsd.toFixed(4)} spent of $${limitUsd.toFixed(2)} limit`);
    this.orgId = orgId;
    this.spentUsd = spentUsd;
    this.limitUsd = limitUsd;
  }
}

export interface LLMCallMeta {
  agent: string;          // matches rfp_agent_sessions.agent values (e.g. "drafter_v1")
  proposalId?: string;    // optional — set for proposal-scoped calls
  sessionId?: string;     // optional — pass through from lib function
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

/**
 * Run fn() only if orgId has remaining AI budget.
 * Records cost in rfp_agent_sessions within the same lifecycle.
 * Throws BudgetExceededError (not 500) when over limit.
 *
 * @param orgId   — the rfp_orgs.id for the tenant
 * @param fn      — async function that makes the LLM call; MUST return LLMCallMeta
 */
export async function guardedLLMCall<T extends LLMCallMeta>(
  orgId: string,
  fn: () => Promise<T>
): Promise<T> {
  // 1. Budget preflight
  await checkBudget(orgId);       // throws BudgetExceededError if over

  // 2. Fire the LLM call
  const result = await fn();

  // 3. Record cost — non-fatal if insert fails
  await recordCost(orgId, result).catch((err) =>
    console.error("[guardrail] cost record failed (non-fatal):", err)
  );

  return result;
}
```

**How routes translate BudgetExceededError:**
```typescript
// In every LLM-backed API route, replace bare try/catch with:
try {
  const result = await guardedLLMCall(orgId, () => generateDraft({ ... }));
  // ...
} catch (err) {
  if (err instanceof BudgetExceededError) {
    return NextResponse.json(
      {
        error: "budget_exceeded",
        message: `Your organization's AI budget ($${err.limitUsd.toFixed(2)}/mo) has been reached. Contact your admin to increase the limit.`,
        spent_usd: err.spentUsd,
        limit_usd: err.limitUsd,
      },
      { status: 402 }
    );
  }
  // ... existing error handling
}
```

### Pattern 2: Budget Check Query

**What:** Sum this month's `cost_usd` from `rfp_agent_sessions` for the org, compare against `rfp_entitlements.monthly_ai_budget_usd`. If the column is NULL (unlimited), skip the check.

**Implementation:**
```typescript
async function checkBudget(orgId: string): Promise<void> {
  const admin = createAdminClient();

  // Read the spend limit (NULL = unlimited)
  const { data: ent } = await admin
    .from("rfp_entitlements")
    .select("monthly_ai_budget_usd")
    .eq("org_id", orgId)
    .maybeSingle();

  const limitUsd: number | null = (ent as { monthly_ai_budget_usd: number | null } | null)
    ?.monthly_ai_budget_usd ?? null;

  if (limitUsd === null) return;   // NULL = unlimited, skip

  // Sum this calendar month's spend
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: rows } = await admin
    .from("rfp_agent_sessions")
    .select("cost_usd")
    .eq("org_id", orgId)
    .gte("created_at", monthStart.toISOString())
    .not("cost_usd", "is", null)
    .returns<{ cost_usd: number | string | null }[]>();

  const spentUsd = (rows ?? []).reduce(
    (sum, r) => sum + toNum(r.cost_usd),
    0
  );

  if (spentUsd >= limitUsd) {
    throw new BudgetExceededError(orgId, spentUsd, limitUsd);
  }
}
```

### Pattern 3: Cost Recording

**What:** After every successful call, insert a row into `rfp_agent_sessions` with `cost_usd`, `tokens_in`, `tokens_out`, `model`, `agent`, `org_id`, optional `proposal_id`.

**Key insight:** Most routes ALREADY insert `rfp_agent_sessions` post-call. The wrapper ensures this also happens for call sites that previously skipped it (notably `naics-suggest` and scoring/cron paths). For routes that already insert, they should delegate to `guardedLLMCall` — which inserts the row — and remove their inline inserts to avoid double-counting.

```typescript
async function recordCost(orgId: string, meta: LLMCallMeta): Promise<void> {
  const admin = createAdminClient();
  await admin.from("rfp_agent_sessions").insert({
    org_id: orgId,
    proposal_id: meta.proposalId ?? null,
    agent: meta.agent,
    session_id: meta.sessionId ?? null,
    model: meta.model,
    tokens_in: meta.tokensIn,
    tokens_out: meta.tokensOut,
    cost_usd: meta.costUsd,
  });
}
```

### Pattern 4: Model Rate Map (constants in guardrail.ts)

All call sites use hardcoded `PRICE_PER_M_INPUT` / `PRICE_PER_M_OUTPUT` constants that are already correct but scattered. The guardrail can optionally expose a canonical rate map for future use, but for v1 it just trusts the `costUsd` field returned by each lib function (they all compute it already).

**No new rate map needed for v1** — all 9 call sites already compute `cost_usd` from their local pricing constants and return it. The wrapper receives the computed cost as input.

### Anti-Patterns to Avoid

- **Double-counting:** Routes that currently insert `rfp_agent_sessions` inline must remove that inline insert once wrapped — the wrapper does it. Otherwise one call creates two ledger rows and spend doubles.
- **Fail-open on budget check:** If the Supabase read for the limit fails, do NOT silently allow. Log + re-throw as a 500 (the user can retry — this is a DB error, not a budget situation).
- **Fail-open vs fail-closed on record failure:** Cost recording failures ARE non-fatal (don't break the user's draft). Log + swallow. The spec says "within the same request lifecycle" — insert attempt within the lifecycle is sufficient.
- **User-context client for ledger writes:** Always use `createAdminClient()` for `rfp_agent_sessions` inserts (existing pattern confirmed across 9 routes).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting pre-call | Custom tokenizer to estimate prompt tokens | Trust post-call `usage` from SDK response | Pre-call estimation is inaccurate; check is on cumulative spend not per-call token budget |
| Distributed lock for concurrent calls | Redis advisory lock, Postgres FOR UPDATE lock | Simple pre-call sum + post-call insert | At beachhead scale (1-2 orgs, <10 concurrent calls) a small overspend window is acceptable; document it |
| Rate-map DB table | `ai_model_pricing` DB table (exists but is non-RFP) | Inline constants in each lib function (already present) | The DB table at `lib/billing/model-pricing.ts` is for the non-RFP AI OS system; RFP lib functions already have their own pricing constants |
| Streaming cost ledger | Event-driven CDC, webhook on insert | Synchronous post-call insert into rfp_agent_sessions | Already the pattern; no new infrastructure |

---

## Complete LLM Call Site Inventory

Every RFP-namespace LLM call, sorted by type:

### User-Facing (require guardedLLMCall with org budget check)

| # | File | Agent Label | Model | SDK | Call Type | Currently Writes Session? |
|---|------|------------|-------|-----|-----------|--------------------------|
| 1 | `app/api/rfp/draft/route.ts` | `drafter_v1` | gpt-4o | OpenAI | `chat.completions.create` | YES — inline insert after call |
| 2 | `app/api/rfp/proposals/[proposalId]/redraft/route.ts` | `drafter_v1` | gpt-4o | OpenAI | `chat.completions.create` | YES — inline insert after call |
| 3 | `app/api/rfp/proposals/[proposalId]/review/route.ts` | `reviewer_v1` | gpt-4o | OpenAI | `chat.completions.create` | YES — inline insert after call |
| 4 | `app/api/rfp/orgs/[orgId]/voice/train/route.ts` | `voice_fingerprint_extractor_v1` | gpt-4o | OpenAI | `chat.completions.create` | YES — inline insert after call |
| 5 | `app/api/rfp/orgs/[orgId]/voice/from-description/route.ts` | `voice_fingerprint_extractor_v1` | gpt-4o | OpenAI | `chat.completions.create` | YES — inline insert after call |
| 6 | `app/api/rfp/orgs/[orgId]/vault/upload/route.ts` | `vault_indexer_v1` | text-embedding-3-large | OpenAI | `embeddings.create` | YES — inline insert after call |
| 7 | `app/api/rfp/orgs/[orgId]/vault/from-description/route.ts` | `vault_indexer_v1` | gpt-4o + text-embedding-3-large | OpenAI (x2) | Two calls: expand + embed | YES — single inline insert after both |
| 8 | `app/api/orgs/naics-suggest/route.ts` | `naics_suggest_v1` (new label) | gpt-4o | OpenAI | `chat.completions.create` | NO — no session insert today |

### Background/Cron (require guardedLLMCall per org in loop)

| # | File | Agent Label | Model | SDK | Context |
|---|------|------------|-------|-----|---------|
| 9 | `lib/rfp/scoring/recompute.ts` → `lib/rfp/scoring/summary.ts` | `scoring_summary_v1` (new label) | claude-sonnet-4-5 (primary) / claude-haiku-4-5 (fallback) | Anthropic | Called per (opp, org) pair in cron; currently NO session insert |

### Call sites NOT requiring RFP guardrail (out of scope for Phase 17)

- `lib/rfp/import/extract.ts` — quick-import URL extractor; runs per user-submitted URL. Uses Anthropic. No org budget attribution because quick-import is currently pre-org (it runs before the org exists). Phase 17 DEFERS this; document the gap.
- Non-RFP routes (all `app/api/chat/`, `lib/agents/`, `lib/documents/`, etc.) — those are the non-RFP AI OS system with its own quota system (`lib/ai/quota-manager.ts`). Do not cross the namespaces.

---

## Schema Design

### New Column on rfp_entitlements

The existing table has `monthly_score_quota`, `monthly_draft_quota`, `monthly_review_quota`, `monthly_vault_mb` — all operation-count limits. Phase 17 adds a dollar-value spend limit:

```sql
-- supabase/migrations/20260607_rfp_ai_budget.sql
ALTER TABLE rfp_entitlements
  ADD COLUMN IF NOT EXISTS monthly_ai_budget_usd numeric;
  -- NULL = unlimited (default behavior for all existing rows)
  -- Operator sets: UPDATE rfp_entitlements SET monthly_ai_budget_usd = 5.00
  --   WHERE org_id = '...'
```

**Why not a separate table:** `rfp_agent_sessions` is already the append-only per-call cost ledger with `org_id`, `cost_usd`, `created_at`. A separate `rfp_ai_cost_ledger` table would duplicate what `rfp_agent_sessions` already provides. The budget limit belongs on `rfp_entitlements` alongside the other per-org limits. This minimizes schema additions.

**No new ledger table needed.** The sum query `SELECT SUM(cost_usd) FROM rfp_agent_sessions WHERE org_id = $1 AND created_at >= <month-start>` is the ledger read.

### rfp_agent_sessions RLS status (confirmed)

Current policies (from `20260509_rfp_rls_fix_recursion.sql`):
- SELECT: `org_id = ANY(rfp_my_org_ids())` — members read own org's sessions
- INSERT: `org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))`
- UPDATE/DELETE: owner/writer only

**The INSERT policy allows member-role users** because routes insert after auth check. But the guardrail inserts via `createAdminClient()` (service_role), which bypasses RLS. This is correct per CLAUDE.md. No policy change needed.

**For Phase 17 testing:** The test org needs a member so the user-facing routes can authenticate. But the guardrail writes via admin client regardless.

---

## Token Count Extraction (SDK-specific)

### OpenAI SDK (openai ^6.5.0)

Response shape for `chat.completions.create`:
```typescript
// res.usage is type CompletionUsage | undefined
const tokens_in = res.usage?.prompt_tokens ?? 0;
const tokens_out = res.usage?.completion_tokens ?? 0;
```
This is already the pattern in `lib/rfp/draft/generate.ts`, `lib/rfp/review/generate.ts`, `lib/rfp/voice/extract.ts`, `lib/rfp/vault/expand.ts`, `lib/rfp/naics/suggest.ts`.

For `embeddings.create`:
```typescript
// res.usage is EmbeddingCreateParams.Usage
const tokens = res.usage.total_tokens; // only input tokens for embeddings; no output
```
This is already used in `lib/rfp/vault/embed.ts`.

### Anthropic SDK (@anthropic-ai/sdk ^0.67.0)

Response shape for `messages.create`:
```typescript
// resp.usage is Usage { input_tokens: number; output_tokens: number }
const tokens_in = resp.usage.input_tokens;
const tokens_out = resp.usage.output_tokens;
```
This is the correct Anthropic SDK pattern. Note: `lib/rfp/scoring/summary.ts` currently does NOT extract or return token counts — it just returns the text string. The wrapper integration for scoring requires `summary.ts` to return `{ text, tokensIn, tokensOut, costUsd }` or the cron caller must handle it separately.

### Pricing constants (all existing, confirm accuracy)

| Model | Input $/M | Output $/M | Source |
|-------|-----------|------------|--------|
| gpt-4o | 2.50 | 10.00 | Hardcoded in generate.ts, review.ts, voice/extract.ts, expand.ts, naics/suggest.ts — CONSISTENT |
| text-embedding-3-large | 0.13 | 0 (embeddings have no output) | Hardcoded in embed.ts |
| claude-sonnet-4-5 | 3.00 | 15.00 | Must add to guardrail constants — NOT currently in any RFP file |
| claude-haiku-4-5 | 0.25 | 1.25 | Must add to guardrail constants — NOT currently in any RFP file |

**Action for planner:** Phase 17 should establish a `RFP_MODEL_RATES` map in `lib/rfp/ai/guardrail.ts` with all 4+ models so the rate constants are canonical for the RFP namespace.

---

## Common Pitfalls

### Pitfall 1: Double-counting from inline + wrapper inserts

**What goes wrong:** Routes 1–7 already insert `rfp_agent_sessions` after the LLM call. If the wrapper also inserts, every call generates two rows and the spend sum doubles, tripping the budget at half the actual limit.

**Why it happens:** Incremental integration — wrapping without removing the inline insert.

**How to avoid:** For each route, the integration plan must include: (a) wrap the lib function call with `guardedLLMCall`, (b) delete the existing inline `rfp_agent_sessions` insert, (c) verify the wrapper inserts the same fields. The lib functions themselves (generate.ts, etc.) do NOT insert sessions — only the routes do — so wrapping at the route level and removing the inline insert is clean.

**Warning signs:** `rfp_agent_sessions` rows count doubles what you expect during testing.

### Pitfall 2: `summary.ts` returns only text — no cost metadata

**What goes wrong:** `generateFitSummary` in `lib/rfp/scoring/summary.ts` returns `string | null` — it makes a `messages.create` call but throws away the usage response. The cron path (`scoreNewOpportunitiesForAllActiveOrgs`) has no cost to record.

**Why it happens:** The function was written for scoring only, not billing.

**How to avoid:** The planner must include a task to update `generateFitSummary` to return `{ text: string | null; tokensIn: number; tokensOut: number; costUsd: number }`. The cron caller then records cost via the guardrail per org.

**Note on cron scoring:** The cron runs per org across ALL opps. Each `generateFitSummary` call is ~80 tokens = ~$0.0004. At 1000 opps/org that is $0.40 per recompute run. The guardrail must check the budget BEFORE each summary call in the per-org loop, not once per cron run.

### Pitfall 3: NULL limit treated as $0.00 blocks all calls

**What goes wrong:** `rfp_entitlements.monthly_ai_budget_usd IS NULL` means unlimited. If the check reads NULL and compares `spentUsd >= null`, JavaScript coerces to false but `>= 0` could fire if NULL becomes 0.

**Why it happens:** Numeric coercion on NULL.

**How to avoid:** Explicit null guard: `if (limitUsd === null || limitUsd === undefined) return;` before any comparison.

### Pitfall 4: Month boundary for the sum query

**What goes wrong:** Rolling 30-day window misses the billing semantics (calendar month). A call on June 30 and July 1 should count in different billing periods.

**Why it happens:** Using `Date.now() - 30 * 86400 * 1000` instead of calendar month start.

**How to avoid:** Compute month start as `new Date(year, month, 1, 0, 0, 0, 0).toISOString()` — first day of current calendar month in UTC.

### Pitfall 5: vault/from-description has TWO LLM calls (expand + embed)

**What goes wrong:** `app/api/rfp/orgs/[orgId]/vault/from-description/route.ts` calls `expandOrgDescription` (gpt-4o) then `embedChunks` (text-embedding-3-large). Both are LLM calls. The current inline insert covers both with a combined cost_usd. The guardrail must either wrap them as a single logical operation OR check budget before expand and record total cost after embed.

**How to avoid:** Wrap the entire "expand then embed" sequence as one `guardedLLMCall` — the fn() runs both calls, returns a combined `LLMCallMeta` with summed tokens/cost. This matches the existing single-insert pattern.

### Pitfall 6: quick-import extract.ts — no org_id available

**What goes wrong:** `lib/rfp/import/extract.ts` is called from `lib/rfp/import/run.ts` which is triggered by `app/api/rfp/quick-import/route.ts`. The quick-import flow extracts metadata FROM a URL before an org is created/selected. There is no org_id available to attribute cost to at extract time.

**How to avoid:** Defer quick-import guardrail to a future phase. Document the gap in the plan. The quick-import Claude call costs ~$0.002 per URL and runs only when a user submits a URL manually — negligible budget risk at beachhead scale.

---

## Code Examples

### Migration

```sql
-- supabase/migrations/20260607_rfp_ai_budget.sql
-- Phase 17: Add AI spend limit to rfp_entitlements
-- Additive only. NULL = unlimited (all existing rows remain unlimited).
-- Applied to: hgxxxmtfmvguotkowxbu (LDC Brain AI) via supabase MCP apply_migration

ALTER TABLE rfp_entitlements
  ADD COLUMN IF NOT EXISTS monthly_ai_budget_usd numeric;

COMMENT ON COLUMN rfp_entitlements.monthly_ai_budget_usd IS
  'Monthly AI spend hard limit in USD. NULL = unlimited. Enforced by Phase 17 guardrail before every LLM call.';
```

### Test Pattern (success criterion 1 — $0 budget blocks call)

```typescript
// tests/unit/rfp-ai-guardrail.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { guardedLLMCall, BudgetExceededError } from "@/lib/rfp/ai/guardrail";

// Mock createAdminClient
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

describe("guardedLLMCall — $0 budget", () => {
  it("throws BudgetExceededError before calling fn when budget is $0", async () => {
    const mockAdmin = makeMockAdminWithBudget({ limitUsd: 0, spentUsd: 0 });
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as never);

    const fn = vi.fn().mockResolvedValue({ tokensIn: 100, tokensOut: 200, costUsd: 0.001, agent: "drafter_v1", model: "gpt-4o" });

    await expect(guardedLLMCall("org-123", fn)).rejects.toBeInstanceOf(BudgetExceededError);
    expect(fn).not.toHaveBeenCalled();  // LLM call NEVER fires
  });
});

describe("guardedLLMCall — successful call records cost", () => {
  it("inserts rfp_agent_sessions row after successful call", async () => {
    const { mockAdmin, insertCapture } = makeMockAdminWithBudget({ limitUsd: 10.00, spentUsd: 0.5 });
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as never);

    const meta = { tokensIn: 500, tokensOut: 1000, costUsd: 0.012, agent: "drafter_v1", model: "gpt-4o", proposalId: "prop-abc" };
    const fn = vi.fn().mockResolvedValue(meta);

    await guardedLLMCall("org-123", fn);

    expect(insertCapture).toHaveBeenCalledWith(
      expect.objectContaining({ org_id: "org-123", cost_usd: 0.012, agent: "drafter_v1" })
    );
  });
});

describe("guardedLLMCall — mid-session blocking", () => {
  it("blocks when cumulative spend crosses the limit", async () => {
    // spentUsd = 9.99, limitUsd = 10.00 — next call of $0.02 pushes over
    // The check is: spentUsd >= limitUsd (pre-call sum vs limit)
    const mockAdmin = makeMockAdminWithBudget({ limitUsd: 10.00, spentUsd: 10.00 });
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as never);

    const fn = vi.fn().mockResolvedValue({ tokensIn: 100, tokensOut: 200, costUsd: 0.001, agent: "reviewer_v1", model: "gpt-4o" });

    await expect(guardedLLMCall("org-123", fn)).rejects.toBeInstanceOf(BudgetExceededError);
    expect(fn).not.toHaveBeenCalled();
  });
});
```

### Route Error Translation

```typescript
// Standard block to add in every LLM-backed route catch:
import { BudgetExceededError } from "@/lib/rfp/ai/guardrail";

// In the try/catch around guardedLLMCall:
} catch (err) {
  if (err instanceof BudgetExceededError) {
    return NextResponse.json(
      {
        error: "budget_exceeded",
        message: `Your organization's AI budget ($${err.limitUsd.toFixed(2)}/mo) has been reached. Contact your administrator to increase the limit or wait until next month.`,
        spent_usd: err.spentUsd,
        limit_usd: err.limitUsd,
      },
      { status: 402 }
    );
  }
  // ... existing error handling unchanged
}
```

---

## Concurrency and Race Conditions

### The Small Overspend Window (acceptable for v1)

**Pattern:** pre-call SUM query → call fires → post-call INSERT.

**Race:** Two concurrent calls both read `spentUsd = 9.90` against `limitUsd = 10.00`. Both pass the check. Both fire. Combined spend becomes $9.90 + $0.012 + $0.012 = $9.924 — slightly over but not meaningfully so at beachhead scale.

**Mitigation for v1:** Document as acceptable. Maximum overspend in one request cycle is bounded by the most expensive single call (draft: ~$0.05). For orgs with meaningful budgets ($5–$50/mo) this is <1% overage.

**Do NOT:** Add a Postgres advisory lock or a `FOR UPDATE` row lock on the entitlements row. That adds serialization risk and complexity that is not warranted at beachhead scale. A future phase (Phase 24 or 23) can add a DB-side `PERFORM pg_advisory_xact_lock(hashtext(org_id::text))` wrapper if overspend becomes an issue.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| rfp_agent_sessions agent CHECK constraint (5 hardcoded values) | Constraint dropped (any snake_case string) | `20260522_rfp_status_and_agent_check_drift.sql` | New agent labels like `naics_suggest_v1` are safe to insert without migration |
| ivfflat embedding index | HNSW index | Phase 14 | No guardrail impact |
| Manual cost tracking per-route | Centralized wrapper (Phase 17) | Phase 17 | Guardrail is the canonical source; routes no longer need inline inserts |

**Deprecated/outdated:**
- Inline `rfp_agent_sessions` inserts in routes: Once wrapped, remove them — they are replaced by the guardrail's `recordCost()` call. Keep INSERT code ONLY if a route somehow cannot use the wrapper (none found).

---

## Open Questions

1. **Scoring cron: per-org or global budget check?**
   - What we know: `scoreNewOpportunitiesForAllActiveOrgs` loops over all active orgs. Each org's AI summary calls should check that org's budget.
   - What's unclear: Should the cron silently SKIP an over-budget org (log + continue to next org) or abort the entire cron run?
   - Recommendation: Silent skip + log. The cron should not fail for other orgs because one org hit their limit. Pattern: `try { await guardedLLMCall(orgId, ...) } catch (err) { if (err instanceof BudgetExceededError) { log + continue } else throw }`.

2. **quick-import (lib/rfp/import/extract.ts) attribution**
   - What we know: No org_id is available at extract time. The call costs ~$0.002.
   - Recommendation: Defer. Document as a known gap. If org_id becomes available at call time in a later phase, add guardrail then.

3. **naics-suggest budget attribution: which org?**
   - What we know: The route is auth-gated but not org-scoped. The user calling it may belong to multiple orgs. There is no `org_id` in the request body today.
   - Recommendation: For Phase 17, the naics-suggest route should accept an optional `org_id` in the body. If provided and the user is a member, charge the budget. If absent, skip the budget check (acceptable for a $0.003 onboarding call). Add `org_id?: string` to the request schema.

---

## Sources

### Primary (HIGH confidence — code verified in repo)

- `supabase/migrations/20260606_rfp_entitlements.sql` — exact column names and types for rfp_entitlements
- `supabase/migrations/20260509_rfp_schema.sql` — rfp_agent_sessions table definition (org_id, cost_usd, tokens_in, tokens_out, model, agent, created_at)
- `supabase/migrations/20260522_rfp_status_and_agent_check_drift.sql` — agent CHECK constraint dropped; any string label is now valid
- `lib/supabase/database.types.ts` — confirms rfp_entitlements Row shape (no monthly_ai_budget_usd yet), rfp_agent_sessions Row shape, rfp_opp_matches shape
- `lib/rfp/draft/generate.ts`, `lib/rfp/review/generate.ts`, `lib/rfp/voice/extract.ts`, `lib/rfp/vault/embed.ts`, `lib/rfp/vault/expand.ts`, `lib/rfp/naics/suggest.ts`, `lib/rfp/scoring/summary.ts`, `lib/rfp/import/extract.ts` — all LLM call sites confirmed with SDK version, model, token extraction pattern
- `app/api/rfp/draft/route.ts`, `app/api/rfp/proposals/[proposalId]/review/route.ts`, `app/api/rfp/orgs/[orgId]/voice/train/route.ts`, `app/api/rfp/orgs/[orgId]/vault/upload/route.ts`, `app/api/rfp/orgs/[orgId]/vault/from-description/route.ts` — confirmed inline rfp_agent_sessions inserts
- `package.json` — `@anthropic-ai/sdk ^0.67.0`, `openai ^6.5.0`
- `lib/billing/usage-guard.ts`, `lib/ai/quota-manager.ts` — non-RFP quota system confirmed separate; RFP guardrail must NOT cross-import these

### Secondary (MEDIUM confidence — verified by grep/code inspection)

- `lib/rfp/admin-metrics.ts` — confirms `SUM(cost_usd)` from rfp_agent_sessions is already used for admin reporting; same query pattern is valid for budget check
- `app/api/orgs/naics-suggest/route.ts` — confirmed no rfp_agent_sessions insert; confirmed no org_id in request body today

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all SDKs already in repo; no new packages needed
- Schema: HIGH — rfp_entitlements and rfp_agent_sessions both confirmed in live DB via Phase 14 verification
- Architecture / wrapper pattern: HIGH — all 9 call sites inventoried from code; token extraction patterns confirmed from existing call sites
- Pitfalls: HIGH — double-counting, null handling, calendar month boundary all confirmed from reading actual code
- Cron scoring integration: MEDIUM — summary.ts return type change is a refactor; behavior is straightforward but requires careful execution to avoid breaking scoring display

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (stable — no external dependencies changing)
