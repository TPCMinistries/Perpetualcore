import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForToken,
  fetchUserInfo,
  decodeIdToken,
  mapOAuthAttributes,
} from "@/lib/sso/oauth";
import { cookies } from "next/headers";

// GET /api/sso/oauth/callback?code=xxx&state=xxx
// Handle OAuth callback from provider
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Code and state are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Verify state (CSRF protection)
    const storedState = cookieStore.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // Get code verifier from cookie
    const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;
    if (!codeVerifier) {
      return NextResponse.json(
        { error: "Code verifier not found" },
        { status: 400 }
      );
    }

    // Get provider ID from cookie
    const providerId = cookieStore.get("oauth_provider_id")?.value;
    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID not found" },
        { status: 400 }
      );
    }

    // Clean up cookies
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_code_verifier");
    cookieStore.delete("oauth_provider_id");

    const supabase = createClient();

    // Get provider configuration
    const { data: provider, error: providerError } = await supabase
      .from("sso_providers")
      .select("*")
      .eq("id", providerId)
      .eq("enabled", true)
      .single();

    if (providerError || !provider) {
      console.error("Provider fetch error:", providerError);
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        null,
        false,
        "Provider not found"
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Provider+not+found`
      );
    }

    // Exchange code for tokens
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/oauth/callback`;

    let tokenResponse;
    try {
      tokenResponse = await exchangeCodeForToken(
        provider,
        callbackUrl,
        code,
        codeVerifier
      );
    } catch (error: any) {
      console.error("Token exchange error:", error);
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        null,
        false,
        "Token exchange failed",
        error.message
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Authentication+failed`
      );
    }

    // Get user info
    let userInfo;
    if (tokenResponse.id_token && provider.provider_type === "oidc") {
      // Use ID token for OIDC
      userInfo = decodeIdToken(tokenResponse.id_token);
    } else if (provider.oauth_user_info_url) {
      // Fetch user info from endpoint
      try {
        userInfo = await fetchUserInfo(provider, tokenResponse.access_token);
      } catch (error: any) {
        console.error("User info fetch error:", error);
        await logLoginAttempt(
          supabase,
          providerId,
          null,
          null,
          false,
          "Failed to fetch user info",
          error.message
        );
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Failed+to+get+user+info`
        );
      }
    } else {
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        null,
        false,
        "No user info available"
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Cannot+get+user+info`
      );
    }

    // Map OAuth attributes to user fields
    const mappedProfile = mapOAuthAttributes(
      userInfo,
      provider.attribute_mapping as Record<string, string>
    );

    if (!mappedProfile.email) {
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        null,
        false,
        "Email not provided in OAuth response"
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Email+is+required`
      );
    }

    // Check if email domain is allowed
    if (provider.allowed_domains && provider.allowed_domains.length > 0) {
      const emailDomain = mappedProfile.email.split("@")[1];
      if (!provider.allowed_domains.includes(emailDomain)) {
        await logLoginAttempt(
          supabase,
          providerId,
          null,
          mappedProfile.email,
          false,
          "Email domain not allowed"
        );
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Domain+not+allowed`
        );
      }
    }

    // Find or create user
    let userId;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("user_id, organization_id")
      .eq("email", mappedProfile.email)
      .eq("organization_id", provider.organization_id)
      .single();

    if (existingUser) {
      userId = existingUser.user_id;
    } else if (provider.auto_provision_users) {
      // Auto-provision new user
      try {
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: mappedProfile.email,
            email_confirm: true,
            user_metadata: {
              full_name:
                mappedProfile.displayName ||
                `${mappedProfile.firstName || ""} ${mappedProfile.lastName || ""}`.trim(),
              sso_provider_id: providerId,
            },
          });

        if (authError || !authData.user) {
          throw new Error(`Failed to create user: ${authError?.message}`);
        }

        userId = authData.user.id;

        // Create user profile
        await supabase.from("user_profiles").insert({
          user_id: userId,
          email: mappedProfile.email,
          full_name:
            mappedProfile.displayName ||
            `${mappedProfile.firstName || ""} ${mappedProfile.lastName || ""}`.trim(),
          organization_id: provider.organization_id,
          role: "member",
        });
      } catch (error: any) {
        console.error("User provisioning error:", error);
        await logLoginAttempt(
          supabase,
          providerId,
          null,
          mappedProfile.email,
          false,
          "User provisioning failed",
          error.message
        );
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Failed+to+create+user`
        );
      }
    } else {
      // User doesn't exist and auto-provisioning is disabled
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        mappedProfile.email,
        false,
        "User not found and auto-provisioning disabled"
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=User+not+found`
      );
    }

    // Create SSO session
    const sessionExpiry = new Date();
    if (tokenResponse.expires_in) {
      sessionExpiry.setSeconds(sessionExpiry.getSeconds() + tokenResponse.expires_in);
    } else {
      sessionExpiry.setHours(sessionExpiry.getHours() + 8); // Default 8 hours
    }

    await supabase.from("sso_sessions").insert({
      provider_id: providerId,
      user_id: userId,
      external_user_id: userInfo.sub,
      expires_at: sessionExpiry.toISOString(),
    });

    // Log successful attempt
    await logLoginAttempt(
      supabase,
      providerId,
      userId,
      mappedProfile.email,
      true
    );

    // TODO: Properly sign in user with Supabase Auth
    // For now, redirect to login page with a success message
    // In production, you'd want to create a proper session here

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Authentication+failed`
    );
  }
}

// Helper function to log login attempts
async function logLoginAttempt(
  supabase: any,
  providerId: string,
  userId: string | null,
  email: string | null,
  success: boolean,
  errorMessage?: string,
  errorCode?: string
) {
  await supabase.rpc("log_sso_login_attempt", {
    p_provider_id: providerId,
    p_user_id: userId,
    p_email: email,
    p_success: success,
    p_error_message: errorMessage || null,
    p_error_code: errorCode || null,
  });
}
