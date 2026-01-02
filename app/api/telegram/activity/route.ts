import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/telegram/activity
 * Get recent Telegram bot activity for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const adminClient = createAdminClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch recent interactions
    const { data: interactions, error } = await adminClient
      .from("telegram_interactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching Telegram activity:", error);
      return Response.json({ error: "Failed to fetch activity" }, { status: 500 });
    }

    // Calculate summary
    const allInteractions = interactions || [];
    const todayCount = allInteractions.filter(
      (i) => new Date(i.created_at) >= today
    ).length;

    const entitiesCreated = allInteractions.filter(
      (i) => i.created_entity_id
    ).length;

    return Response.json({
      interactions: allInteractions,
      summary: {
        todayCount,
        mostRecentIntent: allInteractions[0]?.detected_intent || null,
        entitiesCreated,
      },
    });
  } catch (error) {
    console.error("Telegram activity error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
