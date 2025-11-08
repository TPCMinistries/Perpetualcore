import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/beta/stats
 * Get activity stats for all beta testers
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authorization
    await requireAdmin();

    const supabase = await createClient();

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
    const status = error.message === "Unauthorized" ? 401 : error.message.includes("Forbidden") ? 403 : 500;
    const message = status === 500 ? "Failed to fetch stats" : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
