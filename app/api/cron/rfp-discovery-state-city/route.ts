/**
 * Vercel Cron — State/City RFP Discovery
 *
 * POST /api/cron/rfp-discovery-state-city
 *
 * Runs every 6 hours (offset +30m from the federal Discovery cron in plan 05-01)
 * to spread function-execution load across the hour.
 *
 * Auth: Bearer ${CRON_SECRET}
 * Returns: { ok, results, duration_ms }
 *
 * Pattern parity with `app/api/cron/heartbeat/route.ts`:
 *   - `runtime = 'nodejs'` (we use admin Supabase client + scraper fetches).
 *   - `dynamic = 'force-dynamic'` to opt out of any static caching.
 *   - 401 on bad bearer; 405 + Allow:POST on GET; 500 on unexpected throw
 *     (sanitized — we do NOT echo raw error stacks back to the caller).
 *
 * Side effects (delegated to `runStateCityIngest`):
 *   - Hits 4 external sources (NY State + 3 NYC) with 1 req/sec throttle each.
 *   - Upserts rfp_opportunities idempotently on (source, source_id).
 *   - Writes drift events to rfp_source_drift on parse / count / fetch failures.
 *   - Updates rfp_source_baseline rolling window on each successful run.
 *
 * This route never throws to the caller — failures are surfaced as drift rows
 * + per-source error arrays in the response body.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  isStateCityIngestSource,
  runStateCityIngest,
  type StateCityIngestResult,
  type StateCitySourceName,
} from "@/lib/rfp/ingest/run-state-city";
import { scoreNewOpportunitiesForAllActiveOrgs } from "@/lib/rfp/scoring/recompute";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";

interface IngestTotals {
  fetched: number;
  upserted: number;
  errors: number;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CRON_NAME = "rfp-discovery-state-city";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

/**
 * Optional `?source=a,b` scoping so vercel.json can stagger heavy sources
 * (NYS Contract Reporter pages ~35 requests; CA grants upserts ~2,000 rows)
 * into separate invocations that each stay well under the 300s ceiling.
 * No param = run every scraper (manual / legacy behaviour).
 */
function parseRequestedSources(request: NextRequest): {
  rawSources: string[];
  validSources: StateCitySourceName[];
  invalidSources: string[];
} {
  const raw =
    request.nextUrl.searchParams.get("source") ??
    request.nextUrl.searchParams.get("sources") ??
    "";
  const rawSources = raw
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean);
  const validSources: StateCitySourceName[] = [];
  const invalidSources: string[] = [];
  for (const source of rawSources) {
    if (isStateCityIngestSource(source)) validSources.push(source);
    else invalidSources.push(source);
  }
  return { rawSources, validSources: [...new Set(validSources)], invalidSources };
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { rawSources, validSources, invalidSources } =
    parseRequestedSources(request);

  try {
    if (invalidSources.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid state/city source",
          invalid_sources: invalidSources,
        },
        { status: 400 }
      );
    }

    const results = await runStateCityIngest({
      sources: validSources.length > 0 ? validSources : undefined,
    });
    const totals = results.reduce<IngestTotals>(
      (acc: IngestTotals, r: StateCityIngestResult) => {
        acc.fetched += r.fetched;
        acc.upserted += r.upserted;
        acc.errors += r.errors.length;
        return acc;
      },
      { fetched: 0, upserted: 0, errors: 0 }
    );

    // Scheduled discovery scores only rows created during this ingest run.
    // upserted_ids remains the all-touched set used by manual rerun recovery.
    // Scoring failure is non-fatal: ingest already landed.
    const scoringCandidateIds = results.flatMap(
      (r) => r.scoring_candidate_ids
    );
    let scored: { scored: number; orgs: number } | { error: string } = {
      scored: 0,
      orgs: 0,
    };
    try {
      scored =
        await scoreNewOpportunitiesForAllActiveOrgs(scoringCandidateIds);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(
        "[rfp-discovery-state-city] scoring failed (non-fatal):",
        message
      );
      scored = { error: message };
    }

    const duration_ms = Date.now() - startedAt;
    const scoringFailed = "error" in scored;
    const completedWithoutErrors = totals.errors === 0 && !scoringFailed;
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: duration_ms,
      status: completedWithoutErrors ? "success" : "warning",
      result: {
        total_fetched: totals.fetched,
        total_upserted: totals.upserted,
        total_errors: totals.errors,
        requested_sources: rawSources.length > 0 ? rawSources : null,
        scoring_candidates: scoringCandidateIds.length,
        scored: "scored" in scored ? scored.scored : null,
        scoring_error: "error" in scored ? scored.error.slice(0, 200) : null,
        sources: results.map((row) => ({
          source: row.source,
          fetched: row.fetched,
          upserted: row.upserted,
          errors: row.errors.length,
        })),
      },
      errors:
        totals.errors > 0 || scoringFailed
          ? {
              sources: results
                .filter((row) => row.errors.length > 0)
                .map((row) => ({
                  source: row.source,
                  errors: row.errors.slice(0, 5),
                })),
              scoring: "error" in scored ? scored.error.slice(0, 200) : null,
            }
          : null,
    });
    console.log(
      `[rfp-discovery-state-city] fetched=${totals.fetched} upserted=${totals.upserted} errors=${totals.errors} scored=${"scored" in scored ? scored.scored : "error"} duration=${duration_ms}ms`
    );

    return NextResponse.json({
      ok: completedWithoutErrors,
      results,
      totals,
      scored,
      requested_sources: rawSources.length > 0 ? rawSources : null,
      warning:
        completedWithoutErrors
          ? null
          : "Ingest completed with source or scoring errors. See results and cron log for details.",
      duration_ms,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: Date.now() - startedAt,
      status: "error",
      errors: { message: message.slice(0, 200) },
    });
    // Sanitize: log full detail server-side, return only the message to the caller.
    console.error("[rfp-discovery-state-city] fatal:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "ingest_failed",
        message,
        duration_ms: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCron(request);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (isAuthorized(request)) return runCron(request);
  return new NextResponse(
    JSON.stringify({ error: "Method not allowed. Use authenticated GET or POST." }),
    {
      status: 405,
      headers: {
        Allow: "GET, POST",
        "Content-Type": "application/json",
      },
    }
  );
}
