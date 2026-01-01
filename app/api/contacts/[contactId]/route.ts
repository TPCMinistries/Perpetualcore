import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { UpdateContactInput } from "@/types/contacts";
import { logActivity } from "@/lib/activity-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

/**
 * GET - Fetch a single contact with related data
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

    // Fetch contact with interaction count
    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get interaction count (handle gracefully if table doesn't exist)
    let interactionCount = 0;
    const interactionCountResult = await supabase
      .from("contact_interactions")
      .select("*", { count: "exact", head: true })
      .eq("contact_id", contactId);
    if (!interactionCountResult.error) {
      interactionCount = interactionCountResult.count || 0;
    }

    // Get project count (handle gracefully if table doesn't exist)
    let projectCount = 0;
    const projectCountResult = await supabase
      .from("contact_projects")
      .select("*", { count: "exact", head: true })
      .eq("contact_id", contactId);
    if (!projectCountResult.error) {
      projectCount = projectCountResult.count || 0;
    }

    // Get recent interactions (handle gracefully if table doesn't exist)
    let recentInteractions: any[] = [];
    const interactionsResult = await supabase
      .from("contact_interactions")
      .select("*")
      .eq("contact_id", contactId)
      .order("interaction_date", { ascending: false })
      .limit(5);
    if (!interactionsResult.error) {
      recentInteractions = interactionsResult.data || [];
    }

    // Get linked projects (handle gracefully if tables don't exist)
    let linkedProjects: any[] = [];
    const linkedProjectsResult = await supabase
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
          current_stage
        )
      `)
      .eq("contact_id", contactId);
    if (!linkedProjectsResult.error) {
      linkedProjects = linkedProjectsResult.data || [];
    }

    // Get connections (handle gracefully if table doesn't exist)
    let connections: any[] = [];
    const connectionsAResult = await supabase
      .from("contact_connections")
      .select(`
        id,
        relationship_type,
        strength,
        notes,
        connected_contact:contacts!contact_connections_contact_b_id_fkey (
          id,
          full_name,
          company,
          avatar_url
        )
      `)
      .eq("contact_a_id", contactId);

    const connectionsBResult = await supabase
      .from("contact_connections")
      .select(`
        id,
        relationship_type,
        strength,
        notes,
        connected_contact:contacts!contact_connections_contact_a_id_fkey (
          id,
          full_name,
          company,
          avatar_url
        )
      `)
      .eq("contact_b_id", contactId);

    if (!connectionsAResult.error && !connectionsBResult.error) {
      connections = [...(connectionsAResult.data || []), ...(connectionsBResult.data || [])];
    } else if (!connectionsAResult.error) {
      connections = connectionsAResult.data || [];
    } else if (!connectionsBResult.error) {
      connections = connectionsBResult.data || [];
    }

    return NextResponse.json({
      contact: {
        ...contact,
        interaction_count: interactionCount || 0,
        project_count: projectCount || 0,
      },
      recentInteractions: recentInteractions || [],
      linkedProjects: linkedProjects || [],
      connections,
    });
  } catch (error) {
    console.error("Contact GET error:", error);
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
  }
}

/**
 * PUT - Update a contact
 */
export async function PUT(req: NextRequest, context: RouteContext) {
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

    const body: Partial<UpdateContactInput> = await req.json();

    // Remove id from body if present (we use the URL param)
    const { id, ...updates } = body as any;

    // Clean up string fields
    const cleanedUpdates: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === "string") {
        cleanedUpdates[key] = value.trim() || null;
      } else {
        cleanedUpdates[key] = value;
      }
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .update(cleanedUpdates)
      .eq("id", contactId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Contact update error:", error);
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Log activity for contact update
    const contactName = `${contact.first_name}${contact.last_name ? " " + contact.last_name : ""}`;
    const action = (cleanedUpdates as any).is_archived ? "archived" : "updated";
    await logActivity({
      supabase,
      userId: user.id,
      action,
      entityType: "contact",
      entityId: contact.id,
      entityName: contactName,
      metadata: {
        changes: Object.keys(cleanedUpdates),
      },
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Contact PUT error:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

/**
 * DELETE - Delete a contact
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

    // Verify ownership before delete and get contact name
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Store contact name before deletion
    const contactName = `${existing.first_name}${existing.last_name ? " " + existing.last_name : ""}`;

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Contact delete error:", error);
      return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
    }

    // Log activity for contact deletion
    await logActivity({
      supabase,
      userId: user.id,
      action: "deleted",
      entityType: "contact",
      entityId: contactId,
      entityName: contactName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
