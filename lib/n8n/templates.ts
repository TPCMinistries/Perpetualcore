/**
 * n8n Template Management
 * Pre-built workflow templates for common automation tasks
 */

import { createClient } from "@/lib/supabase/server";
import { N8nClient, createN8nClient } from "./client";

export interface N8nTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  workflow_json: any;
  required_credentials: string[];
  is_public: boolean;
  is_featured: boolean;
  install_count: number;
  rating: number;
  rating_count: number;
  author_name?: string;
}

export interface TemplateInstallResult {
  success: boolean;
  workflowId?: string;
  n8nWorkflowId?: string;
  error?: string;
}

/**
 * Get available templates
 */
export async function getTemplates(options?: {
  category?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ templates: N8nTemplate[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("n8n_templates")
    .select("*", { count: "exact" })
    .eq("is_public", true)
    .eq("is_active", true)
    .order("install_count", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.featured) {
    query = query.eq("is_featured", true);
  }

  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,description.ilike.%${options.search}%`
    );
  }

  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[n8n Templates] Error fetching:", error);
    return { templates: [], total: 0 };
  }

  return { templates: data || [], total: count || 0 };
}

/**
 * Get template categories
 */
export async function getTemplateCategories(): Promise<
  Array<{ category: string; count: number }>
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("n8n_templates")
    .select("category")
    .eq("is_public", true)
    .eq("is_active", true);

  if (!data) return [];

  // Count by category
  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.category, (counts.get(row.category) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get a single template
 */
export async function getTemplate(templateId: string): Promise<N8nTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("n8n_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Install a template to n8n
 */
export async function installTemplate(
  templateId: string,
  integrationId: string,
  organizationId: string,
  userId: string,
  customConfig?: Record<string, any>
): Promise<TemplateInstallResult> {
  const supabase = await createClient();

  try {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from("n8n_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return { success: false, error: "Template not found" };
    }

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from("n8n_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("organization_id", organizationId)
      .single();

    if (integrationError || !integration) {
      return { success: false, error: "n8n integration not found" };
    }

    // Create n8n client
    const client = createN8nClient(integration);

    // Prepare workflow JSON
    const workflowJson = prepareWorkflowJson(
      template.workflow_json,
      template.name,
      customConfig
    );

    // Create workflow in n8n
    const n8nWorkflow = await client.createWorkflow(workflowJson);

    // Sync to local database
    const { data: workflowId } = await supabase.rpc("sync_n8n_workflow", {
      p_org_id: organizationId,
      p_integration_id: integrationId,
      p_n8n_workflow_id: n8nWorkflow.id,
      p_n8n_workflow_name: n8nWorkflow.name,
      p_trigger_type: detectTriggerType(workflowJson),
      p_trigger_config: customConfig || {},
    });

    // Record installation
    await supabase.from("n8n_template_installations").insert({
      organization_id: organizationId,
      template_id: templateId,
      n8n_integration_id: integrationId,
      n8n_workflow_id: workflowId,
      custom_config: customConfig || {},
      status: "installed",
      installed_by: userId,
    });

    // Update template install count
    await supabase.rpc("increment_template_installs", { p_template_id: templateId });

    return {
      success: true,
      workflowId,
      n8nWorkflowId: n8nWorkflow.id,
    };
  } catch (error: any) {
    console.error("[n8n Templates] Install error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Prepare workflow JSON for installation
 */
function prepareWorkflowJson(
  templateJson: any,
  name: string,
  customConfig?: Record<string, any>
): any {
  const workflow = {
    name: `${name} (from template)`,
    nodes: templateJson.nodes || [],
    connections: templateJson.connections || {},
    settings: {
      ...templateJson.settings,
      executionOrder: "v1",
    },
  };

  // Apply custom config to nodes if provided
  if (customConfig) {
    workflow.nodes = workflow.nodes.map((node: any) => {
      if (customConfig[node.name]) {
        return {
          ...node,
          parameters: {
            ...node.parameters,
            ...customConfig[node.name],
          },
        };
      }
      return node;
    });
  }

  return workflow;
}

/**
 * Detect trigger type from workflow JSON
 */
function detectTriggerType(workflowJson: any): string {
  const nodes = workflowJson.nodes || [];

  for (const node of nodes) {
    const type = (node.type || "").toLowerCase();

    if (type.includes("webhook")) return "webhook";
    if (type.includes("schedule") || type.includes("cron")) return "schedule";
    if (type.includes("trigger")) return "event";
  }

  return "manual";
}

/**
 * Get user's installed templates
 */
export async function getInstalledTemplates(
  organizationId: string
): Promise<
  Array<{
    installation: any;
    template: N8nTemplate;
    workflow?: any;
  }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("n8n_template_installations")
    .select(`
      *,
      n8n_templates (*),
      n8n_workflows (*)
    `)
    .eq("organization_id", organizationId)
    .order("installed_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    installation: {
      id: row.id,
      status: row.status,
      custom_config: row.custom_config,
      installed_at: row.installed_at,
    },
    template: row.n8n_templates,
    workflow: row.n8n_workflows,
  }));
}

/**
 * Uninstall a template
 */
export async function uninstallTemplate(
  installationId: string,
  organizationId: string,
  deleteFromN8n: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get installation
    const { data: installation, error: installError } = await supabase
      .from("n8n_template_installations")
      .select(`
        *,
        n8n_workflows (*),
        n8n_integrations (*)
      `)
      .eq("id", installationId)
      .eq("organization_id", organizationId)
      .single();

    if (installError || !installation) {
      return { success: false, error: "Installation not found" };
    }

    // Optionally delete from n8n
    if (deleteFromN8n && installation.n8n_workflows && installation.n8n_integrations) {
      try {
        const client = createN8nClient(installation.n8n_integrations);
        await client.deleteWorkflow(installation.n8n_workflows.n8n_workflow_id);
      } catch (err: any) {
        console.warn("[n8n Templates] Could not delete from n8n:", err.message);
      }
    }

    // Delete local workflow record
    if (installation.n8n_workflow_id) {
      await supabase
        .from("n8n_workflows")
        .delete()
        .eq("id", installation.n8n_workflow_id);
    }

    // Delete installation record
    await supabase
      .from("n8n_template_installations")
      .delete()
      .eq("id", installationId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create increment function for template installs (helper)
 */
export async function createIncrementFunction() {
  const supabase = await createClient();

  await supabase.rpc("create_increment_function");
}

// SQL for increment function (run manually if needed):
// CREATE OR REPLACE FUNCTION increment_template_installs(p_template_id UUID)
// RETURNS VOID AS $$
// BEGIN
//   UPDATE n8n_templates SET install_count = install_count + 1 WHERE id = p_template_id;
// END;
// $$ LANGUAGE plpgsql;
