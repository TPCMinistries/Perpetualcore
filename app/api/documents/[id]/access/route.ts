import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/documents/[id]/access
 * Get list of users who have access to this document
 */
export async function GET(
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

    // Verify document exists and user has access
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("user_id")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return new Response("Document not found", { status: 404 });
    }

    // Only owner can view access list
    if (document.user_id !== user.id) {
      return new Response("Only the document owner can view access list", {
        status: 403,
      });
    }

    // Get all users with access
    const { data: access, error: accessError } = await supabase
      .from("document_access")
      .select(`
        user_id,
        access_level,
        granted_at,
        granted_by,
        share_message,
        user:user_id (
          email,
          full_name
        )
      `)
      .eq("document_id", documentId)
      .order("granted_at", { ascending: false });

    if (accessError) {
      console.error("Error fetching document access:", accessError);
      return new Response("Failed to fetch access list", { status: 500 });
    }

    return Response.json({ access: access || [] });
  } catch (error) {
    console.error("Document access list error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
