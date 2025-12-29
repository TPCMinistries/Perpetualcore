import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/opportunities/[id]/stakeholders - Get stakeholders for an opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the helper function to get stakeholders with details
    const { data: stakeholders, error } = await supabase
      .rpc("get_item_stakeholders", {
        p_item_type: "opportunity",
        p_item_id: id,
      });

    if (error) {
      console.error("Error fetching stakeholders:", error);
      // Fallback to direct query if function doesn't exist
      const { data: fallbackData } = await supabase
        .from("item_stakeholders")
        .select(`
          *,
          user:profiles!item_stakeholders_user_id_fkey(full_name, email, avatar_url),
          contact:contacts!item_stakeholders_contact_id_fkey(full_name, email, avatar_url)
        `)
        .eq("item_type", "opportunity")
        .eq("item_id", id);

      const formattedStakeholders = (fallbackData || []).map((s: any) => ({
        id: s.id,
        role: s.role,
        notes: s.notes,
        stakeholder_type: s.user_id ? "user" : "contact",
        stakeholder_id: s.user_id || s.contact_id,
        stakeholder_name: s.user?.full_name || s.contact?.full_name,
        stakeholder_email: s.user?.email || s.contact?.email,
        stakeholder_avatar: s.user?.avatar_url || s.contact?.avatar_url,
        notify_on_updates: s.notify_on_updates,
        notify_on_decision: s.notify_on_decision,
        notify_on_comments: s.notify_on_comments,
        created_at: s.created_at,
      }));

      return NextResponse.json({ stakeholders: formattedStakeholders });
    }

    return NextResponse.json({ stakeholders: stakeholders || [] });
  } catch (error) {
    console.error("Get stakeholders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/stakeholders - Add a stakeholder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, contact_id, role, notes, notify_on_updates, notify_on_decision, notify_on_comments } = body;

    if (!user_id && !contact_id) {
      return NextResponse.json({ error: "Either user_id or contact_id is required" }, { status: 400 });
    }

    const { data: stakeholder, error } = await supabase
      .from("item_stakeholders")
      .insert({
        item_type: "opportunity",
        item_id: id,
        user_id: user_id || null,
        contact_id: contact_id || null,
        role: role || "stakeholder",
        notes: notes || null,
        notify_on_updates: notify_on_updates ?? true,
        notify_on_decision: notify_on_decision ?? true,
        notify_on_comments: notify_on_comments ?? true,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding stakeholder:", error);
      if (error.code === "23505") {
        return NextResponse.json({ error: "This stakeholder is already added" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to add stakeholder" }, { status: 500 });
    }

    return NextResponse.json({ stakeholder }, { status: 201 });
  } catch (error) {
    console.error("Add stakeholder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/opportunities/[id]/stakeholders - Remove a stakeholder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stakeholder_id } = body;

    if (!stakeholder_id) {
      return NextResponse.json({ error: "stakeholder_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("item_stakeholders")
      .delete()
      .eq("id", stakeholder_id)
      .eq("item_type", "opportunity")
      .eq("item_id", id);

    if (error) {
      console.error("Error removing stakeholder:", error);
      return NextResponse.json({ error: "Failed to remove stakeholder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove stakeholder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
