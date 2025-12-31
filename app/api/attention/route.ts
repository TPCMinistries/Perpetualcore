import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AttentionItem,
  AttentionItemType,
  calculatePriorityScore,
  sortByPriority,
} from "@/lib/attention/priority";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as AttentionItemType | null;
    const urgencyFilter = searchParams.get("urgency");
    const sortBy = searchParams.get("sort") || "priority";

    // Fetch from multiple sources in parallel
    const [
      tasksResult,
      emailsResult,
      notificationsResult,
      automationsResult,
      mentionsResult,
    ] = await Promise.all([
      fetchTasks(supabase, user.id),
      fetchEmails(supabase, user.id),
      fetchNotifications(supabase, user.id),
      fetchAutomationResults(supabase, user.id),
      fetchMentions(supabase, user.id),
    ]);

    // Combine all items
    let items: AttentionItem[] = [
      ...tasksResult,
      ...emailsResult,
      ...notificationsResult,
      ...automationsResult,
      ...mentionsResult,
    ];

    // Calculate priority scores
    items = items.map((item) => ({
      ...item,
      aiPriorityScore: calculatePriorityScore(item),
    }));

    // Apply type filter
    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter);
    }

    // Apply urgency filter
    if (urgencyFilter && urgencyFilter !== "all") {
      const thresholds: Record<string, [number, number]> = {
        critical: [0.8, 1.0],
        high: [0.6, 0.8],
        medium: [0.4, 0.6],
        low: [0, 0.4],
      };
      const [min, max] = thresholds[urgencyFilter] || [0, 1];
      items = items.filter(
        (item) =>
          (item.aiPriorityScore ?? 0) >= min &&
          (item.aiPriorityScore ?? 0) < max
      );
    }

    // Apply sorting
    if (sortBy === "priority") {
      items = sortByPriority(items);
    } else if (sortBy === "date") {
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "due") {
      items.sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Attention API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attention items" },
      { status: 500 }
    );
  }
}

async function fetchTasks(supabase: any, userId: string): Promise<AttentionItem[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, priority, status, created_at, project:projects(name)")
    .eq("user_id", userId)
    .neq("status", "completed")
    .or(`due_date.lte.${today.toISOString()},priority.eq.high`)
    .order("due_date", { ascending: true })
    .limit(50);

  return (tasks || []).map((task: any) => ({
    id: `task-${task.id}`,
    type: "task" as const,
    sourceId: task.id,
    title: task.title,
    preview: task.description?.slice(0, 100),
    createdAt: task.created_at,
    dueAt: task.due_date,
    source: task.project?.name || "Tasks",
    isResolved: false,
    metadata: {
      priority: task.priority,
      status: task.status,
      href: `/dashboard/tasks?id=${task.id}`,
    },
  }));
}

async function fetchEmails(supabase: any, userId: string): Promise<AttentionItem[]> {
  const { data: emails } = await supabase
    .from("emails")
    .select("id, subject, snippet, from_name, from_address, is_read, is_starred, received_at, created_at")
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_archived", false)
    .order("received_at", { ascending: false })
    .limit(50);

  return (emails || []).map((email: any) => ({
    id: `email-${email.id}`,
    type: "email" as const,
    sourceId: email.id,
    title: email.subject || "(No subject)",
    preview: email.snippet,
    createdAt: email.received_at || email.created_at,
    source: email.from_name || email.from_address || "Email",
    isResolved: false,
    metadata: {
      isStarred: email.is_starred,
      href: `/dashboard/inbox?email=${email.id}`,
    },
  }));
}

async function fetchNotifications(supabase: any, userId: string): Promise<AttentionItem[]> {
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, type, is_read, created_at, action_url")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(30);

  return (notifications || []).map((notif: any) => ({
    id: `notification-${notif.id}`,
    type: "notification" as const,
    sourceId: notif.id,
    title: notif.title,
    preview: notif.body,
    createdAt: notif.created_at,
    source: "System",
    isResolved: false,
    metadata: {
      notificationType: notif.type,
      href: notif.action_url || "/dashboard/inbox",
    },
  }));
}

async function fetchAutomationResults(supabase: any, userId: string): Promise<AttentionItem[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: executions } = await supabase
    .from("automation_executions")
    .select(`
      id,
      status,
      summary,
      created_at,
      completed_at,
      automation:automations(id, name, type)
    `)
    .eq("user_id", userId)
    .in("status", ["failed", "completed"])
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  // Only show failed ones as attention items (completed are info only)
  return (executions || [])
    .filter((exec: any) => exec.status === "failed")
    .map((exec: any) => ({
      id: `automation-${exec.id}`,
      type: "automation" as const,
      sourceId: exec.id,
      title: `${exec.automation?.name || "Automation"} failed`,
      preview: exec.summary || "Execution failed - click for details",
      createdAt: exec.created_at,
      source: exec.automation?.type || "Automation",
      isResolved: false,
      metadata: {
        status: exec.status,
        automationId: exec.automation?.id,
        href: `/dashboard/automation?execution=${exec.id}`,
      },
    }));
}

async function fetchMentions(supabase: any, userId: string): Promise<AttentionItem[]> {
  const { data: mentions } = await supabase
    .from("mentions")
    .select("id, content, source_type, source_id, mentioned_by, is_read, created_at")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return (mentions || []).map((mention: any) => ({
    id: `mention-${mention.id}`,
    type: "mention" as const,
    sourceId: mention.id,
    title: `Mentioned by ${mention.mentioned_by}`,
    preview: mention.content?.slice(0, 100),
    createdAt: mention.created_at,
    source: mention.source_type || "Mention",
    isResolved: false,
    metadata: {
      sourceType: mention.source_type,
      sourceId: mention.source_id,
      href: getMentionHref(mention),
    },
  }));
}

function getMentionHref(mention: any): string {
  switch (mention.source_type) {
    case "project":
      return `/dashboard/projects/${mention.source_id}`;
    case "task":
      return `/dashboard/tasks?id=${mention.source_id}`;
    case "document":
      return `/dashboard/library/${mention.source_id}`;
    default:
      return "/dashboard/inbox";
  }
}
