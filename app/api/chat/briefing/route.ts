import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BriefingHighlight {
  type: "meeting" | "task" | "agent" | "email";
  text: string;
  time?: string;
  priority?: "high" | "medium" | "low";
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMins = Math.round(diffMs / (1000 * 60));

  if (diffMins < 0) return "now";
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return `tomorrow`;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, first_name")
      .eq("id", user.id)
      .single();

    const highlights: BriefingHighlight[] = [];
    let meetingsCount = 0;
    let tasksCount = 0;

    // Fetch today's calendar events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: events } = await supabase
      .from("calendar_events")
      .select("title, start_time")
      .eq("user_id", user.id)
      .gte("start_time", today.toISOString())
      .lt("start_time", tomorrow.toISOString())
      .order("start_time", { ascending: true })
      .limit(5);

    if (events && events.length > 0) {
      meetingsCount = events.length;
      // Add top 2 meetings as highlights
      events.slice(0, 2).forEach((event) => {
        highlights.push({
          type: "meeting",
          text: event.title,
          time: getRelativeTime(new Date(event.start_time)),
        });
      });
    }

    // Fetch tasks due today
    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, priority, due_date")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("due_date", tomorrow.toISOString())
      .order("priority", { ascending: false })
      .limit(5);

    if (tasks && tasks.length > 0) {
      tasksCount = tasks.length;
      // Add top 2 high priority tasks
      tasks
        .filter((t) => t.priority === "high" || t.priority === "urgent")
        .slice(0, 2)
        .forEach((task) => {
          highlights.push({
            type: "task",
            text: task.title,
            priority: task.priority as "high" | "medium" | "low",
          });
        });
    }

    // Check agent activities (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: agentActivities, count: agentCount } = await supabase
      .from("agent_activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", yesterday.toISOString());

    if (agentCount && agentCount > 0) {
      highlights.push({
        type: "agent",
        text: `Your agents completed ${agentCount} action${agentCount > 1 ? "s" : ""}`,
      });
    }

    // Build summary
    const summaryParts = [];
    if (meetingsCount > 0)
      summaryParts.push(`${meetingsCount} meeting${meetingsCount > 1 ? "s" : ""}`);
    if (tasksCount > 0)
      summaryParts.push(`${tasksCount} task${tasksCount > 1 ? "s" : ""} due`);

    const summary =
      summaryParts.length > 0
        ? `You have ${summaryParts.join(" and ")} today`
        : "Your schedule is clear today";

    // Generate suggestion based on context
    let suggestion = "What can I help you with?";
    if (highlights.length > 0 && highlights[0].type === "meeting") {
      suggestion = `Want me to prep you for "${highlights[0].text}"?`;
    } else if (highlights.some((h) => h.type === "task" && h.priority === "high")) {
      suggestion = "Want to tackle your high-priority tasks first?";
    }

    const greeting = profile?.first_name
      ? `${getTimeGreeting()}, ${profile.first_name}`
      : getTimeGreeting();

    return NextResponse.json({
      greeting,
      date: formatDate(),
      summary,
      highlights,
      suggestion,
    });
  } catch (error) {
    console.error("Briefing API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefing" },
      { status: 500 }
    );
  }
}
