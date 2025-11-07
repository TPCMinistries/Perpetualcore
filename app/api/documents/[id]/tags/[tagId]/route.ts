import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/documents/[id]/tags/[tagId]
// Remove a tag from a document
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;
    const tagId = params.tagId;

    // Verify document exists and user has access
    const { data: document } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Remove tag from document
    const { error: deleteError } = await supabase
      .from("document_tags")
      .delete()
      .eq("document_id", documentId)
      .eq("tag_id", tagId);

    if (deleteError) {
      console.error("Error removing tag from document:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove tag from document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove document tag API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
