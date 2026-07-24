/**
 * Self-healing repair for org/opportunity scoring coverage.
 *
 * The scorer is idempotent for missing (opp, org) pairs, so this helper only
 * finds under-scored opportunities and hands those IDs back to the normal
 * scoring pipeline.
 */

import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import { scoreMissingOpportunitiesForAllActiveOrgsNoAi } from "@/lib/rfp/scoring/recompute";
import { createAdminClient } from "@/lib/supabase/server";

export const RFP_SCORE_COVERAGE_REPAIR_CRON = "rfp-score-coverage-repair";
export const DEFAULT_SCORE_COVERAGE_MAX_REPAIR = 500;
export const DEFAULT_SCORE_COVERAGE_SCAN_LIMIT = 20_000;

const PAGE_SIZE = 100;

interface OrgMembershipRow {
  org_id: string;
}

interface OrgRow {
  id: string;
}

interface OpportunityRow {
  id: string;
}

interface MatchRow {
  opp_id: string;
  org_id: string;
}

export interface ScoreCoverageRepairResult {
  ok: boolean;
  duration_ms: number;
  active_orgs: number;
  scanned_opportunities: number;
  under_scored_opportunities: number;
  repaired_opportunity_ids: string[];
  scored: { scored: number; orgs: number } | { error: string };
  warning: string | null;
}

export interface ScoreCoverageRepairInput {
  maxRepair?: number;
  scanLimit?: number;
  logExecution?: boolean;
  cronName?: string;
}

function clampPositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (!Number.isFinite(value) || !value || value <= 0) return fallback;
  return Math.min(Math.floor(value), max);
}

async function loadActiveOrgIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rfp_user_orgs")
    .select("org_id")
    .returns<OrgMembershipRow[]>();
  if (error) {
    throw new Error(`active_org_membership_query_failed: ${error.message}`);
  }

  const fromMembership = new Set((data ?? []).map((row) => row.org_id));
  if (fromMembership.size > 0) return [...fromMembership];

  const { data: orgs, error: orgError } = await admin
    .from("rfp_orgs")
    .select("id")
    .returns<OrgRow[]>();
  if (orgError) {
    throw new Error(`active_org_fallback_query_failed: ${orgError.message}`);
  }
  return [...new Set((orgs ?? []).map((row) => row.id))];
}

async function findUnderScoredOpportunityIds(params: {
  orgIds: string[];
  maxRepair: number;
  scanLimit: number;
}): Promise<{ ids: string[]; scanned: number }> {
  if (params.orgIds.length === 0) return { ids: [], scanned: 0 };

  const admin = createAdminClient();
  const out: string[] = [];
  let scanned = 0;

  for (let start = 0; start < params.scanLimit; start += PAGE_SIZE) {
    const remainingScan = params.scanLimit - start;
    const pageEnd = start + Math.min(PAGE_SIZE, remainingScan) - 1;
    const { data: opportunities, error: oppError } = await admin
      .from("rfp_opportunities")
      .select("id")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(start, pageEnd)
      .returns<OpportunityRow[]>();
    if (oppError) {
      throw new Error(`opportunity_scan_failed: ${oppError.message}`);
    }

    const oppIds = (opportunities ?? []).map((row) => row.id);
    if (oppIds.length === 0) break;
    scanned += oppIds.length;

    const { data: matches, error: matchError } = await admin
      .from("rfp_opp_matches")
      .select("opp_id, org_id")
      .in("opp_id", oppIds)
      .in("org_id", params.orgIds)
      .returns<MatchRow[]>();
    if (matchError) {
      throw new Error(`match_scan_failed: ${matchError.message}`);
    }

    const coveredOrgsByOpp = new Map<string, Set<string>>();
    for (const row of matches ?? []) {
      const existing = coveredOrgsByOpp.get(row.opp_id) ?? new Set<string>();
      existing.add(row.org_id);
      coveredOrgsByOpp.set(row.opp_id, existing);
    }

    for (const oppId of oppIds) {
      const covered = coveredOrgsByOpp.get(oppId)?.size ?? 0;
      if (covered < params.orgIds.length) {
        out.push(oppId);
        if (out.length >= params.maxRepair) {
          return { ids: out, scanned };
        }
      }
    }

    if (oppIds.length < PAGE_SIZE) break;
  }

  return { ids: out, scanned };
}

export async function runScoreCoverageRepair(
  input: ScoreCoverageRepairInput = {},
): Promise<ScoreCoverageRepairResult> {
  const startedAt = Date.now();
  const maxRepair = clampPositiveInt(
    input.maxRepair,
    DEFAULT_SCORE_COVERAGE_MAX_REPAIR,
    2_000,
  );
  const scanLimit = clampPositiveInt(
    input.scanLimit,
    DEFAULT_SCORE_COVERAGE_SCAN_LIMIT,
    100_000,
  );
  const cronName = input.cronName ?? RFP_SCORE_COVERAGE_REPAIR_CRON;
  const shouldLog = input.logExecution ?? false;

  try {
    const orgIds = await loadActiveOrgIds();
    const coverage = await findUnderScoredOpportunityIds({
      orgIds,
      maxRepair,
      scanLimit,
    });

    let scored: ScoreCoverageRepairResult["scored"] = {
      scored: 0,
      orgs: orgIds.length,
    };
    try {
      scored = await scoreMissingOpportunitiesForAllActiveOrgsNoAi(coverage.ids);
    } catch (err) {
      scored = { error: err instanceof Error ? err.message : String(err) };
    }

    const scoringFailed = "error" in scored;
    const durationMs = Date.now() - startedAt;

    if (shouldLog) {
      await logRfpCronExecution({
        cronName,
        durationMs,
        status: scoringFailed ? "warning" : "success",
        result: {
          active_orgs: orgIds.length,
          scanned_opportunities: coverage.scanned,
          under_scored_opportunities: coverage.ids.length,
          max_repair: maxRepair,
          scan_limit: scanLimit,
          scored: "scored" in scored ? scored.scored : null,
          scoring_error: "error" in scored ? scored.error.slice(0, 200) : null,
        },
        errors: scoringFailed
          ? { scoring: "error" in scored ? scored.error.slice(0, 200) : null }
          : null,
      });
    }

    return {
      ok: !scoringFailed,
      duration_ms: durationMs,
      active_orgs: orgIds.length,
      scanned_opportunities: coverage.scanned,
      under_scored_opportunities: coverage.ids.length,
      repaired_opportunity_ids: coverage.ids.slice(0, 25),
      scored,
      warning: scoringFailed
        ? "Coverage repair found gaps, but scoring failed. See cron log."
        : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    if (shouldLog) {
      await logRfpCronExecution({
        cronName,
        durationMs: Date.now() - startedAt,
        status: "error",
        errors: { message: message.slice(0, 200) },
      });
    }
    throw err;
  }
}
