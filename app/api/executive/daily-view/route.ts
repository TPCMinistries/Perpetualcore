import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DailyCommandSummary, DeadlineItem, RiskLevel } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/executive/daily-view - Get aggregated daily command view data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check executive access
    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Fetch all data in parallel
    const [
      prioritiesResult,
      decisionsResult,
      opportunitiesResult,
      taskHealthResult,
      riskAnalysisResult,
      deadlines7Result,
      deadlines30Result,
    ] = await Promise.all([
      // Top 5 priorities for today
      supabase
        .from("executive_priorities")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("priority_date", today)
        .eq("status", "active")
        .order("priority_rank", { ascending: true })
        .limit(5),

      // Pending decisions count
      supabase
        .from("decisions")
        .select("id, priority", { count: "exact" })
        .eq("organization_id", profile.organization_id)
        .eq("status", "pending"),

      // Active opportunities count
      supabase
        .from("work_items")
        .select("id", { count: "exact" })
        .eq("organization_id", profile.organization_id)
        .eq("item_type", "opportunity")
        .is("final_decision", null)
        .eq("is_archived", false),

      // Task health issues count
      supabase
        .from("task_health_flags")
        .select("id", { count: "exact" })
        .eq("organization_id", profile.organization_id)
        .eq("status", "active"),

      // Latest risk analysis
      supabase
        .from("risk_analyses")
        .select("overall_risk_level")
        .eq("organization_id", profile.organization_id)
        .order("analysis_date", { ascending: false })
        .limit(1)
        .single(),

      // Deadlines within 7 days
      supabase
        .from("work_items")
        .select("id, title, due_date, item_type, priority, current_stage_id")
        .eq("organization_id", profile.organization_id)
        .eq("is_archived", false)
        .not("due_date", "is", null)
        .gte("due_date", today)
        .lte("due_date", sevenDaysFromNow)
        .order("due_date", { ascending: true })
        .limit(10),

      // Deadlines within 30 days (but after 7)
      supabase
        .from("work_items")
        .select("id, title, due_date, item_type, priority, current_stage_id")
        .eq("organization_id", profile.organization_id)
        .eq("is_archived", false)
        .not("due_date", "is", null)
        .gt("due_date", sevenDaysFromNow)
        .lte("due_date", thirtyDaysFromNow)
        .order("due_date", { ascending: true })
        .limit(15),
    ]);

    // Calculate urgent decisions (due within 3 days or high/urgent priority)
    const urgentDecisions = (decisionsResult.data || []).filter((d) => {
      return d.priority === "urgent" || d.priority === "high";
    }).length;

    // Map deadlines to DeadlineItem format
    const mapDeadline = (item: {
      id: string;
      title: string;
      due_date: string;
      item_type: string;
      priority: string;
      current_stage_id: string;
    }): DeadlineItem => {
      const dueDate = new Date(item.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: item.id,
        title: item.title,
        due_date: item.due_date,
        source_type: item.item_type as DeadlineItem["source_type"],
        source_id: item.id,
        priority: item.priority as DeadlineItem["priority"],
        status: item.current_stage_id,
        days_until_due: daysUntilDue,
      };
    };

    const summary: DailyCommandSummary = {
      priorities: prioritiesResult.data || [],
      pending_decisions: decisionsResult.count || 0,
      urgent_decisions: urgentDecisions,
      active_opportunities: opportunitiesResult.count || 0,
      task_health_issues: taskHealthResult.count || 0,
      risk_level: (riskAnalysisResult.data?.overall_risk_level as RiskLevel) || null,
      deadlines_7_days: (deadlines7Result.data || []).map(mapDeadline),
      deadlines_30_days: (deadlines30Result.data || []).map(mapDeadline),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Daily view API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
