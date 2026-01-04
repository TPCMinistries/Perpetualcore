/**
 * Proactive AI Insights System
 * Analyzes user data and surfaces actionable opportunities
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface ProactiveInsight {
  id: string;
  type: InsightType;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  data?: any;
  expiresAt?: string;
  createdAt: string;
}

export type InsightType =
  | "cold_leads"
  | "meeting_prep"
  | "overdue_tasks"
  | "unanswered_emails"
  | "stale_projects"
  | "opportunity"
  | "pattern"
  | "reminder"
  | "achievement"
  | "suggestion";

/**
 * Generate all proactive insights for a user
 */
export async function generateProactiveInsights(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];

  // Run all insight generators in parallel
  const [
    coldLeads,
    overdueTasks,
    meetingPrep,
    staleProjects,
    opportunities,
  ] = await Promise.all([
    detectColdLeads(supabase, userId, organizationId),
    detectOverdueTasks(supabase, userId),
    detectMeetingPrep(supabase, userId),
    detectStaleProjects(supabase, userId, organizationId),
    detectOpportunities(supabase, userId, organizationId),
  ]);

  insights.push(...coldLeads, ...overdueTasks, ...meetingPrep, ...staleProjects, ...opportunities);

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

/**
 * Detect leads that haven't been contacted recently
 */
async function detectColdLeads(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];

  // Get leads with no recent activity
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: coldLeads } = await supabase
    .from("leads")
    .select("id, name, company, status, last_contacted_at")
    .eq("organization_id", organizationId)
    .in("status", ["new", "contacted", "qualified"])
    .or(`last_contacted_at.is.null,last_contacted_at.lt.${sevenDaysAgo.toISOString()}`)
    .limit(10);

  if (coldLeads && coldLeads.length > 0) {
    insights.push({
      id: `cold-leads-${Date.now()}`,
      type: "cold_leads",
      priority: coldLeads.length > 5 ? "high" : "medium",
      title: `${coldLeads.length} lead${coldLeads.length > 1 ? "s" : ""} going cold`,
      description: coldLeads.length === 1
        ? `${coldLeads[0].name} hasn't been contacted in over a week`
        : `${coldLeads.map(l => l.name).slice(0, 3).join(", ")}${coldLeads.length > 3 ? ` and ${coldLeads.length - 3} more` : ""} need attention`,
      action: {
        label: "View Leads",
        href: "/dashboard/leads?filter=cold",
      },
      data: { leads: coldLeads },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Detect overdue or due-soon tasks
 */
async function detectOverdueTasks(
  supabase: SupabaseClient,
  userId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Overdue tasks
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lt("due_date", now.toISOString())
    .limit(5);

  if (overdueTasks && overdueTasks.length > 0) {
    insights.push({
      id: `overdue-tasks-${Date.now()}`,
      type: "overdue_tasks",
      priority: "high",
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
      description: overdueTasks.length === 1
        ? `"${overdueTasks[0].title}" is overdue`
        : `${overdueTasks.map(t => t.title).slice(0, 2).join(", ")} need immediate attention`,
      action: {
        label: "View Tasks",
        href: "/dashboard/tasks?filter=overdue",
      },
      data: { tasks: overdueTasks },
      createdAt: new Date().toISOString(),
    });
  }

  // Due today/tomorrow
  const { data: dueSoonTasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("due_date", now.toISOString())
    .lte("due_date", tomorrow.toISOString())
    .limit(5);

  if (dueSoonTasks && dueSoonTasks.length > 0) {
    insights.push({
      id: `due-soon-${Date.now()}`,
      type: "reminder",
      priority: "medium",
      title: `${dueSoonTasks.length} task${dueSoonTasks.length > 1 ? "s" : ""} due soon`,
      description: dueSoonTasks.map(t => t.title).slice(0, 2).join(", "),
      action: {
        label: "View Tasks",
        href: "/dashboard/tasks?filter=today",
      },
      data: { tasks: dueSoonTasks },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Detect upcoming meetings that need preparation
 */
async function detectMeetingPrep(
  supabase: SupabaseClient,
  userId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  const in24Hours = new Date();
  in24Hours.setHours(in24Hours.getHours() + 24);

  const { data: upcomingMeetings } = await supabase
    .from("calendar_events")
    .select("id, title, start_time, description, attendees")
    .eq("user_id", userId)
    .gte("start_time", now.toISOString())
    .lte("start_time", in24Hours.toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

  if (upcomingMeetings && upcomingMeetings.length > 0) {
    const nextMeeting = upcomingMeetings[0];
    const meetingTime = new Date(nextMeeting.start_time);
    const hoursUntil = Math.round((meetingTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    insights.push({
      id: `meeting-prep-${Date.now()}`,
      type: "meeting_prep",
      priority: hoursUntil <= 2 ? "high" : "medium",
      title: hoursUntil <= 2 ? `Meeting in ${hoursUntil}h: ${nextMeeting.title}` : `${upcomingMeetings.length} meeting${upcomingMeetings.length > 1 ? "s" : ""} today`,
      description: hoursUntil <= 2
        ? "Would you like me to prepare a briefing?"
        : upcomingMeetings.map(m => m.title).join(", "),
      action: {
        label: "Prepare",
        href: `/dashboard/calendar?event=${nextMeeting.id}`,
      },
      data: { meetings: upcomingMeetings },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Detect projects with no recent activity
 */
async function detectStaleProjects(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data: staleProjects } = await supabase
    .from("projects")
    .select("id, name, updated_at, status")
    .eq("organization_id", organizationId)
    .in("status", ["active", "in_progress"])
    .lt("updated_at", twoWeeksAgo.toISOString())
    .limit(5);

  if (staleProjects && staleProjects.length > 0) {
    insights.push({
      id: `stale-projects-${Date.now()}`,
      type: "stale_projects",
      priority: "low",
      title: `${staleProjects.length} project${staleProjects.length > 1 ? "s" : ""} need attention`,
      description: `${staleProjects.map(p => p.name).slice(0, 2).join(", ")} have no recent activity`,
      action: {
        label: "Review",
        href: "/dashboard/projects?filter=stale",
      },
      data: { projects: staleProjects },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Detect positive patterns and achievements
 */
async function detectOpportunities(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Count completed tasks this week
  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("updated_at", weekAgo.toISOString());

  if (completedTasks && completedTasks >= 10) {
    insights.push({
      id: `achievement-tasks-${Date.now()}`,
      type: "achievement",
      priority: "low",
      title: `Great week! ${completedTasks} tasks completed`,
      description: "You're making excellent progress. Keep up the momentum!",
      createdAt: new Date().toISOString(),
    });
  }

  // Check for new leads this week
  const { count: newLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", weekAgo.toISOString());

  if (newLeads && newLeads >= 5) {
    insights.push({
      id: `opportunity-leads-${Date.now()}`,
      type: "opportunity",
      priority: "medium",
      title: `${newLeads} new leads this week`,
      description: "Strong pipeline growth! Consider reviewing and prioritizing.",
      action: {
        label: "Review Leads",
        href: "/dashboard/leads?filter=new",
      },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Get cached insights or generate new ones
 */
export async function getProactiveInsights(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  forceRefresh = false
): Promise<ProactiveInsight[]> {
  const cacheKey = `insights-${userId}`;
  const cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  // Check cache
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from("briefing_cache")
      .select("data, generated_at")
      .eq("user_id", userId)
      .eq("briefing_date", new Date().toISOString().split("T")[0])
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
      if (cacheAge < cacheMaxAge && cached.data?.insights) {
        return cached.data.insights;
      }
    }
  }

  // Generate fresh insights
  return generateProactiveInsights(supabase, userId, organizationId);
}
