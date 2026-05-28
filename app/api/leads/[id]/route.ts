import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leads/[id]
 * Get a single lead with activities
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

    // Get lead with related data
    const { data: lead, error } = await supabase
      .from("leads")
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone, company, avatar_url),
        assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url),
        current_sequence:outreach_sequences(id, name, status)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Get activities
    const { data: activities } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    return Response.json({
      lead,
      activities: activities || [],
    });
  } catch (error) {
    console.error("Lead GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/[id]
 * Update a lead
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

    // Get current lead for status change tracking
    const { data: currentLead } = await supabase
      .from("leads")
      .select("status, stage, next_follow_up_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!currentLead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json();
    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "title",
      "status",
      "stage",
      "estimated_value",
      "probability",
      "expected_close_date",
      "source",
      "source_detail",
      "notes",
      "tags",
      "assigned_to",
      "contact_id",
      "current_sequence_id",
      "next_follow_up_at",
      "lead_score",
      "ai_insights",
    ];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle status changes
    if (body.status === "won" && currentLead.status !== "won") {
      updates.converted_at = new Date().toISOString();
    }
    if (body.status === "lost" && currentLead.status !== "lost") {
      updates.lost_at = new Date().toISOString();
      if (body.lost_reason) {
        updates.lost_reason = body.lost_reason;
      }
    }
    if (body.status && body.status !== currentLead.status) {
      updates.last_contacted_at = new Date().toISOString();
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating lead:", error);
      return Response.json({ error: "Failed to update lead" }, { status: 500 });
    }

    // Log status change activity
    if (body.status && body.status !== currentLead.status) {
      await supabase.from("lead_activities").insert({
        lead_id: id,
        user_id: user.id,
        activity_type: "status_change",
        title: `Status changed to ${body.status}`,
        from_value: currentLead.status,
        to_value: body.status,
      });
    }

    if (
      body.next_follow_up_at &&
      body.next_follow_up_at !== currentLead.next_follow_up_at
    ) {
      await supabase.from("lead_activities").insert({
        lead_id: id,
        user_id: user.id,
        activity_type: "follow_up_scheduled",
        title: "Follow-up scheduled",
        from_value: currentLead.next_follow_up_at,
        to_value: body.next_follow_up_at,
      });
    }

    if (body.ai_insights) {
      await supabase.from("lead_activities").insert({
        lead_id: id,
        user_id: user.id,
        activity_type: "ai_plan_saved",
        title: "Assistant plan saved",
        description: "AI routing, qualification questions, and next action were saved to this lead.",
      });
    }

    return Response.json({ lead });
  } catch (error) {
    console.error("Lead PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/leads/[id]
 * Delete a lead
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
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting lead:", error);
      return Response.json({ error: "Failed to delete lead" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Lead DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
