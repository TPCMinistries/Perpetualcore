"use server";

import { createClient } from "@/lib/supabase/server";
import { BriefingData } from "@/components/briefing/DailyBriefing";
import { isN8nConfigured } from "@/lib/n8n";
import { generateProactiveInsights, ProactiveInsight } from "@/lib/ai/proactive-insights";

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

/**
 * Fetches all data needed for the daily briefing
 */
export async function getBriefingData(userId: string): Promise<BriefingData> {
  const supabase = await createClient();

  // Get user's last login to determine "overnight" period
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_login_at")
    .eq("id", userId)
    .single();

  const lastLogin = profile?.last_login_at
    ? new Date(profile.last_login_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago

  // Parallel fetch all data sources
  const [
    overnightData,
    prioritiesData,
    automationData,
    meetingsData,
    insightsData,
  ] = await Promise.all([
    getOvernightSummary(supabase, userId, lastLogin),
    getTodaysPriorities(supabase, userId),
    getAutomationResults(supabase, userId),
    getUpcomingMeetings(supabase, userId),
    getAIInsights(supabase, userId),
  ]);

  // Generate quick actions based on context
  const quickActions = generateQuickActions(overnightData, prioritiesData, meetingsData);

  return {
    overnight: overnightData,
    priorities: prioritiesData,
    automationResults: automationData,
    meetings: meetingsData,
    insights: insightsData,
    quickActions,
  };
}

async function getOvernightSummary(supabase: any, userId: string, since: Date) {
  const sinceStr = since.toISOString();

  // Count new items since last login
  const [emails, tasks, automations, mentions, contacts] = await Promise.all([
    supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceStr),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceStr),
    supabase
      .from("automation_executions")
      .select("id, status", { count: "exact" })
      .eq("user_id", userId)
      .gte("created_at", sinceStr),
    supabase
      .from("mentions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceStr),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceStr),
  ]);

  // Get automation stats
  let completedAutomations = automations.data?.filter((a: any) => a.status === "completed").length || 0;
  let failedAutomations = automations.data?.filter((a: any) => a.status === "failed").length || 0;

  // Add n8n execution stats if configured
  if (isN8nConfigured() && N8N_API_URL && N8N_API_KEY) {
    try {
      const execResponse = await fetch(`${N8N_API_URL}/executions?limit=50`, {
        headers: {
          "X-N8N-API-KEY": N8N_API_KEY,
          "Accept": "application/json",
        },
      });

      if (execResponse.ok) {
        const execData = await execResponse.json();
        const n8nExecutions = (execData.data || []).filter((exec: any) => {
          // Only count executions since last login
          const execTime = new Date(exec.startedAt).getTime();
          return execTime >= since.getTime();
        });

        completedAutomations += n8nExecutions.filter((e: any) => e.finished && e.status === "success").length;
        failedAutomations += n8nExecutions.filter((e: any) => e.finished && e.status === "error").length;
      }
    } catch (error) {
      console.error("Failed to fetch n8n stats for overnight summary:", error);
    }
  }

  // Generate highlights
  const highlights: string[] = [];
  if (emails.count && emails.count > 0) {
    highlights.push(`${emails.count} new email${emails.count > 1 ? "s" : ""} received`);
  }
  if (completedAutomations > 0) {
    highlights.push(`${completedAutomations} automation${completedAutomations > 1 ? "s" : ""} completed successfully`);
  }
  if (failedAutomations > 0) {
    highlights.push(`${failedAutomations} automation${failedAutomations > 1 ? "s" : ""} need attention`);
  }

  return {
    newEmails: emails.count || 0,
    newTasks: tasks.count || 0,
    completedAutomations,
    failedAutomations,
    newMentions: mentions.count || 0,
    newContacts: contacts.count || 0,
    highlights,
  };
}

async function getTodaysPriorities(supabase: any, userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get active tasks - prioritize by due date and priority level
  // First get high priority or due soon, then fall back to any active tasks
  let { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, ai_priority_score")
    .eq("user_id", userId)
    .in("status", ["todo", "in_progress", "pending"])
    .or(`due_date.lte.${tomorrow.toISOString()},priority.eq.high`)
    .order("ai_priority_score", { ascending: false })
    .limit(10);

  // If no urgent/high priority tasks, show any active tasks
  if (!tasks || tasks.length === 0) {
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority, ai_priority_score")
      .eq("user_id", userId)
      .in("status", ["todo", "in_progress", "pending"])
      .order("priority", { ascending: true }) // high < medium < low alphabetically
      .order("created_at", { ascending: false })
      .limit(10);
    tasks = allTasks;
  }

  // Get meetings today
  const { data: meetings } = await supabase
    .from("calendar_events")
    .select("id, title, start_time")
    .eq("user_id", userId)
    .gte("start_time", today.toISOString())
    .lt("start_time", tomorrow.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  // Combine and sort by AI score
  const priorities = [
    ...(tasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      type: "task" as const,
      dueAt: t.due_date,
      aiScore: t.ai_priority_score || calculateBasePriority(t.priority, t.due_date),
    })),
    ...(meetings || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      type: "meeting" as const,
      dueAt: m.start_time,
      aiScore: 0.75, // Meetings default to high priority
    })),
  ].sort((a, b) => b.aiScore - a.aiScore);

  return priorities.slice(0, 5);
}

function calculateBasePriority(priority: string, dueDate?: string): number {
  let score = 0.5;

  // Priority boost
  if (priority === "high") score += 0.3;
  else if (priority === "medium") score += 0.15;

  // Due date urgency
  if (dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) score += 0.3; // Overdue
    else if (hoursUntilDue < 4) score += 0.25;
    else if (hoursUntilDue < 24) score += 0.15;
  }

  return Math.min(score, 1);
}

async function getAutomationResults(supabase: any, userId: string) {
  // Fetch from database automations
  const { data: executions } = await supabase
    .from("automation_executions")
    .select(`
      id,
      status,
      completed_at,
      summary,
      automation:automations(name, type)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const dbResults = (executions || []).map((e: any) => ({
    id: e.id,
    name: e.automation?.name || "Unknown Automation",
    type: e.automation?.type || "workflow",
    status: e.status === "completed" ? "success" : e.status === "running" ? "running" : "failed",
    completedAt: e.completed_at,
    summary: e.summary,
  }));

  // Fetch from live n8n if configured
  let n8nResults: any[] = [];
  if (isN8nConfigured() && N8N_API_URL && N8N_API_KEY) {
    try {
      // Fetch recent n8n executions
      const execResponse = await fetch(`${N8N_API_URL}/executions?limit=10`, {
        headers: {
          "X-N8N-API-KEY": N8N_API_KEY,
          "Accept": "application/json",
        },
      });

      if (execResponse.ok) {
        const execData = await execResponse.json();
        const n8nExecutions = execData.data || [];

        // Fetch workflow names
        let workflowNames: Record<string, string> = {};
        try {
          const wfResponse = await fetch(`${N8N_API_URL}/workflows`, {
            headers: {
              "X-N8N-API-KEY": N8N_API_KEY,
              "Accept": "application/json",
            },
          });
          if (wfResponse.ok) {
            const wfData = await wfResponse.json();
            workflowNames = (wfData.data || []).reduce(
              (acc: Record<string, string>, wf: any) => {
                acc[wf.id] = wf.name;
                return acc;
              },
              {}
            );
          }
        } catch {}

        n8nResults = n8nExecutions.map((exec: any) => ({
          id: `n8n-${exec.id}`,
          name: workflowNames[exec.workflowId] || `n8n Workflow ${exec.workflowId}`,
          type: "n8n" as const,
          status: exec.finished
            ? exec.status === "success" ? "success" : "failed"
            : "running",
          completedAt: exec.stoppedAt,
          summary: exec.status === "error" && exec.data?.resultData?.error
            ? exec.data.resultData.error.message
            : undefined,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch n8n executions for briefing:", error);
    }
  }

  // Combine and sort by completion time
  const allResults = [...dbResults, ...n8nResults].sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

  return allResults.slice(0, 10);
}

async function getUpcomingMeetings(supabase: any, userId: string) {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: meetings } = await supabase
    .from("calendar_events")
    .select("id, title, start_time, end_time, attendees, ai_prep_notes")
    .eq("user_id", userId)
    .gte("start_time", now.toISOString())
    .lte("start_time", endOfDay.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  return (meetings || []).map((m: any) => ({
    id: m.id,
    title: m.title,
    startTime: m.start_time,
    endTime: m.end_time,
    attendees: m.attendees || [],
    aiPrep: m.ai_prep_notes,
  }));
}

async function getAIInsights(supabase: any, userId: string) {
  // Get user's profile for organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  const organizationId = profile?.organization_id;

  // Get proactive insights from our new system
  let proactiveInsights: ProactiveInsight[] = [];
  if (organizationId) {
    try {
      proactiveInsights = await generateProactiveInsights(supabase, userId, organizationId);
    } catch (error) {
      console.error("Error generating proactive insights:", error);
    }
  }

  // Also get any stored insights from database
  const { data: storedInsights } = await supabase
    .from("ai_insights")
    .select("id, type, title, description, action_url")
    .eq("user_id", userId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Map proactive insights to the briefing format
  const mappedProactive = proactiveInsights.map((i) => ({
    id: i.id,
    type: mapInsightType(i.type, i.priority),
    title: i.title,
    description: i.description,
    actionUrl: i.action?.href,
  }));

  // Map stored insights
  const mappedStored = (storedInsights || []).map((i: any) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    description: i.description,
    actionUrl: i.action_url,
  }));

  // Combine and deduplicate, prioritizing proactive insights
  const combined = [...mappedProactive, ...mappedStored];
  return combined.slice(0, 8); // Return top 8 insights
}

// Map our insight types to the briefing display types
function mapInsightType(type: string, priority: string): "pattern" | "suggestion" | "warning" {
  // High priority items should be warnings
  if (priority === "high") return "warning";

  // Map specific types
  switch (type) {
    case "cold_leads":
    case "overdue_tasks":
    case "stale_projects":
      return "warning";
    case "opportunity":
    case "achievement":
      return "pattern";
    case "meeting_prep":
    case "suggestion":
    case "reminder":
    default:
      return "suggestion";
  }
}

function generateQuickActions(
  overnight: any,
  priorities: any[],
  meetings: any[]
): BriefingData["quickActions"] {
  const actions: BriefingData["quickActions"] = [];

  // Always show inbox action
  actions.push({
    id: "inbox",
    label: "Check Inbox",
    icon: "mail",
    action: "/dashboard/inbox",
    count: overnight.newEmails,
  });

  // Show tasks if there are any
  if (priorities.some((p) => p.type === "task")) {
    actions.push({
      id: "tasks",
      label: "View Tasks",
      icon: "check-square",
      action: "/dashboard/tasks",
      count: priorities.filter((p) => p.type === "task").length,
    });
  }

  // Show meeting prep if meeting soon
  if (meetings.length > 0) {
    const nextMeeting = meetings[0];
    const minutesUntil = (new Date(nextMeeting.startTime).getTime() - Date.now()) / 60000;
    if (minutesUntil <= 30 && minutesUntil > 0) {
      actions.push({
        id: "meeting-prep",
        label: "Prep for Meeting",
        icon: "calendar",
        action: `/dashboard/calendar?meeting=${nextMeeting.id}`,
      });
    }
  }

  // Show automation review if failures
  if (overnight.failedAutomations > 0) {
    actions.push({
      id: "automations",
      label: "Review Failures",
      icon: "zap",
      action: "/dashboard/automation?status=failed",
      count: overnight.failedAutomations,
    });
  }

  // AI chat is always helpful
  actions.push({
    id: "ai-chat",
    label: "Ask AI",
    icon: "brain",
    action: "/dashboard/chat",
  });

  return actions.slice(0, 5);
}

/**
 * Cache briefing data for quick retrieval
 */
export async function generateBriefingCache(
  userId: string,
  date: string,
  data: BriefingData
) {
  const supabase = await createClient();

  await supabase.from("briefing_cache").upsert(
    {
      user_id: userId,
      briefing_date: date,
      data,
      generated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,briefing_date",
    }
  );
}
