import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Handles Supabase auth callbacks including:
 * - Magic link verification (from SSO OAuth flow)
 * - Email confirmation links
 * - Password reset links
 * - OAuth provider redirects
 *
 * Query params:
 * - token_hash: The hashed token from the magic link
 * - type: The token type (magiclink, signup, recovery, email_change, invite)
 * - code: OAuth authorization code (from Supabase OAuth providers)
 * - next: Where to redirect after successful auth (default: /dashboard)
 * - error: Error message from auth flow
 * - error_description: Detailed error description
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const redirectTo = request.nextUrl.clone();

  // Handle errors from auth provider
  if (error) {
    console.error("[AuthCallback] Error:", error, errorDescription);
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set(
      "error",
      errorDescription || error
    );
    redirectTo.search = redirectTo.searchParams.toString();
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();

  // Handle OAuth code exchange (from Supabase's built-in OAuth providers)
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[AuthCallback] Code exchange error:", exchangeError);
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set("error", "Authentication failed");
      redirectTo.search = redirectTo.searchParams.toString();
      return NextResponse.redirect(redirectTo);
    }

    redirectTo.pathname = next;
    redirectTo.search = "";
    return NextResponse.redirect(redirectTo);
  }

  // Handle token hash verification (magic links, SSO, email confirmations)
  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "magiclink"
        | "signup"
        | "recovery"
        | "email_change"
        | "invite",
    });

    if (verifyError) {
      console.error("[AuthCallback] Token verify error:", verifyError);
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set(
        "error",
        verifyError.message || "Verification failed"
      );
      redirectTo.search = redirectTo.searchParams.toString();
      return NextResponse.redirect(redirectTo);
    }

    // For password recovery, redirect to update-password page
    if (type === "recovery") {
      redirectTo.pathname = "/auth/update-password";
      redirectTo.search = "";
      return NextResponse.redirect(redirectTo);
    }

    redirectTo.pathname = next;
    redirectTo.search = "";
    return NextResponse.redirect(redirectTo);
  }

  // No valid params — redirect to login
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "Invalid callback parameters");
  redirectTo.search = redirectTo.searchParams.toString();
  return NextResponse.redirect(redirectTo);
}
