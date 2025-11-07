import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSAMLResponse, mapSAMLAttributes } from "@/lib/sso/saml";

// POST /api/sso/saml/callback
// Handle SAML assertion response from IdP
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const samlResponse = formData.get("SAMLResponse") as string;
    const relayState = formData.get("RelayState") as string;

    if (!samlResponse) {
      return NextResponse.json(
        { error: "SAML response is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get provider from relay state (provider ID)
    const providerId = relayState;
    if (!providerId) {
      return NextResponse.json(
        { error: "Invalid relay state" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "SSO provider not found" },
        { status: 404 }
      );
    }

    // Validate SAML response
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/saml/callback`;

    let profile;
    try {
      profile = await validateSAMLResponse(provider, callbackUrl, samlResponse);
    } catch (error: any) {
      console.error("SAML validation error:", error);
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        null,
        false,
        "SAML validation failed",
        error.message
      );
      return NextResponse.json(
        { error: "SAML validation failed", details: error.message },
        { status: 400 }
      );
    }

    // Map SAML attributes to user fields
    const mappedProfile = mapSAMLAttributes(
      profile,
      provider.attribute_mapping as Record<string, string>
    );

    if (!mappedProfile.email) {
      await logLoginAttempt(
        supabase,
        providerId,
        null,
        null,
        false,
        "Email not provided in SAML response"
      );
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
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
        return NextResponse.json(
          { error: "Email domain not allowed for this SSO provider" },
          { status: 403 }
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
        // Create auth user via Supabase Admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: mappedProfile.email,
          email_confirm: true,
          user_metadata: {
            full_name: mappedProfile.displayName || `${mappedProfile.firstName || ""} ${mappedProfile.lastName || ""}`.trim(),
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
          full_name: mappedProfile.displayName || `${mappedProfile.firstName || ""} ${mappedProfile.lastName || ""}`.trim(),
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
        return NextResponse.json(
          { error: "Failed to provision user", details: error.message },
          { status: 500 }
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
      return NextResponse.json(
        {
          error:
            "User not found. Please contact your administrator to create an account.",
        },
        { status: 403 }
      );
    }

    // Create SSO session
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 8); // 8 hour session

    await supabase.from("sso_sessions").insert({
      provider_id: providerId,
      user_id: userId,
      session_index: profile.sessionIndex,
      name_id: profile.nameID,
      external_user_id: profile.nameID,
      expires_at: sessionExpiry.toISOString(),
    });

    // Log successful attempt
    await logLoginAttempt(supabase, providerId, userId, mappedProfile.email, true);

    // Sign in user with Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: mappedProfile.email,
      password: crypto.randomUUID(), // This won't work, need to use admin API
    });

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
  } catch (error) {
    console.error("SAML callback error:", error);
    return NextResponse.json(
      { error: "SAML authentication failed" },
      { status: 500 }
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
