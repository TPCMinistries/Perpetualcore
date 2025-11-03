import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/documents/folders/[id]
// Update a folder
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folderId = params.id;
    const body = await request.json();
    const { name, description, parent_folder_id, color, icon } = body;

    // Verify folder exists and user owns it
    const { data: folder } = await supabase
      .from("folders")
      .select("*")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Prepare update object
    const updates: any = {};

    if (name !== undefined && name.trim().length > 0) {
      // Check if name already exists in same parent
      const { data: existingFolder } = await supabase
        .from("folders")
        .select("id")
        .eq("organization_id", folder.organization_id)
        .eq("name", name.trim())
        .eq("parent_folder_id", parent_folder_id !== undefined ? parent_folder_id : folder.parent_folder_id)
        .neq("id", folderId)
        .single();

      if (existingFolder) {
        return NextResponse.json(
          { error: "A folder with this name already exists in this location" },
          { status: 400 }
        );
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (parent_folder_id !== undefined) {
      // Prevent moving folder into itself or its children
      if (parent_folder_id === folderId) {
        return NextResponse.json(
          { error: "Cannot move folder into itself" },
          { status: 400 }
        );
      }
      updates.parent_folder_id = parent_folder_id;
    }

    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    // Update folder
    const { data: updatedFolder, error: updateError } = await supabase
      .from("folders")
      .update(updates)
      .eq("id", folderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating folder:", updateError);

      // Check for circular reference error
      if (updateError.message?.includes("circular")) {
        return NextResponse.json(
          { error: "Cannot create circular folder reference" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update folder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ folder: updatedFolder });
  } catch (error: any) {
    console.error("Update folder API error:", error);

    // Check for circular reference error from database trigger
    if (error.message?.includes("circular") || error.message?.includes("Circular")) {
      return NextResponse.json(
        { error: "Cannot create circular folder reference" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/folders/[id]
// Delete a folder (moves documents to parent or root)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folderId = params.id;

    // Get folder details and verify ownership
    const { data: folder } = await supabase
      .from("folders")
      .select("*, documents(count)")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if folder has subfolders
    const { data: subfolders } = await supabase
      .from("folders")
      .select("id")
      .eq("parent_folder_id", folderId)
      .limit(1);

    if (subfolders && subfolders.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder with subfolders. Please delete or move subfolders first." },
        { status: 400 }
      );
    }

    // Move documents to parent folder (or null if root)
    const { error: moveError } = await supabase
      .from("documents")
      .update({ folder_id: folder.parent_folder_id })
      .eq("folder_id", folderId);

    if (moveError) {
      console.error("Error moving documents:", moveError);
      return NextResponse.json(
        { error: "Failed to move documents from folder" },
        { status: 500 }
      );
    }

    // Delete folder
    const { error: deleteError } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (deleteError) {
      console.error("Error deleting folder:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete folder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete folder API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
