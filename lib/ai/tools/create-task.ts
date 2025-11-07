/**
 * Create Task Tool
 * Allows AI to create tasks in the user's task list
 */

import { Tool, ToolExecutionContext } from "./schema";
import { createClient } from "@/lib/supabase/server";

export const createTaskTool: Tool = {
  name: "create_task",
  description:
    "Create a new task in the user's task list. Use this when the user asks you to remind them of something, create a todo, or track an action item. Examples: 'remind me to call John', 'create a task to review the proposal', 'add to my todo list: finish the report'.",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "The task title or summary (required, keep it concise)",
      },
      description: {
        type: "string",
        description:
          "Detailed description of the task (optional, provide context)",
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
        description:
          "Task priority (default: medium). Use 'high' for urgent tasks, 'low' for nice-to-haves.",
      },
      due_date: {
        type: "string",
        description:
          "Due date in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ). Optional. Examples: '2025-11-15', '2025-11-15T14:30:00Z'",
      },
    },
    required: ["title"],
  },
};

export async function executeCreateTask(
  params: {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    due_date?: string;
  },
  context: ToolExecutionContext
): Promise<string> {
  try {
    const supabase = createClient();

    // Validate required parameters
    if (!params.title || params.title.trim().length === 0) {
      return "Error: Task title is required and cannot be empty.";
    }

    // Insert task into database
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        organization_id: context.organizationId,
        user_id: context.userId,
        title: params.title.trim(),
        description: params.description?.trim() || null,
        priority: params.priority || "medium",
        status: "todo",
        due_date: params.due_date || null,
        conversation_id: context.conversationId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return `Error creating task: ${error.message}`;
    }

    // Format success response
    let response = `Task created successfully: "${params.title}"`;

    if (params.priority && params.priority !== "medium") {
      response += ` (Priority: ${params.priority})`;
    }

    if (params.due_date) {
      const dueDate = new Date(params.due_date);
      response += ` (Due: ${dueDate.toLocaleDateString()})`;
    }

    return response;
  } catch (error: any) {
    console.error("Unexpected error in executeCreateTask:", error);
    return `Error: ${error.message || "Failed to create task"}`;
  }
}
