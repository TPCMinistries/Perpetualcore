/**
 * n8n Workflow Sync
 * Two-way synchronization between platform and n8n
 */

import { createClient } from "@/lib/supabase/server";
import { N8nClient, createN8nClient, N8nWorkflow } from "./client";

export interface SyncResult {
  success: boolean;
  synced: number;
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

/**
 * Sync all workflows from an n8n integration
 */
export async function syncWorkflowsFromN8n(
  integrationId: string,
  organizationId: string
): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = {
    success: true,
    synced: 0,
    added: 0,
    updated: 0,
    removed: 0,
    errors: [],
  };

  try {
    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from("n8n_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("organization_id", organizationId)
      .single();

    if (integrationError || !integration) {
      return { ...result, success: false, errors: ["Integration not found"] };
    }

    // Create n8n client
    const client = createN8nClient(integration);

    // Get all workflows from n8n
    const { data: n8nWorkflows } = await client.getWorkflows({ limit: 100 });

    // Get existing synced workflows
    const { data: existingWorkflows } = await supabase
      .from("n8n_workflows")
      .select("id, n8n_workflow_id")
      .eq("n8n_integration_id", integrationId);

    const existingMap = new Map(
      (existingWorkflows || []).map((w) => [w.n8n_workflow_id, w.id])
    );

    // Sync each workflow
    for (const workflow of n8nWorkflows) {
      try {
        const triggerType = detectTriggerType(workflow);
        const webhookUrl = await extractWebhookUrl(client, workflow);

        const { error } = await supabase.rpc("sync_n8n_workflow", {
          p_org_id: organizationId,
          p_integration_id: integrationId,
          p_n8n_workflow_id: workflow.id,
          p_n8n_workflow_name: workflow.name,
          p_trigger_type: triggerType,
          p_trigger_config: {
            active: workflow.active,
            webhookUrl,
          },
        });

        if (error) {
          result.errors.push(`Failed to sync ${workflow.name}: ${error.message}`);
        } else {
          result.synced++;
          if (existingMap.has(workflow.id)) {
            result.updated++;
            existingMap.delete(workflow.id);
          } else {
            result.added++;
          }
        }
      } catch (err: any) {
        result.errors.push(`Error syncing ${workflow.name}: ${err.message}`);
      }
    }

    // Mark removed workflows as not synced
    for (const [n8nId, localId] of existingMap) {
      await supabase
        .from("n8n_workflows")
        .update({ is_synced: false, updated_at: new Date().toISOString() })
        .eq("id", localId);
      result.removed++;
    }

    // Update integration last sync time
    await supabase
      .from("n8n_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        is_verified: true,
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", integrationId);

    result.success = result.errors.length === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Sync failed: ${error.message}`);
  }

  return result;
}

/**
 * Detect trigger type from workflow nodes
 */
function detectTriggerType(workflow: N8nWorkflow): string {
  const nodes = workflow.nodes || [];

  for (const node of nodes) {
    const type = node.type?.toLowerCase() || "";

    if (type.includes("webhook")) return "webhook";
    if (type.includes("schedule") || type.includes("cron")) return "schedule";
    if (type.includes("trigger")) return "event";
  }

  return "manual";
}

/**
 * Extract webhook URL from workflow
 */
async function extractWebhookUrl(
  client: N8nClient,
  workflow: N8nWorkflow
): Promise<string | null> {
  try {
    const webhooks = await client.getWebhooks(workflow.id);
    if (webhooks.length > 0) {
      return webhooks[0].path;
    }
  } catch {
    // Ignore webhook extraction errors
  }
  return null;
}

/**
 * Execute a workflow and track it
 */
export async function executeWorkflow(
  workflowId: string,
  organizationId: string,
  userId: string,
  inputData: Record<string, any> = {},
  triggeredBy: string = "manual"
): Promise<{
  success: boolean;
  executionId?: string;
  n8nExecutionId?: string;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("n8n_workflows")
      .select(`
        *,
        n8n_integrations!inner (
          n8n_instance_url,
          api_key_encrypted,
          is_active
        )
      `)
      .eq("id", workflowId)
      .eq("organization_id", organizationId)
      .single();

    if (workflowError || !workflow) {
      return { success: false, error: "Workflow not found" };
    }

    if (!workflow.n8n_integrations.is_active) {
      return { success: false, error: "n8n integration is not active" };
    }

    // Create execution record
    const { data: executionId } = await supabase.rpc("record_n8n_execution", {
      p_org_id: organizationId,
      p_workflow_id: workflowId,
      p_triggered_by: triggeredBy,
      p_triggered_by_user: userId,
      p_input_data: inputData,
    });

    // Create n8n client and execute
    const client = createN8nClient(workflow.n8n_integrations);

    try {
      const { executionId: n8nExecId } = await client.executeWorkflow(
        workflow.n8n_workflow_id,
        inputData
      );

      // Mark execution as started with n8n ID
      await supabase
        .from("n8n_workflow_executions")
        .update({ n8n_execution_id: n8nExecId })
        .eq("id", executionId);

      return {
        success: true,
        executionId,
        n8nExecutionId: n8nExecId,
      };
    } catch (execError: any) {
      // Mark execution as failed
      await supabase.rpc("complete_n8n_execution", {
        p_execution_id: executionId,
        p_success: false,
        p_error_message: execError.message,
      });

      return { success: false, executionId, error: execError.message };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Poll execution status and update when complete
 */
export async function pollExecutionStatus(
  executionId: string,
  organizationId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<{
  success: boolean;
  status: string;
  outputData?: any;
  error?: string;
}> {
  const supabase = await createClient();

  // Get execution details
  const { data: execution, error: execError } = await supabase
    .from("n8n_workflow_executions")
    .select(`
      *,
      n8n_workflows!inner (
        n8n_workflow_id,
        n8n_integration_id,
        n8n_integrations!inner (
          n8n_instance_url,
          api_key_encrypted
        )
      )
    `)
    .eq("id", executionId)
    .eq("organization_id", organizationId)
    .single();

  if (execError || !execution) {
    return { success: false, status: "error", error: "Execution not found" };
  }

  if (!execution.n8n_execution_id) {
    return { success: false, status: "error", error: "No n8n execution ID" };
  }

  const client = createN8nClient(execution.n8n_workflows.n8n_integrations);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const n8nExec = await client.getExecution(execution.n8n_execution_id);

      if (n8nExec.finished) {
        const success = n8nExec.status === "success";

        // Update our execution record
        await supabase.rpc("complete_n8n_execution", {
          p_execution_id: executionId,
          p_success: success,
          p_output_data: n8nExec.data || null,
          p_n8n_execution_id: execution.n8n_execution_id,
        });

        return {
          success,
          status: n8nExec.status,
          outputData: n8nExec.data,
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch (err: any) {
      // Continue polling on error
      console.error("[n8n] Poll error:", err.message);
    }
  }

  return { success: false, status: "timeout", error: "Polling timeout" };
}

/**
 * Trigger workflows for a platform event
 */
export async function triggerWorkflowsForEvent(
  organizationId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<{ triggered: number; errors: string[] }> {
  const supabase = await createClient();
  const result = { triggered: 0, errors: [] as string[] };

  try {
    // Get workflows mapped to this event
    const { data: mappings } = await supabase.rpc("get_workflows_for_event", {
      p_org_id: organizationId,
      p_event_type: eventType,
    });

    if (!mappings || mappings.length === 0) {
      return result;
    }

    // Trigger each workflow
    for (const mapping of mappings) {
      try {
        // Apply payload transform if defined
        let payload = eventData;
        if (mapping.payload_transform) {
          // Simple field mapping
          payload = applyTransform(eventData, mapping.payload_transform);
        }

        // Execute the workflow
        const execResult = await executeWorkflow(
          mapping.workflow_id,
          organizationId,
          "system",
          payload,
          "event"
        );

        if (execResult.success) {
          result.triggered++;

          // Update event mapping stats
          await supabase
            .from("n8n_event_mappings")
            .update({
              trigger_count: supabase.rpc("increment", { x: 1 }),
              last_triggered_at: new Date().toISOString(),
            })
            .eq("n8n_workflow_id", mapping.workflow_id)
            .eq("event_type", eventType);
        } else {
          result.errors.push(`${mapping.workflow_name}: ${execResult.error}`);
        }
      } catch (err: any) {
        result.errors.push(`${mapping.workflow_name}: ${err.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Event trigger error: ${error.message}`);
  }

  return result;
}

/**
 * Apply a simple payload transform
 */
function applyTransform(
  data: Record<string, any>,
  transform: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [targetKey, sourcePath] of Object.entries(transform)) {
    const value = getNestedValue(data, sourcePath);
    if (value !== undefined) {
      result[targetKey] = value;
    }
  }

  return result;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
