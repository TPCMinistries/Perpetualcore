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
import { runStateCityIngest } from "@/lib/rfp/ingest/run-state-city";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const results = await runStateCityIngest();
    const totals = results.reduce(
      (acc, r) => {
        acc.fetched += r.fetched;
        acc.upserted += r.upserted;
        acc.errors += r.errors.length;
        return acc;
      },
      { fetched: 0, upserted: 0, errors: 0 }
    );

    const duration_ms = Date.now() - startedAt;
    console.log(
      `[rfp-discovery-state-city] fetched=${totals.fetched} upserted=${totals.upserted} errors=${totals.errors} duration=${duration_ms}ms`
    );

    return NextResponse.json({
      ok: true,
      results,
      totals,
      duration_ms,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
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
