import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sample suggestions for demo/testing
const sampleSuggestions = [
  {
    title: "You have 3 overdue tasks",
    description: "These tasks are past their due date and need attention: Complete quarterly report, Review team feedback, Update project documentation",
    category: "productivity",
    priority: "high",
    suggested_action: "Review and update your overdue tasks",
    action_url: "/dashboard/tasks?filter=overdue",
    confidence_score: 0.95,
    reasoning: "Your task list shows 3 items past their due date. Addressing overdue items helps maintain project momentum and team accountability.",
  },
  {
    title: "Optimize your document workflow",
    description: "You've manually tagged 15 documents this week. Consider creating an automation workflow to save time.",
    category: "workflow",
    priority: "medium",
    suggested_action: "Create a workflow automation",
    action_url: "/dashboard/workflows/templates",
    confidence_score: 0.82,
    reasoning: "Pattern detected: You've performed similar document tagging tasks repeatedly. Automation could save approximately 2 hours per week.",
  },
  {
    title: "Prepare for tomorrow's team meeting",
    description: "Your team meeting \"Q4 Planning Session\" is tomorrow at 10am. Review the agenda and prepare materials.",
    category: "meeting",
    priority: "high",
    suggested_action: "Prepare for the meeting",
    action_url: "/dashboard/calendar",
    confidence_score: 0.90,
    reasoning: "Meeting scheduled in 18 hours. Early preparation improves meeting effectiveness and demonstrates leadership.",
  },
  {
    title: "52 unread emails in your inbox",
    description: "Your inbox has accumulated 52 unread emails over the past 3 days. Consider processing them to stay organized.",
    category: "email",
    priority: "medium",
    suggested_action: "Process your unread emails",
    action_url: "/dashboard/email",
    confidence_score: 0.75,
    reasoning: "Email buildup detected. Regular inbox processing prevents important messages from being overlooked.",
  },
  {
    title: "Great job! 8 tasks completed today",
    description: "You've completed 8 tasks today, exceeding your daily average of 5. Keep up the excellent momentum!",
    category: "insight",
    priority: "low",
    suggested_action: "Continue your productivity streak",
    action_url: "/dashboard/analytics",
    confidence_score: 0.88,
    reasoning: "Positive reinforcement: You're 60% above your average daily task completion rate. Celebrating wins maintains motivation.",
  },
  {
    title: "Organize 12 untagged documents",
    description: "You have 12 documents without tags or folders in the past week. Organize them for easier discovery.",
    category: "document",
    priority: "low",
    suggested_action: "Tag and organize documents",
    action_url: "/dashboard/documents?filter=untagged",
    confidence_score: 0.70,
    reasoning: "Untagged documents reduce searchability and collaboration efficiency. Regular organization improves long-term productivity.",
  },
  {
    title: "Create a Morning Briefing assistant",
    description: "Based on your usage patterns, you check tasks, calendar, and emails every morning. An AI assistant could automate this routine.",
    category: "optimization",
    priority: "medium",
    suggested_action: "Create an AI assistant",
    action_url: "/dashboard/assistants/browse",
    confidence_score: 0.85,
    reasoning: "Daily pattern detected: Morning review ritual takes 15-20 minutes. A Daily Digest assistant could deliver this information automatically.",
  },
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get count parameter (default to 3)
    const { searchParams } = new URL(request.url);
    const count = Math.min(parseInt(searchParams.get("count") || "3"), sampleSuggestions.length);

    // Select random suggestions
    const selectedSuggestions = sampleSuggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    // Insert suggestions
    const suggestions = [];
    for (const sample of selectedSuggestions) {
      const { data, error } = await supabase
        .from("ai_suggestions")
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          ...sample,
          status: "pending",
        })
        .select()
        .single();

      if (data) {
        suggestions.push(data);
      }
    }

    return NextResponse.json({
      message: `Generated ${suggestions.length} sample suggestions`,
      suggestions,
    }, { status: 201 });
  } catch (error) {
    console.error("Generate samples API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
