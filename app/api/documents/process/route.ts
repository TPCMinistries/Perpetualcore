import { processAndStoreDocument } from "@/lib/documents/processor";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for processing

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response("Document ID required", { status: 400 });
    }

    if (isDev) console.log(`🔄 Starting async processing for document ${documentId}`);

    // Process document asynchronously
    await processAndStoreDocument(documentId);

    if (isDev) console.log(`✅ Document ${documentId} processed successfully`);

    return Response.json({ success: true, documentId });
  } catch (error) {
    if (isDev) console.error("Document processing error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
