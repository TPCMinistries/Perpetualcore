import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PersonWorkload } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/executive/people - Get people with workload summary
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");

    // Get all active users in organization
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("organization_id", profile.organization_id);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get work items with assignments
    let workItemsQuery = supabase
      .from("work_items")
      .select("id, assigned_to, current_stage_id, due_date, is_archived")
      .eq("organization_id", profile.organization_id)
      .eq("is_archived", false)
      .not("assigned_to", "is", null);

    if (team_id) {
      workItemsQuery = workItemsQuery.eq("team_id", team_id);
    }

    const { data: workItems, error: workItemsError } = await workItemsQuery;

    if (workItemsError) {
      console.error("Error fetching work items:", workItemsError);
      return NextResponse.json(
        { error: "Failed to fetch work items" },
        { status: 500 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate workload per person
    const workloadMap = new Map<string, {
      pending: number;
      active: number;
      blocked: number;
      overdue: number;
      nextDueDate: string | null;
    }>();

    for (const item of workItems || []) {
      if (!item.assigned_to) continue;

      const current = workloadMap.get(item.assigned_to) || {
        pending: 0,
        active: 0,
        blocked: 0,
        overdue: 0,
        nextDueDate: null,
      };

      // Determine task state based on stage
      const stageId = item.current_stage_id?.toLowerCase() || "";
      if (stageId.includes("blocked") || stageId.includes("waiting")) {
        current.blocked++;
      } else if (
        stageId.includes("progress") ||
        stageId.includes("active") ||
        stageId.includes("doing")
      ) {
        current.active++;
      } else if (
        !stageId.includes("done") &&
        !stageId.includes("complete") &&
        !stageId.includes("closed")
      ) {
        current.pending++;
      }

      // Check for overdue
      if (item.due_date) {
        const dueDate = new Date(item.due_date);
        if (dueDate < today) {
          current.overdue++;
        }
        // Track next due date
        if (dueDate >= today) {
          if (!current.nextDueDate || dueDate.toISOString() < current.nextDueDate) {
            current.nextDueDate = item.due_date;
          }
        }
      }

      workloadMap.set(item.assigned_to, current);
    }

    // Build response with workload status
    const people: PersonWorkload[] = (users || []).map((u) => {
      const workload = workloadMap.get(u.id) || {
        pending: 0,
        active: 0,
        blocked: 0,
        overdue: 0,
        nextDueDate: null,
      };

      const totalWorkload = workload.pending + workload.active + workload.blocked;

      let workloadStatus: PersonWorkload["workload_status"] = "normal";
      if (totalWorkload === 0) {
        workloadStatus = "light";
      } else if (totalWorkload > 10 || workload.overdue > 2) {
        workloadStatus = "overloaded";
      } else if (totalWorkload > 7 || workload.overdue > 0) {
        workloadStatus = "heavy";
      }

      return {
        person_id: u.id,
        full_name: u.full_name || "Unknown",
        avatar_url: u.avatar_url,
        pending_tasks: workload.pending,
        active_tasks: workload.active,
        blocked_tasks: workload.blocked,
        total_workload: totalWorkload,
        next_due_date: workload.nextDueDate,
        overdue_count: workload.overdue,
        workload_status: workloadStatus,
      };
    });

    // Sort by workload (overloaded first, then by total)
    people.sort((a, b) => {
      const statusOrder = { overloaded: 0, heavy: 1, normal: 2, light: 3 };
      const statusDiff = statusOrder[a.workload_status] - statusOrder[b.workload_status];
      if (statusDiff !== 0) return statusDiff;
      return b.total_workload - a.total_workload;
    });

    return NextResponse.json({
      people,
      summary: {
        total_people: people.length,
        overloaded: people.filter((p) => p.workload_status === "overloaded").length,
        heavy: people.filter((p) => p.workload_status === "heavy").length,
        normal: people.filter((p) => p.workload_status === "normal").length,
        light: people.filter((p) => p.workload_status === "light").length,
      },
    });
  } catch (error) {
    console.error("People API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
