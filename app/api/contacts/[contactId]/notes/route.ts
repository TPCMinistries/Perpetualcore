import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

// GET - Fetch all notes for a contact
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

    // Fetch notes
    const { data: notes, error } = await supabase
      .from("contact_notes")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ notes: [] });
      }
      throw error;
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error("Error fetching contact notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST - Create a new note
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

    // Get profile for organization_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
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
    const { content, ai_generated } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Create note
    const { data: note, error } = await supabase
      .from("contact_notes")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        contact_id: contactId,
        content: content.trim(),
        ai_generated: ai_generated || false,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, create it
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Notes table not set up. Please run migrations." },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing note
export async function PATCH(req: NextRequest, context: RouteContext) {
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
    const { noteId, content, ai_generated } = body;

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Update note (verify it belongs to this contact and user)
    const { data: note, error } = await supabase
      .from("contact_notes")
      .update({
        content: content.trim(),
        ai_generated: ai_generated || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("contact_id", contactId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating contact note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

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

    // Delete note (verify it belongs to this contact and user)
    const { error } = await supabase
      .from("contact_notes")
      .delete()
      .eq("id", noteId)
      .eq("contact_id", contactId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
