import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: triggers, error } = await supabase
      .from("automation_triggers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get automation names
    const automationIds = [...new Set(triggers?.map((t) => t.automation_id) || [])];

    const [botsResult, workflowsResult, n8nResult, jobsResult] = await Promise.all([
      supabase.from("bots").select("id, name").in("id", automationIds),
      supabase.from("workflows").select("id, name").in("id", automationIds),
      supabase.from("n8n_workflows").select("id, name").in("id", automationIds),
      supabase.from("scheduled_jobs").select("id, name").in("id", automationIds),
    ]);

    const nameMap = new Map<string, string>();
    [...(botsResult.data || []), ...(workflowsResult.data || []), ...(n8nResult.data || []), ...(jobsResult.data || [])]
      .forEach((item: any) => nameMap.set(item.id, item.name));

    const enrichedTriggers = (triggers || []).map((trigger) => ({
      id: trigger.id,
      name: trigger.name,
      type: trigger.type,
      automationId: trigger.automation_id,
      automationName: nameMap.get(trigger.automation_id) || "Unknown",
      isActive: trigger.is_active,
      config: trigger.config,
      lastTriggered: trigger.last_triggered_at,
      triggerCount: trigger.trigger_count,
      createdAt: trigger.created_at,
    }));

    return NextResponse.json({ triggers: enrichedTriggers });
  } catch (error) {
    console.error("Triggers API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch triggers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, automationId, config } = body;

    if (!name || !type || !automationId) {
      return NextResponse.json(
        { error: "Name, type, and automationId are required" },
        { status: 400 }
      );
    }

    const { data: trigger, error } = await supabase
      .from("automation_triggers")
      .insert({
        user_id: user.id,
        name,
        type,
        automation_id: automationId,
        config: config || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ trigger });
  } catch (error) {
    console.error("Create trigger error:", error);
    return NextResponse.json(
      { error: "Failed to create trigger" },
      { status: 500 }
    );
  }
}
