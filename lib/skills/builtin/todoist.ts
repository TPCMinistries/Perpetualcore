/**
 * Todoist Skill
 *
 * Manage tasks and projects in Todoist.
 * Uses BYOK (Bring Your Own Key) for API authentication.
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { resolveCredential } from "../credentials";
import { createAdminClient } from "@/lib/supabase/server";

const TODOIST_API = "https://api.todoist.com/rest/v2";

/**
 * Get Todoist API headers
 */
async function getTodoistHeaders(
  userId: string,
  organizationId?: string
): Promise<Headers | null> {
  const credential = await resolveCredential("todoist", userId, organizationId);

  if (!credential) {
    return null;
  }

  return new Headers({
    Authorization: `Bearer ${credential.key}`,
    "Content-Type": "application/json",
  });
}

/**
 * Sync Todoist tasks to external_tasks table
 */
async function syncToDatabase(
  userId: string,
  organizationId: string,
  tasks: any[]
): Promise<number> {
  const supabase = createAdminClient();
  let synced = 0;

  for (const task of tasks) {
    const taskData = {
      user_id: userId,
      organization_id: organizationId,
      provider: "todoist",
      provider_task_id: task.id,
      provider_project_id: task.project_id,
      title: task.content,
      description: task.description || null,
      status: task.is_completed ? "completed" : "open",
      priority: 5 - task.priority, // Todoist: 1=normal, 4=urgent; We use: 1=highest, 4=lowest
      due_date: task.due?.datetime || task.due?.date || null,
      todoist_section_id: task.section_id || null,
      todoist_labels: task.labels || [],
      url: task.url,
      raw_data: task,
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("external_tasks").upsert(taskData, {
      onConflict: "user_id,provider,provider_task_id",
    });

    if (!error) synced++;
  }

  return synced;
}

/**
 * List all projects
 */
async function listProjects(
  params: {},
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getTodoistHeaders(context.userId, context.organizationId);
  if (!headers) {
    return {
      success: false,
      error: "Todoist not connected. Add your API token in Settings > Integrations.",
    };
  }

  try {
    const response = await fetch(`${TODOIST_API}/projects`, { headers });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Invalid Todoist API token. Please update in Settings." };
      }
      return { success: false, error: `Todoist API error: ${response.status}` };
    }

    const projects = await response.json();

    return {
      success: true,
      data: {
        projects: projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          isFavorite: p.is_favorite,
          isInboxProject: p.is_inbox_project,
        })),
      },
      display: {
        type: "table",
        content: {
          headers: ["Project", "ID", "Favorite"],
          rows: projects.slice(0, 15).map((p: any) => [
            p.is_inbox_project ? "📥 " + p.name : p.name,
            p.id,
            p.is_favorite ? "⭐" : "",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List tasks with optional filters
 */
async function listTasks(
  params: {
    projectId?: string;
    filter?: string;
    dueTodayOnly?: boolean;
    limit?: number;
  },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getTodoistHeaders(context.userId, context.organizationId);
  if (!headers) {
    return {
      success: false,
      error: "Todoist not connected. Add your API token in Settings > Integrations.",
    };
  }

  try {
    let url = `${TODOIST_API}/tasks`;
    const queryParams: string[] = [];

    if (params.projectId) {
      queryParams.push(`project_id=${params.projectId}`);
    }

    if (params.filter) {
      queryParams.push(`filter=${encodeURIComponent(params.filter)}`);
    } else if (params.dueTodayOnly) {
      queryParams.push(`filter=${encodeURIComponent("today")}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { success: false, error: `Todoist API error: ${response.status}` };
    }

    const tasks = await response.json();
    const limit = params.limit || 20;
    const limitedTasks = tasks.slice(0, limit);

    // Sync to database
    await syncToDatabase(context.userId, context.organizationId, limitedTasks).catch(() => {});

    // Format for display
    const formattedTasks = limitedTasks.map((t: any) => ({
      id: t.id,
      content: t.content,
      description: t.description,
      priority: t.priority,
      due: t.due?.string || t.due?.date,
      labels: t.labels,
      projectId: t.project_id,
      url: t.url,
    }));

    if (formattedTasks.length === 0) {
      return {
        success: true,
        data: { tasks: [], count: 0 },
        display: {
          type: "text",
          content: params.dueTodayOnly
            ? "🎉 No tasks due today! Your day is clear."
            : "No tasks found matching your criteria.",
        },
      };
    }

    const priorityEmoji = (p: number) => {
      switch (p) {
        case 4: return "🔴";
        case 3: return "🟠";
        case 2: return "🟡";
        default: return "⚪";
      }
    };

    return {
      success: true,
      data: { tasks: formattedTasks, count: formattedTasks.length },
      display: {
        type: "table",
        content: {
          headers: ["P", "Task", "Due", "Labels"],
          rows: formattedTasks.slice(0, 15).map((t: any) => [
            priorityEmoji(t.priority),
            t.content.substring(0, 40) + (t.content.length > 40 ? "..." : ""),
            t.due || "-",
            t.labels?.join(", ") || "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new task
 */
async function createTask(
  params: {
    content: string;
    description?: string;
    projectId?: string;
    projectName?: string;
    dueString?: string;
    priority?: number;
    labels?: string[];
  },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getTodoistHeaders(context.userId, context.organizationId);
  if (!headers) {
    return { success: false, error: "Todoist not connected" };
  }

  try {
    // If projectName given but not projectId, find the project
    let projectId = params.projectId;
    if (!projectId && params.projectName) {
      const projectsResponse = await fetch(`${TODOIST_API}/projects`, { headers });
      const projects = await projectsResponse.json();
      const project = projects.find(
        (p: any) => p.name.toLowerCase() === params.projectName!.toLowerCase()
      );
      if (project) {
        projectId = project.id;
      }
    }

    const taskData: any = {
      content: params.content,
    };

    if (params.description) {
      taskData.description = params.description;
    }

    if (projectId) {
      taskData.project_id = projectId;
    }

    if (params.dueString) {
      taskData.due_string = params.dueString;
    }

    if (params.priority) {
      // Convert our priority (1=highest) to Todoist (4=highest)
      taskData.priority = Math.min(4, Math.max(1, 5 - params.priority));
    }

    if (params.labels && params.labels.length > 0) {
      taskData.labels = params.labels;
    }

    const response = await fetch(`${TODOIST_API}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || `Failed to create task: ${response.status}`,
      };
    }

    const task = await response.json();

    return {
      success: true,
      data: {
        id: task.id,
        content: task.content,
        projectId: task.project_id,
        due: task.due?.string,
        url: task.url,
      },
      display: {
        type: "card",
        content: {
          title: `✅ Created: ${task.content}`,
          description: task.due?.string ? `Due: ${task.due.string}` : "No due date",
          fields: [
            { label: "ID", value: task.id },
            ...(task.project_id ? [{ label: "Project", value: task.project_id }] : []),
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Complete a task
 */
async function completeTask(
  params: { taskId: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getTodoistHeaders(context.userId, context.organizationId);
  if (!headers) {
    return { success: false, error: "Todoist not connected" };
  }

  try {
    const response = await fetch(`${TODOIST_API}/tasks/${params.taskId}/close`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      return { success: false, error: `Failed to complete task: ${response.status}` };
    }

    // Update local database
    const supabase = createAdminClient();
    await supabase
      .from("external_tasks")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("provider", "todoist")
      .eq("provider_task_id", params.taskId)
      .catch(() => {});

    return {
      success: true,
      data: { taskId: params.taskId, completed: true },
      display: {
        type: "text",
        content: `✅ Task completed!`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update a task
 */
async function updateTask(
  params: {
    taskId: string;
    content?: string;
    description?: string;
    dueString?: string;
    priority?: number;
    labels?: string[];
  },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getTodoistHeaders(context.userId, context.organizationId);
  if (!headers) {
    return { success: false, error: "Todoist not connected" };
  }

  try {
    const updateData: any = {};

    if (params.content) updateData.content = params.content;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.dueString) updateData.due_string = params.dueString;
    if (params.priority) updateData.priority = Math.min(4, Math.max(1, 5 - params.priority));
    if (params.labels) updateData.labels = params.labels;

    const response = await fetch(`${TODOIST_API}/tasks/${params.taskId}`, {
      method: "POST",
      headers,
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      return { success: false, error: `Failed to update task: ${response.status}` };
    }

    const task = await response.json();

    return {
      success: true,
      data: {
        id: task.id,
        content: task.content,
        due: task.due?.string,
      },
      display: {
        type: "text",
        content: `✅ Task updated: "${task.content}"`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tasks due today
 */
async function getTodaysTasks(params: {}, context: ToolContext): Promise<ToolResult> {
  return listTasks({ dueTodayOnly: true, limit: 20 }, context);
}

/**
 * Sync all Todoist tasks
 */
async function syncTasks(params: {}, context: ToolContext): Promise<ToolResult> {
  const headers = await getTodoistHeaders(context.userId, context.organizationId);
  if (!headers) {
    return { success: false, error: "Todoist not connected" };
  }

  try {
    const response = await fetch(`${TODOIST_API}/tasks`, { headers });

    if (!response.ok) {
      return { success: false, error: `Todoist API error: ${response.status}` };
    }

    const tasks = await response.json();
    const synced = await syncToDatabase(context.userId, context.organizationId, tasks);

    return {
      success: true,
      data: { synced, total: tasks.length },
      display: {
        type: "text",
        content: `✅ Synced ${synced} tasks from Todoist.`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const todoistSkill: Skill = {
  id: "todoist",
  name: "Todoist",
  description: "Manage tasks and projects in Todoist - create, complete, and organize your tasks",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["tasks", "todoist", "productivity", "todo", "gtd"],

  icon: "✅",
  color: "#E44332",

  tier: "free",
  isBuiltIn: true,

  requiredEnvVars: [], // Uses BYOK, not system env vars

  configSchema: {
    apiToken: {
      type: "string",
      label: "Todoist API Token",
      description: "Get your API token from Todoist Settings > Integrations > Developer",
      required: true,
      placeholder: "Enter your Todoist API token",
    },
  },

  tools: [
    {
      name: "list_projects",
      description: "List all Todoist projects",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: listProjects,
    },
    {
      name: "list_tasks",
      description: "List tasks, optionally filtered by project or Todoist filter query",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Filter by project ID (get from list_projects)",
          },
          filter: {
            type: "string",
            description: "Todoist filter query (e.g., 'today', 'overdue', 'p1', '@work')",
          },
          dueTodayOnly: {
            type: "boolean",
            description: "Only show tasks due today (default: false)",
          },
          limit: {
            type: "number",
            description: "Maximum tasks to return (default: 20)",
          },
        },
      },
      execute: listTasks,
    },
    {
      name: "create_task",
      description: "Create a new task in Todoist",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Task title/content",
          },
          description: {
            type: "string",
            description: "Task description (optional)",
          },
          projectId: {
            type: "string",
            description: "Project ID to add task to (optional)",
          },
          projectName: {
            type: "string",
            description: "Project name to add task to (alternative to projectId)",
          },
          dueString: {
            type: "string",
            description: "Due date in natural language (e.g., 'tomorrow', 'next Monday', 'Jan 15')",
          },
          priority: {
            type: "number",
            description: "Priority 1-4 where 1=highest (optional)",
          },
          labels: {
            type: "array",
            description: "Labels to add (optional)",
          },
        },
        required: ["content"],
      },
      execute: createTask,
    },
    {
      name: "complete_task",
      description: "Mark a task as complete",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task to complete",
          },
        },
        required: ["taskId"],
      },
      execute: completeTask,
    },
    {
      name: "update_task",
      description: "Update an existing task",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task to update",
          },
          content: {
            type: "string",
            description: "New task title/content",
          },
          description: {
            type: "string",
            description: "New task description",
          },
          dueString: {
            type: "string",
            description: "New due date in natural language",
          },
          priority: {
            type: "number",
            description: "New priority 1-4",
          },
          labels: {
            type: "array",
            description: "New labels (replaces existing)",
          },
        },
        required: ["taskId"],
      },
      execute: updateTask,
    },
    {
      name: "today",
      description: "Get all tasks due today",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: getTodaysTasks,
    },
    {
      name: "sync",
      description: "Sync all Todoist tasks to Perpetual Core",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: syncTasks,
    },
  ],

  systemPrompt: `You have access to Todoist for task management. When users ask about tasks:
- Use "today" to quickly see what's due today
- Use "list_tasks" with filters for specific queries (e.g., filter="overdue", filter="p1")
- Use "list_projects" to find project IDs before filtering
- Use "create_task" to add new tasks - supports natural language due dates
- Use "complete_task" to mark tasks done (needs task ID from list_tasks)
- Use "sync" to refresh task data

For creating tasks:
- Ask for project if user doesn't specify
- Use natural language for due dates (e.g., "tomorrow", "next Monday")
- Priority 1 = highest (red), 4 = lowest (white)

Always show task IDs when listing so users can reference them for completion.`,
};
