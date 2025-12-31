import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - Get API usage statistics
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);
    const keyId = searchParams.get("key_id");

    // Get usage stats from database function
    const { data: stats, error: statsError } = await supabase.rpc("get_api_usage_stats", {
      p_org_id: profile.organization_id,
      p_days: days,
    });

    if (statsError) {
      if (isDev) console.error("Error fetching usage stats:", statsError);
      // Return empty stats if function doesn't exist yet
      return NextResponse.json({
        summary: {
          total_requests: 0,
          total_tokens: 0,
          total_cost_usd: 0,
          requests_today: 0,
          avg_response_time_ms: 0,
          success_rate: 100,
        },
        top_endpoints: [],
        daily_usage: [],
      });
    }

    // Get daily breakdown
    let dailyQuery = supabase
      .from("api_usage")
      .select("created_at, response_status, tokens_used, cost_usd, response_time_ms")
      .eq("organization_id", profile.organization_id)
      .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);

    if (keyId) {
      dailyQuery = dailyQuery.eq("api_key_id", keyId);
    }

    const { data: usageData } = await dailyQuery;

    // Aggregate by day
    const dailyMap = new Map<string, { requests: number; tokens: number; cost: number }>();
    (usageData || []).forEach((u: any) => {
      const date = u.created_at.split("T")[0];
      const existing = dailyMap.get(date) || { requests: 0, tokens: 0, cost: 0 };
      dailyMap.set(date, {
        requests: existing.requests + 1,
        tokens: existing.tokens + (u.tokens_used || 0),
        cost: existing.cost + parseFloat(u.cost_usd || 0),
      });
    });

    const daily_usage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get per-key breakdown
    const { data: keyUsage } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, total_requests, last_used_at")
      .eq("organization_id", profile.organization_id)
      .order("total_requests", { ascending: false })
      .limit(10);

    const summary = stats?.[0] || {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
      requests_today: 0,
      avg_response_time_ms: 0,
      success_rate: 100,
    };

    return NextResponse.json({
      summary: {
        total_requests: summary.total_requests || 0,
        total_tokens: summary.total_tokens || 0,
        total_cost_usd: parseFloat(summary.total_cost || 0),
        requests_today: summary.requests_today || 0,
        avg_response_time_ms: parseFloat(summary.avg_response_time_ms || 0),
        success_rate: parseFloat(summary.success_rate || 100),
      },
      top_endpoints: summary.top_endpoints || [],
      daily_usage,
      keys: (keyUsage || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        prefix: k.key_prefix,
        total_requests: k.total_requests || 0,
        last_used: k.last_used_at,
      })),
      period_days: days,
    });
  } catch (error: any) {
    if (isDev) console.error("Usage stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
