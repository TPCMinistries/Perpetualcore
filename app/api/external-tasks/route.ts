import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/external-tasks
 * Fetch external tasks from Todoist, Linear, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "open";
    const source = searchParams.get("source"); // optional: "todoist" | "linear"

    // Build query
    let query = supabase
      .from("external_tasks")
      .select("*")
      .eq("user_id", user.id);

    // Filter by status
    if (status === "open") {
      query = query.not("status", "in", '("done","completed","closed","cancelled")');
    } else if (status === "closed") {
      query = query.in("status", ["done", "completed", "closed", "cancelled"]);
    }

    // Filter by source if specified
    if (source) {
      query = query.eq("source", source);
    }

    // Order by priority and due date
    query = query
      .order("priority", { ascending: true, nullsFirst: false })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit);

    const { data: tasks, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.code === "42P01") {
        return NextResponse.json({ tasks: [], message: "External tasks not configured" });
      }
      throw error;
    }

    return NextResponse.json({
      tasks: tasks || [],
      count: tasks?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching external tasks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch external tasks" },
      { status: 500 }
    );
  }
}
