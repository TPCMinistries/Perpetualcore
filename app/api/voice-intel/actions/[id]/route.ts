import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import type { ActionStatus } from "@/lib/voice-intel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET - Fetch a single action by ID with classification data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.api);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: action, error } = await supabase
      .from("voice_intel_actions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    // Fetch classification if linked
    let classification = null;
    if (action.classification_id) {
      const { data: classData } = await supabase
        .from("voice_intel_classifications")
        .select("*")
        .eq("id", action.classification_id)
        .single();
      classification = classData;
    }

    return NextResponse.json({ action, classification });
  } catch (error) {
    console.error("Voice intel action GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch action" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update action status (approve/reject/complete)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.api);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("voice_intel_actions")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, rejection_reason } = body as {
      status?: ActionStatus;
      rejection_reason?: string;
    };

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status transitions
    const currentStatus = existing.status as ActionStatus;
    const validTransitions: Record<string, ActionStatus[]> = {
      pending: ["approved", "rejected"],
      approved: ["completed"],
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid transition from '${currentStatus}' to '${status}'`,
        },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejection_reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updatePayload.approved_at = new Date().toISOString();
    } else if (status === "rejected") {
      updatePayload.rejection_reason = rejection_reason;
    } else if (status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
    }

    // Use admin client for reliable writes
    const adminSupabase = createAdminClient();
    const { data: updated, error: updateError } = await adminSupabase
      .from("voice_intel_actions")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Voice intel action update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ action: updated });
  } catch (error) {
    console.error("Voice intel action PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update action" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Hard delete an action
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.api);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership before deleting
    const { data: existing } = await supabase
      .from("voice_intel_actions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("voice_intel_actions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Voice intel action delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voice intel action DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete action" },
      { status: 500 }
    );
  }
}
