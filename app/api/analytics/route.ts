import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOverviewMetrics,
  getDailyActivity,
  getAIUsageStats,
  getProductivityInsights,
  getIntegrationHealth,
  getTopDocuments,
} from "@/lib/analytics/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch analytics data
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

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

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "overview";
    const period = (searchParams.get("period") as "7d" | "30d" | "90d") || "30d";

    switch (type) {
      case "overview":
        const overview = await getOverviewMetrics(
          user.id,
          profile.organization_id,
          period
        );
        return NextResponse.json({ overview });

      case "activity":
        const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
        const activity = await getDailyActivity(
          user.id,
          profile.organization_id,
          days
        );
        return NextResponse.json({ activity });

      case "ai":
        const aiStats = await getAIUsageStats(user.id, profile.organization_id);
        return NextResponse.json({ ai: aiStats });

      case "productivity":
        const productivity = await getProductivityInsights(
          user.id,
          profile.organization_id
        );
        return NextResponse.json({ productivity });

      case "integrations":
        const integrations = await getIntegrationHealth(
          user.id,
          profile.organization_id
        );
        return NextResponse.json({ integrations });

      case "documents":
        const limit = parseInt(searchParams.get("limit") || "10");
        const documents = await getTopDocuments(profile.organization_id, limit);
        return NextResponse.json({ documents });

      case "all":
        // Fetch all analytics data at once
        const [
          allOverview,
          allActivity,
          allAI,
          allProductivity,
          allIntegrations,
        ] = await Promise.all([
          getOverviewMetrics(user.id, profile.organization_id, period),
          getDailyActivity(user.id, profile.organization_id, 30),
          getAIUsageStats(user.id, profile.organization_id),
          getProductivityInsights(user.id, profile.organization_id),
          getIntegrationHealth(user.id, profile.organization_id),
        ]);

        return NextResponse.json({
          overview: allOverview,
          activity: allActivity,
          ai: allAI,
          productivity: allProductivity,
          integrations: allIntegrations,
        });

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
