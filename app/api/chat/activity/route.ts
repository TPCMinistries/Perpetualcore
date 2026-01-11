import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RecentDocument {
  id: string;
  title: string;
  type: string;
  created_at: string;
  status: string;
}

interface RecentTask {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
}

interface RecentConversation {
  id: string;
  title: string | null;
  updated_at: string;
  message_count: number;
}

interface UpcomingMeeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
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

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch recent documents (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, file_type, created_at, status")
      .eq("organization_id", profile?.organization_id)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch upcoming tasks (due soon or high priority)
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, priority, due_date, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "in_progress"])
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true })
      .limit(5);

    // Fetch upcoming meetings (today)
    const { data: meetings } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, end_time")
      .eq("user_id", user.id)
      .gte("start_time", now.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .order("start_time", { ascending: true })
      .limit(5);

    // Fetch recent conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select(`
        id,
        title,
        updated_at,
        messages:messages(count)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    // Format the data
    const recentDocuments: RecentDocument[] = (documents || []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.file_type || "document",
      created_at: doc.created_at,
      status: doc.status,
    }));

    const recentTasks: RecentTask[] = (tasks || []).map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      due_date: task.due_date,
      status: task.status,
    }));

    const upcomingMeetings: UpcomingMeeting[] = (meetings || []).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
    }));

    const recentConversations: RecentConversation[] = (conversations || []).map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      updated_at: conv.updated_at,
      message_count: conv.messages?.[0]?.count || 0,
    }));

    return NextResponse.json({
      documents: recentDocuments,
      tasks: recentTasks,
      meetings: upcomingMeetings,
      conversations: recentConversations,
    });
  } catch (error) {
    console.error("Activity API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
