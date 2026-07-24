import { NextRequest, NextResponse } from "next/server";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import {
  RFP_AMENDMENT_MONITOR_CRON,
  runAmendmentMonitor,
} from "@/lib/rfp/amendments/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

function readLimit(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("limit");
  const parsed = raw ? Number.parseInt(raw, 10) : 50;
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 200)) : 50;
}

function readFetchLive(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get("fetch_live") === "true";
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const limit = readLimit(request);
  const fetchLive = readFetchLive(request);

  try {
    const result = await runAmendmentMonitor({ limit, fetchLive });
    const durationMs = Date.now() - startedAt;
    await logRfpCronExecution({
      cronName: RFP_AMENDMENT_MONITOR_CRON,
      durationMs,
      status: result.errors.length > 0 ? "warning" : "success",
      result: {
        ...result,
        fetch_live: fetchLive,
      },
      errors: result.errors.length > 0 ? { errors: result.errors.slice(0, 10) } : null,
    });

    return NextResponse.json({
      ok: result.errors.length === 0,
      ...result,
      fetch_live: fetchLive,
      duration_ms: durationMs,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "unknown";
    await logRfpCronExecution({
      cronName: RFP_AMENDMENT_MONITOR_CRON,
      durationMs,
      status: "error",
      errors: { message: message.slice(0, 200) },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "amendment_monitor_failed",
        message: message.slice(0, 200),
        duration_ms: durationMs,
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
