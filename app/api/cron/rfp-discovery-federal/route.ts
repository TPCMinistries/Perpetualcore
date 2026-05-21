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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — accidental browser visits should be explicit, not silently 404 or
 * leak details about the route. Return 405 with an Allow header.
 */
export async function GET(): Promise<NextResponse> {
  return new NextResponse(
    JSON.stringify({ error: "Method not allowed. Use POST." }),
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * POST — the cron entrypoint.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Bearer-secret auth.
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const results: IngestRunResult = await runFederalIngest();

    const duration_ms = Date.now() - startedAt;
    const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
    const totalUpserted = results.reduce((s, r) => s + r.upserted, 0);

    console.log(
      `[rfp-discovery-federal] complete in ${duration_ms}ms — ` +
        `fetched=${totalFetched} upserted=${totalUpserted}`
    );

    return NextResponse.json({
      ok: true,
      duration_ms,
      results,
    });
  } catch (err) {
    // runFederalIngest is designed to never throw, but defense-in-depth.
    // Sanitize: do NOT leak stack traces or internal paths.
    const message = err instanceof Error ? err.message : "Unknown error";
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
