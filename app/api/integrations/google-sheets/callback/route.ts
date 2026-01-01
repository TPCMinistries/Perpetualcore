import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTokensFromCode } from "@/lib/integrations/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=oauth_denied", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=missing_params", request.url)
      );
    }

    // Parse state
    let stateData: { userId: string; returnUrl: string };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=invalid_state", request.url)
      );
    }

    // Verify user session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=unauthorized", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Store integration in database
    const { error: dbError } = await supabase.from("integrations").upsert(
      {
        user_id: user.id,
        provider: "google_sheets",
        credentials: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
        expires_at: new Date(tokens.expiry_date).toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,provider",
      }
    );

    if (dbError) {
      console.error("Failed to store integration:", dbError);
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=storage_failed", request.url)
      );
    }

    // Redirect to return URL
    const returnUrl = stateData.returnUrl || "/dashboard/integrations";
    return NextResponse.redirect(
      new URL(`${returnUrl}?success=google_sheets_connected`, request.url)
    );
  } catch (error) {
    console.error("Google Sheets callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=callback_failed", request.url)
    );
  }
}
