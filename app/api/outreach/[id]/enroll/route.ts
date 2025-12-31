import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/outreach/[id]/enroll
 * Get all enrollments for a sequence
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("sequence_enrollments")
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, company, avatar_url)
      `)
      .eq("sequence_id", id)
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      console.error("Error fetching enrollments:", error);
      return Response.json({ error: "Failed to fetch enrollments" }, { status: 500 });
    }

    return Response.json({ enrollments: enrollments || [] });
  } catch (error) {
    console.error("Enroll GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/outreach/[id]/enroll
 * Enroll contacts in a sequence
 *
 * Body:
 * - contact_ids: string[] - Array of contact IDs to enroll
 * - start_immediately: boolean - Start from step 1 immediately (default: true)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contact_ids, start_immediately = true } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return Response.json({ error: "contact_ids array is required" }, { status: 400 });
    }

    // Verify sequence exists and belongs to user
    const { data: sequence, error: seqError } = await supabase
      .from("outreach_sequences")
      .select("id, status, steps")
      .eq("id", sequenceId)
      .eq("user_id", user.id)
      .single();

    if (seqError || !sequence) {
      return Response.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Check existing enrollments to avoid duplicates
    const { data: existingEnrollments } = await supabase
      .from("sequence_enrollments")
      .select("contact_id")
      .eq("sequence_id", sequenceId)
      .in("contact_id", contact_ids);

    const existingContactIds = new Set((existingEnrollments || []).map(e => e.contact_id));
    const newContactIds = contact_ids.filter((id: string) => !existingContactIds.has(id));

    if (newContactIds.length === 0) {
      return Response.json({
        message: "All contacts are already enrolled",
        enrolled: 0,
        skipped: contact_ids.length,
      });
    }

    // Create enrollments
    const now = new Date().toISOString();
    const enrollments = newContactIds.map((contactId: string) => ({
      sequence_id: sequenceId,
      contact_id: contactId,
      user_id: user.id,
      status: "active",
      current_step: 1,
      enrolled_at: now,
      next_step_at: start_immediately ? now : null,
    }));

    const { data: created, error: enrollError } = await supabase
      .from("sequence_enrollments")
      .insert(enrollments)
      .select();

    if (enrollError) {
      console.error("Error enrolling contacts:", enrollError);
      return Response.json({ error: "Failed to enroll contacts" }, { status: 500 });
    }

    // Update sequence metrics
    await supabase
      .from("outreach_sequences")
      .update({
        total_enrolled: sequence.total_enrolled + newContactIds.length,
        updated_at: now,
      })
      .eq("id", sequenceId);

    return Response.json({
      message: `Enrolled ${newContactIds.length} contacts`,
      enrolled: newContactIds.length,
      skipped: existingContactIds.size,
      enrollments: created,
    }, { status: 201 });
  } catch (error) {
    console.error("Enroll POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/outreach/[id]/enroll
 * Remove a contact from a sequence
 *
 * Body:
 * - enrollment_id: string - The enrollment to remove
 * - stop_reason: string - Optional reason for stopping
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { enrollment_id, stop_reason } = body;

    if (!enrollment_id) {
      return Response.json({ error: "enrollment_id is required" }, { status: 400 });
    }

    // Update enrollment to stopped
    const { error } = await supabase
      .from("sequence_enrollments")
      .update({
        status: "stopped",
        stopped_at: new Date().toISOString(),
        stop_reason: stop_reason || "Manually removed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollment_id)
      .eq("sequence_id", sequenceId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error stopping enrollment:", error);
      return Response.json({ error: "Failed to remove enrollment" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Enroll DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
