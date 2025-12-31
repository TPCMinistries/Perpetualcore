import { processAndStoreDocument } from "@/lib/documents/processor";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for processing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, reprocessAll } = body;

    // Handle reprocess all stuck documents
    if (reprocessAll) {
      const supabase = createAdminClient();

      const { data: stuckDocs, error } = await supabase
        .from("documents")
        .select("id, title")
        .eq("status", "processing");

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
      return new Response("Document ID required", { status: 400 });
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
