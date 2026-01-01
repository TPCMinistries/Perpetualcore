/**
 * n8n Integration Library
 * Provides functions to sync and execute n8n workflows
 */

import { createClient } from "@/lib/supabase/server";

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

interface SyncResult {
  success: boolean;
  synced: number;
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

interface ExecuteResult {
  success: boolean;
  executionId?: string;
  n8nExecutionId?: string;
  error?: string;
}

interface PollResult {
  success: boolean;
  status: string;
  outputData?: any;
  error?: string;
}

/**
 * Check if n8n API is configured
 */
export function isN8nConfigured(): boolean {
  return !!(N8N_API_URL && N8N_API_KEY && !N8N_API_KEY.includes("REPLACE"));
}

/**
 * Fetch workflows from n8n API
 */
async function fetchN8nWorkflows(instanceUrl?: string) {
  const baseUrl = instanceUrl || N8N_API_URL;
  if (!baseUrl || !N8N_API_KEY) {
    throw new Error("n8n API not configured");
  }

  const response = await fetch(`${baseUrl}/workflows`, {
    headers: {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Sync workflows from n8n instance to database
 */
export async function syncWorkflowsFromN8n(
  integrationId: string,
  organizationId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    synced: 0,
    added: 0,
    updated: 0,
    removed: 0,
    errors: [],
  };

  try {
    const supabase = await createClient();

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from("n8n_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("organization_id", organizationId)
      .single();

    if (integrationError || !integration) {
      result.errors.push("Integration not found");
      return result;
    }

    // Fetch workflows from n8n
    const n8nWorkflows = await fetchN8nWorkflows(integration.n8n_instance_url);

    // Get existing workflows in database
    const { data: existingWorkflows } = await supabase
      .from("n8n_workflows")
      .select("id, n8n_workflow_id")
      .eq("n8n_integration_id", integrationId);

    const existingIds = new Set((existingWorkflows || []).map(w => w.n8n_workflow_id));
    const n8nIds = new Set(n8nWorkflows.map((w: any) => w.id));

    // Add new and update existing
    for (const wf of n8nWorkflows) {
      const workflowData = {
        n8n_integration_id: integrationId,
        organization_id: organizationId,
        n8n_workflow_id: wf.id,
        n8n_workflow_name: wf.name,
        is_active: wf.active,
        is_synced: true,
        trigger_type: detectTriggerType(wf.nodes || []),
        tags: wf.tags?.map((t: any) => t.name) || [],
        last_synced_at: new Date().toISOString(),
      };

      if (existingIds.has(wf.id)) {
        // Update existing
        const { error } = await supabase
          .from("n8n_workflows")
          .update(workflowData)
          .eq("n8n_workflow_id", wf.id)
          .eq("n8n_integration_id", integrationId);

        if (error) {
          result.errors.push(`Failed to update ${wf.name}: ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        // Add new
        const { error } = await supabase.from("n8n_workflows").insert(workflowData);

        if (error) {
          result.errors.push(`Failed to add ${wf.name}: ${error.message}`);
        } else {
          result.added++;
        }
      }
      result.synced++;
    }

    // Mark removed workflows
    const removedIds = [...existingIds].filter(id => !n8nIds.has(id));
    if (removedIds.length > 0) {
      const { error } = await supabase
        .from("n8n_workflows")
        .update({ is_synced: false })
        .in("n8n_workflow_id", removedIds)
        .eq("n8n_integration_id", integrationId);

      if (!error) {
        result.removed = removedIds.length;
      }
    }

    // Update integration last sync time
    await supabase
      .from("n8n_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integrationId);

    result.success = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Sync failed");
  }

  return result;
}

/**
 * Execute a workflow via webhook or direct API
 */
export async function executeWorkflow(
  workflowId: string,
  organizationId: string,
  userId: string,
  inputData: Record<string, any> = {},
  triggerSource: string = "manual"
): Promise<ExecuteResult> {
  try {
    const supabase = await createClient();

    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("n8n_workflows")
      .select(`
        *,
        n8n_integrations (
          id,
          n8n_instance_url,
          api_key_encrypted
        )
      `)
      .eq("id", workflowId)
      .eq("organization_id", organizationId)
      .single();

    if (workflowError || !workflow) {
      return { success: false, error: "Workflow not found" };
    }

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from("n8n_executions")
      .insert({
        workflow_id: workflowId,
        organization_id: organizationId,
        triggered_by: userId,
        trigger_source: triggerSource,
        status: "running",
        input_data: inputData,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (execError) {
      return { success: false, error: "Failed to create execution record" };
    }

    // Execute via n8n API
    const baseUrl = workflow.n8n_integrations?.n8n_instance_url || N8N_API_URL;
    if (!baseUrl || !N8N_API_KEY) {
      return { success: false, error: "n8n API not configured" };
    }

    try {
      // Try webhook first if available
      if (workflow.webhook_url) {
        const response = await fetch(workflow.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputData),
        });

        if (response.ok) {
          const result = await response.json().catch(() => ({}));

          // Update execution with n8n ID if available
          await supabase
            .from("n8n_executions")
            .update({
              n8n_execution_id: result.executionId || null,
              status: "running",
            })
            .eq("id", execution.id);

          return {
            success: true,
            executionId: execution.id,
            n8nExecutionId: result.executionId,
          };
        }
      }

      // Fallback to direct API execution
      const response = await fetch(
        `${baseUrl}/workflows/${workflow.n8n_workflow_id}/run`,
        {
          method: "POST",
          headers: {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: inputData }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        await supabase
          .from("n8n_executions")
          .update({
            status: "failed",
            error_message: errorText,
            finished_at: new Date().toISOString(),
          })
          .eq("id", execution.id);

        return { success: false, executionId: execution.id, error: errorText };
      }

      const result = await response.json();

      await supabase
        .from("n8n_executions")
        .update({
          n8n_execution_id: result.id || result.executionId,
          status: "running",
        })
        .eq("id", execution.id);

      return {
        success: true,
        executionId: execution.id,
        n8nExecutionId: result.id || result.executionId,
      };
    } catch (fetchError) {
      await supabase
        .from("n8n_executions")
        .update({
          status: "failed",
          error_message: fetchError instanceof Error ? fetchError.message : "Execution failed",
          finished_at: new Date().toISOString(),
        })
        .eq("id", execution.id);

      return {
        success: false,
        executionId: execution.id,
        error: fetchError instanceof Error ? fetchError.message : "Execution failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Poll for execution status
 */
export async function pollExecutionStatus(
  executionId: string,
  organizationId: string,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<PollResult> {
  const supabase = await createClient();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: execution } = await supabase
      .from("n8n_executions")
      .select("*")
      .eq("id", executionId)
      .eq("organization_id", organizationId)
      .single();

    if (!execution) {
      return { success: false, status: "not_found", error: "Execution not found" };
    }

    if (execution.status === "completed") {
      return {
        success: true,
        status: "completed",
        outputData: execution.output_data,
      };
    }

    if (execution.status === "failed") {
      return {
        success: false,
        status: "failed",
        error: execution.error_message,
      };
    }

    // If we have an n8n execution ID, poll n8n directly
    if (execution.n8n_execution_id && N8N_API_URL && N8N_API_KEY) {
      try {
        const response = await fetch(
          `${N8N_API_URL}/executions/${execution.n8n_execution_id}`,
          {
            headers: {
              "X-N8N-API-KEY": N8N_API_KEY,
              "Accept": "application/json",
            },
          }
        );

        if (response.ok) {
          const n8nExec = await response.json();

          if (n8nExec.finished) {
            const status = n8nExec.status === "success" ? "completed" : "failed";
            const updateData: any = {
              status,
              finished_at: new Date().toISOString(),
              execution_time_ms: n8nExec.stoppedAt
                ? new Date(n8nExec.stoppedAt).getTime() - new Date(n8nExec.startedAt).getTime()
                : null,
            };

            if (status === "completed") {
              updateData.output_data = n8nExec.data?.resultData?.lastNodeOutput || null;
            } else {
              updateData.error_message = n8nExec.data?.resultData?.error?.message || "Execution failed";
            }

            await supabase
              .from("n8n_executions")
              .update(updateData)
              .eq("id", executionId);

            // Update workflow stats
            await updateWorkflowStats(execution.workflow_id, status === "completed", updateData.execution_time_ms);

            return {
              success: status === "completed",
              status,
              outputData: updateData.output_data,
              error: updateData.error_message,
            };
          }
        }
      } catch {
        // Continue polling
      }
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return { success: false, status: "timeout", error: "Polling timed out" };
}

/**
 * Update workflow statistics after execution
 */
async function updateWorkflowStats(
  workflowId: string,
  success: boolean,
  executionTimeMs?: number | null
) {
  const supabase = await createClient();

  const { data: workflow } = await supabase
    .from("n8n_workflows")
    .select("total_executions, successful_executions, failed_executions, avg_execution_time_ms")
    .eq("id", workflowId)
    .single();

  if (!workflow) return;

  const totalExec = (workflow.total_executions || 0) + 1;
  const successExec = (workflow.successful_executions || 0) + (success ? 1 : 0);
  const failedExec = (workflow.failed_executions || 0) + (success ? 0 : 1);

  // Calculate new average execution time
  let avgTime = workflow.avg_execution_time_ms;
  if (executionTimeMs && success) {
    const prevTotal = workflow.successful_executions || 0;
    const prevAvg = workflow.avg_execution_time_ms || 0;
    avgTime = Math.round((prevAvg * prevTotal + executionTimeMs) / (prevTotal + 1));
  }

  await supabase
    .from("n8n_workflows")
    .update({
      total_executions: totalExec,
      successful_executions: successExec,
      failed_executions: failedExec,
      avg_execution_time_ms: avgTime,
      last_execution_at: new Date().toISOString(),
      last_execution_status: success ? "success" : "failed",
    })
    .eq("id", workflowId);
}

/**
 * Detect trigger type from workflow nodes
 */
function detectTriggerType(nodes: any[]): string {
  for (const node of nodes) {
    const type = node.type?.toLowerCase() || "";
    if (type.includes("webhook")) return "webhook";
    if (type.includes("schedule") || type.includes("cron")) return "schedule";
    if (type.includes("emailtrigger")) return "email";
    if (type.includes("formtrigger")) return "form";
    if (type.includes("chat")) return "chat";
  }
  return "manual";
}

/**
 * Get n8n health status
 */
export async function checkN8nHealth(): Promise<{
  connected: boolean;
  instanceUrl: string | null;
  error?: string;
}> {
  if (!N8N_API_URL || !N8N_API_KEY || N8N_API_KEY.includes("REPLACE")) {
    return {
      connected: false,
      instanceUrl: null,
      error: "n8n API not configured",
    };
  }

  try {
    const response = await fetch(`${N8N_API_URL}/workflows?limit=1`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Accept": "application/json",
      },
    });

    return {
      connected: response.ok,
      instanceUrl: N8N_API_URL,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      connected: false,
      instanceUrl: N8N_API_URL,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
