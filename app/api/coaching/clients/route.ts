import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/coaching/clients
 * Fetch all coaching clients
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const coachingType = searchParams.get("coaching_type");

    let query = supabase
      .from("coaching_clients")
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone, company, avatar_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (coachingType) {
      query = query.eq("coaching_type", coachingType);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error("Error fetching clients:", error);
      return Response.json({ error: "Failed to fetch clients" }, { status: 500 });
    }

    // Get session counts
    const clientIds = (clients || []).map(c => c.id);
    const { data: sessionCounts } = await supabase
      .from("coaching_sessions")
      .select("client_id, status")
      .in("client_id", clientIds);

    const countsMap: Record<string, { total: number; completed: number }> = {};
    (sessionCounts || []).forEach(s => {
      if (!countsMap[s.client_id]) {
        countsMap[s.client_id] = { total: 0, completed: 0 };
      }
      countsMap[s.client_id].total++;
      if (s.status === "completed") {
        countsMap[s.client_id].completed++;
      }
    });

    const clientsWithCounts = (clients || []).map(client => ({
      ...client,
      session_counts: countsMap[client.id] || { total: 0, completed: 0 },
    }));

    // Get stats
    const statusCounts = (clients || []).reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    return Response.json({
      clients: clientsWithCounts,
      stats: statusCounts,
    });
  } catch (error) {
    console.error("Coaching clients GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/coaching/clients
 * Create a coaching client
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      contact_id,
      name,
      email,
      phone,
      company,
      role,
      coaching_type,
      session_frequency,
      session_duration_minutes,
      primary_goals,
      rate_type,
      rate_amount,
      notes,
    } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: client, error } = await supabase
      .from("coaching_clients")
      .insert({
        user_id: user.id,
        contact_id,
        name,
        email,
        phone,
        company,
        role,
        coaching_type,
        session_frequency,
        session_duration_minutes,
        primary_goals,
        rate_type,
        rate_amount,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return Response.json({ error: "Failed to create client" }, { status: 500 });
    }

    return Response.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Coaching clients POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
