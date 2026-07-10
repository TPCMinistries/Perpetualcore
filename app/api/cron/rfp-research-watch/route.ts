/**
 * RFP Cycle Watch — periodic re-verification of ai_research and watched
 * opportunities whose application window is not yet confirmed open.
 *
 * See lib/rfp/research/watch.ts for selection + verification + alert logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { runResearchWatch } from "@/lib/rfp/research/watch";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_NAME = "rfp-research-watch";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const result = await runResearchWatch(
      limit !== undefined && Number.isFinite(limit) ? { limit } : undefined,
    );
    const duration_ms = Date.now() - startedAt;
    const completedWithoutErrors = result.errors.length === 0;

    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: duration_ms,
      status: completedWithoutErrors ? "success" : "warning",
      result: {
        checked: result.checked,
        updated: result.updated,
        became_open: result.became_open,
        alerts_sent: result.alerts_sent,
        cost_usd: result.cost_usd,
      },
      errors: result.errors.length > 0 ? { rows: result.errors.slice(0, 20) } : null,
    });

    return NextResponse.json({
      ok: completedWithoutErrors,
      duration_ms,
      ...result,
      warning: completedWithoutErrors
        ? null
        : "Cycle watch completed with per-row errors. See errors and cron log for details.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: Date.now() - startedAt,
      status: "error",
      errors: { message: message.slice(0, 200) },
    });
    console.error("[rfp-research-watch] fatal:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "research_watch_failed",
        message,
        duration_ms: Date.now() - startedAt,
      },
      { status: 500 },
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
    },
  );
}
