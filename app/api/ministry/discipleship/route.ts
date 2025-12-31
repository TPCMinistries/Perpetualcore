import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ministry/discipleship
 * Fetch discipleship relationships
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const relationshipType = searchParams.get("relationship_type");

    let query = supabase
      .from("discipleship_relationships")
      .select(`
        *,
        disciple_contact:contacts(id, first_name, last_name, email, phone, avatar_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (relationshipType) {
      query = query.eq("relationship_type", relationshipType);
    }

    const { data: relationships, error } = await query;

    if (error) {
      console.error("Error fetching discipleship relationships:", error);
      return Response.json({ error: "Failed to fetch relationships" }, { status: 500 });
    }

    return Response.json({ relationships: relationships || [] });
  } catch (error) {
    console.error("Discipleship GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ministry/discipleship
 * Create a discipleship relationship
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      disciple_contact_id,
      disciple_name,
      disciple_email,
      disciple_phone,
      relationship_type,
      meeting_frequency,
      goals,
      current_focus,
      notes,
    } = body;

    if (!disciple_name && !disciple_contact_id) {
      return Response.json({ error: "Disciple name or contact is required" }, { status: 400 });
    }

    // If contact_id provided, get the contact name
    let finalName = disciple_name;
    if (disciple_contact_id && !disciple_name) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("first_name, last_name")
        .eq("id", disciple_contact_id)
        .single();

      if (contact) {
        finalName = `${contact.first_name} ${contact.last_name}`.trim();
      }
    }

    const { data: relationship, error } = await supabase
      .from("discipleship_relationships")
      .insert({
        user_id: user.id,
        disciple_contact_id,
        disciple_name: finalName,
        disciple_email,
        disciple_phone,
        relationship_type,
        meeting_frequency,
        goals,
        current_focus,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating relationship:", error);
      return Response.json({ error: "Failed to create relationship" }, { status: 500 });
    }

    return Response.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error("Discipleship POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
