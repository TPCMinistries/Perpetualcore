/**
 * RFP canonical alias backfill cron.
 *
 * Fresh importers attach source rows to canonical clusters. This route repairs
 * older rows that were indexed before canonical clustering existed.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_CANONICAL_BACKFILL_MAX,
  DEFAULT_CANONICAL_BACKFILL_SCAN_LIMIT,
  RFP_CANONICAL_BACKFILL_CRON,
  runCanonicalBackfill,
} from "@/lib/rfp/ingest/canonical-backfill";

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
  const maxBackfill = readPositiveInt(
    request,
    "max_backfill",
    DEFAULT_CANONICAL_BACKFILL_MAX,
    5_000,
  );
  const scanLimit = readPositiveInt(
    request,
    "scan_limit",
    DEFAULT_CANONICAL_BACKFILL_SCAN_LIMIT,
    250_000,
  );

  try {
    const result = await runCanonicalBackfill({
      maxBackfill,
      scanLimit,
      logExecution: true,
      cronName: RFP_CANONICAL_BACKFILL_CRON,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        ok: false,
        error: "canonical_backfill_failed",
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
