import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/documents/[id]/visibility
 * Update document visibility (personal, team, organization, public)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await req.json();
    const { visibility } = body;

    if (!["personal", "team", "organization", "public"].includes(visibility)) {
      return new Response("Invalid visibility value", { status: 400 });
    }

    // Verify document ownership or admin rights
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("user_id, organization_id")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return new Response("Document not found", { status: 404 });
    }

    // Only owner can change visibility
    if (document.user_id !== user.id) {
      return new Response("Only the document owner can change visibility", {
        status: 403,
      });
    }

    // Update visibility
    const { data: updated, error: updateError } = await supabase
      .from("documents")
      .update({ visibility })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating visibility:", updateError);
      return new Response("Failed to update visibility", { status: 500 });
    }

    // Log activity
    await supabase.from("activity_feed").insert({
      organization_id: document.organization_id,
      user_id: user.id,
      activity_type: "updated",
      entity_type: "document",
      entity_id: documentId,
      metadata: {
        field: "visibility",
        new_value: visibility,
      },
      is_public: visibility === "organization" || visibility === "public",
    });

    return Response.json({ document: updated });
  } catch (error) {
    console.error("Document visibility update error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
