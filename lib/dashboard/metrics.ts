"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardMetrics {
  conversations: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
  documents: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
  timeSaved: {
    value: string;
    change: number;
    trend: "up" | "down";
  };
  activeWorkflows: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return getEmptyMetrics();
    }

    // Get current month date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get current week date range
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);

    // Query conversations (this month vs last month)
    const { data: currentMonthConversations, error: convError1 } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", currentMonthStart.toISOString());

    const { data: lastMonthConversations, error: convError2 } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    const currentConvCount = currentMonthConversations?.length || 0;
    const lastConvCount = lastMonthConversations?.length || 0;
    const convChange = lastConvCount > 0
      ? ((currentConvCount - lastConvCount) / lastConvCount) * 100
      : currentConvCount > 0 ? 100 : 0;

    // Query documents (this week vs last week)
    const { data: currentWeekDocs, error: docError1 } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", currentWeekStart.toISOString());

    const { data: lastWeekDocs, error: docError2 } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", lastWeekStart.toISOString())
      .lte("created_at", lastWeekEnd.toISOString());

    const currentDocCount = currentWeekDocs?.length || 0;
    const lastDocCount = lastWeekDocs?.length || 0;
    const docChange = lastDocCount > 0
      ? ((currentDocCount - lastDocCount) / lastDocCount) * 100
      : currentDocCount > 0 ? 100 : 0;

    // Estimate time saved (based on messages this week vs last week)
    // Assumption: Each AI message saves ~5 minutes
    const { data: currentWeekMessages, error: msgError1 } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "assistant")
      .gte("created_at", currentWeekStart.toISOString());

    const { data: lastWeekMessages, error: msgError2 } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "assistant")
      .gte("created_at", lastWeekStart.toISOString())
      .lte("created_at", lastWeekEnd.toISOString());

    const currentMsgCount = currentWeekMessages?.length || 0;
    const lastMsgCount = lastWeekMessages?.length || 0;
    const timeSavedMinutes = currentMsgCount * 5; // 5 minutes per AI interaction
    const lastTimeSavedMinutes = lastMsgCount * 5;
    const timeSavedChange = lastTimeSavedMinutes > 0
      ? ((timeSavedMinutes - lastTimeSavedMinutes) / lastTimeSavedMinutes) * 100
      : timeSavedMinutes > 0 ? 100 : 0;

    const timeSavedHours = Math.round(timeSavedMinutes / 60);
    const timeSavedValue = timeSavedHours > 0 ? `${timeSavedHours}h` : `${timeSavedMinutes}m`;

    // Query active workflows/agents - assuming there's an agents table
    // If this fails, we'll default to 0
    let activeCount = 0;
    try {
      const { data: activeAgents } = await supabase
        .from("agents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");
      activeCount = activeAgents?.length || 0;
    } catch {
      // Table may not exist, default to 0
    }

    return {
      conversations: {
        value: currentConvCount,
        change: Number(convChange.toFixed(1)),
        trend: convChange >= 0 ? "up" : "down",
      },
      documents: {
        value: currentDocCount,
        change: Number(docChange.toFixed(1)),
        trend: docChange >= 0 ? "up" : "down",
      },
      timeSaved: {
        value: timeSavedValue,
        change: Number(timeSavedChange.toFixed(1)),
        trend: timeSavedChange >= 0 ? "up" : "down",
      },
      activeWorkflows: {
        value: activeCount,
        change: 0, // No historical comparison for now
        trend: "up",
      },
    };
  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    return getEmptyMetrics();
  }
}

function getEmptyMetrics(): DashboardMetrics {
  return {
    conversations: { value: 0, change: 0, trend: "up" },
    documents: { value: 0, change: 0, trend: "up" },
    timeSaved: { value: "0m", change: 0, trend: "up" },
    activeWorkflows: { value: 0, change: 0, trend: "up" },
  };
}
