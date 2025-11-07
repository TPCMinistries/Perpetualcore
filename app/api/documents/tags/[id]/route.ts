import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/documents/tags/[id]
// Delete a tag
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tagId = params.id;

    // Verify tag exists and belongs to organization
    const { data: tag } = await supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Delete tag (document_tags will be cascade deleted)
    const { error: deleteError } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (deleteError) {
      console.error("Error deleting tag:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete tag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tag API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
