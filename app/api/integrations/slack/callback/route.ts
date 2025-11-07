import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/integrations/config";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=missing_params`
      );
    }

    // Verify state token
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_state`
      );
    }

    const { user_id, provider, timestamp } = stateData;

    // Check if state is too old (10 minutes)
    if (Date.now() - timestamp > 600000) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=expired_state`
      );
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens("slack", code);

    // Create Supabase client
    const supabase = await createClient();

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user_id)
      .single();

    if (!profile) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=profile_not_found`
      );
    }

    // Calculate token expiration
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Save integration to database
    const { error: insertError } = await supabase.from("integrations").upsert(
      {
        organization_id: profile.organization_id,
        user_id,
        provider: "slack",
        provider_user_id: tokenData.authed_user?.id || null,
        provider_team_id: tokenData.team?.id || null,
        access_token: tokenData.access_token, // NOTE: Should be encrypted in production
        refresh_token: tokenData.refresh_token || null, // NOTE: Should be encrypted in production
        token_expires_at: expiresAt,
        scopes: tokenData.scope ? tokenData.scope.split(",") : [],
        metadata: {
          team_name: tokenData.team?.name || null,
          user_name: tokenData.authed_user?.name || null,
        },
        is_active: true,
        last_synced_at: new Date().toISOString(),
      },
      {
        onConflict: "organization_id,provider,provider_user_id",
      }
    );

    if (insertError) {
      console.error("Error saving integration:", insertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=save_failed`
      );
    }

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=slack_connected`
    );
  } catch (error) {
    console.error("Slack OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`
    );
  }
}
