import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/sso/providers/[id]
// Get a specific SSO provider
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
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

    // Get provider
    const { data: provider, error } = await supabase
      .from("sso_providers")
      .select("*")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // If not admin/owner, hide sensitive fields
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({
        provider: {
          id: provider.id,
          provider_name: provider.provider_name,
          provider_type: provider.provider_type,
          enabled: provider.enabled,
          enforce_sso: provider.enforce_sso,
        },
      });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("SSO provider GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SSO provider" },
      { status: 500 }
    );
  }
}

// PATCH /api/sso/providers/[id]
// Update an SSO provider
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
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

    // Only admins and owners can update SSO providers
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify provider belongs to user's organization
    const { data: existingProvider } = await supabase
      .from("sso_providers")
      .select("id")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existingProvider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      provider_name,
      enabled,
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
      auto_provision_users,
      enforce_sso,
      allowed_domains,
    } = body;

    // Build update object (only include provided fields)
    const updates: any = {};
    if (provider_name !== undefined) updates.provider_name = provider_name;
    if (enabled !== undefined) updates.enabled = enabled;
    if (saml_entity_id !== undefined) updates.saml_entity_id = saml_entity_id;
    if (saml_sso_url !== undefined) updates.saml_sso_url = saml_sso_url;
    if (saml_slo_url !== undefined) updates.saml_slo_url = saml_slo_url;
    if (saml_certificate !== undefined)
      updates.saml_certificate = saml_certificate;
    if (saml_signature_algorithm !== undefined)
      updates.saml_signature_algorithm = saml_signature_algorithm;
    if (saml_name_id_format !== undefined)
      updates.saml_name_id_format = saml_name_id_format;
    if (oauth_client_id !== undefined)
      updates.oauth_client_id = oauth_client_id;
    if (oauth_client_secret !== undefined)
      updates.oauth_client_secret = oauth_client_secret;
    if (oauth_authorization_url !== undefined)
      updates.oauth_authorization_url = oauth_authorization_url;
    if (oauth_token_url !== undefined)
      updates.oauth_token_url = oauth_token_url;
    if (oauth_user_info_url !== undefined)
      updates.oauth_user_info_url = oauth_user_info_url;
    if (oauth_scopes !== undefined) updates.oauth_scopes = oauth_scopes;
    if (attribute_mapping !== undefined)
      updates.attribute_mapping = attribute_mapping;
    if (auto_provision_users !== undefined)
      updates.auto_provision_users = auto_provision_users;
    if (enforce_sso !== undefined) updates.enforce_sso = enforce_sso;
    if (allowed_domains !== undefined) updates.allowed_domains = allowed_domains;

    // Update provider
    const { data: provider, error } = await supabase
      .from("sso_providers")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating SSO provider:", error);
      return NextResponse.json(
        { error: "Failed to update SSO provider" },
        { status: 500 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("SSO provider PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update SSO provider" },
      { status: 500 }
    );
  }
}

// DELETE /api/sso/providers/[id]
// Delete an SSO provider
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
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

    // Only admins and owners can delete SSO providers
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify provider belongs to user's organization
    const { data: existingProvider } = await supabase
      .from("sso_providers")
      .select("id, enforce_sso")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existingProvider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if SSO is enforced
    if (existingProvider.enforce_sso) {
      return NextResponse.json(
        {
          error:
            "Cannot delete provider with enforced SSO. Disable enforcement first.",
        },
        { status: 400 }
      );
    }

    // Delete provider (this will cascade delete sessions and attempts)
    const { error } = await supabase
      .from("sso_providers")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting SSO provider:", error);
      return NextResponse.json(
        { error: "Failed to delete SSO provider" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SSO provider DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete SSO provider" },
      { status: 500 }
    );
  }
}
