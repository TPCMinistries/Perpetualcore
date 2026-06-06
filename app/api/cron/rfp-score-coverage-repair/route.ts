/**
 * RFP scoring coverage repair cron.
 *
 * Health now detects when indexed opportunities are missing org-specific match
 * rows. This cron is the self-healing counterpart: scan active opportunities,
 * find opportunities with incomplete org coverage, and hand them back to the
 * scorer, which only writes missing (opp, org) pairs.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_SCORE_COVERAGE_MAX_REPAIR,
  DEFAULT_SCORE_COVERAGE_SCAN_LIMIT,
  RFP_SCORE_COVERAGE_REPAIR_CRON,
  runScoreCoverageRepair,
} from "@/lib/rfp/scoring/coverage-repair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

function readPositiveInt(
  request: NextRequest,
  key: string,
  fallback: number,
  max: number,
): number {
  const raw = request.nextUrl.searchParams.get(key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const maxRepair = readPositiveInt(
    request,
    "max_repair",
    DEFAULT_SCORE_COVERAGE_MAX_REPAIR,
    2_000,
  );
  const scanLimit = readPositiveInt(
    request,
    "scan_limit",
    DEFAULT_SCORE_COVERAGE_SCAN_LIMIT,
    100_000,
  );

  try {
    const result = await runScoreCoverageRepair({
      maxRepair,
      scanLimit,
      logExecution: true,
      cronName: RFP_SCORE_COVERAGE_REPAIR_CRON,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        ok: false,
        error: "score_coverage_repair_failed",
        message,
        duration_ms: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
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
    },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCron(request);
}
