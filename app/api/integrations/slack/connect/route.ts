import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Initiate Slack OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Slack OAuth is not configured. Please set SLACK_CLIENT_ID." },
        { status: 500 }
      );
    }

    // Slack scopes for bot and user permissions
    const scopes = [
      "channels:read",
      "chat:write",
      "users:read",
      "users:read.email",
      "team:read",
    ].join(",");

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString("base64");

    // Store state in database for verification
    await supabase.from("oauth_states").upsert({
      user_id: user.id,
      state,
      provider: "slack",
      service: "slack",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Build OAuth URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const redirectUri = `${baseUrl}/api/integrations/slack/callback`;

    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Slack OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Slack OAuth" },
      { status: 500 }
    );
  }
}
