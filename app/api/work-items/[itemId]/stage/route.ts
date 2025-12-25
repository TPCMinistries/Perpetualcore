import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MoveStageRequest {
  new_stage_id: string;
  comment?: string;
}

// PUT /api/work-items/[itemId]/stage - Move item to a new stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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

    const body: MoveStageRequest = await request.json();

    if (!body.new_stage_id) {
      return NextResponse.json(
        { error: "new_stage_id is required" },
        { status: 400 }
      );
    }

    // Get existing item with team info
    const { data: existingItem } = await supabase
      .from("work_items")
      .select("*, team:teams(id, workflow_stages)")
      .eq("id", itemId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Verify team access (member, creator, or admin)
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", existingItem.team_id)
      .eq("user_id", user.id)
      .single();

    // Also check if user created the team or is an admin
    const { data: teamAccess } = await supabase
      .from("teams")
      .select("created_by")
      .eq("id", existingItem.team_id)
      .single();

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner", "business_owner"].includes(userProfile?.user_role || "");
    const isCreator = teamAccess?.created_by === user.id;

    if (!membership && !isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 }
      );
    }

    // Validate new stage exists in team's workflow
    const workflowStages = (existingItem.team?.workflow_stages as Array<{ id: string; name: string }>) || [];
    const newStage = workflowStages.find((s) => s.id === body.new_stage_id);

    if (!newStage && workflowStages.length > 0) {
      return NextResponse.json(
        { error: "Invalid stage for this team" },
        { status: 400 }
      );
    }

    const oldStageId = existingItem.current_stage_id;

    // Check if this is a completion stage (last stage in workflow)
    const sortedStages = [...workflowStages].sort((a: { order?: number }, b: { order?: number }) =>
      (a.order || 0) - (b.order || 0)
    );
    const isCompletionStage = sortedStages.length > 0 &&
      sortedStages[sortedStages.length - 1].id === body.new_stage_id;

    // Update item
    const updateData: Record<string, unknown> = {
      current_stage_id: body.new_stage_id,
      previous_stage_id: oldStageId,
    };

    // If moving to completion stage, set completed_at
    if (isCompletionStage && !existingItem.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }
    // If moving away from completion stage, clear completed_at
    else if (!isCompletionStage && existingItem.completed_at) {
      updateData.completed_at = null;
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from("work_items")
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating work item stage:", updateError);
      return NextResponse.json(
        { error: "Failed to update stage" },
        { status: 500 }
      );
    }

    // Record stage change in history
    await supabase.from("work_item_history").insert({
      work_item_id: itemId,
      event_type: "stage_changed",
      from_stage_id: oldStageId,
      to_stage_id: body.new_stage_id,
      actor_id: user.id,
      actor_type: "user",
      comment: body.comment || null,
    });

    // Get stage names for response
    const oldStage = workflowStages.find((s) => s.id === oldStageId);

    return NextResponse.json({
      item: updatedItem,
      transition: {
        from_stage: oldStage?.name || oldStageId,
        to_stage: newStage?.name || body.new_stage_id,
      },
    });
  } catch (error) {
    console.error("Move stage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
