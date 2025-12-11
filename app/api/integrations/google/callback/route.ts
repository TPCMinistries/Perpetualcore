import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const redirectUrl = `${baseUrl}/dashboard/settings/integrations`;

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${redirectUrl}?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${redirectUrl}?error=missing_params`);
    }

    const supabase = await createClient();

    // Verify state
    const { data: storedState } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("provider", "google")
      .single();

    if (!storedState) {
      return NextResponse.redirect(`${redirectUrl}?error=invalid_state`);
    }

    // Check expiry
    if (new Date(storedState.expires_at) < new Date()) {
      await supabase.from("oauth_states").delete().eq("state", state);
      return NextResponse.redirect(`${redirectUrl}?error=state_expired`);
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${redirectUrl}?error=oauth_not_configured`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${baseUrl}/api/integrations/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(`${redirectUrl}?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = userInfoResponse.ok ? await userInfoResponse.json() : {};

    // Determine integration ID based on service
    const service = storedState.service || "gmail";
    const integrationId = service === "calendar" ? "google-calendar" : "gmail";

    // Save integration to database
    await supabase.from("user_integrations").upsert({
      user_id: storedState.user_id,
      integration_id: integrationId,
      is_connected: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      settings: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        scope: tokens.scope,
      },
    }, {
      onConflict: "user_id,integration_id",
    });

    // Clean up state
    await supabase.from("oauth_states").delete().eq("state", state);

    return NextResponse.redirect(`${redirectUrl}?success=${integrationId}`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/integrations?error=callback_failed`);
  }
}
