import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAuthRequest } from "@/lib/sso/saml";

// GET /api/sso/saml/login?provider_id=xxx
// Initiate SAML SSO login
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

    if (provider.provider_type !== "saml") {
      return NextResponse.json(
        { error: "Provider is not a SAML provider" },
        { status: 400 }
      );
    }

    // Generate SAML auth request
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/saml/callback`;
    const relayState = providerId; // Use provider ID as relay state

    try {
      const authUrl = await generateAuthRequest(
        provider,
        callbackUrl,
        relayState
      );

      // Redirect to IdP
      return NextResponse.redirect(authUrl);
    } catch (error: any) {
      console.error("Error generating SAML auth request:", error);
      return NextResponse.json(
        { error: "Failed to initiate SAML login", details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("SAML login error:", error);
    return NextResponse.json(
      { error: "Failed to initiate SAML login" },
      { status: 500 }
    );
  }
}
