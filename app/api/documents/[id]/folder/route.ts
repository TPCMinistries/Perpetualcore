import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/documents/[id]/folder
// Update document's folder
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;
    const body = await req.json();
    const { folder_id } = body;

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS since we've already verified authorization
    const adminClient = createAdminClient();

    // Update document folder - verify ownership via organization
    const { data, error } = await adminClient
      .from("documents")
      .update({ folder_id })
      .eq("id", documentId)
      .eq("organization_id", profile.organization_id) // Ensure document belongs to user's org
      .select();

    if (error) {
      console.error("Error updating document folder:", error);
      return NextResponse.json(
        { error: "Failed to update folder", details: {
          message: error.message,
          code: error.code
        }},
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document moved successfully",
    });
  } catch (error) {
    console.error("Update folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
