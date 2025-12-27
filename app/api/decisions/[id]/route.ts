import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/decisions/[id] - Get single decision with history
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get decision with related data
    const { data: decision, error } = await supabase
      .from("decisions")
      .select(
        `
        *,
        user:profiles!decisions_user_id_fkey(full_name, avatar_url),
        decided_by_user:profiles!decisions_decided_by_fkey(full_name, avatar_url),
        delegated_to_user:profiles!decisions_delegated_to_fkey(full_name, avatar_url)
      `
      )
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Get decision events
    const { data: events } = await supabase
      .from("decision_events")
      .select(
        `
        *,
        performer:profiles!decision_events_performed_by_fkey(full_name, avatar_url)
      `
      )
      .eq("decision_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ decision, events: events || [] });
  } catch (error) {
    console.error("Get decision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/decisions/[id] - Update decision
export async function PATCH(
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();

    // Build update object with only allowed fields
    const allowedFields = [
      "title",
      "description",
      "context",
      "options",
      "priority",
      "due_date",
      "tags",
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: decision, error } = await supabase
      .from("decisions")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating decision:", error);
      return NextResponse.json(
        { error: "Failed to update decision" },
        { status: 500 }
      );
    }

    // Record update event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "updated",
      performed_by: user.id,
      performed_by_system: false,
      metadata: { updated_fields: Object.keys(updates).filter((k) => k !== "updated_at") },
    });

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("Update decision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/decisions/[id] - Delete (cancel) decision
export async function DELETE(
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get current status
    const { data: currentDecision } = await supabase
      .from("decisions")
      .select("status")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!currentDecision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Update status to cancelled
    const { error } = await supabase
      .from("decisions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id);

    if (error) {
      console.error("Error cancelling decision:", error);
      return NextResponse.json(
        { error: "Failed to cancel decision" },
        { status: 500 }
      );
    }

    // Record cancellation event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "cancelled",
      from_status: currentDecision.status,
      to_status: "cancelled",
      performed_by: user.id,
      performed_by_system: false,
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete decision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
