import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/coaching/clients/[id]
 * Get a coaching client with sessions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client, error } = await supabase
      .from("coaching_clients")
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone, company, avatar_url)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    // Get sessions
    const { data: sessions } = await supabase
      .from("coaching_sessions")
      .select("*")
      .eq("client_id", id)
      .order("scheduled_at", { ascending: false });

    // Get action items
    const { data: actionItems } = await supabase
      .from("coaching_action_items")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    return Response.json({
      client,
      sessions: sessions || [],
      action_items: actionItems || [],
    });
  } catch (error) {
    console.error("Coaching client GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/coaching/clients/[id]
 * Update a coaching client
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "role",
      "coaching_type",
      "engagement_end",
      "session_frequency",
      "session_duration_minutes",
      "primary_goals",
      "success_metrics",
      "rate_type",
      "rate_amount",
      "status",
      "notes",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: client, error } = await supabase
      .from("coaching_clients")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating client:", error);
      return Response.json({ error: "Failed to update client" }, { status: 500 });
    }

    return Response.json({ client });
  } catch (error) {
    console.error("Coaching client PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/coaching/clients/[id]
 * Delete a coaching client
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("coaching_clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting client:", error);
      return Response.json({ error: "Failed to delete client" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Coaching client DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
