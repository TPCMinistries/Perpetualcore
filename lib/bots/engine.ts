/**
 * Bot Execution Engine
 * Executes visual bot flows node by node
 */

import { createClient } from "@/lib/supabase/server";
import { executeNode, NodeExecutionResult } from "./nodes";

export interface BotNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    config?: Record<string, any>;
  };
}

export interface BotEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
  data?: {
    condition?: Record<string, any>;
  };
}

export interface BotFlow {
  nodes: BotNode[];
  edges: BotEdge[];
}

export interface ExecutionContext {
  executionId: string;
  agentId: string;
  organizationId: string;
  userId?: string;
  variables: Record<string, any>;
  nodeOutputs: Map<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  output?: any;
  error?: string;
  executionTimeMs?: number;
  nodesExecuted: number;
}

/**
 * Execute a bot flow
 */
export async function executeBot(
  agentId: string,
  organizationId: string,
  userId: string,
  inputData: Record<string, any> = {},
  triggeredBy: string = "manual"
): Promise<ExecutionResult> {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    // Start execution
    const { data: executionId, error: startError } = await supabase.rpc(
      "start_bot_execution",
      {
        p_agent_id: agentId,
        p_org_id: organizationId,
        p_triggered_by: triggeredBy,
        p_triggered_by_user: userId,
        p_input_data: inputData,
      }
    );

    if (startError || !executionId) {
      return {
        success: false,
        executionId: "",
        error: startError?.message || "Failed to start execution",
        nodesExecuted: 0,
      };
    }

    // Load bot flow
    const { data: flowData, error: flowError } = await supabase.rpc(
      "load_bot_flow",
      { p_agent_id: agentId }
    );

    if (flowError || !flowData) {
      await completeExecution(supabase, executionId, false, null, "Failed to load bot flow");
      return {
        success: false,
        executionId,
        error: "Failed to load bot flow",
        nodesExecuted: 0,
      };
    }

    const flow: BotFlow = flowData;

    // Create execution context
    const context: ExecutionContext = {
      executionId,
      agentId,
      organizationId,
      userId,
      variables: { ...inputData },
      nodeOutputs: new Map(),
    };

    // Find trigger node (starting point)
    const triggerNode = flow.nodes.find((n) => n.type.startsWith("trigger_"));
    if (!triggerNode) {
      await completeExecution(supabase, executionId, false, null, "No trigger node found");
      return {
        success: false,
        executionId,
        error: "No trigger node found",
        nodesExecuted: 0,
      };
    }

    // Build adjacency list for graph traversal
    const adjacency = buildAdjacencyList(flow);

    // Execute flow starting from trigger
    let nodesExecuted = 0;
    const result = await executeNodeChain(
      supabase,
      context,
      flow,
      adjacency,
      triggerNode.id,
      inputData,
      (count) => { nodesExecuted = count; }
    );

    // Complete execution
    await completeExecution(
      supabase,
      executionId,
      result.success,
      result.output,
      result.error
    );

    return {
      success: result.success,
      executionId,
      output: result.output,
      error: result.error,
      executionTimeMs: Date.now() - startTime,
      nodesExecuted,
    };
  } catch (error: any) {
    console.error("[Bot Engine] Execution error:", error);
    return {
      success: false,
      executionId: "",
      error: error.message,
      nodesExecuted: 0,
    };
  }
}

/**
 * Build adjacency list from edges
 */
function buildAdjacencyList(flow: BotFlow): Map<string, BotEdge[]> {
  const adjacency = new Map<string, BotEdge[]>();

  for (const edge of flow.edges) {
    const existing = adjacency.get(edge.source) || [];
    existing.push(edge);
    adjacency.set(edge.source, existing);
  }

  return adjacency;
}

/**
 * Execute nodes in chain
 */
async function executeNodeChain(
  supabase: any,
  context: ExecutionContext,
  flow: BotFlow,
  adjacency: Map<string, BotEdge[]>,
  currentNodeId: string,
  input: any,
  onNodeExecuted: (count: number) => void,
  visited: Set<string> = new Set(),
  nodeCount: number = 0
): Promise<{ success: boolean; output?: any; error?: string }> {
  // Prevent infinite loops
  if (visited.has(currentNodeId)) {
    return { success: true, output: input };
  }
  visited.add(currentNodeId);

  // Find current node
  const node = flow.nodes.find((n) => n.id === currentNodeId);
  if (!node) {
    return { success: false, error: `Node ${currentNodeId} not found` };
  }

  // Execute node
  const nodeResult = await executeNode(node, input, context);

  // Log node execution
  await supabase.rpc("log_node_execution", {
    p_execution_id: context.executionId,
    p_node_id: currentNodeId,
    p_status: nodeResult.success ? "success" : "failed",
    p_output: nodeResult.output,
    p_error: nodeResult.error,
  });

  nodeCount++;
  onNodeExecuted(nodeCount);

  // Store output in context
  context.nodeOutputs.set(currentNodeId, nodeResult.output);

  if (!nodeResult.success) {
    return { success: false, error: nodeResult.error };
  }

  // Get outgoing edges
  const outgoingEdges = adjacency.get(currentNodeId) || [];

  if (outgoingEdges.length === 0) {
    // End of flow
    return { success: true, output: nodeResult.output };
  }

  // Handle conditional branching
  if (node.type === "logic_condition" || node.type === "logic_switch") {
    const selectedEdge = selectConditionalEdge(outgoingEdges, nodeResult.output);
    if (selectedEdge) {
      return executeNodeChain(
        supabase,
        context,
        flow,
        adjacency,
        selectedEdge.target,
        nodeResult.output,
        onNodeExecuted,
        visited,
        nodeCount
      );
    }
    return { success: true, output: nodeResult.output };
  }

  // Handle parallel execution
  if (node.type === "logic_parallel") {
    const results = await Promise.all(
      outgoingEdges.map((edge) =>
        executeNodeChain(
          supabase,
          context,
          flow,
          adjacency,
          edge.target,
          nodeResult.output,
          onNodeExecuted,
          new Set(visited),
          nodeCount
        )
      )
    );

    const anyFailed = results.find((r) => !r.success);
    if (anyFailed) {
      return anyFailed;
    }

    return {
      success: true,
      output: results.map((r) => r.output),
    };
  }

  // Standard sequential execution (follow first edge)
  const nextEdge = outgoingEdges[0];
  return executeNodeChain(
    supabase,
    context,
    flow,
    adjacency,
    nextEdge.target,
    nodeResult.output,
    onNodeExecuted,
    visited,
    nodeCount
  );
}

/**
 * Select edge based on condition
 */
function selectConditionalEdge(
  edges: BotEdge[],
  conditionResult: any
): BotEdge | null {
  // For boolean conditions, select true/false edge
  if (typeof conditionResult === "boolean") {
    const trueEdge = edges.find(
      (e) => e.sourceHandle === "true" || e.label === "true"
    );
    const falseEdge = edges.find(
      (e) => e.sourceHandle === "false" || e.label === "false"
    );
    return conditionResult ? trueEdge || edges[0] : falseEdge || edges[1];
  }

  // For switch/case, match by value
  if (conditionResult?.case !== undefined) {
    const matchedEdge = edges.find(
      (e) =>
        e.sourceHandle === String(conditionResult.case) ||
        e.label === String(conditionResult.case)
    );
    return matchedEdge || edges.find((e) => e.label === "default") || edges[0];
  }

  return edges[0];
}

/**
 * Complete execution
 */
async function completeExecution(
  supabase: any,
  executionId: string,
  success: boolean,
  output: any,
  error?: string
): Promise<void> {
  await supabase.rpc("complete_bot_execution", {
    p_execution_id: executionId,
    p_success: success,
    p_output_data: output,
    p_error_message: error,
  });
}

/**
 * Get execution status
 */
export async function getExecutionStatus(
  executionId: string,
  organizationId: string
): Promise<{
  status: string;
  currentNode?: string;
  output?: any;
  error?: string;
  executionLog?: any[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bot_executions")
    .select("status, current_node_id, output_data, error_message, execution_log")
    .eq("id", executionId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return { status: "not_found" };
  }

  return {
    status: data.status,
    currentNode: data.current_node_id,
    output: data.output_data,
    error: data.error_message,
    executionLog: data.execution_log,
  };
}
