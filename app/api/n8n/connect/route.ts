import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { N8nClient, syncWorkflowsFromN8n } from "@/lib/n8n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * POST - Connect a new n8n instance
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await req.json();
    const { name, instance_url, api_key } = body;

    // Validation
    if (!instance_url) {
      return NextResponse.json({ error: "instance_url is required" }, { status: 400 });
    }

    if (!api_key) {
      return NextResponse.json({ error: "api_key is required" }, { status: 400 });
    }

    // Validate URL format
    let normalizedUrl: string;
    try {
      const url = new URL(instance_url);
      normalizedUrl = `${url.protocol}//${url.host}`;
    } catch {
      return NextResponse.json({ error: "Invalid instance URL" }, { status: 400 });
    }

    // Test connection
    const client = new N8nClient({
      instanceUrl: normalizedUrl,
      apiKey: api_key,
    });

    const verifyResult = await client.verifyConnection();
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: "Failed to connect to n8n", details: verifyResult.error },
        { status: 400 }
      );
    }

    // Create integration record
    const { data: integration, error: createError } = await supabase
      .from("n8n_integrations")
      .insert({
        organization_id: profile.organization_id,
        name: name || "My n8n Instance",
        n8n_instance_url: normalizedUrl,
        api_key_encrypted: api_key, // In production, encrypt this
        is_active: true,
        is_verified: true,
        last_verified_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      if (isDev) console.error("Error creating n8n integration:", createError);
      return NextResponse.json(
        { error: "Failed to create integration" },
        { status: 500 }
      );
    }

    // Initial sync of workflows
    const syncResult = await syncWorkflowsFromN8n(
      integration.id,
      profile.organization_id
    );

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        instance_url: integration.n8n_instance_url,
        is_active: integration.is_active,
        is_verified: integration.is_verified,
      },
      sync: {
        workflows_synced: syncResult.synced,
        errors: syncResult.errors,
      },
    });
  } catch (error: any) {
    if (isDev) console.error("n8n connect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - List n8n integrations
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { data: integrations, error } = await supabase
      .from("n8n_integrations")
      .select(`
        id,
        name,
        n8n_instance_url,
        is_active,
        is_verified,
        last_verified_at,
        last_sync_at,
        workflow_count,
        total_executions,
        created_at
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      if (isDev) console.error("Error fetching integrations:", error);
      return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabase.rpc("get_n8n_stats", {
      p_org_id: profile.organization_id,
    });

    return NextResponse.json({
      integrations: integrations || [],
      stats: stats?.[0] || null,
    });
  } catch (error: any) {
    if (isDev) console.error("n8n list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Remove an n8n integration
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get("integration_id");

    if (!integrationId) {
      return NextResponse.json({ error: "integration_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("n8n_integrations")
      .delete()
      .eq("id", integrationId)
      .eq("organization_id", profile.organization_id);

    if (error) {
      if (isDev) console.error("Error deleting integration:", error);
      return NextResponse.json({ error: "Failed to delete integration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (isDev) console.error("n8n delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
