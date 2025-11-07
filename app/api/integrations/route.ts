import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizationUrl, INTEGRATION_CONFIGS, isIntegrationConfigured } from "@/lib/integrations/config";
import { IntegrationProvider } from "@/types";

// GET /api/integrations
// Get all integrations for the user's organization
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get all integrations for this organization
    const { data: integrations, error: integrationsError } = await supabase
      .from("integrations")
      .select("id, provider, provider_user_id, provider_team_id, is_active, metadata, last_synced_at, created_at, updated_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (integrationsError) {
      console.error("Error fetching integrations:", integrationsError);
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    // Add configuration info to each integration
    const integrationsWithConfig = (integrations || []).map((integration) => ({
      ...integration,
      config: INTEGRATION_CONFIGS[integration.provider as IntegrationProvider],
      configured: isIntegrationConfigured(integration.provider as IntegrationProvider),
    }));

    // Return list of available integrations
    const availableIntegrations = Object.values(INTEGRATION_CONFIGS).map((config) => ({
      ...config,
      configured: isIntegrationConfigured(config.provider),
      connected: integrationsWithConfig.some(
        (i) => i.provider === config.provider && i.is_active
      ),
    }));

    return NextResponse.json({
      integrations: integrationsWithConfig,
      available: availableIntegrations,
    });
  } catch (error) {
    console.error("Get integrations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/integrations
// Initiate OAuth flow for an integration
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body as { provider: IntegrationProvider };

    if (!provider || !INTEGRATION_CONFIGS[provider]) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    if (!isIntegrationConfigured(provider)) {
      return NextResponse.json(
        {
          error: `${INTEGRATION_CONFIGS[provider].name} integration is not configured. Please set environment variables in .env file.`,
          help: `Required: ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET`
        },
        { status: 400 }
      );
    }

    // Generate state token for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        user_id: user.id,
        provider,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Get authorization URL
    const authUrl = getAuthorizationUrl(provider, state);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Initiate OAuth error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
