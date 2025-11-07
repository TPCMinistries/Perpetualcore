import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/audit-logs/stats?days=30
// Get audit log statistics
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only admins and owners can view audit logs
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Get statistics using database function
    const { data, error } = await supabase.rpc("get_audit_log_stats", {
      p_organization_id: profile.organization_id,
      p_days: days,
    });

    if (error) {
      console.error("Error fetching audit log stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit log statistics" },
        { status: 500 }
      );
    }

    const stats = data?.[0];

    if (!stats) {
      return NextResponse.json({
        total_events: 0,
        successful_events: 0,
        failed_events: 0,
        critical_events: 0,
        events_by_category: {},
        events_by_action: {},
        top_users: [],
        recent_critical: [],
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Audit log stats GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log statistics" },
      { status: 500 }
    );
  }
}
