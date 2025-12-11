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

    // Try to get template from agent_templates table
    let { data: template, error: templateError } = await supabase
      .from("agent_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    // If not found in agent_templates, try marketplace_items
    if (templateError || !template) {
      const { data: marketplaceItem, error: marketplaceError } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("id", templateId)
        .eq("type", "agent")
        .single();

      if (marketplaceError || !marketplaceItem) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      // Transform marketplace item to template format
      template = {
        ...marketplaceItem,
        agent_type: marketplaceItem.category?.toLowerCase() || "general",
        default_config: marketplaceItem.config || {},
        default_personality: "professional",
        default_instructions: marketplaceItem.description || "",
        usage_count: marketplaceItem.total_sales || 0,
      };
    }

    const templateData = template;

    const { data: agent, error: createError } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: templateData.name,
        description: templateData.description,
        agent_type: templateData.agent_type,
        config: templateData.default_config,
        personality: templateData.default_personality,
        instructions: templateData.default_instructions,
        enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    // Only update usage count if template is from database
    if (template) {
      await supabase
        .from("agent_templates")
        .update({ usage_count: templateData.usage_count + 1 })
        .eq("id", templateId);
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Install template API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
