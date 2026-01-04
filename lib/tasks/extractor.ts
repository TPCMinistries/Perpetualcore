import { getChatCompletion } from "@/lib/ai/router";
import { createClient } from "@/lib/supabase/server";

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  confidence: number;
  context: string;
}

/**
 * Extract action items from text using AI
 */
export async function extractTasksFromText(
  text: string,
  userId: string,
  sourceType: "chat" | "email" | "calendar" | "manual",
  sourceId?: string
): Promise<ExtractedTask[]> {
  try {
    const prompt = `Analyze the following text and extract any action items, tasks, or to-dos mentioned.

For each action item, provide:
- title: Clear, actionable title (imperative form: "Do X", "Review Y")
- description: Additional context if provided
- priority: low, medium, high, or urgent (based on language like "ASAP", "urgent", "when you can")
- dueDate: ISO date string if a deadline is mentioned (e.g., "tomorrow", "next week", "by Friday")
- confidence: 0.0-1.0 score of how confident you are this is an actionable task

Only extract clear, actionable items. Don't extract vague statements or questions.

Text:
"""
${text}
"""

Respond with a JSON array of tasks. If no tasks are found, return an empty array [].
Example:
[
  {
    "title": "Review the proposal",
    "description": "Check the budget section carefully",
    "priority": "high",
    "dueDate": "2025-10-25T00:00:00Z",
    "confidence": 0.95,
    "context": "Need to review proposal, especially budget"
  }
]`;

    const result = await getChatCompletion("gpt-4o-mini", [
      {
        role: "system",
        content:
          "You are an expert at extracting action items from text. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ]);

    // Parse JSON response - getChatCompletion returns { response: string, ... }
    const responseText = result.response;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("No tasks extracted from text");
      return [];
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return extracted;
  } catch (error) {
    console.error("Error extracting tasks:", error);
    return [];
  }
}

/**
 * Save extracted tasks to database
 */
export async function saveExtractedTasks(
  tasks: ExtractedTask[],
  userId: string,
  organizationId: string,
  sourceType: string,
  sourceId?: string
): Promise<{ success: boolean; savedCount: number }> {
  try {
    const supabase = await createClient();

    // Filter tasks by confidence threshold
    const highConfidenceTasks = tasks.filter((t) => t.confidence >= 0.7);

    if (highConfidenceTasks.length === 0) {
      return { success: true, savedCount: 0 };
    }

    // Insert tasks - using only core columns that exist in the database
    const tasksToInsert = highConfidenceTasks.map((task) => ({
      organization_id: organizationId,
      user_id: userId,
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      due_date: task.dueDate || null,
      status: "todo",
    }));

    const { data, error } = await supabase.from("tasks").insert(tasksToInsert).select();

    if (error) {
      console.error("Error saving tasks:", error);
      return { success: false, savedCount: 0 };
    }

    return { success: true, savedCount: data?.length || 0 };
  } catch (error) {
    console.error("Error in saveExtractedTasks:", error);
    return { success: false, savedCount: 0 };
  }
}

/**
 * Extract and save tasks from chat message
 */
export async function extractTasksFromChatMessage(
  messageContent: string,
  messageId: string,
  userId: string,
  organizationId: string
): Promise<number> {
  const extracted = await extractTasksFromText(messageContent, userId, "chat", messageId);

  if (extracted.length === 0) {
    return 0;
  }

  const { savedCount } = await saveExtractedTasks(
    extracted,
    userId,
    organizationId,
    "chat",
    messageId
  );

  return savedCount;
}

/**
 * Get tasks for a user with deliverable counts
 */
export async function getUserTasks(
  userId: string,
  filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    dueBefore?: string;
    projectId?: string;
    teamId?: string;
    entityId?: string;
    brandId?: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters?.teamId) {
    query = query.eq("team_id", filters.teamId);
  }

  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  if (filters?.brandId) {
    query = query.eq("brand_id", filters.brandId);
  }

  if (filters?.dueBefore) {
    query = query.lte("due_date", filters.dueBefore);
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Fetch deliverable counts for all tasks
  const taskIds = tasks.map((t) => t.id);
  const { data: deliverableCounts } = await supabase
    .from("task_deliverables")
    .select("task_id")
    .in("task_id", taskIds)
    .neq("status", "archived");

  // Count deliverables per task
  const countMap: Record<string, number> = {};
  if (deliverableCounts) {
    for (const d of deliverableCounts) {
      countMap[d.task_id] = (countMap[d.task_id] || 0) + 1;
    }
  }

  // Merge counts with tasks
  return tasks.map((task) => ({
    ...task,
    deliverable_count: countMap[task.id] || 0,
  }));
}
