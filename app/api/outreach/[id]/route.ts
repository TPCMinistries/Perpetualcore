import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/outreach/[id]
 * Get a single outreach sequence with enrollment stats
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

    // Get sequence
    const { data: sequence, error } = await supabase
      .from("outreach_sequences")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !sequence) {
      return Response.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Get enrollment stats
    const { data: enrollments, count: totalEnrolled } = await supabase
      .from("sequence_enrollments")
      .select("status", { count: "exact" })
      .eq("sequence_id", id);

    // Count by status
    const statusCounts = (enrollments || []).reduce((acc: Record<string, number>, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    return Response.json({
      sequence,
      stats: {
        total_enrolled: totalEnrolled || 0,
        active: statusCounts.active || 0,
        completed: statusCounts.completed || 0,
        replied: statusCounts.replied || 0,
        converted: statusCounts.converted || 0,
        stopped: statusCounts.stopped || 0,
      },
    });
  } catch (error) {
    console.error("Outreach GET [id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/outreach/[id]
 * Update an outreach sequence
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
      "description",
      "status",
      "sequence_type",
      "steps",
      "target_audience",
      "tags",
      "trigger_type",
      "trigger_config",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle status changes
    if (body.status === "active" && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (body.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data: sequence, error } = await supabase
      .from("outreach_sequences")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sequence:", error);
      return Response.json({ error: "Failed to update sequence" }, { status: 500 });
    }

    return Response.json({ sequence });
  } catch (error) {
    console.error("Outreach PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/outreach/[id]
 * Delete an outreach sequence (soft delete by archiving)
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

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // Hard delete
      const { error } = await supabase
        .from("outreach_sequences")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting sequence:", error);
        return Response.json({ error: "Failed to delete sequence" }, { status: 500 });
      }
    } else {
      // Soft delete (archive)
      const { error } = await supabase
        .from("outreach_sequences")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error archiving sequence:", error);
        return Response.json({ error: "Failed to archive sequence" }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Outreach DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
