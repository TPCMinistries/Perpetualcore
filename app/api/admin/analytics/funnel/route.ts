import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const FUNNEL_STEPS = [
  { event_type: "page_view", label: "Page Views" },
  { event_type: "cta_click", label: "CTA Clicks" },
  { event_type: "signup", label: "Signups" },
  { event_type: "onboarding_complete", label: "Onboarding Complete" },
  { event_type: "first_chat", label: "First Chat" },
  { event_type: "first_document", label: "First Document" },
  { event_type: "trial_converted", label: "Trial Converted" },
] as const;

/**
 * GET /api/admin/analytics/funnel
 *
 * Returns funnel metrics for the admin analytics dashboard.
 * Query params: days (default 30)
 */
export async function GET(request: NextRequest) {
  // Verify admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse date range
  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startISO = startDate.toISOString();

  try {
    // Query each funnel step count + unique users
    const stepQueries = FUNNEL_STEPS.map(async (step) => {
      const { data, error } = await admin
        .from("analytics_events")
        .select("id, user_id, anonymous_id", { count: "exact" })
        .eq("event_type", step.event_type)
        .gte("created_at", startISO);

      if (error) {
        console.error(`[Funnel] Error querying ${step.event_type}:`, error);
        return { ...step, count: 0, unique_users: 0 };
      }

      // Count unique users (user_id or anonymous_id)
      const uniqueIds = new Set<string>();
      data?.forEach((row) => {
        const id = row.user_id || row.anonymous_id;
        if (id) uniqueIds.add(id);
      });

      return {
        ...step,
        count: data?.length ?? 0,
        unique_users: uniqueIds.size,
      };
    });

    const results = await Promise.all(stepQueries);

    // Calculate conversion rates between steps
    const steps = results.map((step, i) => {
      const prevUnique = i > 0 ? results[i - 1].unique_users : step.unique_users;
      return {
        event_type: step.event_type,
        label: step.label,
        count: step.count,
        unique_users: step.unique_users,
        conversion_rate:
          prevUnique > 0
            ? Math.round((step.unique_users / prevUnique) * 10000) / 100
            : 0,
      };
    });

    // Daily trend for the top-of-funnel (page views) and signups
    const { data: dailyTrend } = await admin
      .from("analytics_events")
      .select("event_type, created_at")
      .in("event_type", ["page_view", "signup", "trial_converted"])
      .gte("created_at", startISO)
      .order("created_at", { ascending: true });

    // Group by day
    const trendByDay: Record<string, { page_views: number; signups: number; conversions: number }> = {};
    dailyTrend?.forEach((event) => {
      const day = event.created_at.split("T")[0];
      if (!trendByDay[day]) {
        trendByDay[day] = { page_views: 0, signups: 0, conversions: 0 };
      }
      if (event.event_type === "page_view") trendByDay[day].page_views++;
      if (event.event_type === "signup") trendByDay[day].signups++;
      if (event.event_type === "trial_converted") trendByDay[day].conversions++;
    });

    const trend = Object.entries(trendByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, counts]) => ({ day, ...counts }));

    return NextResponse.json({
      steps,
      trend,
      period: {
        start: startISO,
        end: new Date().toISOString(),
        days,
      },
      total_visitors: steps[0]?.unique_users ?? 0,
    });
  } catch (error) {
    console.error("[Funnel API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch funnel data" }, { status: 500 });
  }
}
