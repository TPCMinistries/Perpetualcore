import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/activity
 * Get team activity feed with filtering options
 * Query params:
 * - user_id: Filter by specific user
 * - activity_type: Filter by activity type
 * - resource_type: Filter by resource type
 * - limit: Number of activities to return (default 50)
 * - offset: Pagination offset (default 0)
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

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("user_id");
    const activityType = searchParams.get("activity_type");
    const resourceType = searchParams.get("resource_type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("team_activity")
      .select(`
        *,
        user:profiles!team_activity_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (activityType) {
      query = query.eq("activity_type", activityType);
    }
    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error("Error fetching team activity:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activities: activities || [],
      count: activities?.length || 0
    });
  } catch (error: any) {
    console.error("Error in GET /api/team/activity:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
