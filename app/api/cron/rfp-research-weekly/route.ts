/**
 * RFP Deep Research — Weekly Cron
 *
 * Sweeps a bounded batch of orgs (default 5/week) and runs one research
 * vertical each, ingesting verified leads and emailing owners a digest when
 * new opportunities land. See lib/rfp/research/weekly.ts for the full
 * eligibility/rotation/budget-skip logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { runWeeklyResearch } from "@/lib/rfp/research/weekly";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CRON_NAME = "rfp-research-weekly";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

async function runCron(): Promise<NextResponse> {
  const startedAt = Date.now();
  try {
    const result = await runWeeklyResearch();
    const duration_ms = Date.now() - startedAt;
    const hadErrors = result.errors.length > 0;

    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: duration_ms,
      status: hadErrors ? "warning" : "success",
      result: {
        orgs_run: result.orgs_run,
        leads_found: result.leads_found,
        leads_ingested: result.leads_ingested,
        emails_sent: result.emails_sent,
        skipped_budget: result.skipped_budget,
        cost_usd: result.cost_usd,
      },
      errors: hadErrors ? { messages: result.errors.slice(0, 20) } : null,
    });

    return NextResponse.json({ ok: !hadErrors, duration_ms, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: Date.now() - startedAt,
      status: "error",
      errors: { message: message.slice(0, 200) },
    });
    console.error("[rfp-research-weekly] fatal:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "research_weekly_failed",
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
  return runCron();
}

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
