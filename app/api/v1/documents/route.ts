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
    .select("id, title, file_type, file_size, status, created_at, updated_at", { count: "exact" })
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
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

    // Support both n8n format and standard format
    // n8n format: { title: "string", content: "string", type: "document|transcript|notes", source: "n8n|telegram|manual" }
    // Standard format: { title: "string", content: "string", file_type: "string" }
    const title = body.title || body.filename;
    const content = body.content;
    const fileType = body.file_type || body.type || "document";
    const source = body.source || "api";
    const isN8nFormat = !!body.title;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    // Calculate content size
    const fileSize = content.length;

    // Create document record
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        organization_id: context.organizationId,
        user_id: context.userId,
        title,
        content,
        file_type: fileType,
        file_size: fileSize,
        status: "pending",
        source: source,
        doc_type: fileType,
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
      title: document.title,
      fileType: document.file_type,
      size: document.file_size,
    }).catch(() => {});

    // Return n8n-compatible format when n8n format was used
    if (isN8nFormat) {
      return NextResponse.json(
        {
          id: document.id,
          success: true,
        },
        { status: 201 }
      );
    }

    // Standard format response
    return NextResponse.json(
      {
        id: document.id,
        title: document.title,
        file_type: document.file_type,
        file_size: document.file_size,
        status: document.status,
        created_at: document.created_at,
        message: "Document created successfully",
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
