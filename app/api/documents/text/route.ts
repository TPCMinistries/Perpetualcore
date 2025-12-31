import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/documents/text
// Create a new text document
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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

    // Create document record
    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id || user.id, // Fallback to user.id if no org
        title,
        file_type: "text/plain",
        file_size: new Blob([content]).size,
        status: "completed",
        content: plainText, // Use 'content' column (not content_text)
        metadata: {
          wordCount,
          charCount,
          isRichText: content.includes("<"),
          originalHtml: content.includes("<") ? content : null,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating document:", insertError);
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Create text document API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
