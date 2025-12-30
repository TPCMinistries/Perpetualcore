import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/search/saved/[id]
// Update a saved search
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: searchId } = await params;

    // Verify ownership
    const { data: savedSearch } = await supabase
      .from("saved_searches")
      .select("user_id")
      .eq("id", searchId)
      .single();

    if (!savedSearch || savedSearch.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, query, filters, is_pinned, is_shared, notifications_enabled } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (query !== undefined) updateData.query = query;
    if (filters !== undefined) updateData.filters = filters;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (is_shared !== undefined) updateData.is_shared = is_shared;
    if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;

    const { data: updatedSearch, error: updateError } = await supabase
      .from("saved_searches")
      .update(updateData)
      .eq("id", searchId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating saved search:", updateError);
      return NextResponse.json(
        { error: "Failed to update saved search" },
        { status: 500 }
      );
    }

    return NextResponse.json({ savedSearch: updatedSearch });
  } catch (error) {
    console.error("Update saved search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/search/saved/[id]
// Delete a saved search
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: searchId } = await params;

    // Verify ownership
    const { data: savedSearch } = await supabase
      .from("saved_searches")
      .select("user_id")
      .eq("id", searchId)
      .single();

    if (!savedSearch || savedSearch.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", searchId);

    if (deleteError) {
      console.error("Error deleting saved search:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete saved search" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete saved search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
