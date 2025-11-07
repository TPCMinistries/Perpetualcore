import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAuthorizationUrl } from "@/lib/sso/oauth";
import { cookies } from "next/headers";

// GET /api/sso/oauth/login?provider_id=xxx
// Initiate OAuth/OIDC SSO login
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get provider configuration
    const { data: provider, error } = await supabase
      .from("sso_providers")
      .select("*")
      .eq("id", providerId)
      .eq("enabled", true)
      .single();

    if (error || !provider) {
      return NextResponse.json(
        { error: "SSO provider not found or disabled" },
        { status: 404 }
      );
    }

    if (!["oauth2", "oidc"].includes(provider.provider_type)) {
      return NextResponse.json(
        { error: "Provider is not an OAuth/OIDC provider" },
        { status: 400 }
      );
    }

    // Generate OAuth authorization URL with PKCE
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/oauth/callback`;

    try {
      const { url, codeVerifier, state } = generateAuthorizationUrl(
        provider,
        callbackUrl,
        providerId // Include provider ID in state
      );

      // Store code verifier in HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set("oauth_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      });

      // Store state in HTTP-only cookie for CSRF protection
      cookieStore.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      });

      // Store provider ID
      cookieStore.set("oauth_provider_id", providerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });

      // Redirect to OAuth provider
      return NextResponse.redirect(url);
    } catch (error: any) {
      console.error("Error generating OAuth authorization URL:", error);
      return NextResponse.json(
        { error: "Failed to initiate OAuth login", details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("OAuth login error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth login" },
      { status: 500 }
    );
  }
}
