import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documents/[id]/tags
// Get all tags for a specific document
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;

    // Verify document exists and user has access
    const { data: document } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Get document tags
    const { data: documentTags, error: tagsError } = await supabase
      .from("document_tags")
      .select(`
        tag_id,
        tags(*)
      `)
      .eq("document_id", documentId);

    if (tagsError) {
      console.error("Error fetching document tags:", tagsError);
      return NextResponse.json(
        { error: "Failed to fetch document tags" },
        { status: 500 }
      );
    }

    // Extract tags from the response
    const tags = documentTags?.map((dt: any) => dt.tags) || [];

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Get document tags API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/tags
// Add a tag to a document
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;
    const body = await request.json();
    const { tag_id } = body;

    if (!tag_id) {
      return NextResponse.json(
        { error: "tag_id is required" },
        { status: 400 }
      );
    }

    // Verify document exists and user has access
    const { data: document } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify tag exists and belongs to same organization
    const { data: tag } = await supabase
      .from("tags")
      .select("id")
      .eq("id", tag_id)
      .eq("organization_id", document.organization_id)
      .single();

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found or doesn't belong to your organization" },
        { status: 404 }
      );
    }

    // Add tag to document (ignore if already exists)
    const { data: documentTag, error: insertError } = await supabase
      .from("document_tags")
      .insert({
        document_id: documentId,
        tag_id: tag_id,
      })
      .select()
      .single();

    if (insertError) {
      // Check if tag is already added
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Tag already added to this document" },
          { status: 400 }
        );
      }

      console.error("Error adding tag to document:", insertError);
      return NextResponse.json(
        { error: "Failed to add tag to document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documentTag }, { status: 201 });
  } catch (error) {
    console.error("Add document tag API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
