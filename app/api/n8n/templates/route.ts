import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTemplates,
  getTemplateCategories,
  getTemplate,
  installTemplate,
  getInstalledTemplates,
  uninstallTemplate,
} from "@/lib/n8n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - List templates or get a specific template
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

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("template_id");
    const installed = searchParams.get("installed") === "true";
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");

    // Get single template
    if (templateId) {
      const template = await getTemplate(templateId);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // Get installed templates
    if (installed && profile?.organization_id) {
      const installations = await getInstalledTemplates(profile.organization_id);
      return NextResponse.json({ installations });
    }

    // Get categories
    if (searchParams.get("categories") === "true") {
      const categories = await getTemplateCategories();
      return NextResponse.json({ categories });
    }

    // List templates
    const result = await getTemplates({
      category: category || undefined,
      featured: featured || undefined,
      search: search || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    });

    return NextResponse.json({
      templates: result.templates,
      total: result.total,
    });
  } catch (error: any) {
    if (isDev) console.error("n8n templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Install a template
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
    const { template_id, integration_id, custom_config } = body;

    if (!template_id) {
      return NextResponse.json({ error: "template_id is required" }, { status: 400 });
    }

    if (!integration_id) {
      return NextResponse.json({ error: "integration_id is required" }, { status: 400 });
    }

    const result = await installTemplate(
      template_id,
      integration_id,
      profile.organization_id,
      user.id,
      custom_config
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      workflow_id: result.workflowId,
      n8n_workflow_id: result.n8nWorkflowId,
      message: "Template installed successfully",
    });
  } catch (error: any) {
    if (isDev) console.error("n8n template install error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Uninstall a template
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
    const installationId = searchParams.get("installation_id");
    const deleteFromN8n = searchParams.get("delete_from_n8n") === "true";

    if (!installationId) {
      return NextResponse.json({ error: "installation_id is required" }, { status: 400 });
    }

    const result = await uninstallTemplate(
      installationId,
      profile.organization_id,
      deleteFromN8n
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Template uninstalled successfully",
    });
  } catch (error: any) {
    if (isDev) console.error("n8n template uninstall error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
