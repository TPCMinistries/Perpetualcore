import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ entityId: string }>;
}

/**
 * GET - Get a single entity by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: entity, error } = await supabase
      .from("entities")
      .select(`
        *,
        entity_type:lookup_entity_types(id, name, icon),
        primary_focus:lookup_focus_areas(id, name, icon),
        brands(id, name, is_active),
        entity_projects(id, name, is_active)
      `)
      .eq("id", entityId)
      .eq("owner_id", user.id)
      .single();

    if (error || !entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entity });
  } catch (error) {
    console.error("Entity GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entity" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update an entity
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Build update object with only provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.legal_name !== undefined) updates.legal_name = body.legal_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.entity_type_id !== undefined) updates.entity_type_id = body.entity_type_id;
    if (body.primary_focus_id !== undefined) updates.primary_focus_id = body.primary_focus_id;
    if (body.website !== undefined) updates.website = body.website;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.color_primary !== undefined) updates.color_primary = body.color_primary;
    if (body.color_secondary !== undefined) updates.color_secondary = body.color_secondary;
    if (body.ai_context !== undefined) updates.ai_context = body.ai_context;
    if (body.settings !== undefined) updates.settings = body.settings;

    const { data: entity, error } = await supabase
      .from("entities")
      .update(updates)
      .eq("id", entityId)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating entity:", error);
      return NextResponse.json(
        { error: "Failed to update entity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entity, success: true });
  } catch (error) {
    console.error("Entity PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update entity" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete an entity (soft delete)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { entityId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("entities")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", entityId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error deleting entity:", error);
      return NextResponse.json(
        { error: "Failed to delete entity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Entity DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete entity" },
      { status: 500 }
    );
  }
}
