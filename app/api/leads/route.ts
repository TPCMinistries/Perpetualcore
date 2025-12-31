import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leads
 * Fetch all leads for the authenticated user
 *
 * Query params:
 * - status: filter by status (new, contacted, qualified, proposal, negotiation, won, lost)
 * - source: filter by source
 * - assigned_to: filter by assigned user
 * - search: search by name, email, company
 * - sort: field to sort by (default: created_at)
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const assignedTo = searchParams.get("assigned_to");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("leads")
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, avatar_url),
        assigned_user:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    const { data: leads, error, count } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      return Response.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Calculate pipeline stats
    const { data: stats } = await supabase
      .from("leads")
      .select("status, estimated_value")
      .eq("user_id", user.id);

    const pipelineStats = (stats || []).reduce((acc: any, lead) => {
      acc[lead.status] = acc[lead.status] || { count: 0, value: 0 };
      acc[lead.status].count++;
      acc[lead.status].value += lead.estimated_value || 0;
      return acc;
    }, {});

    return Response.json({
      leads: leads || [],
      total: count || 0,
      limit,
      offset,
      pipeline: pipelineStats,
    });
  } catch (error) {
    console.error("Leads GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/leads
 * Create a new lead
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
      email,
      phone,
      company,
      title,
      status = "new",
      source,
      source_detail,
      estimated_value,
      probability,
      expected_close_date,
      notes,
      tags,
      contact_id,
      assigned_to,
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

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        name,
        email,
        phone,
        company,
        title,
        status,
        source,
        source_detail,
        estimated_value,
        probability,
        expected_close_date,
        notes,
        tags,
        contact_id,
        assigned_to: assigned_to || user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating lead:", error);
      return Response.json({ error: "Failed to create lead" }, { status: 500 });
    }

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: "status_change",
      title: "Lead created",
      to_value: status,
    });

    return Response.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Leads POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
