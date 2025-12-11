import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { sendApiKeyCreatedEmail } from "@/lib/email";

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
      .select("id, name, key_preview, created_at, last_used_at, expires_at, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }

    return NextResponse.json({ apiKeys: apiKeys || [] });
  } catch (error: any) {
    console.error("API keys fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch API keys" },
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

    const body = await req.json();
    const { name, expiresIn } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate a secure API key
    const apiKey = `pc_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const keyPreview = `pc_...${apiKey.slice(-8)}`;

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case "30d":
          expiresAt = new Date(now.setDate(now.getDate() + 30));
          break;
        case "90d":
          expiresAt = new Date(now.setDate(now.getDate() + 90));
          break;
        case "1y":
          expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
          break;
        default:
          // No expiration
          break;
      }
    }

    const { data: newKey, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_preview: keyPreview,
        expires_at: expiresAt?.toISOString() || null,
        is_active: true,
      })
      .select("id, name, key_preview, created_at, expires_at")
      .single();

    if (error) {
      console.error("Error creating API key:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Send email notification (don't block the response)
    sendApiKeyCreatedEmail({
      user_email: user.email || "",
      user_name: profile?.full_name || "there",
      key_name: name,
      environment: "production",
      rate_limits: {
        per_minute: 60,
        per_day: 10000,
      },
    }).catch((err) => {
      console.error("Failed to send API key email:", err);
    });

    // Return the full API key only once - it won't be retrievable again
    return NextResponse.json({
      apiKey: {
        ...newKey,
        fullKey: apiKey, // Only returned on creation
      },
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

/**
 * DELETE - Revoke an API key
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error revoking API key:", error);
      return NextResponse.json(
        { error: "Failed to revoke API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "API key revoked successfully" });
  } catch (error: any) {
    console.error("API key deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
