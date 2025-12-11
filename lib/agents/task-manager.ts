/**
 * Task Manager Agent
 *
 * Manages tasks by prioritizing, organizing, suggesting next actions,
 * and optionally auto-executing tasks that are marked as fully automated.
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logging";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "blocked" | "completed";
  execution_status: "pending" | "queued" | "executing" | "completed" | "failed";
  execution_type: "manual" | "semi_automated" | "fully_automated";
  due_date: string | null;
  created_at: string;
  estimated_duration_minutes: number | null;
  tags: string[];
  ai_context: string | null;
}

interface TaskPrioritization {
  taskId: string;
  suggestedPriority: "low" | "medium" | "high" | "urgent";
  reason: string;
  suggestedDueDate?: string;
  suggestedOrder: number;
}

interface TaskAnalysis {
  overdueTasks: string[];
  priorityChanges: TaskPrioritization[];
  suggestedNextTasks: string[];
  blockedTasksResolutions: { taskId: string; suggestion: string }[];
  dailyCapacityWarning: boolean;
}

/**
 * Analyze and prioritize tasks using Claude
 */
async function analyzeTasks(tasks: Task[]): Promise<TaskAnalysis> {
  if (tasks.length === 0) {
    return {
      overdueTasks: [],
      priorityChanges: [],
      suggestedNextTasks: [],
      blockedTasksResolutions: [],
      dailyCapacityWarning: false,
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const taskSummary = tasks
    .slice(0, 20) // Limit to 20 tasks for analysis
    .map(
      (t) =>
        `- [${t.id}] "${t.title}" | Priority: ${t.priority} | Status: ${t.status} | Due: ${t.due_date || "none"} | Est: ${t.estimated_duration_minutes || "?"} min`
    )
    .join("\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze these tasks and provide prioritization recommendations. Today is ${today}.

Tasks:
${taskSummary}

Respond with ONLY valid JSON in this exact format:
{
  "overdueTasks": ["task_id1", "task_id2"],
  "priorityChanges": [
    {"taskId": "id", "suggestedPriority": "high", "reason": "why", "suggestedOrder": 1}
  ],
  "suggestedNextTasks": ["task_id1", "task_id2", "task_id3"],
  "blockedTasksResolutions": [
    {"taskId": "id", "suggestion": "how to unblock"}
  ],
  "dailyCapacityWarning": false
}

Guidelines:
- Flag overdue tasks (past due_date)
- Suggest priority upgrades for tasks due soon
- Order suggestedNextTasks by urgency and impact
- Set dailyCapacityWarning if total estimated time exceeds 8 hours
- Keep reasons concise (max 50 chars)`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis response");
    }

    return JSON.parse(jsonMatch[0]) as TaskAnalysis;
  } catch (error) {
    logger.error("Error analyzing tasks", { error });
    return {
      overdueTasks: [],
      priorityChanges: [],
      suggestedNextTasks: [],
      blockedTasksResolutions: [],
      dailyCapacityWarning: false,
    };
  }
}

/**
 * Process tasks for a specific agent
 */
export async function processTasksForAgent(agentId: string) {
  const supabase = await createClient();

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*, profiles!inner(organization_id, id)")
    .eq("id", agentId)
    .eq("enabled", true)
    .single();

  if (agentError || !agent) {
    logger.warn(`Agent ${agentId} not found or disabled`);
    return { processed: 0, updated: 0, error: "Agent not found or disabled" };
  }

  const organizationId = agent.profiles.organization_id;
  const agentConfig = (agent.config as Record<string, unknown>) || {};

  // Fetch incomplete tasks
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["todo", "in_progress", "blocked"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (tasksError) {
    logger.error("Error fetching tasks", { agentId, error: tasksError });
    return { processed: 0, updated: 0, error: "Failed to fetch tasks" };
  }

  if (!tasks || tasks.length === 0) {
    logger.debug(`No tasks to process for agent ${agentId}`);
    return { processed: 0, updated: 0 };
  }

  logger.info(`Processing ${tasks.length} tasks for agent ${agentId}`);

  // Analyze tasks
  const analysis = await analyzeTasks(tasks as Task[]);

  let processed = tasks.length;
  let updated = 0;

  // Apply priority changes if configured
  if (agentConfig.auto_prioritize && analysis.priorityChanges.length > 0) {
    for (const change of analysis.priorityChanges) {
      const task = tasks.find((t) => t.id === change.taskId);
      if (task && task.priority !== change.suggestedPriority) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            priority: change.suggestedPriority,
            ai_context: JSON.stringify({
              ...(task.ai_context ? JSON.parse(task.ai_context) : {}),
              priority_change: {
                from: task.priority,
                to: change.suggestedPriority,
                reason: change.reason,
                changed_by_agent: agentId,
                changed_at: new Date().toISOString(),
              },
            }),
          })
          .eq("id", change.taskId);

        if (!updateError) {
          updated++;
          await supabase.from("agent_actions").insert({
            agent_id: agentId,
            action_type: "update_priority",
            action_data: {
              task_id: change.taskId,
              task_title: task.title,
              old_priority: task.priority,
              new_priority: change.suggestedPriority,
              reason: change.reason,
            },
            status: "success",
            task_id: change.taskId,
          });
        }
      }
    }
  }

  // Flag overdue tasks
  for (const taskId of analysis.overdueTasks) {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.priority !== "urgent") {
      // Upgrade overdue tasks to urgent
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          priority: "urgent",
          ai_context: JSON.stringify({
            ...(task.ai_context ? JSON.parse(task.ai_context) : {}),
            overdue_flagged: {
              flagged_by_agent: agentId,
              flagged_at: new Date().toISOString(),
            },
          }),
        })
        .eq("id", taskId);

      if (!updateError) {
        updated++;
        await supabase.from("agent_actions").insert({
          agent_id: agentId,
          action_type: "flag_overdue",
          action_data: {
            task_id: taskId,
            task_title: task.title,
            due_date: task.due_date,
          },
          status: "success",
          task_id: taskId,
        });
      }
    }
  }

  // Store analysis results for UI
  await supabase.from("agent_actions").insert({
    agent_id: agentId,
    action_type: "analyze_tasks",
    action_data: {
      total_tasks: tasks.length,
      overdue_count: analysis.overdueTasks.length,
      priority_changes: analysis.priorityChanges.length,
      suggested_next: analysis.suggestedNextTasks,
      capacity_warning: analysis.dailyCapacityWarning,
    },
    status: "success",
  });

  // Update agent config with last analysis
  await supabase
    .from("ai_agents")
    .update({
      config: {
        ...agentConfig,
        last_analysis_time: new Date().toISOString(),
        last_analysis_result: {
          overdue_count: analysis.overdueTasks.length,
          suggested_next: analysis.suggestedNextTasks,
          capacity_warning: analysis.dailyCapacityWarning,
        },
      },
    })
    .eq("id", agentId);

  logger.info(`Task processing complete for agent ${agentId}`, {
    agentId,
    processed,
    updated,
  });

  return { processed, updated };
}

/**
 * Process all enabled task manager agents
 */
export async function processAllTaskManagerAgents() {
  const supabase = await createClient();

  const { data: agents, error } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("agent_type", "task_manager")
    .eq("enabled", true);

  if (error) {
    logger.error("Failed to fetch task manager agents", { error });
    return { totalAgents: 0, totalProcessed: 0, totalUpdated: 0 };
  }

  let totalProcessed = 0;
  let totalUpdated = 0;

  for (const agent of agents || []) {
    try {
      const result = await processTasksForAgent(agent.id);
      totalProcessed += result.processed;
      totalUpdated += result.updated;
      logger.info(`Agent "${agent.name}" processed`, {
        agentId: agent.id,
        agentName: agent.name,
        processed: result.processed,
        updated: result.updated,
      });
    } catch (error) {
      logger.error(`Error processing agent ${agent.id}`, { error, agentId: agent.id });
    }
  }

  return {
    totalAgents: agents?.length || 0,
    totalProcessed,
    totalUpdated,
  };
}
