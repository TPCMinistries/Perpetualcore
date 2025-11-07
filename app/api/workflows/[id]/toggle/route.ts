import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflowId = params.id;
    const { enabled } = await request.json();

    // Verify user owns this workflow
    const { data: workflow } = await supabase
      .from("workflows")
      .select("user_id")
      .eq("id", workflowId)
      .single();

    if (!workflow || workflow.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update workflow enabled status
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from("workflows")
      .update({ enabled })
      .eq("id", workflowId)
      .select()
      .single();

    if (updateError) {
      console.error("Error toggling workflow:", updateError);
      return NextResponse.json(
        { error: "Failed to update workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error("Toggle workflow API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
