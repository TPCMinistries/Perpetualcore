import { createClient } from "@/lib/supabase/server";

/**
 * Get overview metrics for analytics dashboard
 */
export async function getOverviewMetrics(
  userId: string,
  organizationId: string,
  period: "7d" | "30d" | "90d" = "30d"
) {
  const supabase = await createClient();

  const periodStart = new Date();
  periodStart.setDate(
    periodStart.getDate() - (period === "7d" ? 7 : period === "30d" ? 30 : 90)
  );

  // Get conversations count
  const { count: conversationsCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString());

  // Get messages count
  const { count: messagesCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", userId)
    .gte("created_at", periodStart.toISOString());

  // Get documents count
  const { count: documentsCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", periodStart.toISOString());

  // Get tasks count
  const { count: tasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", periodStart.toISOString());

  // Get completed tasks count
  const { count: completedTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("completed_at", periodStart.toISOString());

  // Get emails count
  const { count: emailsCount } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("received_at", periodStart.toISOString());

  // Get WhatsApp messages count
  const { count: whatsappCount } = await supabase
    .from("whatsapp_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString());

  // Get notifications count
  const { count: notificationsCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString());

  // Get storage usage
  const { data: storageData } = await supabase
    .from("documents")
    .select("file_size")
    .eq("organization_id", organizationId);

  const totalStorage = storageData?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;

  return {
    conversations: conversationsCount || 0,
    messages: messagesCount || 0,
    documents: documentsCount || 0,
    tasks: tasksCount || 0,
    completedTasks: completedTasksCount || 0,
    emails: emailsCount || 0,
    whatsappMessages: whatsappCount || 0,
    notifications: notificationsCount || 0,
    storageBytes: totalStorage,
  };
}

/**
 * Get daily activity data for charts
 */
export async function getDailyActivity(
  userId: string,
  organizationId: string,
  days: number = 30
) {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get messages by day
  const { data: messages } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Get tasks by day
  const { data: tasks } = await supabase
    .from("tasks")
    .select("created_at, status")
    .eq("organization_id", organizationId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Get documents by day
  const { data: documents } = await supabase
    .from("documents")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Group by day
  const activityByDay: Record<string, any> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    activityByDay[dateStr] = {
      date: dateStr,
      messages: 0,
      tasks: 0,
      completedTasks: 0,
      documents: 0,
    };
  }

  messages?.forEach((msg) => {
    const dateStr = msg.created_at.split("T")[0];
    if (activityByDay[dateStr]) {
      activityByDay[dateStr].messages++;
    }
  });

  tasks?.forEach((task) => {
    const dateStr = task.created_at.split("T")[0];
    if (activityByDay[dateStr]) {
      activityByDay[dateStr].tasks++;
      if (task.status === "completed") {
        activityByDay[dateStr].completedTasks++;
      }
    }
  });

  documents?.forEach((doc) => {
    const dateStr = doc.created_at.split("T")[0];
    if (activityByDay[dateStr]) {
      activityByDay[dateStr].documents++;
    }
  });

  return Object.values(activityByDay);
}

/**
 * Get AI usage statistics
 */
export async function getAIUsageStats(userId: string, organizationId: string) {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get AI messages count
  const { data: aiMessages } = await supabase
    .from("messages")
    .select("role, created_at")
    .eq("conversation_id", userId)
    .eq("role", "assistant")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get AI responses in WhatsApp
  const { count: aiWhatsAppCount } = await supabase
    .from("whatsapp_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("ai_response", true)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get email AI actions
  const { count: emailAICount } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .not("ai_summary", "is", null)
    .gte("received_at", thirtyDaysAgo.toISOString());

  // Get notifications with AI prioritization
  const { count: aiNotificationsCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("ai_priority_score", "is", null)
    .gte("created_at", thirtyDaysAgo.toISOString());

  return {
    totalAIMessages: aiMessages?.length || 0,
    aiWhatsAppMessages: aiWhatsAppCount || 0,
    emailAIActions: emailAICount || 0,
    aiNotifications: aiNotificationsCount || 0,
    totalAIInteractions:
      (aiMessages?.length || 0) +
      (aiWhatsAppCount || 0) +
      (emailAICount || 0) +
      (aiNotificationsCount || 0),
  };
}

/**
 * Get productivity insights
 */
export async function getProductivityInsights(
  userId: string,
  organizationId: string
) {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get task completion rate
  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const completionRate =
    totalTasks && totalTasks > 0 ? (completedTasks! / totalTasks) * 100 : 0;

  // Get average response time (time from question to answer)
  const { data: conversations } = await supabase
    .from("conversations")
    .select("created_at, updated_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const avgResponseTime =
    conversations && conversations.length > 0
      ? conversations.reduce((sum, conv) => {
          const created = new Date(conv.created_at).getTime();
          const updated = new Date(conv.updated_at).getTime();
          return sum + (updated - created);
        }, 0) / conversations.length
      : 0;

  // Get most active hours
  const { data: messages } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  messages?.forEach((msg) => {
    const hour = new Date(msg.created_at).getHours();
    hourCounts[hour]++;
  });

  const mostActiveHour = Object.entries(hourCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  // Get streak (consecutive days with activity)
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", userId)
    .order("created_at", { ascending: false })
    .limit(1000);

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activityDates = new Set(
    recentMessages?.map((m) => m.created_at.split("T")[0]) || []
  );

  while (true) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (activityDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    taskCompletionRate: Math.round(completionRate),
    avgResponseTimeMs: Math.round(avgResponseTime),
    mostActiveHour: mostActiveHour ? parseInt(mostActiveHour[0]) : 9,
    currentStreak: streak,
  };
}

/**
 * Get integration health status
 */
export async function getIntegrationHealth(
  userId: string,
  organizationId: string
) {
  const supabase = await createClient();

  // Check email integration
  const { count: emailAccountsCount } = await supabase
    .from("email_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  // Check calendar integration
  const { count: calendarAccountsCount } = await supabase
    .from("calendar_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  // Check WhatsApp integration
  const { count: whatsappAccountsCount } = await supabase
    .from("whatsapp_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "verified");

  return {
    email: {
      connected: (emailAccountsCount || 0) > 0,
      count: emailAccountsCount || 0,
    },
    calendar: {
      connected: (calendarAccountsCount || 0) > 0,
      count: calendarAccountsCount || 0,
    },
    whatsapp: {
      connected: (whatsappAccountsCount || 0) > 0,
      count: whatsappAccountsCount || 0,
    },
  };
}

/**
 * Get top documents by access
 */
export async function getTopDocuments(organizationId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, file_type, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return documents || [];
}

/**
 * Get recent searches
 */
export async function getRecentSearches(userId: string, limit: number = 10) {
  const supabase = await createClient();

  // This assumes you have a searches table - if not, this will return empty
  const { data: searches } = await supabase
    .from("searches")
    .select("query, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return searches || [];
}
