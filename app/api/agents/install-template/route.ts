import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const { data: template, error: templateError } = await supabase
      .from("agent_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const { data: agent, error: createError } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: template.name,
        description: template.description,
        agent_type: template.agent_type,
        config: template.default_config,
        personality: template.default_personality,
        instructions: template.default_instructions,
        enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    await supabase
      .from("agent_templates")
      .update({ usage_count: template.usage_count + 1 })
      .eq("id", templateId);

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Install template API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
