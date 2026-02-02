import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveCredential, deleteCredential, validateCredential } from "@/lib/skills/credentials";

/**
 * POST /api/skills/credentials
 * Save a new API key for a skill
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, label } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    // Validate the API key first
    const validation = await validateCredential(provider, apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid API key" },
        { status: 400 }
      );
    }

    // Save the credential (encrypted)
    const result = await saveCredential(provider, apiKey, {
      userId: user.id,
      label,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save credential" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key saved successfully",
      metadata: validation.metadata,
    });
  } catch (error: any) {
    console.error("Error saving credential:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills/credentials?provider=xxx
 * Remove an API key for a skill
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const result = await deleteCredential(provider, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete credential" },
        { status: 500 }
      );
    }

    // Also disable the skill
    await supabase
      .from("user_skills")
      .update({ enabled: false })
      .eq("user_id", user.id)
      .eq("skill_id", provider);

    return NextResponse.json({
      success: true,
      message: "Credential removed successfully",
    });
  } catch (error: any) {
    console.error("Error deleting credential:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/skills/credentials
 * List user's connected skills (without exposing keys)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get credentials without the actual keys
    const { data: credentials } = await supabase
      .from("skill_credentials")
      .select("id, provider, label, is_active, last_used_at, created_at")
      .eq("user_id", user.id);

    return NextResponse.json({
      credentials: credentials || [],
    });
  } catch (error: any) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
