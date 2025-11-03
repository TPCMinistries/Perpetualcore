/**
 * Workflow Execution Engine
 * Handles the execution of workflow nodes and manages execution state
 */

import { createClient } from "@/lib/supabase/server";

// Node types
export type NodeType = "input" | "assistant" | "condition" | "output" | "custom";

// Execution status
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

// Node execution result
export interface NodeExecutionResult {
  nodeId: string;
  status: "completed" | "failed" | "skipped";
  output: any;
  error?: string;
  durationMs: number;
}

// Workflow node structure
export interface WorkflowNode {
  id: string;
  type: NodeType;
  data: {
    label: string;
    assistantRole?: string;
    prompt?: string;
    fields?: any[];
    [key: string]: any;
  };
}

// Workflow edge structure
export interface WorkflowEdge {
  source: string;
  target: string;
  label?: string;
}

/**
 * WorkflowExecutionEngine
 * Core engine for executing workflows
 */
export class WorkflowExecutionEngine {
  private executionId: string;
  private workflowId: string;
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private nodeResults: Map<string, any>;
  private supabase: any;

  constructor(
    executionId: string,
    workflowId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ) {
    this.executionId = executionId;
    this.workflowId = workflowId;
    this.nodes = nodes;
    this.edges = edges;
    this.nodeResults = new Map();
  }

  /**
   * Initialize the Supabase client
   */
  async init() {
    this.supabase = await createClient();
  }

  /**
   * Execute the workflow
   */
  async execute(inputData: any = {}): Promise<any> {
    await this.init();
    const startTime = Date.now();

    try {
      // Update execution status to running
      await this.updateExecutionStatus("running", null);

      // Store input data
      this.nodeResults.set("input", inputData);

      // Get execution order (topological sort)
      const executionOrder = this.getExecutionOrder();

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = this.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        await this.logNodeStart(nodeId, node.type);

        try {
          const result = await this.executeNode(node);
          this.nodeResults.set(nodeId, result);

          await this.logNodeComplete(nodeId, node.type, result);
          await this.updateExecutionProgress(nodeId);
        } catch (error: any) {
          await this.logNodeFailed(nodeId, node.type, error.message);
          throw error;
        }
      }

      // Get output data
      const outputNode = this.nodes.find((n) => n.type === "output");
      const outputData = outputNode ? this.nodeResults.get(outputNode.id) : this.nodeResults;

      // Mark execution as completed
      await this.updateExecutionStatus("completed", outputData);

      const duration = Date.now() - startTime;
      return {
        success: true,
        executionId: this.executionId,
        outputData,
        durationMs: duration,
      };
    } catch (error: any) {
      // Mark execution as failed
      await this.updateExecutionStatus("failed", null, error.message);

      const duration = Date.now() - startTime;
      return {
        success: false,
        executionId: this.executionId,
        error: error.message,
        durationMs: duration,
      };
    }
  }

  /**
   * Execute a single node based on its type
   */
  private async executeNode(node: WorkflowNode): Promise<any> {
    switch (node.type) {
      case "input":
        return this.executeInputNode(node);
      case "assistant":
        return await this.executeAssistantNode(node);
      case "condition":
        return this.executeConditionNode(node);
      case "output":
        return this.executeOutputNode(node);
      case "custom":
        return await this.executeCustomNode(node);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute input node (pass through input data)
   */
  private executeInputNode(node: WorkflowNode): any {
    return this.nodeResults.get("input") || {};
  }

  /**
   * Execute assistant node (AI processing)
   */
  private async executeAssistantNode(node: WorkflowNode): Promise<any> {
    // Get input from previous nodes
    const input = this.getNodeInput(node.id);

    // Get assistant role and prompt
    const assistantRole = node.data.assistantRole || "general";
    let prompt = node.data.prompt || this.buildPromptFromInput(input, node.data.label);

    // Parse template variables in prompt
    prompt = this.parsePromptTemplate(prompt);

    // Call AI API (using Anthropic Claude)
    try {
      const result = await this.callAIAPI(prompt, assistantRole);
      return {
        nodeId: node.id,
        type: "assistant",
        role: assistantRole,
        input: input,
        output: result,
      };
    } catch (error: any) {
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * Execute condition node (conditional branching)
   */
  private executeConditionNode(node: WorkflowNode): any {
    const input = this.getNodeInput(node.id);

    // Evaluate condition
    const field = node.data.field;
    const operator = node.data.operator || "equals";
    const value = node.data.value;

    let result = false;
    if (field && input[field] !== undefined) {
      switch (operator) {
        case "equals":
          result = input[field] === value;
          break;
        case "not_equals":
          result = input[field] !== value;
          break;
        case "contains":
          result = String(input[field]).includes(value);
          break;
        case "greater_than":
          result = Number(input[field]) > Number(value);
          break;
        case "less_than":
          result = Number(input[field]) < Number(value);
          break;
        default:
          result = false;
      }
    }

    return {
      nodeId: node.id,
      type: "condition",
      condition: result,
      field,
      operator,
      value,
    };
  }

  /**
   * Execute output node (collect results)
   */
  private executeOutputNode(node: WorkflowNode): any {
    // Collect outputs from all previous nodes
    const outputs: any = {};

    // Get specified fields if configured
    const fields = node.data.fields || [];

    if (fields.length > 0) {
      // Collect only specified fields
      for (const field of fields) {
        for (const [nodeId, result] of this.nodeResults.entries()) {
          if (result && result.output && result.output[field]) {
            outputs[field] = result.output[field];
          }
        }
      }
    } else {
      // Collect all results
      for (const [nodeId, result] of this.nodeResults.entries()) {
        outputs[nodeId] = result;
      }
    }

    return outputs;
  }

  /**
   * Execute custom node (user-defined logic)
   */
  private async executeCustomNode(node: WorkflowNode): Promise<any> {
    const input = this.getNodeInput(node.id);

    // For custom nodes, we'll use AI to process with a custom prompt
    let prompt = node.data.prompt || `Process the following data: ${JSON.stringify(input)}`;

    // Parse template variables in prompt
    prompt = this.parsePromptTemplate(prompt);

    try {
      const result = await this.callAIAPI(prompt, "custom");
      return {
        nodeId: node.id,
        type: "custom",
        input: input,
        output: result,
      };
    } catch (error: any) {
      throw new Error(`Custom node execution failed: ${error.message}`);
    }
  }

  /**
   * Get input for a node from its parent nodes
   */
  private getNodeInput(nodeId: string): any {
    const parentEdges = this.edges.filter((e) => e.target === nodeId);

    if (parentEdges.length === 0) {
      return this.nodeResults.get("input") || {};
    }

    if (parentEdges.length === 1) {
      return this.nodeResults.get(parentEdges[0].source) || {};
    }

    // Multiple parents - merge their outputs
    const mergedInput: any = {};
    for (const edge of parentEdges) {
      const parentResult = this.nodeResults.get(edge.source);
      if (parentResult) {
        Object.assign(mergedInput, parentResult);
      }
    }

    return mergedInput;
  }

  /**
   * Build a prompt from input data and node label
   */
  private buildPromptFromInput(input: any, label: string): string {
    return `Task: ${label}\n\nInput Data:\n${JSON.stringify(input, null, 2)}\n\nPlease process this data according to the task.`;
  }

  /**
   * Parse template variables in prompt
   * Supports: {{variable}}, {{node_id.output}}, {{#if variable}}...{{/if}}
   */
  private parsePromptTemplate(template: string): string {
    let result = template;

    // Get input data from the input node
    const inputData = this.nodeResults.get("input") || {};

    // Replace simple variables from input data: {{variable}}
    result = result.replace(/\{\{([^#/}]+?)\}\}/g, (match, varPath) => {
      varPath = varPath.trim();

      // Check if it's a node reference (e.g., node_2.output)
      if (varPath.includes('.')) {
        const parts = varPath.split('.');
        const nodeId = parts[0];
        const property = parts.slice(1).join('.');

        const nodeResult = this.nodeResults.get(nodeId);
        if (nodeResult) {
          // Navigate the property path
          let value = nodeResult;
          for (const prop of parts.slice(1)) {
            value = value?.[prop];
          }
          return value !== undefined ? String(value) : match;
        }
        return match;
      }

      // Simple variable from input data
      const value = inputData[varPath];
      return value !== undefined ? String(value) : match;
    });

    // Handle conditional blocks: {{#if variable}}...{{/if}}
    result = result.replace(/\{\{#if\s+([^}]+?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      condition = condition.trim();

      // Check if condition variable exists and is truthy
      let conditionValue = inputData[condition];

      // Check if it's a node reference
      if (condition.includes('.')) {
        const parts = condition.split('.');
        const nodeId = parts[0];
        const nodeResult = this.nodeResults.get(nodeId);
        if (nodeResult) {
          conditionValue = nodeResult;
          for (const prop of parts.slice(1)) {
            conditionValue = conditionValue?.[prop];
          }
        }
      }

      // If condition is truthy, return the content (also parse it)
      if (conditionValue) {
        // Recursively parse the content in case it has variables
        return this.parsePromptTemplate(content);
      }

      // Condition is falsy, remove the block
      return '';
    });

    return result;
  }

  /**
   * Call AI API (OpenAI GPT-4o-mini)
   */
  private async callAIAPI(prompt: string, role: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Role-specific system prompts
    const systemPrompts: Record<string, string> = {
      research: "You are a research assistant. Provide thorough, well-researched information with sources when possible.",
      writing: "You are a professional writer. Create clear, engaging, and well-structured content.",
      marketing: "You are a marketing expert. Create compelling, conversion-focused content that resonates with the target audience.",
      customer_support: "You are a helpful customer support agent. Provide clear, empathetic, and solution-focused responses.",
      code_review: "You are a senior software engineer. Review code for quality, security, performance, and best practices.",
      general: "You are a helpful AI assistant. Provide accurate and useful responses.",
      custom: "You are a helpful AI assistant. Process the given task according to the instructions.",
    };

    const systemPrompt = systemPrompts[role] || systemPrompts.general;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`AI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      throw new Error(`Failed to call AI API: ${error.message}`);
    }
  }

  /**
   * Get execution order using topological sort
   */
  private getExecutionOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error("Circular dependency detected in workflow");
      }

      visiting.add(nodeId);

      // Visit all parent nodes first
      const parentEdges = this.edges.filter((e) => e.target === nodeId);
      for (const edge of parentEdges) {
        visit(edge.source);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Start with input nodes
    const inputNodes = this.nodes.filter((n) => n.type === "input");
    for (const node of inputNodes) {
      visit(node.id);
    }

    // Visit all remaining nodes
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return order;
  }

  /**
   * Update execution status in database
   */
  private async updateExecutionStatus(
    status: ExecutionStatus,
    outputData: any = null,
    errorMessage?: string
  ) {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed" || status === "failed") {
      updates.completed_at = new Date().toISOString();
    }

    if (outputData) {
      updates.output_data = outputData;
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (this.nodeResults.size > 0) {
      updates.node_results = Object.fromEntries(this.nodeResults);
    }

    await this.supabase
      .from("workflow_executions")
      .update(updates)
      .eq("id", this.executionId);
  }

  /**
   * Update execution progress (current node)
   */
  private async updateExecutionProgress(currentNodeId: string) {
    await this.supabase
      .from("workflow_executions")
      .update({
        current_node_id: currentNodeId,
        node_results: Object.fromEntries(this.nodeResults),
        updated_at: new Date().toISOString(),
      })
      .eq("id", this.executionId);
  }

  /**
   * Log node start
   */
  private async logNodeStart(nodeId: string, nodeType: string) {
    await this.supabase.from("workflow_execution_logs").insert({
      execution_id: this.executionId,
      node_id: nodeId,
      node_type: nodeType,
      status: "started",
      started_at: new Date().toISOString(),
    });
  }

  /**
   * Log node completion
   */
  private async logNodeComplete(nodeId: string, nodeType: string, output: any) {
    const startLog = await this.supabase
      .from("workflow_execution_logs")
      .select("*")
      .eq("execution_id", this.executionId)
      .eq("node_id", nodeId)
      .eq("status", "started")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (startLog.data) {
      const duration = Date.now() - new Date(startLog.data.started_at).getTime();

      await this.supabase
        .from("workflow_execution_logs")
        .update({
          status: "completed",
          output_data: output,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq("id", startLog.data.id);
    }
  }

  /**
   * Log node failure
   */
  private async logNodeFailed(nodeId: string, nodeType: string, errorMessage: string) {
    const startLog = await this.supabase
      .from("workflow_execution_logs")
      .select("*")
      .eq("execution_id", this.executionId)
      .eq("node_id", nodeId)
      .eq("status", "started")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (startLog.data) {
      const duration = Date.now() - new Date(startLog.data.started_at).getTime();

      await this.supabase
        .from("workflow_execution_logs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq("id", startLog.data.id);
    }

    // Also update execution with error
    await this.supabase
      .from("workflow_executions")
      .update({
        error_message: errorMessage,
        error_node_id: nodeId,
      })
      .eq("id", this.executionId);
  }
}
