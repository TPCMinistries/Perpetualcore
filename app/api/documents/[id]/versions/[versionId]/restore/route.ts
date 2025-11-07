import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/documents/[id]/versions/[versionId]/restore
export async function POST(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
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
    const versionId = params.versionId;

    // Get the version to restore
    const { data: versionToRestore, error: fetchError } = await supabase
      .from("document_versions")
      .select("*")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .single();

    if (fetchError || !versionToRestore) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
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

    // Create a new version from the restored content
    const { data: newVersion, error: createError } = await supabase
      .from("document_versions")
      .insert({
        organization_id: profile.organization_id,
        document_id: documentId,
        version_number: newVersionNumber,
        title: versionToRestore.title,
        content: versionToRestore.content,
        content_snapshot: versionToRestore.content_snapshot,
        changed_by_user_id: user.id,
        change_summary: `Restored from version ${versionToRestore.version_number}`,
        content_length: versionToRestore.content_length,
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
      console.error("Error creating restore version:", createError);
      return NextResponse.json(
        { error: "Failed to restore version" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      version: newVersion,
      message: `Restored to version ${versionToRestore.version_number}`,
    });
  } catch (error) {
    console.error("Restore version API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
