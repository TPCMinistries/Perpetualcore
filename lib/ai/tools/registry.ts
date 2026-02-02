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

// Registry of all core (non-skill) tools
export const CORE_TOOLS: Tool[] = [
  webSearchTool,
  createTaskTool,
  searchDocumentsTool,
  searchConversationsTool, // Search conversation history
  searchContactsTool,      // Search contacts for relationship management
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
