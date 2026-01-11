import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SmartSuggestion {
  text: string;
  source: "calendar" | "task" | "contact" | "document" | "pattern";
  confidence: number;
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const suggestions: SmartSuggestion[] = [];
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // 1. Check for upcoming meetings (within 2 hours)
    const { data: upcomingMeetings } = await supabase
      .from("calendar_events")
      .select("title, start_time")
      .eq("user_id", user.id)
      .gte("start_time", now.toISOString())
      .lte("start_time", in2Hours.toISOString())
      .order("start_time", { ascending: true })
      .limit(1);

    if (upcomingMeetings && upcomingMeetings.length > 0) {
      const meeting = upcomingMeetings[0];
      suggestions.push({
        text: `Prep for ${meeting.title}`,
        source: "calendar",
        confidence: 0.95,
      });
    }

    // 2. Check for high-priority tasks due today
    const { data: urgentTasks } = await supabase
      .from("tasks")
      .select("title, priority")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .in("priority", ["high", "urgent"])
      .lte("due_date", today.toISOString())
      .order("priority", { ascending: false })
      .limit(2);

    if (urgentTasks && urgentTasks.length > 0) {
      urgentTasks.forEach((task) => {
        suggestions.push({
          text: task.title.length > 30 ? task.title.substring(0, 30) + "..." : task.title,
          source: "task",
          confidence: 0.85,
        });
      });
    }

    // 3. Check for contacts needing follow-up
    const { data: followupContacts } = await supabase
      .from("contacts")
      .select("first_name, last_name, next_followup_date")
      .eq("organization_id", profile?.organization_id)
      .lte("next_followup_date", today.toISOString())
      .order("next_followup_date", { ascending: true })
      .limit(1);

    if (followupContacts && followupContacts.length > 0) {
      const contact = followupContacts[0];
      const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
      suggestions.push({
        text: `Follow up with ${name}`,
        source: "contact",
        confidence: 0.8,
      });
    }

    // 4. Check for recently added documents (might want summary)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentDocs } = await supabase
      .from("documents")
      .select("title")
      .eq("organization_id", profile?.organization_id)
      .eq("status", "completed")
      .gte("created_at", yesterday.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentDocs && recentDocs.length > 0) {
      suggestions.push({
        text: `Summarize "${recentDocs[0].title.substring(0, 25)}..."`,
        source: "document",
        confidence: 0.7,
      });
    }

    // 5. Time-based suggestions (patterns)
    const hour = now.getHours();

    // Morning: daily planning
    if (hour >= 6 && hour < 10 && suggestions.length < 3) {
      suggestions.push({
        text: "Plan my day",
        source: "pattern",
        confidence: 0.6,
      });
    }

    // End of day: reflection
    if (hour >= 17 && hour < 20 && suggestions.length < 3) {
      suggestions.push({
        text: "Summarize my day",
        source: "pattern",
        confidence: 0.6,
      });
    }

    // Sort by confidence and return top 3
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      suggestions: suggestions.slice(0, 3),
    });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
