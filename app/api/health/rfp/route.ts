/**
 * GET /api/health/rfp
 *
 * Lightweight JSON status endpoint for UptimeRobot / Better Stack and
 * for quick sanity-checking from a terminal. Public — no auth — so it
 * can be polled. Intentionally returns *aggregate* counts, never row
 * contents, never per-org cost.
 *
 * Fields are intentionally permissive: a missing/null value means "the
 * underlying table or row doesn't exist yet" rather than an error. The
 * top-level `status` is "ok" unless one of the load functions throws.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export async function GET(): Promise<NextResponse> {
  try {
    const admin = createAdminClient();
    const dayAgo = isoHoursAgo(24);

    const [lastCron, lastOpp, openDrift, cost24hRows] = await Promise.all([
      admin
        .from("cron_executions")
        .select("cron_name, executed_at, status")
        .ilike("cron_name", "%rfp%")
        .order("executed_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ cron_name: string; executed_at: string; status: string | null }>(),
      admin
        .from("rfp_opportunities")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>(),
      admin
        .from("rfp_source_drift")
        .select("id", { count: "exact", head: true })
        .is("resolved_at", null),
      admin
        .from("rfp_agent_sessions")
        .select("cost_usd")
        .gte("created_at", dayAgo)
        .returns<{ cost_usd: number | string | null }[]>(),
    ]);

    const ai_cost_24h_usd = (cost24hRows.data ?? []).reduce(
      (sum, r) => sum + toNum(r.cost_usd),
      0,
    );

    return NextResponse.json({
      status: "ok",
      service: "rfp_engine",
      generated_at: new Date().toISOString(),
      last_cron: lastCron.data
        ? {
            name: lastCron.data.cron_name,
            executed_at: lastCron.data.executed_at,
            status: lastCron.data.status,
          }
        : null,
      last_opportunity_ingested_at: lastOpp.data?.created_at ?? null,
      open_drift_events: openDrift.count ?? 0,
      ai_cost_24h_usd: Math.round(ai_cost_24h_usd * 10000) / 10000,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    return NextResponse.json(
      { status: "error", detail },
      { status: 500 },
    );
  }
}
