import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGmailCode } from "@/lib/email/gmail";

export const runtime = "nodejs";

/**
 * Gmail OAuth callback
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // user ID
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/inbox?error=${encodeURIComponent(error)}`,
          req.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/inbox?error=missing_params", req.url)
      );
    }

    const supabase = await createClient();

    // Verify user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== state) {
      return NextResponse.redirect(
        new URL("/dashboard/inbox?error=unauthorized", req.url)
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(
        new URL("/dashboard/inbox?error=no_profile", req.url)
      );
    }

    // Exchange code for tokens
    const result = await exchangeGmailCode(code, user.id, profile.organization_id);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/inbox?error=${encodeURIComponent(result.error || "unknown")}`,
          req.url
        )
      );
    }

    // Success - redirect to inbox page
    return NextResponse.redirect(
      new URL("/dashboard/inbox?gmail=connected", req.url)
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/inbox?error=callback_failed", req.url)
    );
  }
}
