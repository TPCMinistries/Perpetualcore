import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Initiate GitHub OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID." },
        { status: 500 }
      );
    }

    // GitHub scopes
    const scopes = [
      "read:user",
      "user:email",
      "repo",
      "read:org",
    ].join(" ");

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString("base64");

    // Store state in database for verification
    await supabase.from("oauth_states").upsert({
      user_id: user.id,
      state,
      provider: "github",
      service: "github",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Build OAuth URL
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("GitHub OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate GitHub OAuth" },
      { status: 500 }
    );
  }
}
