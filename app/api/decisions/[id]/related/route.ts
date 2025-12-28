import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/decisions/[id]/related - Get related items for a decision
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

    // Try to use the helper function
    const { data: items, error } = await supabase
      .rpc("get_related_items", {
        p_item_type: "decision",
        p_item_id: id,
      });

    if (error) {
      console.error("Error fetching related items:", error);
      // Fallback to direct query
      const { data: outgoing } = await supabase
        .from("item_relationships")
        .select("*")
        .eq("source_type", "decision")
        .eq("source_id", id);

      const { data: incoming } = await supabase
        .from("item_relationships")
        .select("*")
        .eq("target_type", "decision")
        .eq("target_id", id);

      // Format the results
      const allItems = [
        ...(outgoing || []).map((r) => ({
          relationship_id: r.id,
          relationship_type: r.relationship_type,
          direction: "outgoing",
          related_type: r.target_type,
          related_id: r.target_id,
          related_title: null, // Would need additional queries
          related_status: null,
          created_at: r.created_at,
        })),
        ...(incoming || []).map((r) => ({
          relationship_id: r.id,
          relationship_type: r.relationship_type,
          direction: "incoming",
          related_type: r.source_type,
          related_id: r.source_id,
          related_title: null,
          related_status: null,
          created_at: r.created_at,
        })),
      ];

      return NextResponse.json({ items: allItems });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Get related items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/decisions/[id]/related - Link a related item
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
    const { target_type, target_id, relationship_type, description } = body;

    if (!target_type || !target_id || !relationship_type) {
      return NextResponse.json(
        { error: "target_type, target_id, and relationship_type are required" },
        { status: 400 }
      );
    }

    const { data: relationship, error } = await supabase
      .from("item_relationships")
      .insert({
        source_type: "decision",
        source_id: id,
        target_type,
        target_id,
        relationship_type,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating relationship:", error);
      return NextResponse.json({ error: "Failed to create relationship" }, { status: 500 });
    }

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error("Create relationship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/decisions/[id]/related - Remove a relationship
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

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get("relationship_id");

    if (!relationshipId) {
      return NextResponse.json({ error: "relationship_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("item_relationships")
      .delete()
      .eq("id", relationshipId);

    if (error) {
      console.error("Error removing relationship:", error);
      return NextResponse.json({ error: "Failed to remove relationship" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove relationship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
