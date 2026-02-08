import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE - Revoke/delete an API key
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keyId = params.id;

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("user_id", user.id); // Ensure user owns the key

    if (error) {
      console.error("Error deleting API key:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully"
    });
  } catch (error: unknown) {
    console.error("API key deletion error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete API key";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET - Get details of a specific API key
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keyId = params.id;

    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used_at, expires_at, is_active, usage_count")
      .eq("id", keyId)
      .eq("user_id", user.id)
      .single();

    if (error || !apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ apiKey });
  } catch (error: unknown) {
    console.error("API key fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch API key";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
