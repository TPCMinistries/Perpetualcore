/**
 * RFP Discovery — Federal Sources Cron
 *
 * POST /api/cron/rfp-discovery-federal
 *
 * Runs every 6 hours (Vercel Cron, see vercel.json) to ingest opportunities
 * from SAM.gov, Grants.gov, Simpler.Grants.gov, and SBIR.gov. Calls
 * `runFederalIngest()` (lib/rfp/ingest/run.ts) which fans out to per-source
 * fetchers via Promise.allSettled, normalizes records, and upserts onto
 * `rfp_opportunities` keyed on (source, source_id) — idempotent on re-run.
 *
 * Auth: Bearer ${CRON_SECRET}.
 *
 * Failure model: the orchestrator never throws under normal operation —
 * missing API keys / endpoint outages SKIP the affected source while the
 * others continue. We still wrap the call in try/catch as a defense-in-depth
 * measure and return a sanitized 500 (no stack traces) on the unexpected case.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  runFederalIngest,
  type IngestRunResult,
} from "@/lib/rfp/ingest/run";
import { scoreNewOpportunitiesForAllActiveOrgs } from "@/lib/rfp/scoring/recompute";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CRON_NAME = "rfp-discovery-federal";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

async function runCron(): Promise<NextResponse> {
  const startedAt = Date.now();

  try {
    const results: IngestRunResult = await runFederalIngest();

    const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
    const totalUpserted = results.reduce((s, r) => s + r.upserted, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

    // Hand off to Phase 05-03 scoring. Collect all upserted_ids across the
    // per-source results. The scorer iterates active orgs and writes
    // rfp_opp_matches rows. Wrapped in try/catch — a scoring failure must
    // NOT 500 the cron; ingest already landed and is the cron's core duty.
    const upsertedIds = results.flatMap((r) => r.upserted_ids);
    let scored: { scored: number; orgs: number } | { error: string } = {
      scored: 0,
      orgs: 0,
    };
    try {
      scored = await scoreNewOpportunitiesForAllActiveOrgs(upsertedIds);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[rfp-discovery-federal] scoring failed (non-fatal):", message);
      scored = { error: message };
    }

    const duration_ms = Date.now() - startedAt;
    const scoringFailed = "error" in scored;
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: duration_ms,
      status: totalErrors > 0 || scoringFailed ? "warning" : "success",
      result: {
        total_fetched: totalFetched,
        total_upserted: totalUpserted,
        total_errors: totalErrors,
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
        totalErrors > 0 || scoringFailed
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
      `[rfp-discovery-federal] complete in ${duration_ms}ms — ` +
        `fetched=${totalFetched} upserted=${totalUpserted} ` +
        `scored=${"scored" in scored ? scored.scored : "error"}`
    );

    return NextResponse.json({
      ok: true,
      duration_ms,
      results,
      scored,
    });
  } catch (err) {
    // runFederalIngest is designed to never throw, but defense-in-depth.
    // Sanitize: do NOT leak stack traces or internal paths.
    const message = err instanceof Error ? err.message : "Unknown error";
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: Date.now() - startedAt,
      status: "error",
      errors: { message: message.slice(0, 200) },
    });
    console.error("[rfp-discovery-federal] fatal", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Federal ingest failed",
        message,
        duration_ms: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}

/**
 * GET — Vercel Cron invokes GET. Authenticated GET runs the job; unauthenticated
 * browser visits stay explicit and do not leak route details.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (isAuthorized(request)) return runCron();
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

/**
 * POST — manual cron entrypoint.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCron();
}
