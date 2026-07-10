/**
 * Deep Research — run orchestrator.
 *
 * One call to runDeepResearch() executes 1..N verticals sequentially for an
 * org: plan → agentic web-search session → ingest verified leads → kick a
 * fire-and-forget rescore so the new rows rank in the feed.
 *
 * Serverless budget: one vertical ≈ 60–150s, so route callers should run ONE
 * vertical per request (pass `verticalKey`) and iterate client-side. Calling
 * with no verticalKey runs the whole plan — only safe from long-lived
 * contexts (scripts, background jobs).
 *
 * Cost: every agent session goes through the Phase 17 guardrail
 * (guardedLLMCall), so per-org monthly AI budgets apply and every session is
 * recorded in rfp_agent_sessions under agent='research_v1'. Web-search usage
 * ($10/1K searches) is folded into costUsd on top of token cost.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { loadLatestProfile, recomputeAllForOrg } from "@/lib/rfp/scoring/recompute";
import { computeCostUsd, guardedLLMCall } from "@/lib/rfp/ai/guardrail";
import { buildResearchPlan, type ResearchPlanInput } from "./plan";
import { runVerticalAgent, WEB_SEARCH_USD_PER_SEARCH } from "./agent";
import { ingestLeads } from "./ingest";
import type {
  ResearchRunSummary,
  ResearchVertical,
  VerticalRunResult,
} from "./types";

const AGENT_NAME = "research_v1";
const MODEL = "claude-sonnet-4-5-20250929";

/** Load org + profile and build the org's research plan. */
export async function loadResearchPlan(
  orgId: string
): Promise<{ plan: ResearchVertical[]; planInput: ResearchPlanInput } | null> {
  const admin = createAdminClient();
  const [{ data: orgRow }, org] = await Promise.all([
    admin
      .from("rfp_orgs")
      .select("id, name, type, capacity_summary")
      .eq("id", orgId)
      .maybeSingle(),
    loadLatestProfile(orgId),
  ]);
  if (!orgRow) return null;

  const profile = org.profile;
  const planInput: ResearchPlanInput = {
    orgName: orgRow.name as string,
    orgType: org.type,
    capacityKeywords: profile?.capacity_keywords ?? [],
    geoFocus: profile?.geo_focus?.length ? profile.geo_focus : ["US"],
    awardBand: profile?.typical_award_band ?? null,
    capacitySummary: (orgRow.capacity_summary as string | null) ?? null,
  };

  // No profile keywords → the agent would search for nothing in particular.
  // Callers should surface "complete your capture profile first".
  if (planInput.capacityKeywords.length === 0) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  return { plan: buildResearchPlan(planInput, todayIso), planInput };
}

/** Geography a vertical's leads should be scored under. */
function verticalGeo(key: string, geoFocus: string[]): string {
  const subUs = geoFocus.find((g) => g !== "US");
  if (key === "federal") return "US";
  return subUs ?? "US";
}

async function runOneVertical(
  orgId: string,
  vertical: ResearchVertical,
  geoFocus: string[]
): Promise<VerticalRunResult> {
  const result: VerticalRunResult = {
    vertical: vertical.key,
    leads: [],
    ingested: 0,
    opportunity_ids: [],
    searches_used: 0,
    cost_usd: 0,
    errors: [],
  };

  // guardedLLMCall: budget preflight + rfp_agent_sessions cost record.
  const agentOut = await guardedLLMCall(orgId, async () => {
    const out = await runVerticalAgent(vertical);
    const costUsd =
      computeCostUsd(MODEL, out.tokensIn, out.tokensOut) +
      out.searchesUsed * WEB_SEARCH_USD_PER_SEARCH;
    return {
      agent: AGENT_NAME,
      sessionId: `${AGENT_NAME}_${vertical.key}_${Date.now().toString(36)}`,
      model: MODEL,
      tokensIn: out.tokensIn,
      tokensOut: out.tokensOut,
      costUsd,
      out,
    };
  });

  result.cost_usd = agentOut.costUsd;
  result.searches_used = agentOut.out.searchesUsed;
  result.leads = agentOut.out.leads;
  if (agentOut.out.error) result.errors.push(agentOut.out.error);

  if (result.leads.length > 0) {
    try {
      const ingest = await ingestLeads(
        result.leads,
        verticalGeo(vertical.key, geoFocus)
      );
      result.ingested = ingest.ingested;
      result.opportunity_ids = ingest.opportunityIds;
    } catch (err) {
      result.errors.push(
        err instanceof Error ? err.message.slice(0, 300) : "ingest failed"
      );
    }
  }

  return result;
}

export interface DeepResearchOptions {
  /** Run only this vertical (route callers should always set this). */
  verticalKey?: string;
  /** Skip the trailing fire-and-forget rescore (e.g. mid-sequence). */
  skipRescore?: boolean;
}

export async function runDeepResearch(
  orgId: string,
  opts: DeepResearchOptions = {}
): Promise<ResearchRunSummary> {
  const loaded = await loadResearchPlan(orgId);
  if (!loaded) {
    throw new Error("research_plan_unavailable: org missing or capture profile empty");
  }
  const { plan, planInput } = loaded;

  const verticals = opts.verticalKey
    ? plan.filter((v) => v.key === opts.verticalKey)
    : plan;
  if (verticals.length === 0) {
    throw new Error(`unknown_vertical: ${opts.verticalKey}`);
  }

  const results: VerticalRunResult[] = [];
  for (const vertical of verticals) {
    results.push(await runOneVertical(orgId, vertical, planInput.geoFocus));
  }

  // Rescore so new rows rank immediately. Fire-and-forget — idempotent and
  // resumable, same pattern as the recompute-scores route.
  if (!opts.skipRescore) {
    void recomputeAllForOrg(orgId, { aiSummaries: false }).catch((err) => {
      console.warn(
        "[research] post-ingest rescore failed:",
        err instanceof Error ? err.message.slice(0, 200) : "unknown"
      );
    });
  }

  return {
    org_id: orgId,
    verticals_run: results.length,
    leads_found: results.reduce((n, r) => n + r.leads.length, 0),
    leads_ingested: results.reduce((n, r) => n + r.ingested, 0),
    total_cost_usd: Number(
      results.reduce((n, r) => n + r.cost_usd, 0).toFixed(4)
    ),
    results,
  };
}
