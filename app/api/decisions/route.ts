import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateDecisionRequest, Decision, DecisionStatus, Priority } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/decisions - List decisions with filters
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as DecisionStatus | null;
    const priority = searchParams.get("priority") as Priority | null;
    const source_type = searchParams.get("source_type");
    const search = searchParams.get("search");
    const team_id = searchParams.get("team_id");
    const include_org_wide = searchParams.get("include_org_wide") !== "false"; // Default true
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("decisions")
      .select(
        `
        *,
        user:profiles!decisions_user_id_fkey(full_name, avatar_url),
        decided_by_user:profiles!decisions_decided_by_fkey(full_name, avatar_url),
        delegated_to_user:profiles!decisions_delegated_to_fkey(full_name, avatar_url),
        team:teams!decisions_team_id_fkey(id, name)
      `,
        { count: "exact" }
      )
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (source_type) {
      query = query.eq("source_type", source_type);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Team filtering
    if (team_id) {
      if (include_org_wide) {
        // Show decisions for this team OR org-wide decisions (no team_id)
        query = query.or(`team_id.eq.${team_id},team_id.is.null`);
      } else {
        // Show only decisions for this specific team
        query = query.eq("team_id", team_id);
      }
    }

    query = query.range(offset, offset + limit - 1);

    const { data: decisions, error, count } = await query;

    if (error) {
      console.error("Error fetching decisions:", error);
      return NextResponse.json(
        { error: "Failed to fetch decisions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      decisions: decisions || [],
      count: count || 0,
      pagination: { limit, offset, total: count || 0 },
    });
  } catch (error) {
    console.error("Decisions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/decisions - Create a new decision
export async function POST(request: NextRequest) {
  try {
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

    const body: CreateDecisionRequest = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const { data: decision, error } = await supabase
      .from("decisions")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        team_id: body.team_id || null, // Optional team scoping
        title: body.title.trim(),
        description: body.description?.trim() || null,
        context: body.context?.trim() || null,
        source_type: body.source_type || "manual",
        source_id: body.source_id || null,
        options: body.options || [],
        priority: body.priority || "medium",
        due_date: body.due_date || null,
        tags: body.tags || [],
        status: "pending",
        logged_to_memory: false,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating decision:", error);
      return NextResponse.json(
        { error: "Failed to create decision" },
        { status: 500 }
      );
    }

    // Record creation event
    await supabase.from("decision_events").insert({
      decision_id: decision.id,
      event_type: "created",
      to_status: "pending",
      performed_by: user.id,
      performed_by_system: false,
      metadata: {},
    });

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    console.error("Create decision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
