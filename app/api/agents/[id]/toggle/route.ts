import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: agentId } = await params;
    const { enabled } = await request.json();

    const { data: agent } = await supabase
      .from("ai_agents")
      .select("user_id")
      .eq("id", agentId)
      .single();

    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updatedAgent, error: updateError } = await supabase
      .from("ai_agents")
      .update({ enabled })
      .eq("id", agentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error toggling agent:", updateError);
      return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
    }

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error("Toggle agent API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
