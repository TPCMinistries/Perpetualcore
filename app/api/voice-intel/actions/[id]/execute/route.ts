import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import { executeAction } from "@/lib/voice-intel/executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST - Execute an approved action
 * Routes to delivery handlers (email, delegation, prophecy, etc.)
 */
export async function POST(
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

    // Verify ownership and status
    const { data: action, error: fetchError } = await supabase
      .from("voice_intel_actions")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    if (action.status !== "approved") {
      return NextResponse.json(
        { error: "Action must be approved before execution" },
        { status: 400 }
      );
    }

    // Execute the action via the delivery system
    const result = await executeAction(id, user.id);

    if (!result.success) {
      console.error("Voice intel action execution failed:", result);
      return NextResponse.json(
        { error: "Action execution failed", result },
        { status: 500 }
      );
    }

    // Fetch the updated action to return
    const adminSupabase = createAdminClient();
    const { data: updated } = await adminSupabase
      .from("voice_intel_actions")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({ action: updated, executed: true, result });
  } catch (error) {
    console.error("Voice intel action execute POST error:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
