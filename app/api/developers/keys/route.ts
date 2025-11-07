import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendApiKeyCreatedEmail } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Generate new API key
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const { name, environment = "production" } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!["production", "development", "test"].includes(environment)) {
      return NextResponse.json(
        { error: "Invalid environment" },
        { status: 400 }
      );
    }

    // Generate API key
    const apiKey = generateApiKey(environment);
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 12); // Show first 12 chars

    // Get rate limits based on user's subscription plan
    const rateLimits = await getRateLimits(supabase, profile.organization_id);

    // Create API key record
    const { data: key, error: keyError } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        environment,
        status: "active",
        rate_limit_per_minute: rateLimits.per_minute,
        rate_limit_per_day: rateLimits.per_day,
      })
      .select()
      .single();

    if (keyError) {
      console.error("Error creating API key:", keyError);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    // Get user profile for email
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    // Send welcome email with API key details (not including the key itself)
    if (userProfile) {
      await sendApiKeyCreatedEmail({
        user_email: userProfile.email || user.email || "",
        user_name: userProfile.full_name || "Developer",
        key_name: name,
        environment,
        rate_limits: {
          per_minute: rateLimits.per_minute,
          per_day: rateLimits.per_day,
        },
      });
    }

    // Return the FULL key only once (never stored or shown again)
    return NextResponse.json({
      success: true,
      api_key: apiKey, // ONLY shown on creation
      key_id: key.id,
      key_prefix: keyPrefix,
      name: key.name,
      environment: key.environment,
      rate_limits: {
        per_minute: key.rate_limit_per_minute,
        per_day: key.rate_limit_per_day,
      },
      warning:
        "Save this key securely. You won't be able to see it again!",
    });
  } catch (error: any) {
    console.error("API key generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate API key" },
      { status: 500 }
    );
  }
}

/**
 * GET - List user's API keys
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's API keys (excluding the actual key hash for security)
    const { data: keys, error } = await supabase
      .from("api_keys")
      .select(`
        id,
        name,
        key_prefix,
        environment,
        status,
        rate_limit_per_minute,
        rate_limit_per_day,
        total_requests,
        last_used_at,
        created_at,
        expires_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keys: keys || [],
    });
  } catch (error: any) {
    console.error("API keys fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Revoke API key
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("key_id");

    if (!keyId) {
      return NextResponse.json(
        { error: "key_id is required" },
        { status: 400 }
      );
    }

    // Revoke the key (soft delete by setting status)
    const { error } = await supabase
      .from("api_keys")
      .update({ status: "revoked" })
      .eq("id", keyId)
      .eq("user_id", user.id); // Ensure user owns the key

    if (error) {
      console.error("Error revoking API key:", error);
      return NextResponse.json(
        { error: "Failed to revoke API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error: any) {
    console.error("API key revocation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke API key" },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure API key
 */
function generateApiKey(environment: string): string {
  const prefix = environment === "production" ? "sk_prod_" :
                 environment === "development" ? "sk_dev_" :
                 "sk_test_";

  // Generate 32 bytes of random data, encode as base64
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString("base64url"); // URL-safe base64

  return `${prefix}${key}`;
}

/**
 * Hash API key for secure storage
 */
function hashApiKey(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

/**
 * Get rate limits based on subscription plan
 */
async function getRateLimits(
  supabase: any,
  organizationId: string
): Promise<{ per_minute: number; per_day: number }> {
  // Fetch organization's subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_name")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    // Default to free tier
    return { per_minute: 10, per_day: 1000 };
  }

  // Map plan to rate limits
  const rateLimitMap: Record<string, { per_minute: number; per_day: number }> = {
    free: { per_minute: 10, per_day: 1000 },
    hobby: { per_minute: 60, per_day: 25000 },
    pro: { per_minute: 300, per_day: 100000 },
    scale: { per_minute: 1000, per_day: 500000 },
    enterprise: { per_minute: 5000, per_day: 10000000 },
  };

  return rateLimitMap[subscription.plan_name] || rateLimitMap.free;
}
