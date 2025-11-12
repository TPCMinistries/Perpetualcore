import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;

    const { data: agent, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Get agent API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;
    const body = await request.json();

    // Verify agent ownership
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("user_id")
      .eq("id", agentId)
      .single();

    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update agent
    const { data: updatedAgent, error: updateError } = await supabase
      .from("ai_agents")
      .update({
        name: body.name,
        description: body.description,
        agent_type: body.agent_type,
        personality: body.personality,
        instructions: body.instructions,
        enabled: body.enabled,
        config: body.config || {},
      })
      .eq("id", agentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating agent:", updateError);
      return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
    }

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error("Update agent API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;

    const { data: agent } = await supabase
      .from("ai_agents")
      .select("user_id")
      .eq("id", agentId)
      .single();

    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("ai_agents")
      .delete()
      .eq("id", agentId);

    if (deleteError) {
      console.error("Error deleting agent:", deleteError);
      return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete agent API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
