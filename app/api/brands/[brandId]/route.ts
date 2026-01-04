import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ brandId: string }>;
}

/**
 * GET - Get a single brand by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { brandId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .select(`
        *,
        entity:entities(id, name, description)
      `)
      .eq("id", brandId)
      .eq("owner_id", user.id)
      .single();

    if (error || !brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Brand GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a brand
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { brandId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Verify user owns the brand
    const { data: existing } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (body.name !== undefined) updates.name = body.name;
    if (body.tagline !== undefined) updates.tagline = body.tagline;
    if (body.description !== undefined) updates.description = body.description;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.color_primary !== undefined) updates.color_primary = body.color_primary;
    if (body.color_secondary !== undefined) updates.color_secondary = body.color_secondary;
    if (body.tone_config !== undefined) updates.tone_config = body.tone_config;
    if (body.content_calendar_enabled !== undefined) updates.content_calendar_enabled = body.content_calendar_enabled;
    if (body.auto_schedule_enabled !== undefined) updates.auto_schedule_enabled = body.auto_schedule_enabled;
    if (body.approval_required !== undefined) updates.approval_required = body.approval_required;
    if (body.posting_frequency !== undefined) updates.posting_frequency = body.posting_frequency;
    if (body.optimal_times !== undefined) updates.optimal_times = body.optimal_times;
    if (body.primary_ai_model !== undefined) updates.primary_ai_model = body.primary_ai_model;
    if (body.refinement_ai_model !== undefined) updates.refinement_ai_model = body.refinement_ai_model;
    if (body.social_accounts !== undefined) updates.social_accounts = body.social_accounts;

    const { data: brand, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", brandId)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      return NextResponse.json(
        { error: "Failed to update brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Brand PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete (deactivate) a brand
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { brandId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the brand
    const { data: existing } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("brands")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", brandId);

    if (error) {
      console.error("Error deleting brand:", error);
      return NextResponse.json(
        { error: "Failed to delete brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}
