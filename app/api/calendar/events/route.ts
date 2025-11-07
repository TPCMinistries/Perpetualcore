import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/calendar/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get upcoming calendar events for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has connected calendar
    const { data: account } = await supabase
      .from("calendar_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ connected: false, events: [] });
    }

    // Get upcoming events
    const events = await getUpcomingEvents(user.id, 20);

    return NextResponse.json({
      connected: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("Calendar events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
