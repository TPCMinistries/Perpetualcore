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

    const { data: assistants, error } = await supabase
      .from("ai_assistants")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assistants:", error);
      return NextResponse.json({ error: "Failed to fetch assistants" }, { status: 500 });
    }

    return NextResponse.json({ assistants: assistants || [] });
  } catch (error) {
    console.error("Assistants API error:", error);
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
    const {
      name,
      description,
      role,
      avatar_emoji,
      personality_traits,
      tone,
      verbosity,
      system_instructions,
      context_knowledge,
      example_interactions,
      capabilities,
      is_public,
    } = body;

    // Validate required fields
    if (!name || !role || !system_instructions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: assistant, error: createError } = await supabase
      .from("ai_assistants")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name,
        description,
        role,
        avatar_emoji: avatar_emoji || "🤖",
        personality_traits: personality_traits || [],
        tone: tone || "professional",
        verbosity: verbosity || "balanced",
        system_instructions,
        context_knowledge,
        example_interactions: example_interactions || [],
        capabilities: capabilities || [],
        is_public: is_public || false,
        enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating assistant:", createError);
      return NextResponse.json({ error: "Failed to create assistant" }, { status: 500 });
    }

    return NextResponse.json({ assistant }, { status: 201 });
  } catch (error) {
    console.error("Create assistant API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
