import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, syncGoogleCalendarEvents } from "@/lib/calendar/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handle Google Calendar OAuth callback
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/calendar?error=${error}`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?error=missing_params", req.url)
      );
    }

    const userId = state;
    const supabase = await createClient();

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?error=no_tokens", req.url)
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?error=no_profile", req.url)
      );
    }

    // Get user's email from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const userInfo = await userInfoResponse.json();

    // Store calendar account
    await supabase.from("calendar_accounts").upsert({
      user_id: userId,
      organization_id: profile.organization_id,
      provider: "google",
      provider_account_id: userInfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      sync_enabled: true,
      last_sync_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,provider,provider_account_id",
    });

    // Trigger initial sync (don't wait for it)
    syncGoogleCalendarEvents(userId, profile.organization_id).catch((err) =>
      console.error("Initial sync error:", err)
    );

    return NextResponse.redirect(
      new URL("/dashboard/calendar?connected=true", req.url)
    );
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/calendar?error=callback_failed", req.url)
    );
  }
}
