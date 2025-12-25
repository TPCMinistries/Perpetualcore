import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UpdateWorkItemRequest } from "@/types/work";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/work-items/[itemId] - Get single work item
export async function GET(
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

    const { data: item, error } = await supabase
      .from("work_items")
      .select(
        `
        *,
        assigned_user:profiles!work_items_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!work_items_created_by_fkey(id, full_name, email, avatar_url),
        team:teams(id, name, emoji, color, workflow_stages, template_id)
      `
      )
      .eq("id", itemId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Get comment and attachment counts
    const [commentsResult, attachmentsResult] = await Promise.all([
      supabase
        .from("work_item_comments")
        .select("id", { count: "exact", head: true })
        .eq("work_item_id", itemId),
      supabase
        .from("work_item_attachments")
        .select("id", { count: "exact", head: true })
        .eq("work_item_id", itemId),
    ]);

    return NextResponse.json({
      item: {
        ...item,
        comments_count: commentsResult.count || 0,
        attachments_count: attachmentsResult.count || 0,
      },
    });
  } catch (error) {
    console.error("Get work item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/work-items/[itemId] - Update work item
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

    // Get existing item
    const { data: existingItem } = await supabase
      .from("work_items")
      .select("*, team:teams(id)")
      .eq("id", itemId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Verify team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", existingItem.team_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 }
      );
    }

    const body: UpdateWorkItemRequest = await request.json();

    // Build update object
    const updates: Record<string, unknown> = {};
    const historyEvents: Array<{
      field_name: string;
      old_value: unknown;
      new_value: unknown;
    }> = [];

    if (body.title !== undefined) {
      updates.title = body.title.trim();
      if (updates.title !== existingItem.title) {
        historyEvents.push({
          field_name: "title",
          old_value: existingItem.title,
          new_value: updates.title,
        });
      }
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.external_id !== undefined) {
      updates.external_id = body.external_id || null;
    }

    if (body.priority !== undefined && body.priority !== existingItem.priority) {
      updates.priority = body.priority;
      historyEvents.push({
        field_name: "priority",
        old_value: existingItem.priority,
        new_value: body.priority,
      });
    }

    if (body.assigned_to !== undefined) {
      updates.assigned_to = body.assigned_to || null;
      updates.assigned_at = body.assigned_to ? new Date().toISOString() : null;
      if (body.assigned_to !== existingItem.assigned_to) {
        historyEvents.push({
          field_name: "assigned_to",
          old_value: existingItem.assigned_to,
          new_value: body.assigned_to,
        });
      }
    }

    if (body.due_date !== undefined) {
      updates.due_date = body.due_date || null;
    }

    if (body.custom_fields !== undefined) {
      updates.custom_fields = {
        ...existingItem.custom_fields,
        ...body.custom_fields,
      };
    }

    if (body.tags !== undefined) {
      updates.tags = body.tags;
    }

    if (body.is_archived !== undefined) {
      updates.is_archived = body.is_archived;
      if (body.is_archived) {
        updates.archived_at = new Date().toISOString();
        updates.archived_by = user.id;
      } else {
        updates.archived_at = null;
        updates.archived_by = null;
      }
    }

    // Update item
    const { data: updatedItem, error: updateError } = await supabase
      .from("work_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating work item:", updateError);
      return NextResponse.json(
        { error: "Failed to update work item" },
        { status: 500 }
      );
    }

    // Record history for field updates
    for (const event of historyEvents) {
      await supabase.from("work_item_history").insert({
        work_item_id: itemId,
        event_type: event.field_name === "assigned_to" ? "assigned" : "field_updated",
        field_name: event.field_name,
        old_value: event.old_value,
        new_value: event.new_value,
        actor_id: user.id,
        actor_type: "user",
      });
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Update work item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/work-items/[itemId] - Delete work item
export async function DELETE(
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
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get existing item
    const { data: existingItem } = await supabase
      .from("work_items")
      .select("team_id")
      .eq("id", itemId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Verify user can delete (team lead/manager or admin)
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", existingItem.team_id)
      .eq("user_id", user.id)
      .single();

    const canDelete =
      membership?.role === "lead" ||
      membership?.role === "manager" ||
      profile.user_role === "admin" ||
      profile.user_role === "owner";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Only team leads, managers, or admins can delete items" },
        { status: 403 }
      );
    }

    // Delete item (cascades to history, comments, attachments)
    const { error: deleteError } = await supabase
      .from("work_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      console.error("Error deleting work item:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete work item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete work item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
