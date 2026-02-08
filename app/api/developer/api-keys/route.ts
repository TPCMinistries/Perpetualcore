import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - List all API keys for the user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: apiKeys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, key_hash, scopes, last_used_at, created_at, expires_at, total_requests, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }

    // Map total_requests to usage_count for frontend compatibility
    const mappedKeys = (apiKeys || []).map((key) => ({
      ...key,
      usage_count: key.total_requests,
    }));

    return NextResponse.json({ apiKeys: mappedKeys });
  } catch (error: unknown) {
    console.error("API keys fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch API keys";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new API key
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "User profile or organization not found" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, scopes: requestedScopes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Available scopes
    const ALL_SCOPES = [
      "chat:write",
      "documents:read",
      "documents:write",
      "search:read",
      "workflows:execute",
    ];

    // Use requested scopes or default to all scopes
    const scopes = Array.isArray(requestedScopes) && requestedScopes.length > 0
      ? requestedScopes.filter((s: string) => ALL_SCOPES.includes(s))
      : ALL_SCOPES;

    // Generate a secure API key
    const apiKey = `pc_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const keyPrefix = apiKey.substring(0, 12); // Show first 12 chars (pc_xxxxxxxx)

    const { data: newKey, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes,
        is_active: true,
        total_requests: 0,
      })
      .select("id, name, key_prefix, scopes, created_at, expires_at, is_active, total_requests")
      .single();

    if (error) {
      console.error("Error creating API key:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    // Map total_requests to usage_count for frontend compatibility
    const responseKey = {
      ...newKey,
      usage_count: newKey.total_requests,
    };

    // Return the full API key only once - it won't be retrievable again
    return NextResponse.json({
      key: apiKey, // Only returned on creation
      apiKey: responseKey,
      message: "API key created successfully. Save it now - you won't be able to see it again.",
    });
  } catch (error: unknown) {
    console.error("API key creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create API key";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
