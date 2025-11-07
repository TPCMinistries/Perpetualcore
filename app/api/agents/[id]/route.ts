import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
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
