import { processAndStoreDocument } from "@/lib/documents/processor";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for processing

export async function POST(req: NextRequest) {
  try {
    // Auth check - verify user is authenticated
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization for ownership verification
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const organizationId = profile?.organization_id;

    const body = await req.json();
    const { documentId, reprocessAll } = body;

    const supabase = createAdminClient();

    // Handle reprocess all stuck documents
    if (reprocessAll) {
      let query = supabase
        .from("documents")
        .select("id, title")
        .in("status", ["processing", "failed"]);

      // Scope to user's org if available
      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data: stuckDocs, error } = await query;

      if (error) {
        console.error("Failed to fetch stuck documents:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }

      const results = [];
      for (const doc of stuckDocs || []) {
        try {
          await processAndStoreDocument(doc.id);
          results.push({ id: doc.id, title: doc.title, success: true });
        } catch (err) {
          console.error(`Processing failed for ${doc.id}:`, err);
          results.push({ id: doc.id, title: doc.title, success: false, error: String(err) });
        }
      }

      return Response.json({ success: true, processed: results.length, results });
    }

    // Handle single document processing
    if (!documentId) {
      return Response.json({ success: false, error: "Document ID required" }, { status: 400 });
    }

    // Verify the user owns this document
    let ownershipQuery = supabase
      .from("documents")
      .select("id")
      .eq("id", documentId);

    if (organizationId) {
      ownershipQuery = ownershipQuery.eq("organization_id", organizationId);
    } else {
      ownershipQuery = ownershipQuery.eq("user_id", user.id);
    }

    const { data: ownedDoc } = await ownershipQuery.single();
    if (!ownedDoc) {
      return Response.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    await processAndStoreDocument(documentId);

    return Response.json({ success: true, documentId });
  } catch (error) {
    console.error("Document processing error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
