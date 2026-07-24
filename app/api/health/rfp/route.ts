/**
 * GET /api/health/rfp
 *
 * Lightweight JSON status endpoint for UptimeRobot / Better Stack and
 * for quick sanity-checking from a terminal. Public — no auth — so it
 * can be polled. Intentionally returns *aggregate* counts, never row
 * contents, never per-org cost.
 *
 * Fields are intentionally permissive: a missing/null value means "the
 * underlying table or row doesn't exist yet" rather than leaking internals.
 * The top-level `status` is "ok" or "degraded" unless a load function
 * throws, in which case the endpoint returns 500.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { RFP_SOURCE_CATALOG } from "@/lib/rfp/source-catalog";
import { summarizeRfpCronErrors } from "@/lib/rfp/monitoring/health";
import { loadScraperHealth } from "@/lib/rfp/admin-metrics";
import {
  buildSourcePriorityQueue,
  buildSourceReadiness,
  summarizeSourceReadiness,
  sourceReadinessGap,
} from "@/lib/rfp/source-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPPORTUNITY_FRESH_HOURS = 72;
const CRON_FRESH_HOURS = 36;
const SCRAPER_SUCCESS_FRESH_HOURS = 36;
const CRON_ERROR_RATE_WARN_PERCENT = 10;
const AI_COST_24H_WARN_USD = 50;
const SOURCE_SCALE_WARN_COVERAGE_PERCENT = 2;

type CheckStatus = "ok" | "warn" | "fail";

interface HealthCheck {
  name: string;
  status: CheckStatus;
  detail: string;
}

interface QueryError {
  message?: string;
  code?: string;
}

interface QueryResultLike {
  error?: QueryError | null;
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / 3_600_000);
}

function formatHours(hours: number | null): string {
  if (hours === null) return "unknown";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function check(
  name: string,
  status: CheckStatus,
  detail: string,
): HealthCheck {
  return { name, status, detail };
}

function errorDetail(label: string, result: QueryResultLike): string | null {
  if (!result.error) return null;
  const suffix = result.error.code ? ` (${result.error.code})` : "";
  return `${label}: ${(result.error.message ?? "query failed").slice(0, 160)}${suffix}`;
}

export async function GET(): Promise<NextResponse> {
  try {
    const admin = createAdminClient();
    const dayAgo = isoHoursAgo(24);

    const [
      orgs,
      proposals,
      opportunities,
      lastCron,
      recentCrons,
      lastScraperSuccess,
      lastOpp,
      openDrift,
      cost24hRows,
      memberships,
      matches,
      canonicalAliases,
      canonicals,
      enrichments,
    ] = await Promise.all([
      admin.from("rfp_orgs").select("id", { count: "exact", head: true }),
      admin.from("rfp_proposals").select("id", { count: "exact", head: true }),
      admin
        .from("rfp_opportunities")
        .select("id", { count: "exact", head: true }),
      admin
        .from("cron_executions")
        .select("cron_name, executed_at, status")
        .ilike("cron_name", "%rfp%")
        .order("executed_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ cron_name: string; executed_at: string; status: string | null }>(),
      admin
        .from("cron_executions")
        .select("cron_name, executed_at, status")
        .ilike("cron_name", "%rfp%")
        .gte("executed_at", dayAgo)
        .returns<
          { cron_name: string; executed_at: string | null; status: string | null }[]
        >(),
      admin
        .from("rfp_source_baseline")
        .select("source, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ source: string; recorded_at: string }>(),
      admin
        .from("rfp_opportunities")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>(),
      admin
        .from("rfp_source_drift")
        .select("id", { count: "exact", head: true })
        .is("resolved_at", null),
      admin
        .from("rfp_agent_sessions")
        .select("cost_usd")
        .gte("created_at", dayAgo)
        .returns<{ cost_usd: number | string | null }[]>(),
      admin.from("rfp_user_orgs").select("org_id").returns<{ org_id: string }[]>(),
      admin.from("rfp_opp_matches").select("opp_id", { count: "exact", head: true }),
      admin
        .from("rfp_opportunity_aliases")
        .select("opp_id", { count: "exact", head: true }),
      admin
        .from("rfp_opportunity_canonicals")
        .select("id", { count: "exact", head: true }),
      admin
        .from("rfp_opportunity_enrichments")
        .select("opp_id", { count: "exact", head: true }),
    ]);

    const dbErrors = [
      errorDetail("rfp_orgs", orgs),
      errorDetail("rfp_proposals", proposals),
      errorDetail("rfp_opportunities.count", opportunities),
      errorDetail("cron_executions.latest", lastCron),
      errorDetail("cron_executions.recent", recentCrons),
      errorDetail("rfp_source_baseline.latest", lastScraperSuccess),
      errorDetail("rfp_opportunities.latest", lastOpp),
      errorDetail("rfp_source_drift", openDrift),
      errorDetail("rfp_agent_sessions.cost_24h", cost24hRows),
      errorDetail("rfp_user_orgs.active_orgs", memberships),
      errorDetail("rfp_opp_matches.count", matches),
      errorDetail("rfp_opportunity_aliases.count", canonicalAliases),
      errorDetail("rfp_opportunity_canonicals.count", canonicals),
      errorDetail("rfp_opportunity_enrichments.count", enrichments),
    ].filter((row): row is string => Boolean(row));

    const ai_cost_24h_usd = (cost24hRows.data ?? []).reduce(
      (sum, r) => sum + toNum(r.cost_usd),
      0,
    );
    const cronErrorSummary = summarizeRfpCronErrors(recentCrons.data ?? []);
    const lastOppAgeHours = hoursSince(lastOpp.data?.created_at);
    const lastCronAgeHours = hoursSince(lastCron.data?.executed_at);
    const lastScraperSuccessAgeHours = hoursSince(lastScraperSuccess.data?.recorded_at);
    const lastCronStatus = lastCron.data?.status ?? null;
    const activeOrgCount = new Set((memberships.data ?? []).map((row) => row.org_id)).size;
    const opportunityCount = opportunities.count ?? 0;
    const matchCount = matches.count ?? 0;
    const expectedMatches = opportunityCount * activeOrgCount;
    const scoringCoverage =
      expectedMatches > 0 ? Math.min(100, (matchCount / expectedMatches) * 100) : null;
    const canonicalAliasCount = canonicalAliases.count ?? 0;
    const canonicalCount = canonicals.count ?? 0;
    const canonicalCoverage =
      opportunityCount > 0
        ? Math.min(100, (canonicalAliasCount / opportunityCount) * 100)
        : null;
    const enrichmentCount = enrichments.count ?? 0;
    const enrichmentCoverage =
      opportunityCount > 0
        ? Math.min(100, (enrichmentCount / opportunityCount) * 100)
        : null;
    const sourceTargetIndexedEstimate = RFP_SOURCE_CATALOG.reduce(
      (sum, source) => sum + (source.targetIndexedEstimate ?? 0),
      0,
    );
    const sourceScaleCoverage =
      sourceTargetIndexedEstimate > 0
        ? Math.min(100, (opportunityCount / sourceTargetIndexedEstimate) * 100)
        : null;
    const sourceReadiness = buildSourceReadiness(await loadScraperHealth());
    const sourceReadinessSummary = summarizeSourceReadiness(sourceReadiness);
    const sourcePriorityQueue = buildSourcePriorityQueue(sourceReadiness, 5).map(
      (source) => ({
        source: source.source,
        label: source.label,
        category: source.category,
        status: source.effectiveStatus,
        priority: source.priority,
        geography: source.geography,
        ingest_mode: source.ingestMode,
        indexed: source.indexed,
        target_indexed_estimate: source.targetIndexedEstimate,
        gap: sourceReadinessGap(source),
        open_drift_events: source.openDrift,
        next_step: source.nextStep,
      }),
    );
    const liveSourceCount = RFP_SOURCE_CATALOG.filter(
      (source) => source.status === "live",
    ).length;
    const plannedSourceCount = RFP_SOURCE_CATALOG.filter(
      (source) => source.status === "planned",
    ).length;
    const blockedSourceCount = RFP_SOURCE_CATALOG.filter(
      (source) => source.status === "blocked",
    ).length;

    const checks: HealthCheck[] = [
      check(
        "database",
        dbErrors.length === 0 ? "ok" : "fail",
        dbErrors.length === 0
          ? "Admin client queries completed for RFP aggregate tables."
          : `Supabase query errors: ${dbErrors.slice(0, 3).join("; ")}${dbErrors.length > 3 ? `; +${dbErrors.length - 3} more` : ""}.`,
      ),
      check(
        "opportunity_inventory",
        opportunities.error
          ? "fail"
          : (opportunities.count ?? 0) > 0
            ? "ok"
            : "warn",
        opportunities.error
          ? "Opportunity count query failed."
          : `${opportunities.count ?? 0} opportunities indexed.`,
      ),
      check(
        "source_scale",
        opportunities.error
          ? "fail"
          : sourceScaleCoverage !== null &&
              sourceScaleCoverage >= SOURCE_SCALE_WARN_COVERAGE_PERCENT
            ? "ok"
            : "warn",
        opportunities.error
          ? "Opportunity scale query failed."
          : sourceScaleCoverage === null
            ? "No source catalog target estimate configured."
            : `${opportunityCount.toLocaleString("en-US")} / ${sourceTargetIndexedEstimate.toLocaleString("en-US")} estimated catalog records (${sourceScaleCoverage.toFixed(1)}%).`,
      ),
      check(
        "opportunity_freshness",
        lastOpp.error
          ? "fail"
          : lastOppAgeHours === null
          ? "warn"
          : lastOppAgeHours <= OPPORTUNITY_FRESH_HOURS
            ? "ok"
            : "warn",
        lastOpp.error
          ? "Latest opportunity query failed."
          : lastOppAgeHours === null
          ? "No opportunity ingestion timestamp found."
          : `Latest opportunity ingested ${formatHours(lastOppAgeHours)} ago.`,
      ),
      check(
        "scraper_last_success",
        lastScraperSuccess.error
          ? "fail"
          : lastScraperSuccessAgeHours === null
            ? "warn"
            : lastScraperSuccessAgeHours <= SCRAPER_SUCCESS_FRESH_HOURS
              ? "ok"
              : "warn",
        lastScraperSuccess.error
          ? "Latest source baseline query failed."
          : lastScraperSuccessAgeHours === null
            ? "No successful scraper baseline found."
            : `Latest successful scraper baseline for ${lastScraperSuccess.data?.source ?? "unknown"} recorded ${formatHours(lastScraperSuccessAgeHours)} ago.`,
      ),
      check(
        "scoring_coverage",
        memberships.error || matches.error || opportunities.error
          ? "fail"
          : expectedMatches === 0
            ? "warn"
            : matchCount >= expectedMatches
              ? "ok"
              : "warn",
        memberships.error || matches.error || opportunities.error
          ? "Scoring coverage query failed."
          : expectedMatches === 0
            ? "No active org/opportunity scoring target found."
            : `${matchCount.toLocaleString("en-US")} / ${expectedMatches.toLocaleString("en-US")} expected org-opportunity matches (${(scoringCoverage ?? 0).toFixed(1)}%).`,
      ),
      check(
        "canonical_coverage",
        canonicalAliases.error || canonicals.error || opportunities.error
          ? "fail"
          : opportunityCount === 0
            ? "warn"
            : canonicalAliasCount >= opportunityCount
              ? "ok"
              : "warn",
        canonicalAliases.error || canonicals.error || opportunities.error
          ? "Canonical coverage query failed."
          : opportunityCount === 0
            ? "No opportunity canonical target found."
            : `${canonicalAliasCount.toLocaleString("en-US")} / ${opportunityCount.toLocaleString("en-US")} opportunities have canonical aliases (${(canonicalCoverage ?? 0).toFixed(1)}%) across ${canonicalCount.toLocaleString("en-US")} canonical clusters.`,
      ),
      check(
        "enrichment_coverage",
        enrichments.error || opportunities.error
          ? "fail"
          : opportunityCount === 0
            ? "warn"
            : enrichmentCount >= opportunityCount
              ? "ok"
              : "warn",
        enrichments.error || opportunities.error
          ? "Enrichment coverage query failed."
          : opportunityCount === 0
            ? "No opportunity enrichment target found."
            : `${enrichmentCount.toLocaleString("en-US")} / ${opportunityCount.toLocaleString("en-US")} opportunities have structured source intelligence (${(enrichmentCoverage ?? 0).toFixed(1)}%).`,
      ),
      check(
        "cron_freshness",
        lastCron.error
          ? "fail"
          : lastCronAgeHours === null
          ? "warn"
          : lastCronAgeHours <= CRON_FRESH_HOURS
            ? "ok"
            : "warn",
        lastCron.error
          ? "Latest cron query failed."
          : lastCronAgeHours === null
          ? "No RFP cron execution found."
          : `Latest RFP cron ran ${formatHours(lastCronAgeHours)} ago.`,
      ),
      check(
        "cron_error_rate_24h",
        recentCrons.error
          ? "fail"
          : cronErrorSummary.error_rate_percent === null
            ? "warn"
            : cronErrorSummary.error_rate_percent <= CRON_ERROR_RATE_WARN_PERCENT
              ? "ok"
              : "warn",
        recentCrons.error
          ? "Recent cron execution query failed."
          : cronErrorSummary.error_rate_percent === null
            ? "No RFP cron executions found in the last 24h."
            : `${cronErrorSummary.failures} failed / ${cronErrorSummary.total} RFP cron run${cronErrorSummary.total === 1 ? "" : "s"} in the last 24h (${cronErrorSummary.error_rate_percent.toFixed(1)}%).`,
      ),
      check(
        "cron_status",
        lastCron.error
          ? "fail"
          : lastCronStatus === null
          ? "warn"
          : lastCronStatus === "success" || lastCronStatus === "ok"
            ? "ok"
            : "warn",
        lastCron.error
          ? "Latest cron status query failed."
          : lastCronStatus
          ? `Latest RFP cron status: ${lastCronStatus}.`
          : "Latest RFP cron status unavailable.",
      ),
      check(
        "cron_auth_config",
        process.env.CRON_SECRET ? "ok" : "warn",
        process.env.CRON_SECRET
          ? "Cron bearer secret is configured in this runtime."
          : "CRON_SECRET is missing; scheduled cron calls cannot authenticate.",
      ),
      check(
        "source_drift",
        openDrift.error
          ? "fail"
          : (openDrift.count ?? 0) === 0
            ? "ok"
            : "warn",
        openDrift.error
          ? "Source drift query failed."
          : `${openDrift.count ?? 0} unresolved source drift event${openDrift.count === 1 ? "" : "s"}.`,
      ),
      check(
        "ai_spend_24h",
        cost24hRows.error
          ? "fail"
          : ai_cost_24h_usd <= AI_COST_24H_WARN_USD
            ? "ok"
            : "warn",
        cost24hRows.error
          ? "RFP AI session cost query failed."
          : `$${ai_cost_24h_usd.toFixed(4)} spent on RFP AI sessions in the last 24h.`,
      ),
      check(
        "ai_provider_config",
        process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY ? "ok" : "warn",
        process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY
          ? "At least one AI provider key is configured."
          : "No AI provider key detected in this runtime.",
      ),
    ];
    const degraded = checks.some((row) => row.status !== "ok");

    return NextResponse.json({
      status: degraded ? "degraded" : "ok",
      service: "rfp_engine",
      generated_at: new Date().toISOString(),
      thresholds: {
        opportunity_fresh_hours: OPPORTUNITY_FRESH_HOURS,
        cron_fresh_hours: CRON_FRESH_HOURS,
        scraper_success_fresh_hours: SCRAPER_SUCCESS_FRESH_HOURS,
        cron_error_rate_warn_percent: CRON_ERROR_RATE_WARN_PERCENT,
        ai_cost_24h_warn_usd: AI_COST_24H_WARN_USD,
        source_scale_warn_coverage_percent: SOURCE_SCALE_WARN_COVERAGE_PERCENT,
      },
      totals: {
        orgs: orgs.count ?? 0,
        active_orgs: activeOrgCount,
        proposals: proposals.count ?? 0,
        opportunities: opportunityCount,
        matches: matchCount,
        expected_matches: expectedMatches,
        scoring_coverage_percent:
          scoringCoverage === null ? null : Math.round(scoringCoverage * 10) / 10,
        canonical_aliases: canonicalAliasCount,
        canonical_clusters: canonicalCount,
        canonical_coverage_percent:
          canonicalCoverage === null ? null : Math.round(canonicalCoverage * 10) / 10,
        enrichments: enrichmentCount,
        enrichment_coverage_percent:
          enrichmentCoverage === null ? null : Math.round(enrichmentCoverage * 10) / 10,
        source_catalog_target_estimate: sourceTargetIndexedEstimate,
        source_scale_coverage_percent:
          sourceScaleCoverage === null
            ? null
            : Math.round(sourceScaleCoverage * 10) / 10,
        source_catalog_live: liveSourceCount,
        source_catalog_planned: plannedSourceCount,
        source_catalog_blocked: blockedSourceCount,
        source_readiness_p0_remaining: sourceReadinessSummary.p0Remaining,
      },
      source_priority_queue: sourcePriorityQueue,
      last_cron: lastCron.data
        ? {
            name: lastCron.data.cron_name,
            executed_at: lastCron.data.executed_at,
            status: lastCron.data.status,
          }
        : null,
      scraper_last_success: lastScraperSuccess.data
        ? {
            source: lastScraperSuccess.data.source,
            recorded_at: lastScraperSuccess.data.recorded_at,
          }
        : null,
      cron_24h: {
        runs: cronErrorSummary.total,
        successes: cronErrorSummary.successes,
        warnings: cronErrorSummary.warnings,
        failures: cronErrorSummary.failures,
        error_rate: cronErrorSummary.error_rate,
        error_rate_percent: cronErrorSummary.error_rate_percent,
        latest_run_at: cronErrorSummary.latest_run_at,
        latest_success_at: cronErrorSummary.latest_success_at,
      },
      last_opportunity_ingested_at: lastOpp.data?.created_at ?? null,
      open_drift_events: openDrift.count ?? 0,
      ai_cost_24h_usd: Math.round(ai_cost_24h_usd * 10000) / 10000,
      database_errors: dbErrors,
      checks,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    return NextResponse.json(
      { status: "error", detail },
      { status: 500 },
    );
  }
}
