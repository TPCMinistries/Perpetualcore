import { processAndStoreDocument } from "@/lib/documents/processor";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for processing

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response("Document ID required", { status: 400 });
    }

    console.log(`🔄 Starting async processing for document ${documentId}`);

    // Process document asynchronously
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
