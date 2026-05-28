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
  runStateCityIngest,
  type StateCityIngestResult,
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const results = await runStateCityIngest();
    const totals = results.reduce<IngestTotals>(
      (acc: IngestTotals, r: StateCityIngestResult) => {
        acc.fetched += r.fetched;
        acc.upserted += r.upserted;
        acc.errors += r.errors.length;
        return acc;
      },
      { fetched: 0, upserted: 0, errors: 0 }
    );

    // Hand off to Phase 05-03 scoring. Use the upserted_ids surfaced by the
    // state/city orchestrator (StateCityIngestResult.upserted_ids, added in
    // Plan 05-02). Scoring failure is non-fatal: ingest already landed.
    const upsertedIds = results.flatMap((r) => r.upserted_ids);
    let scored: { scored: number; orgs: number } | { error: string } = {
      scored: 0,
      orgs: 0,
    };
    try {
      scored = await scoreNewOpportunitiesForAllActiveOrgs(upsertedIds);
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
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: duration_ms,
      status: totals.errors > 0 || scoringFailed ? "warning" : "success",
      result: {
        total_fetched: totals.fetched,
        total_upserted: totals.upserted,
        total_errors: totals.errors,
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
      ok: true,
      results,
      totals,
      scored,
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

export function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
