import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - Load bot flow (nodes and edges)
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

    // Load flow using database function
    const { data: flow, error } = await supabase.rpc("load_bot_flow", {
      p_agent_id: botId,
    });

    if (error) {
      if (isDev) console.error("Error loading flow:", error);
      return NextResponse.json({ error: "Failed to load flow" }, { status: 500 });
    }

    return NextResponse.json({
      nodes: flow?.nodes || [],
      edges: flow?.edges || [],
    });
  } catch (error: any) {
    if (isDev) console.error("Bot flow load error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Save bot flow
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

    // Verify bot ownership
    const { data: bot, error: botError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("id", botId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const body = await req.json();
    const { nodes, edges } = body;

    if (!Array.isArray(nodes)) {
      return NextResponse.json({ error: "nodes must be an array" }, { status: 400 });
    }

    if (!Array.isArray(edges)) {
      return NextResponse.json({ error: "edges must be an array" }, { status: 400 });
    }

    // Save flow using database function
    const { data: result, error } = await supabase.rpc("save_bot_flow", {
      p_agent_id: botId,
      p_nodes: nodes,
      p_edges: edges,
    });

    if (error) {
      if (isDev) console.error("Error saving flow:", error);
      return NextResponse.json({ error: "Failed to save flow" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      nodes_saved: result?.nodes_saved || nodes.length,
      edges_saved: result?.edges_saved || edges.length,
    });
  } catch (error: any) {
    if (isDev) console.error("Bot flow save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
