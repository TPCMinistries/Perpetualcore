import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documents/[id]/versions
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

    // Fetch versions with user info
    const { data: versions, error: versionsError } = await supabase
      .from("document_versions")
      .select(`
        *,
        user:profiles!changed_by_user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });

    if (versionsError) {
      console.error("Error fetching versions:", versionsError);
      return NextResponse.json(
        { error: "Failed to fetch versions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions: versions || [] });
  } catch (error) {
    console.error("Versions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/versions - Create a new version
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const documentId = params.id;
    const body = await request.json();
    const { title, content, change_summary } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    // Get the latest version number
    const { data: latestVersion } = await supabase
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (latestVersion?.version_number || 0) + 1;

    // Create new version
    const { data: version, error: createError } = await supabase
      .from("document_versions")
      .insert({
        organization_id: profile.organization_id,
        document_id: documentId,
        version_number: newVersionNumber,
        title,
        content,
        content_snapshot: {
          title,
          content,
          metadata: {},
        },
        changed_by_user_id: user.id,
        change_summary: change_summary || null,
        content_length: content.length,
      })
      .select(`
        *,
        user:profiles!changed_by_user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error("Error creating version:", createError);
      return NextResponse.json(
        { error: "Failed to create version" },
        { status: 500 }
      );
    }

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Create version API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
