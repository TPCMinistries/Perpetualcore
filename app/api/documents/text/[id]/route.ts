import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documents/text/[id]
// Get a text document
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;

    // Get document with ownership verification
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Get text document API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/text/[id]
// Update a text document
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;

    // Verify ownership
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("user_id")
      .eq("id", documentId)
      .single();

    if (!existingDoc || existingDoc.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Calculate word and character counts
    const plainText = content.replace(/<[^>]*>/g, "");
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const charCount = plainText.length;

    // Update document
    const { data: document, error: updateError } = await supabase
      .from("documents")
      .update({
        title,
        content_text: plainText,
        content_html: content,
        file_size: new Blob([content]).size,
        metadata: {
          wordCount,
          charCount,
          isRichText: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating document:", updateError);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Update text document API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
