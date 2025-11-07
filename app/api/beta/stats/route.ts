import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/beta/stats
 * Get activity stats for all beta testers
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check here

    // Fetch stats from the view
    const { data: stats, error } = await supabase
      .from("user_activity_stats")
      .select("*")
      .order("total_activities", { ascending: false });

    if (error) {
      console.error("Error fetching beta stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats: stats || [] });
  } catch (error: any) {
    console.error("Error fetching beta stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
