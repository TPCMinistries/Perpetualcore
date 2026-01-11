import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

// GET - Fetch ideas linked to a contact
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact belongs to user
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Try to fetch linked ideas via contact_ideas junction table
    const { data: linkedIdeas, error } = await supabase
      .from("contact_ideas")
      .select(`
        id,
        relevance_note,
        suggested_by,
        created_at,
        idea:ideas(
          id,
          title,
          description,
          status,
          created_at
        )
      `)
      .eq("contact_id", contactId);

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ ideas: [] });
      }
      throw error;
    }

    // Flatten the response
    const ideas = (linkedIdeas || []).map((link) => ({
      id: link.idea?.id,
      title: link.idea?.title,
      description: link.idea?.description,
      status: link.idea?.status,
      relevance_note: link.relevance_note,
      suggested_by: link.suggested_by,
      link_id: link.id,
    })).filter((i) => i.id);

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Error fetching contact ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

// POST - Link an idea to a contact
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact belongs to user
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
    const { idea_id, relevance_note } = body;

    if (!idea_id) {
      return NextResponse.json({ error: "idea_id is required" }, { status: 400 });
    }

    // Create link
    const { data: link, error } = await supabase
      .from("contact_ideas")
      .insert({
        contact_id: contactId,
        idea_id,
        relevance_note,
        suggested_by: "user",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Idea already linked" }, { status: 400 });
      }
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Ideas linking table not set up. Please run migrations." },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Error linking idea to contact:", error);
    return NextResponse.json(
      { error: "Failed to link idea" },
      { status: 500 }
    );
  }
}
