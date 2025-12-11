/**
 * Calendar Monitor Agent
 *
 * Monitors calendar events and creates reminders, prep tasks, and notifications
 * for upcoming meetings and important events.
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchUpcomingEvents,
  fetchMeetingsNeedingPrep,
  isCalendarConnected,
  CalendarEvent,
} from "@/lib/integrations/google-calendar";

interface AgentConfig {
  hoursAhead?: number;
  createPrepTasks?: boolean;
  notifyConflicts?: boolean;
  trackResponseStatus?: boolean;
  importantAttendees?: string[];
}

interface CalendarInsight {
  eventId: string;
  eventSummary: string;
  needsPrep: boolean;
  prepSuggestions: string[];
  priority: "high" | "medium" | "low";
  hasConflicts: boolean;
  attendeeNotes: string | null;
}

const anthropic = new Anthropic();

/**
 * Analyze a calendar event using AI
 */
async function analyzeCalendarEvent(
  event: CalendarEvent,
  config: AgentConfig
): Promise<CalendarInsight> {
  const attendeeList = event.attendees
    .map((a) => `${a.displayName || a.email} (${a.responseStatus})`)
    .join(", ");

  const importantAttendeesInMeeting = config.importantAttendees?.filter((email) =>
    event.attendees.some((a) => a.email.toLowerCase().includes(email.toLowerCase()))
  );

  const prompt = `Analyze this calendar event and provide insights:

Event: ${event.summary}
Description: ${event.description || "No description"}
Location: ${event.location || "No location"}
Start: ${event.start.toISOString()}
Duration: ${Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))} minutes
Attendees: ${attendeeList || "No attendees"}
${importantAttendeesInMeeting?.length ? `Important attendees present: ${importantAttendeesInMeeting.join(", ")}` : ""}

Provide a JSON response with:
1. needsPrep: boolean - does this meeting need preparation?
2. prepSuggestions: string[] - specific preparation suggestions (max 3)
3. priority: "high" | "medium" | "low" - importance based on attendees, topic
4. attendeeNotes: string | null - any notes about attendees (missing RSVPs, key stakeholders)

Consider:
- Meetings with external attendees or leadership are higher priority
- 1:1s typically need less prep than group meetings
- Events with no attendees might be blocked time
- Missing RSVPs close to meeting time are worth noting

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const analysis = JSON.parse(content.text);

    return {
      eventId: event.id,
      eventSummary: event.summary,
      needsPrep: analysis.needsPrep || false,
      prepSuggestions: analysis.prepSuggestions || [],
      priority: analysis.priority || "medium",
      hasConflicts: false, // Will be checked separately
      attendeeNotes: analysis.attendeeNotes || null,
    };
  } catch (error) {
    logger.error("Failed to analyze calendar event", { eventId: event.id, error });
    return {
      eventId: event.id,
      eventSummary: event.summary,
      needsPrep: event.attendees.length > 2,
      prepSuggestions: [],
      priority: "medium",
      hasConflicts: false,
      attendeeNotes: null,
    };
  }
}

/**
 * Check for scheduling conflicts
 */
function detectConflicts(events: CalendarEvent[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();

  for (let i = 0; i < events.length; i++) {
    const event1 = events[i];
    const conflictingEvents: string[] = [];

    for (let j = i + 1; j < events.length; j++) {
      const event2 = events[j];

      // Check for overlap
      if (event1.start < event2.end && event1.end > event2.start) {
        conflictingEvents.push(event2.summary);

        // Also mark the other event as conflicting
        const existingConflicts = conflicts.get(event2.id) || [];
        existingConflicts.push(event1.summary);
        conflicts.set(event2.id, existingConflicts);
      }
    }

    if (conflictingEvents.length > 0) {
      conflicts.set(event1.id, conflictingEvents);
    }
  }

  return conflicts;
}

/**
 * Process calendar events for a specific agent
 */
export async function processCalendarForAgent(agentId: string): Promise<{
  processed: number;
  tasksCreated: number;
  conflictsFound: number;
}> {
  const supabase = await createClient();

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*, profiles!inner(id)")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    logger.error("Calendar Monitor agent not found", { agentId });
    return { processed: 0, tasksCreated: 0, conflictsFound: 0 };
  }

  const userId = agent.user_id;
  const config: AgentConfig = agent.configuration || {};
  const hoursAhead = config.hoursAhead || 24;

  // Check if calendar is connected
  const connected = await isCalendarConnected(userId);
  if (!connected) {
    logger.warn("Calendar not connected for Calendar Monitor agent", { agentId, userId });
    return { processed: 0, tasksCreated: 0, conflictsFound: 0 };
  }

  // Fetch upcoming events
  const timeMax = new Date();
  timeMax.setTime(timeMax.getTime() + hoursAhead * 60 * 60 * 1000);

  const events = await fetchUpcomingEvents(userId, {
    timeMax,
    maxResults: 50,
  });

  if (events.length === 0) {
    logger.info("No upcoming events found", { agentId, hoursAhead });
    return { processed: 0, tasksCreated: 0, conflictsFound: 0 };
  }

  // Detect conflicts
  const conflicts = detectConflicts(events);
  let conflictsFound = 0;

  // Process events that need attention (meetings with attendees)
  const meetingsToAnalyze = events.filter(
    (e) => e.attendees.length > 0 && e.status === "confirmed"
  );

  let tasksCreated = 0;

  for (const event of meetingsToAnalyze) {
    try {
      const insight = await analyzeCalendarEvent(event, config);
      insight.hasConflicts = conflicts.has(event.id);

      if (insight.hasConflicts) {
        conflictsFound++;

        // Log conflict action
        await supabase.from("agent_actions").insert({
          agent_id: agentId,
          action_type: "conflict_detected",
          action_data: {
            eventId: event.id,
            eventSummary: event.summary,
            conflictsWith: conflicts.get(event.id),
            eventTime: event.start.toISOString(),
          },
          status: "completed",
        });

        // Optionally create a task to resolve conflict
        if (config.notifyConflicts) {
          const conflictList = conflicts.get(event.id)?.join(", ");
          await supabase.from("tasks").insert({
            user_id: userId,
            title: `Resolve schedule conflict: ${event.summary}`,
            description: `This meeting conflicts with: ${conflictList}. Please reschedule or decline one of the meetings.`,
            priority: "high",
            status: "todo",
            due_date: event.start.toISOString(),
            created_by_agent_id: agentId,
          });
          tasksCreated++;
        }
      }

      // Create prep task if needed
      if (insight.needsPrep && config.createPrepTasks && insight.prepSuggestions.length > 0) {
        // Check if we already created a prep task for this event
        const { data: existingTask } = await supabase
          .from("tasks")
          .select("id")
          .eq("created_by_agent_id", agentId)
          .ilike("title", `%prep%${event.summary}%`)
          .single();

        if (!existingTask) {
          const prepTime = new Date(event.start);
          prepTime.setTime(prepTime.getTime() - 30 * 60 * 1000); // 30 mins before

          await supabase.from("tasks").insert({
            user_id: userId,
            title: `Prepare for: ${event.summary}`,
            description: `Meeting prep suggestions:\n${insight.prepSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
            priority: insight.priority,
            status: "todo",
            due_date: prepTime.toISOString(),
            created_by_agent_id: agentId,
          });
          tasksCreated++;

          // Log prep task creation
          await supabase.from("agent_actions").insert({
            agent_id: agentId,
            action_type: "prep_task_created",
            action_data: {
              eventId: event.id,
              eventSummary: event.summary,
              prepSuggestions: insight.prepSuggestions,
              priority: insight.priority,
            },
            status: "completed",
          });
        }
      }

      // Track missing RSVPs if configured
      if (config.trackResponseStatus && insight.attendeeNotes) {
        const pendingAttendees = event.attendees.filter(
          (a) => a.responseStatus === "needsAction" && !a.self
        );

        if (pendingAttendees.length > 0) {
          await supabase.from("agent_actions").insert({
            agent_id: agentId,
            action_type: "missing_rsvps_noted",
            action_data: {
              eventId: event.id,
              eventSummary: event.summary,
              pendingAttendees: pendingAttendees.map((a) => a.email),
              attendeeNotes: insight.attendeeNotes,
            },
            status: "completed",
          });
        }
      }
    } catch (eventError) {
      logger.error("Error processing calendar event", {
        agentId,
        eventId: event.id,
        error: eventError,
      });
    }
  }

  // Update agent last_active_at
  await supabase
    .from("ai_agents")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", agentId);

  logger.info("Calendar Monitor agent completed", {
    agentId,
    eventsProcessed: meetingsToAnalyze.length,
    tasksCreated,
    conflictsFound,
  });

  return {
    processed: meetingsToAnalyze.length,
    tasksCreated,
    conflictsFound,
  };
}

/**
 * Process all enabled Calendar Monitor agents
 */
export async function processAllCalendarMonitorAgents(): Promise<{
  totalAgents: number;
  totalProcessed: number;
  totalTasksCreated: number;
  totalConflicts: number;
}> {
  const supabase = await createClient();

  // Get all enabled calendar monitor agents
  const { data: agents, error } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("agent_type", "calendar_monitor")
    .eq("enabled", true);

  if (error) {
    logger.error("Failed to fetch Calendar Monitor agents", { error });
    return { totalAgents: 0, totalProcessed: 0, totalTasksCreated: 0, totalConflicts: 0 };
  }

  if (!agents || agents.length === 0) {
    logger.info("No enabled Calendar Monitor agents found");
    return { totalAgents: 0, totalProcessed: 0, totalTasksCreated: 0, totalConflicts: 0 };
  }

  let totalProcessed = 0;
  let totalTasksCreated = 0;
  let totalConflicts = 0;

  for (const agent of agents) {
    try {
      logger.info(`Processing Calendar Monitor agent: ${agent.name}`, { agentId: agent.id });
      const result = await processCalendarForAgent(agent.id);
      totalProcessed += result.processed;
      totalTasksCreated += result.tasksCreated;
      totalConflicts += result.conflictsFound;
    } catch (agentError) {
      logger.error(`Error processing Calendar Monitor agent: ${agent.name}`, {
        agentId: agent.id,
        error: agentError,
      });
    }
  }

  return {
    totalAgents: agents.length,
    totalProcessed,
    totalTasksCreated,
    totalConflicts,
  };
}

export default {
  processCalendarForAgent,
  processAllCalendarMonitorAgents,
};
