import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/decisions/[id]/history - Get history/events for a decision
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: events, error } = await supabase
      .from("decision_events")
      .select(`
        *,
        performer:profiles!decision_events_performed_by_fkey(full_name, avatar_url)
      `)
      .eq("decision_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching decision history:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    const formattedEvents = (events || []).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      from_status: e.from_status,
      to_status: e.to_status,
      comment: e.comment,
      performed_by: e.performed_by,
      performer_name: e.performer?.full_name,
      performed_by_system: e.performed_by_system,
      metadata: e.metadata,
      created_at: e.created_at,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("Get decision history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
