// @ts-nocheck
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/usage - Get usage analytics for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get date range from query params (optional)
    const url = new URL(req.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    // Query both messages tables with cost data
    // 1. Main chat messages (messages table)
    let mainChatQuery = supabase
      .from("messages")
      .select(`
        id,
        created_at,
        role,
        model_used,
        tokens_used,
        cost_usd,
        user_id,
        conversation_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .not("cost_usd", "is", null)
      .eq("role", "assistant");

    if (startDate) {
      mainChatQuery = mainChatQuery.gte("created_at", startDate);
    }
    if (endDate) {
      mainChatQuery = mainChatQuery.lte("created_at", endDate);
    }

    // 2. Team conversation messages (conversation_messages table)
    let teamChatQuery = supabase
      .from("conversation_messages")
      .select(`
        id,
        created_at,
        role,
        model_used,
        tokens_used,
        cost_usd,
        user_id,
        conversation_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .not("cost_usd", "is", null)
      .eq("role", "assistant");

    if (startDate) {
      teamChatQuery = teamChatQuery.gte("created_at", startDate);
    }
    if (endDate) {
      teamChatQuery = teamChatQuery.lte("created_at", endDate);
    }

    // Execute both queries in parallel
    const [mainChatResult, teamChatResult] = await Promise.all([
      mainChatQuery,
      teamChatQuery,
    ]);

    if (mainChatResult.error) {
      console.error("Error fetching main chat messages:", mainChatResult.error);
      return new Response(JSON.stringify({ error: mainChatResult.error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (teamChatResult.error) {
      console.error("Error fetching team chat messages:", teamChatResult.error);
      return new Response(JSON.stringify({ error: teamChatResult.error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Combine messages from both sources and sort by date
    const messages = [
      ...(mainChatResult.data || []),
      ...(teamChatResult.data || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`📊 Usage API: Found ${mainChatResult.data?.length || 0} main chat + ${teamChatResult.data?.length || 0} team chat messages = ${messages.length} total`);

    // Calculate aggregate statistics
    const totalMessages = messages?.length || 0;
    const totalTokens = messages?.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0) || 0;
    const totalCost = messages?.reduce((sum, msg) => sum + parseFloat(msg.cost_usd || "0"), 0) || 0;

    // Group by user
    const userStats: Record<string, any> = {};
    messages?.forEach(msg => {
      if (msg.user_id && msg.profiles) {
        if (!userStats[msg.user_id]) {
          userStats[msg.user_id] = {
            user_id: msg.user_id,
            full_name: msg.profiles.full_name,
            email: msg.profiles.email,
            message_count: 0,
            total_tokens: 0,
            total_cost: 0
          };
        }
        userStats[msg.user_id].message_count += 1;
        userStats[msg.user_id].total_tokens += msg.tokens_used || 0;
        userStats[msg.user_id].total_cost += parseFloat(msg.cost_usd || "0");
      }
    });

    // Group by conversation
    const conversationStats: Record<string, any> = {};
    messages?.forEach(msg => {
      if (!conversationStats[msg.conversation_id]) {
        conversationStats[msg.conversation_id] = {
          conversation_id: msg.conversation_id,
          message_count: 0,
          total_tokens: 0,
          total_cost: 0
        };
      }
      conversationStats[msg.conversation_id].message_count += 1;
      conversationStats[msg.conversation_id].total_tokens += msg.tokens_used || 0;
      conversationStats[msg.conversation_id].total_cost += parseFloat(msg.cost_usd || "0");
    });

    // Group by model
    const modelStats: Record<string, any> = {};
    messages?.forEach(msg => {
      if (msg.model_used) {
        if (!modelStats[msg.model_used]) {
          modelStats[msg.model_used] = {
            model: msg.model_used,
            message_count: 0,
            total_tokens: 0,
            total_cost: 0
          };
        }
        modelStats[msg.model_used].message_count += 1;
        modelStats[msg.model_used].total_tokens += msg.tokens_used || 0;
        modelStats[msg.model_used].total_cost += parseFloat(msg.cost_usd || "0");
      }
    });

    // Group by date for time series
    const dailyStats: Record<string, any> = {};
    messages?.forEach(msg => {
      const date = new Date(msg.created_at).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          message_count: 0,
          total_tokens: 0,
          total_cost: 0
        };
      }
      dailyStats[date].message_count += 1;
      dailyStats[date].total_tokens += msg.tokens_used || 0;
      dailyStats[date].total_cost += parseFloat(msg.cost_usd || "0");
    });

    // Convert to arrays and sort
    const byUser = Object.values(userStats).sort((a: any, b: any) => b.total_cost - a.total_cost);
    const byConversation = Object.values(conversationStats).sort((a: any, b: any) => b.total_cost - a.total_cost).slice(0, 20);
    const byModel = Object.values(modelStats).sort((a: any, b: any) => b.total_cost - a.total_cost);
    const byDate = Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return Response.json({
      summary: {
        total_messages: totalMessages,
        total_tokens: totalTokens,
        total_cost: totalCost.toFixed(4),
        unique_users: Object.keys(userStats).length,
        unique_conversations: Object.keys(conversationStats).length
      },
      by_user: byUser,
      by_conversation: byConversation,
      by_model: byModel,
      by_date: byDate
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/usage:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
