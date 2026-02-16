import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * A2UI Callback Handler
 *
 * Handles user interactions with A2UI blocks (form submissions,
 * approval actions, checklist toggles, card actions, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { callbackId, action, data } = body as {
      callbackId: string;
      action?: string;
      data?: Record<string, unknown>;
    };

    if (!callbackId) {
      return NextResponse.json(
        { error: "callbackId is required" },
        { status: 400 }
      );
    }

    // Log the callback for debugging and audit
    console.log(`[A2UI Callback] user=${user.id} callback=${callbackId} action=${action || "submit"}`);

    // Route specific callback types
    if (callbackId === "task-toggle" && data?.itemId) {
      // Handle task checkbox toggle
      const { error } = await supabase
        .from("tasks")
        .update({
          status: data.checked ? "done" : "todo",
          completed_at: data.checked ? new Date().toISOString() : null,
        })
        .eq("id", data.itemId as string)
        .eq("user_id", user.id);

      if (error) {
        console.error("[A2UI Callback] Task toggle error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to update task" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Task ${data.checked ? "completed" : "reopened"}`,
      });
    }

    // For approval actions, store in agent_inbox if the table exists
    if (action === "approve" || action === "reject") {
      try {
        await supabase.from("agent_inbox").insert({
          user_id: user.id,
          type: "a2ui_callback",
          payload: {
            callbackId,
            action,
            data,
            timestamp: new Date().toISOString(),
          },
          status: "pending",
        });
      } catch {
        // agent_inbox table may not exist, just log
        console.log("[A2UI Callback] agent_inbox insert skipped (table may not exist)");
      }

      return NextResponse.json({
        success: true,
        message: `Action "${action}" recorded for callback ${callbackId}`,
      });
    }

    // Generic form submission - store the data
    try {
      await supabase.from("agent_inbox").insert({
        user_id: user.id,
        type: "a2ui_form",
        payload: {
          callbackId,
          data,
          timestamp: new Date().toISOString(),
        },
        status: "pending",
      });
    } catch {
      // agent_inbox table may not exist, just log
      console.log("[A2UI Callback] agent_inbox insert skipped (table may not exist)");
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
    });
  } catch (error) {
    console.error("[A2UI Callback] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
