/**
 * lib/rfp/ai/guardrail.ts — Phase 17: Per-tenant AI cost guardrail
 *
 * Wraps every RFP-namespace LLM call:
 *   1. Checks org spend vs monthly_ai_budget_usd BEFORE calling fn()
 *   2. Records cost in rfp_agent_sessions AFTER a successful call
 *   3. Throws BudgetExceededError (never a bare 500) when over limit
 *
 * NULL monthly_ai_budget_usd = unlimited (all existing orgs remain unlimited).
 * Fail-CLOSED on DB read error: re-throw as normal Error → 500, never fail-open.
 *
 * Rates as of 2026-06; update RFP_MODEL_RATES here only.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class BudgetExceededError extends Error {
  readonly code = 'BUDGET_EXCEEDED' as const;
  readonly orgId: string;
  readonly spentUsd: number;
  readonly limitUsd: number;

  constructor(orgId: string, spentUsd: number, limitUsd: number) {
    super(
      `AI budget exceeded: $${spentUsd.toFixed(4)} spent of $${limitUsd.toFixed(2)} limit`
    );
    this.name = 'BudgetExceededError';
    this.orgId = orgId;
    this.spentUsd = spentUsd;
    this.limitUsd = limitUsd;
  }
}

// ---------------------------------------------------------------------------
// LLMCallMeta — returned by every wrapped fn()
// ---------------------------------------------------------------------------

export interface LLMCallMeta {
  /** Matches rfp_agent_sessions.agent values (e.g. "drafter_v1") */
  agent: string;
  /** Optional — set for proposal-scoped calls */
  proposalId?: string;
  /** Optional — pass through from lib function */
  sessionId?: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

// ---------------------------------------------------------------------------
// Canonical model rate map (rates as of 2026-06; update here only)
// ---------------------------------------------------------------------------

export const RFP_MODEL_RATES: Record<
  string,
  { inputPerM: number; outputPerM: number }
> = {
  'gpt-4o': { inputPerM: 2.5, outputPerM: 10.0 },
  'text-embedding-3-large': { inputPerM: 0.13, outputPerM: 0 },
  'claude-sonnet-4-5': { inputPerM: 3.0, outputPerM: 15.0 },
  'claude-haiku-4-5': { inputPerM: 0.25, outputPerM: 1.25 },
};

/**
 * Compute cost in USD given a model and token counts.
 * Returns 0 (with a console.warn) for unknown models so they never block a call.
 */
export function computeCostUsd(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  const rates = RFP_MODEL_RATES[model];
  if (!rates) {
    console.warn(
      `[guardrail] Unknown model "${model}" — cost recorded as $0. Add it to RFP_MODEL_RATES.`
    );
    return 0;
  }
  return (tokensIn / 1_000_000) * rates.inputPerM +
    (tokensOut / 1_000_000) * rates.outputPerM;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** Coerce a cost_usd value that may arrive as string | number | null → number */
function toNum(v: number | string | null | undefined): number {
  return Number(v) || 0;
}

// ---------------------------------------------------------------------------
// checkBudget — exported so unit tests can call it directly
// ---------------------------------------------------------------------------

/**
 * Throws BudgetExceededError when the org has exceeded its monthly spend limit.
 * Returns void when the org is under-limit or has no limit set (NULL = unlimited).
 * Re-throws as a normal Error (→ 500) on any DB read failure (fail-CLOSED).
 */
export async function checkBudget(orgId: string): Promise<void> {
  const admin = createAdminClient();

  // Read the spend limit (NULL = unlimited)
  const { data: ent, error: entError } = await admin
    .from('rfp_entitlements')
    .select('monthly_ai_budget_usd')
    .eq('org_id', orgId)
    .maybeSingle();

  if (entError) {
    throw new Error(
      `[guardrail] DB error reading entitlements for org ${orgId}: ${entError.message}`
    );
  }

  // Explicit null guard — do NOT let NULL coerce to 0
  const limitUsd: number | null =
    (ent as { monthly_ai_budget_usd: number | null } | null)
      ?.monthly_ai_budget_usd ?? null;

  if (limitUsd === null || limitUsd === undefined) return; // NULL = unlimited

  // Calendar-month start in UTC
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  ).toISOString();

  const { data: rows, error: sessError } = await admin
    .from('rfp_agent_sessions')
    .select('cost_usd')
    .eq('org_id', orgId)
    .gte('created_at', monthStart)
    .not('cost_usd', 'is', null)
    .returns<{ cost_usd: number | string | null }[]>();

  if (sessError) {
    throw new Error(
      `[guardrail] DB error reading session spend for org ${orgId}: ${sessError.message}`
    );
  }

  const spentUsd = (rows ?? []).reduce(
    (sum: number, r: { cost_usd: number | string | null }) =>
      sum + toNum(r.cost_usd),
    0
  );

  if (spentUsd >= limitUsd) {
    throw new BudgetExceededError(orgId, spentUsd, limitUsd);
  }
}

// ---------------------------------------------------------------------------
// recordCost — exported so cron callers can use it directly if needed
// ---------------------------------------------------------------------------

/** Insert one rfp_agent_sessions row for the completed call. Non-fatal if it fails. */
export async function recordCost(
  orgId: string,
  meta: LLMCallMeta
): Promise<void> {
  const admin = createAdminClient();
  await admin.from('rfp_agent_sessions').insert({
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

// ---------------------------------------------------------------------------
// guardedLLMCall — the primary public API
// ---------------------------------------------------------------------------

/**
 * Run fn() only if orgId has remaining AI budget.
 * Records cost in rfp_agent_sessions within the same lifecycle.
 * Throws BudgetExceededError (not 500) when over limit.
 *
 * @param orgId  — the rfp_orgs.id for the tenant
 * @param fn     — async function that makes the LLM call; MUST return LLMCallMeta
 */
export async function guardedLLMCall<T extends LLMCallMeta>(
  orgId: string,
  fn: () => Promise<T>
): Promise<T> {
  // 1. Budget preflight — throws BudgetExceededError if over; re-throws DB errors as 500
  await checkBudget(orgId);

  // 2. Fire the LLM call (fn() is NEVER reached when checkBudget throws)
  const result = await fn();

  // 3. Record cost — non-fatal: swallow insert errors so the user still gets their draft
  await recordCost(orgId, result).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[guardrail] cost record failed (non-fatal):', msg);
  });

  return result;
}

// ---------------------------------------------------------------------------
// budgetExceededResponse — 402 HTTP helper for route handlers
// ---------------------------------------------------------------------------

/**
 * Translate a BudgetExceededError into an actionable 402 JSON response.
 * Every LLM-backed route wraps guardedLLMCall in try/catch and calls this helper.
 *
 * @example
 * } catch (err) {
 *   if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
 *   // ... existing error handling
 * }
 */
export function budgetExceededResponse(err: BudgetExceededError): NextResponse {
  return NextResponse.json(
    {
      error: 'budget_exceeded',
      message: `Your organization's AI budget ($${err.limitUsd.toFixed(2)}/mo) has been reached. Contact your administrator to increase the limit or wait until next month.`,
      spent_usd: err.spentUsd,
      limit_usd: err.limitUsd,
    },
    { status: 402 }
  );
}
