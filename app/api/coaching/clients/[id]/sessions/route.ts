import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/coaching/clients/[id]/sessions
 * Get all sessions for a client
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify client belongs to user
    const { data: client } = await supabase
      .from("coaching_clients")
      .select("id")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("coaching_sessions")
      .select("*")
      .eq("client_id", clientId)
      .order("scheduled_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }

    return Response.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("Coaching sessions GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/coaching/clients/[id]/sessions
 * Create a coaching session
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify client belongs to user
    const { data: client } = await supabase
      .from("coaching_clients")
      .select("id, session_duration_minutes")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      scheduled_at,
      duration_minutes,
      prep_notes,
      goals_for_session,
    } = body;

    if (!scheduled_at) {
      return Response.json({ error: "Scheduled time is required" }, { status: 400 });
    }

    // Get session number
    const { count } = await supabase
      .from("coaching_sessions")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    const { data: session, error } = await supabase
      .from("coaching_sessions")
      .insert({
        client_id: clientId,
        user_id: user.id,
        session_number: (count || 0) + 1,
        scheduled_at,
        duration_minutes: duration_minutes || client.session_duration_minutes || 60,
        prep_notes,
        goals_for_session,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return Response.json({ error: "Failed to create session" }, { status: 500 });
    }

    return Response.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Coaching sessions POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
