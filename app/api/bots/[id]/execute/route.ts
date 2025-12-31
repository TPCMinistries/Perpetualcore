import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeBot, getExecutionStatus } from "@/lib/bots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * POST - Execute a bot
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;
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

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Verify bot ownership and get bot details
    const { data: bot, error: botError } = await supabase
      .from("ai_agents")
      .select("id, name, is_active")
      .eq("id", botId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    if (!bot.is_active) {
      return NextResponse.json({ error: "Bot is not active" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { input_data = {}, wait = false } = body;

    // Execute bot
    const result = await executeBot(
      botId,
      profile.organization_id,
      user.id,
      input_data,
      "manual"
    );

    if (!result.success && !result.executionId) {
      return NextResponse.json(
        { error: result.error || "Execution failed to start" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: result.success,
      execution_id: result.executionId,
      output: result.output,
      error: result.error,
      execution_time_ms: result.executionTimeMs,
      nodes_executed: result.nodesExecuted,
    });
  } catch (error: any) {
    if (isDev) console.error("Bot execute error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Get execution status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;
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

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const executionId = searchParams.get("execution_id");

    if (!executionId) {
      // Return recent executions for this bot
      const { data: executions, error } = await supabase
        .from("bot_executions")
        .select("id, status, triggered_by, started_at, completed_at, execution_time_ms, error_message")
        .eq("agent_id", botId)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json({ error: "Failed to fetch executions" }, { status: 500 });
      }

      return NextResponse.json({ executions: executions || [] });
    }

    // Get specific execution status
    const status = await getExecutionStatus(executionId, profile.organization_id);

    return NextResponse.json(status);
  } catch (error: any) {
    if (isDev) console.error("Bot execution status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
