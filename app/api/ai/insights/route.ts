import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProactiveInsights, ProactiveInsight } from "@/lib/ai/proactive-insights";

export const runtime = "nodejs";

/**
 * GET - Get proactive AI insights for the user
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
      return NextResponse.json({ insights: [] });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const insights = await getProactiveInsights(
      supabase,
      user.id,
      profile.organization_id,
      forceRefresh
    );

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

/**
 * POST - Dismiss an insight
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { insightId, action } = body;

    if (!insightId) {
      return NextResponse.json(
        { error: "insightId is required" },
        { status: 400 }
      );
    }

    if (action === "dismiss") {
      // Store dismissed insight ID in user preferences or cache
      // For now, we track dismissals in the briefing_cache
      const today = new Date().toISOString().split("T")[0];

      const { data: cached } = await supabase
        .from("briefing_cache")
        .select("data")
        .eq("user_id", user.id)
        .eq("briefing_date", today)
        .single();

      const dismissedInsights = cached?.data?.dismissedInsights || [];
      dismissedInsights.push(insightId);

      await supabase
        .from("briefing_cache")
        .upsert(
          {
            user_id: user.id,
            briefing_date: today,
            data: {
              ...cached?.data,
              dismissedInsights,
            },
            generated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,briefing_date" }
        );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Insights POST error:", error);
    return NextResponse.json(
      { error: "Failed to process insight action" },
      { status: 500 }
    );
  }
}
