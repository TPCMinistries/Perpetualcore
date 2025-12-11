import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

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
      .from("assistant_role_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const { data: assistant, error: createError } = await supabase
      .from("ai_assistants")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: template.name,
        description: template.description,
        role: template.role,
        avatar_emoji: template.avatar_emoji,
        personality_traits: template.default_personality,
        tone: template.default_tone,
        verbosity: template.default_verbosity,
        system_instructions: template.default_instructions,
        capabilities: template.default_capabilities,
        enabled: true,
      })
      .select()
      .single();

    if (createError) {
      if (isDev) console.error("Error creating assistant:", createError);
      return NextResponse.json({ error: "Failed to create assistant" }, { status: 500 });
    }

    // Increment template usage count
    await supabase
      .from("assistant_role_templates")
      .update({ usage_count: template.usage_count + 1 })
      .eq("id", templateId);

    return NextResponse.json({ assistant }, { status: 201 });
  } catch (error) {
    if (isDev) console.error("Install template API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
