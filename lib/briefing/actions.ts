"use server";

import { createClient } from "@/lib/supabase/server";
import { BriefingData } from "@/components/briefing/DailyBriefing";

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
  const completedAutomations = automations.data?.filter((a: any) => a.status === "completed").length || 0;
  const failedAutomations = automations.data?.filter((a: any) => a.status === "failed").length || 0;

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

  // Get tasks due today or overdue
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, ai_priority_score")
    .eq("user_id", userId)
    .eq("status", "pending")
    .or(`due_date.lte.${tomorrow.toISOString()},priority.eq.high`)
    .order("ai_priority_score", { ascending: false })
    .limit(10);

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

  return (executions || []).map((e: any) => ({
    id: e.id,
    name: e.automation?.name || "Unknown Automation",
    type: e.automation?.type || "workflow",
    status: e.status === "completed" ? "success" : e.status === "running" ? "running" : "failed",
    completedAt: e.completed_at,
    summary: e.summary,
  }));
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
  const { data: insights } = await supabase
    .from("ai_insights")
    .select("id, type, title, description, action_url")
    .eq("user_id", userId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return (insights || []).map((i: any) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    description: i.description,
    actionUrl: i.action_url,
  }));
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
