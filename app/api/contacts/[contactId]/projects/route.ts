import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

/**
 * GET - Fetch projects linked to a contact
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact ownership
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const { data: linkedProjects, error } = await supabase
      .from("contact_projects")
      .select(`
        id,
        role,
        notes,
        added_at,
        project:projects (
          id,
          name,
          emoji,
          current_stage,
          description
        )
      `)
      .eq("contact_id", contactId);

    if (error) {
      console.error("Error fetching contact projects:", error);
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }

    return NextResponse.json({ projects: linkedProjects || [] });
  } catch (error) {
    console.error("Contact projects GET error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

/**
 * POST - Link a contact to a project
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact ownership
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { project_id, role, notes } = body;

    if (!project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from("contact_projects")
      .select("id")
      .eq("contact_id", contactId)
      .eq("project_id", project_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Contact is already linked to this project" }, { status: 400 });
    }

    const { data: link, error } = await supabase
      .from("contact_projects")
      .insert({
        contact_id: contactId,
        project_id,
        role: role || null,
        notes: notes || null,
        added_by: user.id,
      })
      .select(`
        id,
        role,
        notes,
        added_at,
        project:projects (
          id,
          name,
          emoji,
          current_stage
        )
      `)
      .single();

    if (error) {
      console.error("Error linking contact to project:", error);
      return NextResponse.json({ error: "Failed to link contact" }, { status: 500 });
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Contact projects POST error:", error);
    return NextResponse.json({ error: "Failed to link contact" }, { status: 500 });
  }
}

/**
 * DELETE - Unlink a contact from a project
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify contact ownership
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("contact_projects")
      .delete()
      .eq("contact_id", contactId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error unlinking contact:", error);
      return NextResponse.json({ error: "Failed to unlink contact" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact projects DELETE error:", error);
    return NextResponse.json({ error: "Failed to unlink contact" }, { status: 500 });
  }
}
