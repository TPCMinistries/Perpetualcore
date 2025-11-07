import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/email/templates/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templateId = params.id;

    // Verify ownership
    const { data: template } = await supabase
      .from("email_templates")
      .select("user_id")
      .eq("id", templateId)
      .single();

    if (!template || template.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
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
      is_shared,
    } = body;

    // Extract variables from updated template
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    const combinedText = `${subject || ""} ${body_text || ""}`;
    while ((match = variablePattern.exec(combinedText)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (subject !== undefined) updates.subject = subject;
    if (body_text !== undefined) updates.body_text = body_text;
    if (body_html !== undefined) updates.body_html = body_html;
    if (is_shared !== undefined) updates.is_shared = is_shared;
    if (variables.length > 0) updates.variables = variables;

    const { data: updatedTemplate, error: updateError } = await supabase
      .from("email_templates")
      .update(updates)
      .eq("id", templateId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating template:", updateError);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Update template API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/email/templates/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templateId = params.id;

    // Verify ownership
    const { data: template } = await supabase
      .from("email_templates")
      .select("user_id")
      .eq("id", templateId)
      .single();

    if (!template || template.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", templateId);

    if (deleteError) {
      console.error("Error deleting template:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
