/**
 * Daily Digest Agent
 *
 * Generates personalized daily summaries for users including:
 * - Tasks due today and overdue
 * - Upcoming calendar events
 * - Recent document activity
 * - AI-generated insights and recommendations
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import Anthropic from "@anthropic-ai/sdk";
import { fetchTodayEvents, isCalendarConnected } from "@/lib/integrations/google-calendar";

interface AgentConfig {
  includeCalendar?: boolean;
  includeTasks?: boolean;
  includeDocuments?: boolean;
  includeInsights?: boolean;
  deliveryMethod?: "in_app" | "email" | "both";
  digestTime?: string; // HH:mm format
}

interface DigestData {
  tasks: {
    dueToday: number;
    overdue: number;
    completed: number;
    topPriority: Array<{ id: string; title: string; priority: string; dueDate: string | null }>;
  };
  calendar: {
    eventsToday: number;
    nextEvent: { summary: string; start: Date } | null;
    upcomingMeetings: Array<{ id: string; summary: string; start: Date; attendees: number }>;
  };
  documents: {
    recentlyModified: number;
    pendingReview: number;
    recentDocuments: Array<{ id: string; title: string; updatedAt: string }>;
  };
  agentActivity: {
    actionsToday: number;
    tasksCreated: number;
    emailsProcessed: number;
  };
}

interface GeneratedDigest {
  summary: string;
  highlights: string[];
  recommendations: string[];
  priorityActions: string[];
}

const anthropic = new Anthropic();

/**
 * Gather all data needed for the daily digest
 */
async function gatherDigestData(userId: string, config: AgentConfig): Promise<DigestData> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Initialize result
  const data: DigestData = {
    tasks: { dueToday: 0, overdue: 0, completed: 0, topPriority: [] },
    calendar: { eventsToday: 0, nextEvent: null, upcomingMeetings: [] },
    documents: { recentlyModified: 0, pendingReview: 0, recentDocuments: [] },
    agentActivity: { actionsToday: 0, tasksCreated: 0, emailsProcessed: 0 },
  };

  // Gather task data
  if (config.includeTasks !== false) {
    // Tasks due today
    const { count: dueTodayCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("due_date", today.toISOString())
      .lt("due_date", tomorrow.toISOString())
      .neq("status", "completed");

    data.tasks.dueToday = dueTodayCount || 0;

    // Overdue tasks
    const { count: overdueCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .lt("due_date", today.toISOString())
      .neq("status", "completed");

    data.tasks.overdue = overdueCount || 0;

    // Completed today
    const { count: completedCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("updated_at", today.toISOString());

    data.tasks.completed = completedCount || 0;

    // Top priority tasks
    const { data: topTasks } = await supabase
      .from("tasks")
      .select("id, title, priority, due_date")
      .eq("user_id", userId)
      .neq("status", "completed")
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5);

    data.tasks.topPriority = (topTasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority || "medium",
      dueDate: t.due_date,
    }));
  }

  // Gather calendar data
  if (config.includeCalendar !== false) {
    const calendarConnected = await isCalendarConnected(userId);

    if (calendarConnected) {
      const todayEvents = await fetchTodayEvents(userId);

      data.calendar.eventsToday = todayEvents.length;

      // Find next event
      const now = new Date();
      const upcomingToday = todayEvents.filter((e) => e.start > now);
      if (upcomingToday.length > 0) {
        data.calendar.nextEvent = {
          summary: upcomingToday[0].summary,
          start: upcomingToday[0].start,
        };
      }

      // Upcoming meetings with attendees
      data.calendar.upcomingMeetings = todayEvents
        .filter((e) => e.attendees.length > 0)
        .slice(0, 5)
        .map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start,
          attendees: e.attendees.length,
        }));
    }
  }

  // Gather document data
  if (config.includeDocuments !== false) {
    // Recently modified documents
    const { data: recentDocs, count: recentCount } = await supabase
      .from("documents")
      .select("id, title, updated_at", { count: "exact" })
      .eq("user_id", userId)
      .gte("updated_at", today.toISOString())
      .order("updated_at", { ascending: false })
      .limit(5);

    data.documents.recentlyModified = recentCount || 0;
    data.documents.recentDocuments = (recentDocs || []).map((d) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updated_at,
    }));
  }

  // Gather agent activity
  const { count: actionsCount } = await supabase
    .from("agent_actions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  data.agentActivity.actionsToday = actionsCount || 0;

  // Tasks created by agents today
  const { count: agentTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("created_by_agent_id", "is", null)
    .gte("created_at", today.toISOString());

  data.agentActivity.tasksCreated = agentTasksCount || 0;

  return data;
}

/**
 * Generate AI-powered digest content
 */
async function generateDigestContent(
  data: DigestData,
  config: AgentConfig
): Promise<GeneratedDigest> {
  const prompt = `Generate a concise daily digest summary based on this data:

TASKS:
- Due today: ${data.tasks.dueToday}
- Overdue: ${data.tasks.overdue}
- Completed today: ${data.tasks.completed}
- Top priority tasks: ${JSON.stringify(data.tasks.topPriority)}

CALENDAR:
- Events today: ${data.calendar.eventsToday}
- Next event: ${data.calendar.nextEvent ? `${data.calendar.nextEvent.summary} at ${data.calendar.nextEvent.start.toLocaleTimeString()}` : "None"}
- Meetings: ${JSON.stringify(data.calendar.upcomingMeetings)}

DOCUMENTS:
- Recently modified: ${data.documents.recentlyModified}
- Recent docs: ${JSON.stringify(data.documents.recentDocuments)}

AI AGENT ACTIVITY:
- Actions today: ${data.agentActivity.actionsToday}
- Tasks created by agents: ${data.agentActivity.tasksCreated}

Generate a JSON response with:
1. summary: A 2-3 sentence overview of the day (professional, concise)
2. highlights: Array of 3-5 key points about today (bulleted format)
3. recommendations: Array of 2-3 actionable suggestions based on the data
4. priorityActions: Array of 2-3 most important things to focus on today

Be practical and actionable. Return ONLY valid JSON, no markdown.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return JSON.parse(content.text);
  } catch (error) {
    logger.error("Failed to generate digest content", { error });

    // Fallback to basic digest
    return {
      summary: `You have ${data.tasks.dueToday} tasks due today and ${data.calendar.eventsToday} calendar events. ${data.tasks.overdue > 0 ? `There are ${data.tasks.overdue} overdue tasks that need attention.` : ""}`,
      highlights: [
        `${data.tasks.dueToday} tasks due today`,
        `${data.calendar.eventsToday} events scheduled`,
        `${data.tasks.completed} tasks completed so far`,
      ],
      recommendations: [
        data.tasks.overdue > 0
          ? "Review and address overdue tasks"
          : "Stay on track with today's tasks",
      ],
      priorityActions: data.tasks.topPriority.slice(0, 3).map((t) => t.title),
    };
  }
}

/**
 * Store the generated digest
 */
async function storeDigest(
  userId: string,
  agentId: string,
  data: DigestData,
  content: GeneratedDigest
): Promise<string> {
  const supabase = await createClient();

  // Store as a notification or in a digests table
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: "daily_digest",
      title: "Your Daily Digest",
      message: content.summary,
      data: {
        highlights: content.highlights,
        recommendations: content.recommendations,
        priorityActions: content.priorityActions,
        stats: {
          tasksDueToday: data.tasks.dueToday,
          tasksOverdue: data.tasks.overdue,
          eventsToday: data.calendar.eventsToday,
          documentsModified: data.documents.recentlyModified,
        },
      },
      created_by_agent_id: agentId,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to store digest", { userId, error });
    return "";
  }

  return notification?.id || "";
}

/**
 * Process daily digest for a specific agent
 */
export async function processDigestForAgent(agentId: string): Promise<{
  processed: boolean;
  digestId: string;
}> {
  const supabase = await createClient();

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*, profiles!inner(id)")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    logger.error("Daily Digest agent not found", { agentId });
    return { processed: false, digestId: "" };
  }

  const userId = agent.user_id;
  const config: AgentConfig = agent.configuration || {};

  logger.info("Generating daily digest", { agentId, userId });

  try {
    // Gather data
    const data = await gatherDigestData(userId, config);

    // Generate content
    const content = await generateDigestContent(data, config);

    // Store digest
    const digestId = await storeDigest(userId, agentId, data, content);

    // Log action
    await supabase.from("agent_actions").insert({
      agent_id: agentId,
      action_type: "digest_generated",
      action_data: {
        digestId,
        stats: {
          tasksDueToday: data.tasks.dueToday,
          tasksOverdue: data.tasks.overdue,
          eventsToday: data.calendar.eventsToday,
        },
        highlightCount: content.highlights.length,
        recommendationCount: content.recommendations.length,
      },
      status: "completed",
    });

    // Update agent last_active_at
    await supabase
      .from("ai_agents")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", agentId);

    logger.info("Daily digest generated successfully", { agentId, userId, digestId });

    return { processed: true, digestId };
  } catch (error) {
    logger.error("Failed to generate daily digest", { agentId, userId, error });
    return { processed: false, digestId: "" };
  }
}

/**
 * Process all enabled Daily Digest agents
 * Note: This should typically run once per day (via cron at configured time)
 */
export async function processAllDailyDigestAgents(): Promise<{
  totalAgents: number;
  totalProcessed: number;
  digestsGenerated: number;
}> {
  const supabase = await createClient();

  // Get all enabled daily digest agents
  const { data: agents, error } = await supabase
    .from("ai_agents")
    .select("id, name, configuration")
    .eq("agent_type", "daily_digest")
    .eq("enabled", true);

  if (error) {
    logger.error("Failed to fetch Daily Digest agents", { error });
    return { totalAgents: 0, totalProcessed: 0, digestsGenerated: 0 };
  }

  if (!agents || agents.length === 0) {
    logger.info("No enabled Daily Digest agents found");
    return { totalAgents: 0, totalProcessed: 0, digestsGenerated: 0 };
  }

  let totalProcessed = 0;
  let digestsGenerated = 0;

  // Check current hour for time-based filtering
  const currentHour = new Date().getHours();

  for (const agent of agents) {
    try {
      // Check if this agent should run at this time
      const config = agent.configuration as AgentConfig | null;
      const digestTime = config?.digestTime || "09:00";
      const [targetHour] = digestTime.split(":").map(Number);

      // Only process if we're in the target hour (allow 15 min window)
      if (Math.abs(currentHour - targetHour) > 0) {
        continue;
      }

      logger.info(`Processing Daily Digest agent: ${agent.name}`, { agentId: agent.id });
      const result = await processDigestForAgent(agent.id);

      if (result.processed) {
        totalProcessed++;
        if (result.digestId) {
          digestsGenerated++;
        }
      }
    } catch (agentError) {
      logger.error(`Error processing Daily Digest agent: ${agent.name}`, {
        agentId: agent.id,
        error: agentError,
      });
    }
  }

  return {
    totalAgents: agents.length,
    totalProcessed,
    digestsGenerated,
  };
}

export default {
  processDigestForAgent,
  processAllDailyDigestAgents,
};
