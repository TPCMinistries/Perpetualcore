import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handle GitHub OAuth callback
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
      console.error("GitHub OAuth error:", error);
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
      .eq("provider", "github")
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
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${redirectUrl}?error=oauth_not_configured`);
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("GitHub token exchange error:", tokenData);
      return NextResponse.redirect(`${redirectUrl}?error=token_exchange_failed`);
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = userResponse.ok ? await userResponse.json() : {};

    // Save integration to database
    await supabase.from("user_integrations").upsert({
      user_id: storedState.user_id,
      provider: "github",
      provider_account_id: githubUser.login || String(githubUser.id) || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      scopes: tokenData.scope ? tokenData.scope.split(",") : [],
      metadata: {
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
      },
      is_active: true,
      last_used_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,provider",
    });

    // Clean up state
    await supabase.from("oauth_states").delete().eq("state", state);

    return NextResponse.redirect(`${redirectUrl}?success=github`);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/integrations?error=callback_failed`);
  }
}
