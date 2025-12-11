import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Initiate Google OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID." },
        { status: 500 }
      );
    }

    // Determine the service type from query params
    const searchParams = request.nextUrl.searchParams;
    const service = searchParams.get("service") || "gmail"; // gmail, calendar, drive

    // Build scopes based on service
    const baseScopes = [
      "openid",
      "email",
      "profile",
    ];

    const serviceScopes: Record<string, string[]> = {
      gmail: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
      calendar: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      drive: [
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    };

    const scopes = [...baseScopes, ...(serviceScopes[service] || serviceScopes.gmail)];

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      service,
      timestamp: Date.now(),
    })).toString("base64");

    // Store state in database for verification
    await supabase.from("oauth_states").upsert({
      user_id: user.id,
      state,
      provider: "google",
      service,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
    });

    // Build OAuth URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const redirectUri = `${baseUrl}/api/integrations/google/callback`;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Google OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google OAuth" },
      { status: 500 }
    );
  }
}
