import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { gateFeature } from "@/lib/features/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/outreach
 * Fetch all outreach sequences for the authenticated user
 *
 * Query params:
 * - status: filter by status (draft, active, paused, completed, archived)
 * - type: filter by sequence_type
 * - search: search by name
 * - sort: field to sort by (default: updated_at)
 * - order: asc or desc (default: desc)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Feature gate: outreach sequences
    const { data: outreachProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (outreachProfile?.organization_id) {
      const gate = await gateFeature("outreach_sequences", outreachProfile.organization_id);
      if (!gate.allowed) {
        return Response.json(
          { error: gate.reason, code: "FEATURE_GATED", upgrade: gate.upgrade },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "updated_at";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("outreach_sequences")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("sequence_type", type);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: sequences, error, count } = await query;

    if (error) {
      console.error("Error fetching sequences:", error);
      return Response.json({ error: "Failed to fetch sequences" }, { status: 500 });
    }

    return Response.json({
      sequences: sequences || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Outreach GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/outreach
 * Create a new outreach sequence
 *
 * Body:
 * - name: string (required)
 * - description: string
 * - sequence_type: 'outreach' | 'nurture' | 'onboarding' | 'follow_up' | 'custom'
 * - steps: array of step objects
 * - target_audience: string
 * - tags: string[]
 * - trigger_type: 'manual' | 'contact_added' | 'tag_added' | 'deal_stage' | 'webhook'
 * - trigger_config: object
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
      name,
      description,
      sequence_type = "outreach",
      steps = [],
      target_audience,
      tags,
      trigger_type = "manual",
      trigger_config,
    } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: sequence, error } = await supabase
      .from("outreach_sequences")
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        name,
        description,
        sequence_type,
        steps,
        target_audience,
        tags,
        trigger_type,
        trigger_config,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating sequence:", error);
      return Response.json({ error: "Failed to create sequence" }, { status: 500 });
    }

    return Response.json({ sequence }, { status: 201 });
  } catch (error) {
    console.error("Outreach POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
