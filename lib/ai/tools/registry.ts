/**
 * Tool Registry
 * Central registry for all available AI tools and their execution
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

// Registry of all available tools
export const AVAILABLE_TOOLS: Tool[] = [
  webSearchTool,
  createTaskTool,
  searchDocumentsTool,
  searchConversationsTool, // NEW: Search conversation history
  // More tools will be added here
];

// Tool execution router
export async function executeToolCall(
  toolName: string,
  params: any,
  context: ToolExecutionContext
): Promise<string> {
  console.log(`[Tool Execution] ${toolName}`, { params, context });

  try {
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

      // Add more tool cases here as they're implemented
      // case "create_calendar_event":
      //   return await executeCreateCalendarEvent(params, context);

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
