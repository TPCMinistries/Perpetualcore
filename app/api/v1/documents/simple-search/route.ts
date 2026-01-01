import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simple Document Search API (no vector search required)
 * POST /api/v1/documents/simple-search
 *
 * This endpoint performs text-based search without requiring embeddings.
 * Use this if the vector search function is not set up.
 *
 * Request body:
 * {
 *   "query": "search query",
 *   "limit": 20,
 *   "folder_id": "optional-folder-uuid",
 *   "tag": "optional-tag-name"
 * }
 *
 * Authentication:
 * - Header: X-API-Key: your_api_key
 * - Or: Authorization: Bearer your_api_key
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check for API key authentication
    const apiKey = req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required. Use X-API-Key header or Authorization: Bearer" },
        { status: 401 }
      );
    }

    // Validate API key - simple check against api_keys table
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id, organization_id, scopes")
      .eq("is_active", true)
      .limit(100);

    // Find matching key by hash
    const crypto = await import("crypto");
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const matchingKey = keyData?.find((k: any) => {
      // Check if key_hash column exists or compare prefix
      return k.key_hash === keyHash || apiKey.startsWith(k.key_prefix || "");
    });

    // If no API key validation, fall back to session auth
    let userId: string;
    let organizationId: string;

    if (matchingKey) {
      userId = matchingKey.user_id;
      organizationId = matchingKey.organization_id;
    } else {
      // Try session auth as fallback
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: "Invalid API key or not authenticated" },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      userId = user.id;
      organizationId = profile?.organization_id;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      query,
      limit = 20,
      folder_id,
      tag,
    }: {
      query?: string;
      limit?: number;
      folder_id?: string;
      tag?: string;
    } = body;

    // Build query
    let dbQuery = supabase
      .from("documents")
      .select(`
        id,
        title,
        filename,
        file_type,
        file_size,
        status,
        visibility,
        summary,
        created_at,
        updated_at,
        folder_id,
        tags:document_tags(tag:tags(id, name, color))
      `)
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(Math.min(limit, 100));

    // Apply text search if query provided
    if (query && query.trim()) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,filename.ilike.%${query}%,summary.ilike.%${query}%`);
    }

    // Filter by folder
    if (folder_id) {
      dbQuery = dbQuery.eq("folder_id", folder_id);
    }

    const { data: documents, error } = await dbQuery;

    if (error) {
      console.error("Document search error:", error);
      return NextResponse.json(
        { error: "Search failed", details: error.message },
        { status: 500 }
      );
    }

    // Filter by tag if specified (post-query since it's a nested relation)
    let filteredDocs = documents || [];
    if (tag) {
      filteredDocs = filteredDocs.filter((doc: any) =>
        doc.tags?.some((t: any) => t.tag?.name?.toLowerCase() === tag.toLowerCase())
      );
    }

    // Format response
    const results = filteredDocs.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      file_type: doc.file_type,
      file_size: doc.file_size,
      summary: doc.summary,
      visibility: doc.visibility,
      folder_id: doc.folder_id,
      tags: doc.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    }));

    return NextResponse.json({
      query: query || null,
      results,
      total: results.length,
    });
  } catch (error: any) {
    console.error("[API v1] Simple search error:", error);
    return NextResponse.json(
      { error: "Search failed", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Also support GET for simple queries
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || searchParams.get("query");
  const limit = searchParams.get("limit");

  // Convert to POST request format
  const fakeReq = {
    ...req,
    json: async () => ({
      query,
      limit: limit ? parseInt(limit) : 20,
    }),
  } as NextRequest;

  return POST(fakeReq);
}
