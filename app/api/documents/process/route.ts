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
      console.log(`🔄 Reprocessing all stuck documents...`);
      const supabase = createAdminClient();

      const { data: stuckDocs, error } = await supabase
        .from("documents")
        .select("id, title")
        .eq("status", "processing");

      if (error) {
        console.error("Failed to fetch stuck documents:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }

      console.log(`📋 Found ${stuckDocs?.length || 0} stuck documents`);

      const results = [];
      for (const doc of stuckDocs || []) {
        try {
          console.log(`🔄 Processing: ${doc.title} (${doc.id})`);
          await processAndStoreDocument(doc.id);
          results.push({ id: doc.id, title: doc.title, success: true });
          console.log(`✅ Completed: ${doc.title}`);
        } catch (err) {
          console.error(`❌ Failed: ${doc.title}`, err);
          results.push({ id: doc.id, title: doc.title, success: false, error: String(err) });
        }
      }

      return Response.json({ success: true, processed: results.length, results });
    }

    // Handle single document processing
    if (!documentId) {
      return new Response("Document ID required", { status: 400 });
    }

    console.log(`🔄 Starting processing for document ${documentId}`);

    // Process document
    await processAndStoreDocument(documentId);

    console.log(`✅ Document ${documentId} processed successfully`);

    return Response.json({ success: true, documentId });
  } catch (error) {
    console.error("Document processing error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
