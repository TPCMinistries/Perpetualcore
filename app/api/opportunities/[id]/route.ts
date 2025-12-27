import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/opportunities/[id] - Get single opportunity with full details
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: opportunity, error } = await supabase
      .from("work_items")
      .select(
        `
        *,
        team:teams(name, color),
        assigned_user:profiles!work_items_assigned_to_fkey(id, full_name, avatar_url),
        creator:profiles!work_items_created_by_fkey(id, full_name, avatar_url)
      `
      )
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity")
      .single();

    if (error || !opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Get history
    const { data: history } = await supabase
      .from("work_item_history")
      .select("*")
      .eq("work_item_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ opportunity, history: history || [] });
  } catch (error) {
    console.error("Get opportunity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/opportunities/[id] - Update opportunity
export async function PATCH(
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();

    // Build update object with only allowed fields
    const allowedFields = [
      "title",
      "description",
      "opportunity_type",
      "opportunity_source",
      "estimated_value",
      "probability_percent",
      "due_date",
      "priority",
      "tags",
      "current_stage_id",
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: opportunity, error } = await supabase
      .from("work_items")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity")
      .select()
      .single();

    if (error) {
      console.error("Error updating opportunity:", error);
      return NextResponse.json(
        { error: "Failed to update opportunity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("Update opportunity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/opportunities/[id] - Archive opportunity
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("work_items")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity");

    if (error) {
      console.error("Error archiving opportunity:", error);
      return NextResponse.json(
        { error: "Failed to archive opportunity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive opportunity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
