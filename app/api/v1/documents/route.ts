import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, APIContext } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { webhookEvents } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public API v1 - Documents
 * GET /api/v1/documents - List documents
 * POST /api/v1/documents - Upload document metadata
 */

async function handleGet(req: NextRequest, context: APIContext): Promise<Response> {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status"); // pending, processed, failed
  const search = searchParams.get("search");

  let query = supabase
    .from("documents")
    .select("id, filename, mime_type, size, status, chunk_count, created_at, updated_at", { count: "exact" })
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.ilike("filename", `%${search}%`);
  }

  const { data: documents, error, count } = await query;

  if (error) {
    console.error("[API v1] Documents fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    documents: documents || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    },
  });
}

async function handlePost(req: NextRequest, context: APIContext): Promise<Response> {
  const supabase = await createClient();

  try {
    const body = await req.json();
    const { filename, content, mime_type } = body;

    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "content is required (base64 encoded or plain text)" },
        { status: 400 }
      );
    }

    // Determine if content is base64 or plain text
    let fileContent: string;
    let fileSize: number;

    if (content.startsWith("data:")) {
      // Data URL format
      const base64Part = content.split(",")[1];
      fileContent = base64Part;
      fileSize = Math.ceil((base64Part.length * 3) / 4);
    } else if (/^[A-Za-z0-9+/=]+$/.test(content)) {
      // Pure base64
      fileContent = content;
      fileSize = Math.ceil((content.length * 3) / 4);
    } else {
      // Plain text
      fileContent = Buffer.from(content).toString("base64");
      fileSize = content.length;
    }

    // Create document record
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        organization_id: context.organizationId,
        user_id: context.userId,
        filename,
        mime_type: mime_type || "text/plain",
        size: fileSize,
        status: "pending",
        raw_content: Buffer.from(fileContent, "base64").toString("utf-8"),
      })
      .select()
      .single();

    if (error) {
      console.error("[API v1] Document create error:", error);
      return NextResponse.json(
        { error: "Failed to create document", message: error.message },
        { status: 500 }
      );
    }

    // Dispatch webhook
    webhookEvents.documentUploaded(context.organizationId, {
      documentId: document.id,
      filename: document.filename,
      mimeType: document.mime_type,
      size: document.size,
    }).catch(() => {});

    // Trigger async processing (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/documents/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: document.id }),
    }).catch(() => {});

    return NextResponse.json(
      {
        id: document.id,
        filename: document.filename,
        mime_type: document.mime_type,
        size: document.size,
        status: document.status,
        created_at: document.created_at,
        message: "Document uploaded and queued for processing",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API v1] Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document", message: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return withApiAuth(req, handleGet, {
    requiredScopes: ["documents:read"],
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, handlePost, {
    requiredScopes: ["documents:write"],
  });
}
