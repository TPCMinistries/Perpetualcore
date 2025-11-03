import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/activity/log
 * Log user activity for tracking beta tester engagement
 */
export async function POST(request: NextRequest) {
  try {
    const { activityType, metadata = {} } = await request.json();

    if (!activityType) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log the activity
    const { error } = await supabase.from("user_activity").insert({
      user_id: user.id,
      activity_type: activityType,
      metadata: metadata,
    });

    if (error) {
      console.error("Error logging activity:", error);
      return NextResponse.json(
        { error: "Failed to log activity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
