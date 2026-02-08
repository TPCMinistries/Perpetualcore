/**
 * Task Checker
 *
 * Checks for overdue, due-today, and upcoming tasks.
 * Queries both the internal tasks table and external task integrations.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { CheckResult, CheckItem } from "../types";

/**
 * Check tasks for actionable items.
 *
 * @param userId - The Perpetual Core user ID
 * @returns CheckResult with categorized task items
 */
export async function checkTasks(userId: string): Promise<CheckResult> {
  const supabase = createAdminClient();
  const items: CheckItem[] = [];

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

    // Get the user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    const organizationId = profile?.organization_id || userId;

    // Fetch overdue tasks
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("id, title, description, priority, due_date, status, source_type")
      .or(`user_id.eq.${userId},organization_id.eq.${organizationId}`)
      .lt("due_date", todayStart.toISOString())
      .not("status", "in", '("completed","cancelled")')
      .order("due_date", { ascending: true })
      .limit(10);

    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        items.push({
          title: `OVERDUE (${daysOverdue}d): ${task.title}`,
          description: task.description?.substring(0, 200) || "No description",
          urgency: daysOverdue > 3 ? "critical" : "high",
          category: "overdue_task",
          metadata: {
            taskId: task.id,
            priority: task.priority,
            dueDate: task.due_date,
            daysOverdue,
            source: task.source_type,
          },
        });
      }
    }

    // Fetch tasks due today
    const { data: todayTasks } = await supabase
      .from("tasks")
      .select("id, title, description, priority, due_date, status, source_type")
      .or(`user_id.eq.${userId},organization_id.eq.${organizationId}`)
      .gte("due_date", todayStart.toISOString())
      .lt("due_date", todayEnd.toISOString())
      .not("status", "in", '("completed","cancelled")')
      .order("priority", { ascending: false })
      .limit(10);

    if (todayTasks && todayTasks.length > 0) {
      for (const task of todayTasks) {
        items.push({
          title: `Due today: ${task.title}`,
          description: task.description?.substring(0, 200) || "No description",
          urgency: task.priority === "high" ? "high" : "medium",
          category: "due_today",
          metadata: {
            taskId: task.id,
            priority: task.priority,
            dueDate: task.due_date,
            source: task.source_type,
          },
        });
      }
    }

    // Fetch tasks due tomorrow
    const { data: tomorrowTasks } = await supabase
      .from("tasks")
      .select("id, title, description, priority, due_date, status, source_type")
      .or(`user_id.eq.${userId},organization_id.eq.${organizationId}`)
      .gte("due_date", todayEnd.toISOString())
      .lt("due_date", tomorrowEnd.toISOString())
      .not("status", "in", '("completed","cancelled")')
      .order("priority", { ascending: false })
      .limit(5);

    if (tomorrowTasks && tomorrowTasks.length > 0) {
      for (const task of tomorrowTasks) {
        items.push({
          title: `Due tomorrow: ${task.title}`,
          description: task.description?.substring(0, 200) || "No description",
          urgency: "low",
          category: "due_tomorrow",
          metadata: {
            taskId: task.id,
            priority: task.priority,
            dueDate: task.due_date,
            source: task.source_type,
          },
        });
      }
    }

    // Check external tasks if user has integrations (Todoist, Linear)
    const externalItems = await checkExternalTasks(supabase, userId);
    items.push(...externalItems);

    // Determine overall urgency
    const overdueCount = items.filter((i) => i.category === "overdue_task").length;
    const todayCount = items.filter((i) => i.category === "due_today").length;

    let overallUrgency: CheckResult["urgency"] = "low";
    if (overdueCount > 0) overallUrgency = "high";
    else if (todayCount > 0) overallUrgency = "medium";

    let summary = "";
    if (overdueCount > 0) summary += `${overdueCount} overdue task(s). `;
    if (todayCount > 0) summary += `${todayCount} task(s) due today. `;
    if (items.filter((i) => i.category === "due_tomorrow").length > 0) {
      summary += `${items.filter((i) => i.category === "due_tomorrow").length} task(s) due tomorrow.`;
    }
    if (!summary) summary = "No tasks need attention right now.";

    return {
      type: "tasks",
      items,
      summary: summary.trim(),
      urgency: overallUrgency,
    };
  } catch (error: any) {
    console.error("[TaskChecker] Error checking tasks:", error);
    return {
      type: "tasks",
      items: [],
      summary: `Error checking tasks: ${error.message}`,
      urgency: "low",
    };
  }
}

/**
 * Check external task sources (Todoist, Linear) for relevant items.
 */
async function checkExternalTasks(
  supabase: any,
  userId: string
): Promise<CheckItem[]> {
  const items: CheckItem[] = [];

  try {
    // Check for external tasks synced to the external_tasks table
    const now = new Date();
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const { data: externalTasks } = await supabase
      .from("external_tasks")
      .select("id, title, description, priority, due_date, status, source, external_id")
      .eq("user_id", userId)
      .lte("due_date", todayEnd.toISOString())
      .not("status", "in", '("completed","done","cancelled")')
      .order("due_date", { ascending: true })
      .limit(10);

    if (externalTasks && externalTasks.length > 0) {
      for (const task of externalTasks) {
        const isOverdue = new Date(task.due_date) < now;

        items.push({
          title: `[${task.source}] ${isOverdue ? "OVERDUE: " : ""}${task.title}`,
          description: task.description?.substring(0, 200) || "No description",
          urgency: isOverdue ? "high" : "medium",
          category: isOverdue ? "overdue_external_task" : "due_external_task",
          metadata: {
            externalTaskId: task.external_id,
            source: task.source,
            priority: task.priority,
            dueDate: task.due_date,
          },
        });
      }
    }
  } catch (error) {
    // External tasks table may not exist for all users; silently skip
    console.debug("[TaskChecker] External tasks check skipped:", error);
  }

  return items;
}
