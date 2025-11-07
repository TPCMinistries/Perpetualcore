import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/email/templates
export async function GET(request: Request) {
  try {
    const supabase = createClient();
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
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get all templates user can access (own + shared org templates)
    const { data: templates, error: templatesError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/email/templates
export async function POST(request: Request) {
  try {
    const supabase = createClient();
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
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      subject,
      body_text,
      body_html,
      is_shared = false,
    } = body;

    if (!name || !subject || !body_text) {
      return NextResponse.json(
        { error: "name, subject, and body_text are required" },
        { status: 400 }
      );
    }

    // Extract variables from template (find all {{variableName}} patterns)
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    const combinedText = `${subject} ${body_text}`;
    while ((match = variablePattern.exec(combinedText)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const { data: template, error: createError } = await supabase
      .from("email_templates")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name,
        description,
        category: category || "custom",
        subject,
        body_text,
        body_html,
        variables,
        is_shared,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating template:", createError);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create template API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
