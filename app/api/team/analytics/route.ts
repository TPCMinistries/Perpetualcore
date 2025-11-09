import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/analytics
 * Get team analytics dashboard data
 * Query params:
 * - days: Number of days to fetch (default 30)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get total members count
    const { count: totalMembers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id);

    // Get active members (those with activity in the last N days)
    const { data: activeMembers } = await supabase
      .from("team_activity")
      .select("user_id")
      .eq("organization_id", profile.organization_id)
      .gte("created_at", dateThreshold.toISOString());

    const uniqueActiveMembers = new Set(activeMembers?.map(a => a.user_id) || []).size;

    // Get activity counts by type
    const { data: activityByType } = await supabase
      .from("team_activity")
      .select("activity_type")
      .eq("organization_id", profile.organization_id)
      .gte("created_at", dateThreshold.toISOString());

    const activityCounts = activityByType?.reduce((acc: any, item) => {
      acc[item.activity_type] = (acc[item.activity_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get most active members
    const { data: activityData } = await supabase
      .from("team_activity")
      .select(`
        user_id,
        user:profiles!team_activity_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("organization_id", profile.organization_id)
      .gte("created_at", dateThreshold.toISOString());

    const userActivityCounts = activityData?.reduce((acc: any, item) => {
      const userId = item.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user: item.user,
          count: 0
        };
      }
      acc[userId].count += 1;
      return acc;
    }, {}) || {};

    const mostActiveMembers = Object.values(userActivityCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)
      .map((item: any) => ({
        user_id: item.user.id,
        full_name: item.user.full_name,
        email: item.user.email,
        avatar_url: item.user.avatar_url,
        activity_count: item.count
      }));

    // Get team analytics metrics
    const { data: teamMetrics } = await supabase
      .from("team_analytics")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .gte("date", dateThreshold.toISOString().split('T')[0])
      .order("date", { ascending: true });

    // Get activity trend (daily counts)
    const { data: dailyActivity } = await supabase
      .from("team_activity")
      .select("created_at")
      .eq("organization_id", profile.organization_id)
      .gte("created_at", dateThreshold.toISOString());

    const activityByDay = dailyActivity?.reduce((acc: any, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    const activityTrend = Object.entries(activityByDay).map(([date, count]) => ({
      date,
      count
    }));

    return NextResponse.json({
      summary: {
        total_members: totalMembers || 0,
        active_members: uniqueActiveMembers,
        total_activities: activityByType?.length || 0,
        activity_by_type: activityCounts
      },
      most_active_members: mostActiveMembers,
      activity_trend: activityTrend,
      metrics: teamMetrics || []
    });
  } catch (error: any) {
    console.error("Error in GET /api/team/analytics:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
