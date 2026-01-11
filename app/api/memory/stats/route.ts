import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MemoryStats {
  // Knowledge totals
  documents: { count: number; lastAdded: string | null };
  conversations: { count: number; totalMessages: number };
  contacts: { count: number; withContext: number };
  tasks: { count: number; completed: number };

  // AI Memory specifics
  memories: {
    total: number;
    byType: Record<string, number>;
    lastLearned: string | null;
    highConfidence: number;
  };

  // Learning activity
  learningLog: {
    todayCount: number;
    weekCount: number;
    recentEvents: Array<{
      type: string;
      content: string;
      created_at: string;
    }>;
  };

  // Context awareness
  conversationContexts: number;
  insights: number;
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

    const orgId = profile?.organization_id;

    // Fetch all stats in parallel
    const [
      documentsResult,
      conversationsResult,
      messagesResult,
      contactsResult,
      contactsWithContextResult,
      tasksResult,
      completedTasksResult,
      memoriesResult,
      memoriesByTypeResult,
      highConfidenceMemoriesResult,
      lastLearnedResult,
      conversationContextsResult,
      todayLearningResult,
      weekLearningResult,
      recentLearningResult,
      insightsResult,
    ] = await Promise.all([
      // Documents count
      supabase
        .from("documents")
        .select("id, created_at", { count: "exact", head: false })
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1),

      // Conversations count
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Messages count
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Contacts count
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),

      // Contacts with AI context
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .not("ai_summary", "is", null),

      // Tasks count
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Completed tasks
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed"),

      // Total AI memories
      supabase
        .from("user_ai_memory")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true),

      // Memories by type
      supabase
        .from("user_ai_memory")
        .select("memory_type")
        .eq("user_id", user.id)
        .eq("is_active", true),

      // High confidence memories
      supabase
        .from("user_ai_memory")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("confidence", 0.9),

      // Last learned memory
      supabase
        .from("user_ai_memory")
        .select("learned_at, content")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("learned_at", { ascending: false })
        .limit(1),

      // Conversation contexts
      supabase
        .from("conversation_context")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Today's learning events
      supabase
        .from("ai_learning_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // Week's learning events
      supabase
        .from("ai_learning_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent learning events
      supabase
        .from("ai_learning_log")
        .select(`
          event_type,
          created_at,
          memory:user_ai_memory(content)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),

      // AI insights count
      supabase
        .from("ai_insights")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    // Process memories by type
    const byType: Record<string, number> = {};
    memoriesByTypeResult.data?.forEach((m) => {
      byType[m.memory_type] = (byType[m.memory_type] || 0) + 1;
    });

    // Format recent learning events
    const recentEvents = recentLearningResult.data?.map((event: any) => ({
      type: event.event_type,
      content: event.memory?.content || "Memory updated",
      created_at: event.created_at,
    })) || [];

    const stats: MemoryStats = {
      documents: {
        count: documentsResult.count || 0,
        lastAdded: documentsResult.data?.[0]?.created_at || null,
      },
      conversations: {
        count: conversationsResult.count || 0,
        totalMessages: messagesResult.count || 0,
      },
      contacts: {
        count: contactsResult.count || 0,
        withContext: contactsWithContextResult.count || 0,
      },
      tasks: {
        count: tasksResult.count || 0,
        completed: completedTasksResult.count || 0,
      },
      memories: {
        total: memoriesResult.count || 0,
        byType,
        lastLearned: lastLearnedResult.data?.[0]?.learned_at || null,
        highConfidence: highConfidenceMemoriesResult.count || 0,
      },
      learningLog: {
        todayCount: todayLearningResult.count || 0,
        weekCount: weekLearningResult.count || 0,
        recentEvents,
      },
      conversationContexts: conversationContextsResult.count || 0,
      insights: insightsResult.count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Memory stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory stats" },
      { status: 500 }
    );
  }
}
