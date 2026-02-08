/**
 * Tool Registry
 * Central registry for all available AI tools and their execution
 *
 * Includes:
 * - Core built-in tools (web search, tasks, documents, etc.)
 * - Dynamic skill-based tools (Gmail, Calendar, Todoist, Linear, etc.)
 */

import { Tool, ToolExecutionContext } from "./schema";
import { createTaskTool, executeCreateTask } from "./create-task";
import { webSearchTool, executeWebSearch } from "./web-search";
import {
  searchDocumentsTool,
  executeSearchDocuments,
} from "./search-documents";
import {
  searchConversationsTool,
  searchConversations,
  SearchConversationsInput,
} from "./search-conversations";
import {
  searchContactsTool,
  executeSearchContacts,
  SearchContactsInput,
} from "./search-contacts";
import {
  getUserSkills,
  getSkill,
  executeSkillTool,
} from "@/lib/skills/registry";

// Code execution tool definition
const executeCodeTool: Tool = {
  name: "execute_code",
  description: "Execute code in a sandboxed environment. Supports Python, JavaScript, TypeScript, Bash, and R. Use this when the user asks you to run code, test something, do calculations, data analysis, or any programming task.",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["python", "javascript", "typescript", "bash", "r"],
        description: "Programming language to execute",
      },
      code: {
        type: "string",
        description: "The code to execute",
      },
      timeout: {
        type: "number",
        description: "Execution timeout in milliseconds (default 30000, max 300000)",
      },
    },
    required: ["language", "code"],
  },
};

// Browser browsing tool definition
const browseWebTool: Tool = {
  name: "browse_web",
  description: "Browse the web using a real browser. Can take screenshots, scrape page content, extract data, generate PDFs, and interact with web pages. Use this when you need to see what a webpage looks like, extract specific content from a URL, or interact with a website.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["screenshot", "scrape", "pdf", "extract"],
        description: "The browser action to perform",
      },
      url: {
        type: "string",
        description: "The URL to browse",
      },
      selector: {
        type: "string",
        description: "CSS selector to target specific elements (for scrape/extract)",
      },
      javascript: {
        type: "string",
        description: "JavaScript to execute on the page (for extract action)",
      },
    },
    required: ["action", "url"],
  },
};

// Agent plan tools
const delegateToAgentTool: Tool = {
  name: "delegate_to_agent",
  description:
    "Delegate a complex, multi-step task to an autonomous background agent. Use this when the user's request requires multiple tool calls, background execution, or when you want to avoid blocking the conversation. The agent will decompose the goal into steps, execute them sequentially, and pause for approval on sensitive actions (sending emails, creating events, etc.).",
  parameters: {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description:
          "The high-level goal to accomplish (e.g., 'Research my top 3 competitors and draft an email summary')",
      },
      steps_hint: {
        type: "string",
        description:
          "Optional comma-separated hints about what steps to include (e.g., 'search web for competitor A, search web for competitor B, draft email')",
      },
      urgency: {
        type: "string",
        enum: ["low", "normal", "high"],
        description: "How urgently this plan should be executed (default: normal)",
      },
    },
    required: ["goal"],
  },
};

const getPlanStatusTool: Tool = {
  name: "get_plan_status",
  description:
    "Check the status of running or completed agent plans. Use this when the user asks about background tasks, what the agent is working on, or to check on a specific plan.",
  parameters: {
    type: "object",
    properties: {
      plan_id: {
        type: "string",
        description:
          "Specific plan ID to check. If omitted, returns recent plans.",
      },
      status_filter: {
        type: "string",
        enum: ["running", "paused", "completed", "failed", "cancelled"],
        description: "Filter plans by status",
      },
    },
    required: [],
  },
};

// Registry of all core (non-skill) tools
export const CORE_TOOLS: Tool[] = [
  webSearchTool,
  createTaskTool,
  searchDocumentsTool,
  searchConversationsTool, // Search conversation history
  searchContactsTool,      // Search contacts for relationship management
  executeCodeTool,         // Sandboxed code execution
  browseWebTool,           // Browser automation
  delegateToAgentTool,     // Autonomous background agent
  getPlanStatusTool,       // Check agent plan status
];

// Legacy export for backward compatibility
export const AVAILABLE_TOOLS: Tool[] = CORE_TOOLS;

/**
 * Get all available tools for a user (core tools + enabled skill tools)
 * This should be called per-request to get user-specific tools
 */
export async function getAvailableToolsForUser(
  userId: string,
  organizationId: string
): Promise<{ tools: Tool[]; skillMap: Record<string, string> }> {
  // Start with core tools
  const tools: Tool[] = [...CORE_TOOLS];
  const skillMap: Record<string, string> = {};

  try {
    // Get user's enabled skills
    const userSkills = await getUserSkills(userId);

    for (const userSkill of userSkills) {
      const skill = getSkill(userSkill.skillId);
      if (!skill) continue;

      // Add each tool from the skill
      for (const skillTool of skill.tools) {
        const toolName = `${skill.id}_${skillTool.name}`;

        tools.push({
          name: toolName,
          description: `[${skill.name}] ${skillTool.description}`,
          parameters: skillTool.parameters,
        });

        // Map tool name to skill ID for routing
        skillMap[toolName] = skill.id;
      }
    }

    console.log(`[Tools] Loaded ${tools.length} tools for user (${Object.keys(skillMap).length} from skills)`);
  } catch (error) {
    console.error("[Tools] Error loading skill tools:", error);
    // Return core tools only on error
  }

  return { tools, skillMap };
}

// Tool execution router
export async function executeToolCall(
  toolName: string,
  params: any,
  context: ToolExecutionContext,
  skillMap?: Record<string, string>
): Promise<string> {
  console.log(`[Tool Execution] ${toolName}`, { params, context });

  try {
    // Check if this is a skill tool (format: skillId_toolName)
    if (skillMap && skillMap[toolName]) {
      const skillId = skillMap[toolName];
      // Extract the actual tool name (remove skillId_ prefix)
      const actualToolName = toolName.replace(`${skillId}_`, "");

      console.log(`[Skill Tool] Executing ${skillId}.${actualToolName}`);

      const result = await executeSkillTool(skillId, actualToolName, params, {
        userId: context.userId,
        organizationId: context.organizationId,
        conversationId: context.conversationId,
      });

      if (result.success) {
        // Format the result for the AI
        if (typeof result.data === "string") {
          return result.data;
        }
        return JSON.stringify(result.data, null, 2);
      } else {
        return `Error: ${result.error || "Unknown error executing skill tool"}`;
      }
    }

    // Handle core tools
    switch (toolName) {
      case "web_search":
        return await executeWebSearch(params, context);

      case "create_task":
        return await executeCreateTask(params, context);

      case "search_documents":
        return await executeSearchDocuments(params, context);

      case "search_conversations": {
        const result = await searchConversations(params as SearchConversationsInput);
        if (result.totalFound === 0) {
          return "No previous conversations found matching your query.";
        }

        // Format results for the AI
        let response = `Found ${result.totalFound} previous conversation${result.totalFound > 1 ? "s" : ""} about "${params.query}":\n\n`;
        result.results.forEach((conv, idx) => {
          response += `${idx + 1}. **${conv.conversationTitle}** (${new Date(conv.createdAt).toLocaleDateString()})\n`;
          response += `   ${conv.messageRole === "user" ? "User" : "Assistant"}: ${conv.snippet}\n\n`;
        });
        return response;
      }

      case "search_contacts": {
        return await executeSearchContacts(params as SearchContactsInput, context);
      }

      case "execute_code": {
        // Dynamic import to avoid circular deps
        const { executeCode } = await import("@/lib/execution");
        const result = await executeCode(
          { language: params.language, code: params.code, timeout: params.timeout },
          context
        );
        return result.exitCode === 0
          ? `Code executed successfully:\n\`\`\`\n${result.stdout}\n\`\`\``
          : `Code execution ${result.exitCode !== 0 ? "failed" : "completed"}:\nStdout: ${result.stdout}\nStderr: ${result.stderr}`;
      }

      case "browse_web": {
        const { executeBrowserAction } = await import("@/lib/browser");
        const result = await executeBrowserAction(
          { action: params.action, url: params.url, selector: params.selector, javascript: params.javascript },
          context
        );
        if (!result.success) return `Browser action failed: ${result.error}`;
        if (params.action === "screenshot") return `Screenshot taken of ${params.url}. Image data available.`;
        return `Browser ${params.action} result from ${params.url}:\n${typeof result.data === "string" ? result.data : JSON.stringify(result.data)}`;
      }

      case "delegate_to_agent": {
        const { createAndStartPlan } = await import("@/lib/agents/executor");
        const stepsHint = params.steps_hint
          ? params.steps_hint.split(",").map((s: string) => s.trim())
          : undefined;
        const plan = await createAndStartPlan(
          { goal: params.goal, steps_hint: stepsHint, urgency: params.urgency },
          context
        );
        return `Plan created (id: ${plan.id}). ${plan.steps.length} steps queued. I'll execute them in the background and notify you when complete or when approval is needed.`;
      }

      case "get_plan_status": {
        const { getPlan, listPlans } = await import(
          "@/lib/agents/executor/state-manager"
        );
        if (params.plan_id) {
          const plan = await getPlan(params.plan_id);
          if (!plan) return "Plan not found.";
          const { generatePlanSummary } = await import(
            "@/lib/agents/executor/reporter"
          );
          return generatePlanSummary(plan);
        }
        const plans = await listPlans(context.userId, params.status_filter);
        if (plans.length === 0) return "No agent plans found.";
        return plans
          .map(
            (p) =>
              `[${p.status}] "${p.goal}" (${p.steps.filter((s) => s.status === "completed").length}/${p.steps.length} steps) - id: ${p.id}`
          )
          .join("\n");
      }

      default:
        console.error(`Unknown tool: ${toolName}`);
        return `Error: Tool "${toolName}" is not recognized or not implemented yet.`;
    }
  } catch (error: any) {
    console.error(`Error executing tool ${toolName}:`, error);
    return `Error executing ${toolName}: ${error.message || "Unknown error"}`;
  }
}

// Helper to get tool by name
export function getToolByName(name: string): Tool | undefined {
  return AVAILABLE_TOOLS.find((tool) => tool.name === name);
}

// Helper to format tools for OpenAI API
export function formatToolsForOpenAI(tools: Tool[]) {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

// Helper to format tools for Anthropic Claude API
export function formatToolsForClaude(tools: Tool[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}
