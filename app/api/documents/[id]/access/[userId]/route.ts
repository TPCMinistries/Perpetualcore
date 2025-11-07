import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/documents/[id]/access/[userId]
 * Revoke a user's access to a document
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const documentId = params.id;
    const targetUserId = params.userId;

    // Verify document exists and user is owner
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("user_id, organization_id, shared_with_user_ids")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return new Response("Document not found", { status: 404 });
    }

    // Only owner can revoke access
    if (document.user_id !== user.id) {
      return new Response("Only the document owner can revoke access", {
        status: 403,
      });
    }

    // Delete access entry
    const { error: deleteError } = await supabase
      .from("document_access")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Error deleting document access:", deleteError);
      return new Response("Failed to revoke access", { status: 500 });
    }

    // Remove from shared_with_user_ids array
    const updatedUserIds = (document.shared_with_user_ids || []).filter(
      (id: string) => id !== targetUserId
    );

    const { error: updateError } = await supabase
      .from("documents")
      .update({ shared_with_user_ids: updatedUserIds })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating shared_with_user_ids:", updateError);
    }

    // Log activity
    await supabase.from("activity_feed").insert({
      organization_id: document.organization_id,
      user_id: user.id,
      activity_type: "unshared",
      entity_type: "document",
      entity_id: documentId,
      metadata: {
        revoked_user_id: targetUserId,
      },
      is_public: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Document access revoke error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
