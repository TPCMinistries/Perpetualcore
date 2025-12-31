/**
 * Bot Node Implementations
 * Each node type has an execute function
 */

import { BotNode, ExecutionContext } from "../engine";

export interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

type NodeExecutor = (
  node: BotNode,
  input: any,
  context: ExecutionContext
) => Promise<NodeExecutionResult>;

/**
 * Node executor registry
 */
const nodeExecutors: Record<string, NodeExecutor> = {
  // Triggers
  trigger_webhook: executeTriggerWebhook,
  trigger_schedule: executeTriggerSchedule,
  trigger_event: executeTriggerEvent,
  trigger_email: executeTriggerEmail,
  trigger_form: executeTriggerForm,

  // Actions
  action_ai_response: executeAIResponse,
  action_api_call: executeAPICall,
  action_send_email: executeSendEmail,
  action_send_notification: executeSendNotification,
  action_create_task: executeCreateTask,
  action_update_db: executeUpdateDB,
  action_rag_search: executeRAGSearch,

  // Logic
  logic_condition: executeCondition,
  logic_switch: executeSwitch,
  logic_loop: executeLoop,
  logic_delay: executeDelay,
  logic_parallel: executeParallel,
  logic_merge: executeMerge,

  // Transform
  transform_data: executeTransformData,
  transform_filter: executeFilter,
  transform_aggregate: executeAggregate,
};

/**
 * Execute a node
 */
export async function executeNode(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const executor = nodeExecutors[node.type];

  if (!executor) {
    return {
      success: false,
      error: `Unknown node type: ${node.type}`,
    };
  }

  try {
    return await executor(node, input, context);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Node execution failed",
    };
  }
}

// ============================================
// TRIGGER NODES
// ============================================

async function executeTriggerWebhook(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  // Trigger nodes just pass through the input data
  return { success: true, output: input };
}

async function executeTriggerSchedule(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  return {
    success: true,
    output: {
      ...input,
      triggered_at: new Date().toISOString(),
      trigger_type: "schedule",
    },
  };
}

async function executeTriggerEvent(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  return { success: true, output: input };
}

async function executeTriggerEmail(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  return { success: true, output: input };
}

async function executeTriggerForm(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  return { success: true, output: input };
}

// ============================================
// ACTION NODES
// ============================================

async function executeAIResponse(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const prompt = config.prompt || "You are a helpful assistant.";
  const model = config.model || "auto";

  try {
    // Call internal chat API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/v1/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use internal service key or context
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: prompt },
            {
              role: "user",
              content:
                typeof input === "string" ? input : JSON.stringify(input),
            },
          ],
          model,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "AI request failed" };
    }

    const data = await response.json();
    return {
      success: true,
      output: {
        response: data.content,
        model: data.model,
        tokens: data.usage?.total_tokens,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function executeAPICall(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const url = interpolateVariables(config.url || "", input, context);
  const method = config.method || "GET";
  const headers = config.headers || {};
  const body = config.body ? interpolateVariables(config.body, input, context) : undefined;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: method !== "GET" ? JSON.stringify(body || input) : undefined,
    });

    const responseData = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      output: {
        status: response.status,
        data: responseData,
      },
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function executeSendEmail(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};

  // In production, integrate with email service
  console.log("[Bot] Send email:", {
    to: interpolateVariables(config.to || "", input, context),
    subject: interpolateVariables(config.subject || "", input, context),
    body: interpolateVariables(config.body || "", input, context),
  });

  return {
    success: true,
    output: { sent: true, timestamp: new Date().toISOString() },
  };
}

async function executeSendNotification(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};

  console.log("[Bot] Send notification:", {
    channel: config.channel,
    message: interpolateVariables(config.message || "", input, context),
  });

  return {
    success: true,
    output: { sent: true, timestamp: new Date().toISOString() },
  };
}

async function executeCreateTask(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};

  // In production, create task via API
  const task = {
    title: interpolateVariables(config.title || "New Task", input, context),
    assignee: config.assignee,
    created_at: new Date().toISOString(),
  };

  return { success: true, output: task };
}

async function executeUpdateDB(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};

  // Placeholder - in production, perform actual DB operation
  return {
    success: true,
    output: {
      operation: config.operation || "update",
      table: config.table,
      affected: 1,
    },
  };
}

async function executeRAGSearch(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const query = interpolateVariables(config.query || "", input, context) || input;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/v1/documents/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: typeof query === "string" ? query : JSON.stringify(query),
          limit: config.limit || 5,
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "Search failed" };
    }

    const data = await response.json();
    return { success: true, output: data.results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// LOGIC NODES
// ============================================

async function executeCondition(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const field = config.field || "value";
  const operator = config.operator || "equals";
  const compareValue = config.value;

  const actualValue = getNestedValue(input, field);
  let result = false;

  switch (operator) {
    case "equals":
      result = actualValue === compareValue;
      break;
    case "not_equals":
      result = actualValue !== compareValue;
      break;
    case "contains":
      result = String(actualValue).includes(String(compareValue));
      break;
    case "greater_than":
      result = Number(actualValue) > Number(compareValue);
      break;
    case "less_than":
      result = Number(actualValue) < Number(compareValue);
      break;
    case "is_empty":
      result = !actualValue || actualValue === "";
      break;
    case "is_not_empty":
      result = !!actualValue && actualValue !== "";
      break;
    default:
      result = !!actualValue;
  }

  return { success: true, output: result };
}

async function executeSwitch(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const field = config.field || "value";
  const cases = config.cases || [];

  const value = getNestedValue(input, field);
  const matchedCase = cases.find((c: any) => c.value === value);

  return {
    success: true,
    output: { case: matchedCase?.label || "default", value },
  };
}

async function executeLoop(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const itemsField = config.items || "items";
  const maxIterations = config.max_iterations || 100;

  const items = getNestedValue(input, itemsField) || [];
  const limitedItems = Array.isArray(items)
    ? items.slice(0, maxIterations)
    : [items];

  return {
    success: true,
    output: {
      items: limitedItems,
      count: limitedItems.length,
      current_index: 0,
    },
  };
}

async function executeDelay(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const delayMs = Math.min(config.delay_ms || 1000, 30000); // Max 30 seconds

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return { success: true, output: input };
}

async function executeParallel(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  // Parallel execution is handled by the engine
  return { success: true, output: input };
}

async function executeMerge(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const strategy = config.strategy || "array";

  // Input should be array of results from parallel branches
  if (Array.isArray(input)) {
    if (strategy === "object") {
      return { success: true, output: Object.assign({}, ...input) };
    }
    return { success: true, output: input };
  }

  return { success: true, output: input };
}

// ============================================
// TRANSFORM NODES
// ============================================

async function executeTransformData(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const mapping = config.mapping || {};

  const output: Record<string, any> = {};

  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    output[targetKey] = getNestedValue(input, sourcePath as string);
  }

  return { success: true, output };
}

async function executeFilter(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const filter = config.filter || {};

  if (!Array.isArray(input)) {
    return { success: true, output: input };
  }

  const filtered = input.filter((item) => {
    for (const [key, value] of Object.entries(filter)) {
      if (getNestedValue(item, key) !== value) {
        return false;
      }
    }
    return true;
  });

  return { success: true, output: filtered };
}

async function executeAggregate(
  node: BotNode,
  input: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data.config || {};
  const operation = config.operation || "count";
  const field = config.field;

  if (!Array.isArray(input)) {
    return { success: true, output: { result: input } };
  }

  let result: any;

  switch (operation) {
    case "count":
      result = input.length;
      break;
    case "sum":
      result = input.reduce((acc, item) => acc + (getNestedValue(item, field) || 0), 0);
      break;
    case "avg":
      const sum = input.reduce((acc, item) => acc + (getNestedValue(item, field) || 0), 0);
      result = input.length > 0 ? sum / input.length : 0;
      break;
    case "min":
      result = Math.min(...input.map((item) => getNestedValue(item, field) || Infinity));
      break;
    case "max":
      result = Math.max(...input.map((item) => getNestedValue(item, field) || -Infinity));
      break;
    default:
      result = input;
  }

  return { success: true, output: { operation, result } };
}

// ============================================
// HELPERS
// ============================================

function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

function interpolateVariables(
  template: string,
  input: any,
  context: ExecutionContext
): string {
  if (typeof template !== "string") return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();

    // Check context variables first
    if (trimmedPath.startsWith("context.")) {
      return context.variables[trimmedPath.replace("context.", "")] || match;
    }

    // Check input
    const value = getNestedValue(input, trimmedPath);
    return value !== undefined ? String(value) : match;
  });
}
