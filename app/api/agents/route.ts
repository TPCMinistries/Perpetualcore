import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: agents, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }

    return NextResponse.json({ agents: agents || [] });
  } catch (error) {
    console.error("Agents API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, agent_type, config, personality, instructions } = body;

    if (!name || !agent_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: agent, error: createError } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name,
        description,
        agent_type,
        config: config || {},
        personality: personality || "professional",
        instructions,
        enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Agents API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
