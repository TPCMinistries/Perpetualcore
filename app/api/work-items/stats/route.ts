import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WorkItemStatsResponse, WorkItemPriority } from "@/types/work";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/work-items/stats - Get work item statistics for a team
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("team_id");

    if (!teamId) {
      return NextResponse.json(
        { error: "team_id is required" },
        { status: 400 }
      );
    }

    // Get all non-archived items for the team
    const { data: items, error: itemsError } = await supabase
      .from("work_items")
      .select("current_stage_id, priority, is_exception, assigned_to, due_date, ai_score, completed_at, created_at")
      .eq("team_id", teamId)
      .eq("organization_id", profile.organization_id)
      .eq("is_archived", false);

    if (itemsError) {
      console.error("Error fetching work items for stats:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const stageCounts: Record<string, number> = {};
    const priorityCounts: Record<WorkItemPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    let exceptionCount = 0;
    let unassignedCount = 0;
    let overdueCount = 0;
    let completedThisWeek = 0;
    let totalAiScore = 0;
    let aiScoreCount = 0;

    for (const item of items || []) {
      // Stage counts
      const stageId = item.current_stage_id || "unknown";
      stageCounts[stageId] = (stageCounts[stageId] || 0) + 1;

      // Priority counts
      const priority = item.priority as WorkItemPriority;
      if (priority in priorityCounts) {
        priorityCounts[priority]++;
      }

      // Exception count
      if (item.is_exception) {
        exceptionCount++;
      }

      // Unassigned count
      if (!item.assigned_to) {
        unassignedCount++;
      }

      // Overdue count
      if (item.due_date && !item.completed_at) {
        const dueDate = new Date(item.due_date);
        if (dueDate < now) {
          overdueCount++;
        }
      }

      // Completed this week
      if (item.completed_at) {
        const completedDate = new Date(item.completed_at);
        if (completedDate >= oneWeekAgo) {
          completedThisWeek++;
        }
      }

      // AI score average
      if (item.ai_score !== null && item.ai_score !== undefined) {
        totalAiScore += item.ai_score;
        aiScoreCount++;
      }
    }

    const stats: WorkItemStatsResponse = {
      total_count: items?.length || 0,
      stage_counts: stageCounts,
      priority_counts: priorityCounts,
      exception_count: exceptionCount,
      unassigned_count: unassignedCount,
      overdue_count: overdueCount,
      completed_this_week: completedThisWeek,
      avg_ai_score: aiScoreCount > 0 ? totalAiScore / aiScoreCount : undefined,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Work items stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
