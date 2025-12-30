import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/documents/[id]/share
 * Share document with specific users
 */
export async function POST(
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
    const {
      share_with_user_ids,
      access_level = "view",
      message,
    } = body;

    if (!share_with_user_ids || !Array.isArray(share_with_user_ids)) {
      return new Response("share_with_user_ids must be an array", { status: 400 });
    }

    if (!["view", "comment", "edit", "admin"].includes(access_level)) {
      return new Response("Invalid access_level", { status: 400 });
    }

    // Verify document exists and get organization
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("user_id, organization_id, title")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return new Response("Document not found", { status: 404 });
    }

    // Only owner can share
    if (document.user_id !== user.id) {
      return new Response("Only the document owner can share it", {
        status: 403,
      });
    }

    // Use the SQL function to share with each user
    const shareResults = await Promise.all(
      share_with_user_ids.map(async (userId) => {
        const { data, error } = await supabase.rpc("share_document_with_user", {
          doc_id: documentId,
          target_user_id: userId,
          level: access_level,
          granted_by_user: user.id,
          share_msg: message || null,
        });

        if (error) {
          console.error(`Error sharing with user ${userId}:`, error);
          return { userId, success: false, error };
        }

        return { userId, success: true };
      })
    );

    // Update document's shared_with_user_ids array
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        shared_with_user_ids: supabase.sql`array_cat(
          COALESCE(shared_with_user_ids, '{}'),
          ${share_with_user_ids}::uuid[]
        )`,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document shared_with_user_ids:", updateError);
    }

    // Log activity for each successful share
    for (const result of shareResults) {
      if (result.success) {
        await supabase.from("activity_feed").insert({
          organization_id: document.organization_id,
          user_id: user.id,
          activity_type: "shared",
          entity_type: "document",
          entity_id: documentId,
          metadata: {
            shared_with_user_id: result.userId,
            access_level,
            message,
          },
          is_public: false,
          visible_to_user_ids: [result.userId],
        });

        // Create mention if there's a message
        if (message) {
          await supabase.from("mentions").insert({
            organization_id: document.organization_id,
            entity_type: "document",
            entity_id: documentId,
            mentioned_user_id: result.userId,
            mentioned_by_user_id: user.id,
            content_snippet: message.substring(0, 200),
          });
        }
      }
    }

    const successCount = shareResults.filter((r) => r.success).length;
    const failureCount = shareResults.filter((r) => !r.success).length;

    return Response.json({
      success: true,
      shared_count: successCount,
      failed_count: failureCount,
      results: shareResults,
    });
  } catch (error) {
    console.error("Document share error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
