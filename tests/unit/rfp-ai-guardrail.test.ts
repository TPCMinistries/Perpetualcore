import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for lib/rfp/ai/guardrail.ts (BILL-04 — Phase 17).
 *
 * Proves the three Phase 17 success criteria with a mocked Supabase client:
 *   SC-1: $0 budget blocks guardedLLMCall; fn() is NEVER invoked (zero token usage).
 *   SC-2: A successful call records exactly one rfp_agent_sessions insert with the
 *         correct cost, org_id, and agent.
 *   SC-3: Cumulative spend already at the limit blocks the next call (BudgetExceededError,
 *         fn not called).
 *
 * Additional guards:
 *   NULL limit = unlimited: NULL monthly_ai_budget_usd must resolve, NOT block.
 *   budgetExceededResponse maps to 402: the helper returns status 402 with the
 *         error:"budget_exceeded" body and includes limit_usd + spent_usd.
 *
 * No real network — createAdminClient is mocked via vi.mock.
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface EntitlementRow {
  monthly_ai_budget_usd: number | null;
}

interface SessionRow {
  cost_usd: number | string | null;
}

// ── Mock factory ─────────────────────────────────────────────────────────────

/**
 * Captured inserts — cleared in beforeEach.
 * Each entry is the value passed to .insert() on rfp_agent_sessions.
 */
const capturedInserts: unknown[] = [];

/**
 * Build a mock Supabase admin client whose:
 *   - rfp_entitlements .select() yields { monthly_ai_budget_usd: limitUsd }
 *   - rfp_agent_sessions .select() yields rows that sum to spentUsd
 *   - rfp_agent_sessions .insert() records args into capturedInserts
 */
function makeMockAdminWithBudget({
  limitUsd,
  spentUsd,
}: {
  limitUsd: number | null;
  spentUsd: number;
}) {
  // Build session rows that sum to spentUsd.
  // Use two equal halves so the array is clearly >0 rows when spentUsd > 0.
  const sessionRows: SessionRow[] =
    spentUsd > 0 ? [{ cost_usd: spentUsd }] : [];

  return {
    from: vi.fn((table: string) => {
      if (table === "rfp_entitlements") {
        return {
          select: vi.fn((_cols: string) => ({
            eq: vi.fn((_col: string, _val: string) => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({
                  data: { monthly_ai_budget_usd: limitUsd } satisfies EntitlementRow,
                  error: null,
                })
              ),
            })),
          })),
        };
      }

      if (table === "rfp_agent_sessions") {
        return {
          select: vi.fn((_cols: string) => ({
            eq: vi.fn((_col: string, _val: string) => ({
              gte: vi.fn((_col2: string, _val2: string) => ({
                not: vi.fn((_col3: string, _op: string, _val3: null) =>
                  // returns<T>() is the final call; we return the rows here
                  ({
                    returns: vi.fn(() =>
                      Promise.resolve({ data: sessionRows, error: null })
                    ),
                  })
                ),
              })),
            })),
          })),
          insert: vi.fn((values: unknown) => {
            capturedInserts.push(values);
            return Promise.resolve({ data: null, error: null });
          }),
        };
      }

      // Fallback for any other table
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      };
    }),
  };
}

// ── Mock registration ────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

// ── Imports after mock ───────────────────────────────────────────────────────

import {
  guardedLLMCall,
  BudgetExceededError,
  budgetExceededResponse,
  type LLMCallMeta,
} from "@/lib/rfp/ai/guardrail";
import { createAdminClient } from "@/lib/supabase/server";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("guardedLLMCall — Phase 17 BILL-04 success criteria", () => {
  beforeEach(() => {
    capturedInserts.length = 0;
    vi.clearAllMocks();
  });

  // ── SC-1: $0 budget blocks; fn() is never called (zero token usage) ────────

  it("SC-1: $0 budget blocks and fn() is NEVER invoked (zero token usage)", async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeMockAdminWithBudget({ limitUsd: 0, spentUsd: 0 })
    );

    const fn = vi.fn<[], Promise<LLMCallMeta>>().mockResolvedValue({
      agent: "drafter_v1",
      model: "gpt-4o",
      tokensIn: 500,
      tokensOut: 1000,
      costUsd: 0.012,
    });

    await expect(guardedLLMCall("org-123", fn)).rejects.toBeInstanceOf(
      BudgetExceededError
    );

    // The LLM call must NEVER fire → zero token usage
    expect(fn).not.toHaveBeenCalled();
  });

  // ── SC-2: Successful call records cost in same lifecycle ───────────────────

  it("SC-2: successful call records one rfp_agent_sessions insert with correct cost", async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeMockAdminWithBudget({ limitUsd: 10.0, spentUsd: 0.5 })
    );

    const meta: LLMCallMeta = {
      agent: "drafter_v1",
      model: "gpt-4o",
      tokensIn: 500,
      tokensOut: 1000,
      costUsd: 0.012,
      proposalId: "prop-abc",
    };

    const fn = vi.fn<[], Promise<LLMCallMeta>>().mockResolvedValue(meta);

    const result = await guardedLLMCall("org-123", fn);

    // The call resolved
    expect(fn).toHaveBeenCalledOnce();
    expect(result).toEqual(meta);

    // Exactly one insert was captured
    expect(capturedInserts).toHaveLength(1);
    expect(capturedInserts[0]).toEqual(
      expect.objectContaining({
        org_id: "org-123",
        cost_usd: 0.012,
        agent: "drafter_v1",
      })
    );
  });

  // ── SC-3: Mid-session limit crossing blocks next call ─────────────────────

  it("SC-3: cumulative spend at limit blocks next call (BudgetExceededError, fn not called)", async () => {
    // Spend equals the limit → already at ceiling
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeMockAdminWithBudget({ limitUsd: 10.0, spentUsd: 10.0 })
    );

    const fn = vi.fn<[], Promise<LLMCallMeta>>().mockResolvedValue({
      agent: "drafter_v1",
      model: "gpt-4o",
      tokensIn: 500,
      tokensOut: 1000,
      costUsd: 0.012,
    });

    await expect(guardedLLMCall("org-123", fn)).rejects.toBeInstanceOf(
      BudgetExceededError
    );

    // fn was never invoked — no tokens consumed
    expect(fn).not.toHaveBeenCalled();
  });

  // ── NULL limit = unlimited (must NOT be treated as $0) ───────────────────

  it("NULL budget = unlimited: fn is called and cost is recorded", async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeMockAdminWithBudget({ limitUsd: null, spentUsd: 999 })
    );

    const meta: LLMCallMeta = {
      agent: "drafter_v1",
      model: "gpt-4o",
      tokensIn: 100,
      tokensOut: 200,
      costUsd: 0.003,
    };

    const fn = vi.fn<[], Promise<LLMCallMeta>>().mockResolvedValue(meta);

    // Must resolve — NULL is unlimited regardless of accumulated spend
    const result = await guardedLLMCall("org-null", fn);

    expect(fn).toHaveBeenCalledOnce();
    expect(result).toEqual(meta);

    // Cost row still recorded
    expect(capturedInserts).toHaveLength(1);
    expect(capturedInserts[0]).toEqual(
      expect.objectContaining({ org_id: "org-null", cost_usd: 0.003 })
    );
  });

  // ── budgetExceededResponse maps to HTTP 402 ───────────────────────────────

  it("budgetExceededResponse returns status 402 with error:budget_exceeded body", async () => {
    const err = new BudgetExceededError("org-123", 10.0, 10.0);
    const response = budgetExceededResponse(err);

    expect(response.status).toBe(402);

    const body = (await response.json()) as {
      error: string;
      limit_usd: number;
      spent_usd: number;
    };

    expect(body.error).toBe("budget_exceeded");
    expect(body.limit_usd).toBe(10.0);
    expect(body.spent_usd).toBe(10.0);
  });
});
