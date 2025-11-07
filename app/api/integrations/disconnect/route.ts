import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId } = await request.json();

    // For OAuth integrations (Google), we need to revoke tokens
    if (integrationId === "google-calendar" || integrationId === "gmail") {
      // In a real implementation, you would:
      // 1. Fetch stored OAuth tokens from database
      // 2. Call Google's token revocation endpoint
      // 3. Delete tokens from database

      return NextResponse.json({
        success: true,
        message: "Google integration disconnected. Please remove tokens from database.",
      });
    }

    // For other integrations, just return success
    // (they are configured via environment variables)
    return NextResponse.json({
      success: true,
      message: "Integration configuration is set via environment variables. To disconnect, remove the env vars from your .env.local file.",
    });
  } catch (error) {
    console.error("Integration disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
