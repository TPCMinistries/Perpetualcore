import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/calendar/google";
import { gateFeature } from "@/lib/features/gate";

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

    // Feature gate: calendar integration
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (profile?.organization_id) {
      const gate = await gateFeature("calendar_integration", profile.organization_id);
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, code: "FEATURE_GATED", upgrade: gate.upgrade },
          { status: 403 }
        );
      }
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
