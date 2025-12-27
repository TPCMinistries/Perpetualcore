import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  processMedia,
  processWebClip,
  detectMediaType,
} from "@/lib/documents/multimodal-processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for media processing

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await req.json();
    const { documentId, sourceUrl } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Get document details
    const { data: document } = await supabase
      .from("documents")
      .select("id, organization_id, file_url, title, mime_type")
      .eq("id", documentId)
      .single();

    if (!document || document.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    let result;

    // If sourceUrl is provided, treat as web clip
    if (sourceUrl) {
      result = await processWebClip(
        sourceUrl,
        documentId,
        profile.organization_id
      );
    } else if (document.file_url) {
      // Process based on file type
      result = await processMedia(
        document.file_url,
        documentId,
        profile.organization_id,
        document.title || "file",
        document.mime_type
      );
    } else {
      return NextResponse.json(
        { error: "No file URL or source URL provided" },
        { status: 400 }
      );
    }

    // Log activity
    await supabase.from("document_activity").insert({
      organization_id: profile.organization_id,
      document_id: documentId,
      user_id: user.id,
      activity_type: "process_media",
      metadata: {
        mediaType: result.mediaType,
        success: result.success,
        hasTranscription: !!result.transcription,
        hasOcr: !!result.ocrText,
        hasDescription: !!result.aiDescription,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Processing failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaType: result.mediaType,
      transcription: result.transcription,
      ocrText: result.ocrText,
      aiDescription: result.aiDescription,
      duration: result.duration,
      thumbnailUrl: result.thumbnailUrl,
    });
  } catch (error: any) {
    console.error("Media processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process media" },
      { status: 500 }
    );
  }
}

/**
 * GET - Check processing status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const { data: document } = await supabase
      .from("documents")
      .select(`
        media_type,
        transcription_status,
        transcription,
        ocr_text,
        ai_description,
        duration_seconds,
        thumbnail_url,
        media_metadata
      `)
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mediaType: document.media_type,
      transcriptionStatus: document.transcription_status,
      hasTranscription: !!document.transcription,
      hasOcr: !!document.ocr_text,
      hasDescription: !!document.ai_description,
      duration: document.duration_seconds,
      thumbnailUrl: document.thumbnail_url,
      metadata: document.media_metadata,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
