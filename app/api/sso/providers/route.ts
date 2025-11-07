import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SSOProvider } from "@/types";

// GET /api/sso/providers
// Get all SSO providers for the user's organization
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get SSO providers for organization
    const { data: providers, error } = await supabase
      .from("sso_providers")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching SSO providers:", error);
      return NextResponse.json(
        { error: "Failed to fetch SSO providers" },
        { status: 500 }
      );
    }

    // If not admin/owner, hide sensitive fields
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({
        providers: providers.map((p) => ({
          id: p.id,
          provider_name: p.provider_name,
          provider_type: p.provider_type,
          enabled: p.enabled,
          enforce_sso: p.enforce_sso,
        })),
      });
    }

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("SSO providers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SSO providers" },
      { status: 500 }
    );
  }
}

// POST /api/sso/providers
// Create a new SSO provider
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only admins and owners can create SSO providers
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider_type,
      provider_name,
      enabled = false,
      // SAML fields
      saml_entity_id,
      saml_sso_url,
      saml_slo_url,
      saml_certificate,
      saml_signature_algorithm,
      saml_name_id_format,
      // OAuth fields
      oauth_client_id,
      oauth_client_secret,
      oauth_authorization_url,
      oauth_token_url,
      oauth_user_info_url,
      oauth_scopes,
      // Settings
      attribute_mapping,
      auto_provision_users = true,
      enforce_sso = false,
      allowed_domains,
    } = body;

    // Validate required fields
    if (!provider_type || !provider_name) {
      return NextResponse.json(
        { error: "Provider type and name are required" },
        { status: 400 }
      );
    }

    if (!["saml", "oauth2", "oidc"].includes(provider_type)) {
      return NextResponse.json(
        { error: "Invalid provider type" },
        { status: 400 }
      );
    }

    // Validate SAML configuration
    if (provider_type === "saml") {
      if (!saml_sso_url || !saml_certificate) {
        return NextResponse.json(
          { error: "SAML SSO URL and certificate are required" },
          { status: 400 }
        );
      }
    }

    // Validate OAuth configuration
    if (["oauth2", "oidc"].includes(provider_type)) {
      if (!oauth_client_id || !oauth_authorization_url || !oauth_token_url) {
        return NextResponse.json(
          {
            error:
              "OAuth client ID, authorization URL, and token URL are required",
          },
          { status: 400 }
        );
      }
    }

    // Create provider
    const { data: provider, error } = await supabase
      .from("sso_providers")
      .insert({
        organization_id: profile.organization_id,
        provider_type,
        provider_name,
        enabled,
        saml_entity_id,
        saml_sso_url,
        saml_slo_url,
        saml_certificate,
        saml_signature_algorithm,
        saml_name_id_format,
        oauth_client_id,
        oauth_client_secret,
        oauth_authorization_url,
        oauth_token_url,
        oauth_user_info_url,
        oauth_scopes,
        attribute_mapping: attribute_mapping || {
          email: "email",
          firstName: "given_name",
          lastName: "family_name",
          displayName: "name",
        },
        auto_provision_users,
        enforce_sso,
        allowed_domains,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating SSO provider:", error);
      return NextResponse.json(
        { error: "Failed to create SSO provider" },
        { status: 500 }
      );
    }

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error("SSO provider POST error:", error);
    return NextResponse.json(
      { error: "Failed to create SSO provider" },
      { status: 500 }
    );
  }
}
