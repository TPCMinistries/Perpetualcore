import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateOpportunityRequest, Priority } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/opportunities - List opportunities
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
    const team_id = searchParams.get("team_id");
    const opportunity_type = searchParams.get("opportunity_type");
    const final_decision = searchParams.get("final_decision");
    const priority = searchParams.get("priority") as Priority | null;
    const min_score = searchParams.get("min_score");
    const max_score = searchParams.get("max_score");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("work_items")
      .select(
        `
        *,
        team:teams(name, color),
        decision_by_user:profiles!work_items_created_by_fkey(full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (team_id) {
      query = query.eq("team_id", team_id);
    }
    if (opportunity_type) {
      query = query.eq("opportunity_type", opportunity_type);
    }
    if (final_decision) {
      query = query.eq("final_decision", final_decision);
    } else {
      // By default, show opportunities without a final decision
      query = query.is("final_decision", null);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (min_score) {
      query = query.gte("weighted_composite_score", parseFloat(min_score));
    }
    if (max_score) {
      query = query.lte("weighted_composite_score", parseFloat(max_score));
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: opportunities, error, count } = await query;

    if (error) {
      console.error("Error fetching opportunities:", error);
      return NextResponse.json(
        { error: "Failed to fetch opportunities" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      opportunities: opportunities || [],
      count: count || 0,
      pagination: { limit, offset, total: count || 0 },
    });
  } catch (error) {
    console.error("Opportunities API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/opportunities - Create a new opportunity
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

    const body: CreateOpportunityRequest = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Get team - either specified or first available team
    let team;
    if (body.team_id) {
      // Verify team access
      const { data: specifiedTeam } = await supabase
        .from("teams")
        .select("id, workflow_stages")
        .eq("id", body.team_id)
        .eq("organization_id", profile.organization_id)
        .single();

      if (!specifiedTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      team = specifiedTeam;
    } else {
      // Auto-select first team in organization
      const { data: firstTeam } = await supabase
        .from("teams")
        .select("id, workflow_stages")
        .eq("organization_id", profile.organization_id)
        .limit(1)
        .single();

      if (!firstTeam) {
        // Create a default team if none exists
        const { data: newTeam } = await supabase
          .from("teams")
          .insert({
            organization_id: profile.organization_id,
            name: "Opportunities",
            description: "Default team for opportunity tracking",
            color: "#8B5CF6",
            workflow_stages: [
              { id: "new", name: "New", order: 0 },
              { id: "evaluating", name: "Evaluating", order: 1 },
              { id: "pursuing", name: "Pursuing", order: 2 },
              { id: "closed", name: "Closed", order: 3 },
            ],
          })
          .select("id, workflow_stages")
          .single();

        if (!newTeam) {
          return NextResponse.json({ error: "Failed to create default team" }, { status: 500 });
        }
        team = newTeam;
      } else {
        team = firstTeam;
      }
    }

    // Get first stage
    const workflowStages = (team.workflow_stages as Array<{ id: string; order: number }>) || [];
    const sortedStages = [...workflowStages].sort((a, b) => a.order - b.order);
    const firstStage = sortedStages.length > 0 ? sortedStages[0] : null;

    const { data: opportunity, error } = await supabase
      .from("work_items")
      .insert({
        organization_id: profile.organization_id,
        team_id: team.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        item_type: "opportunity",
        opportunity_type: body.opportunity_type || null,
        opportunity_source: body.opportunity_source || null,
        estimated_value: body.estimated_value || null,
        due_date: body.due_date || null,
        priority: body.priority || "medium",
        current_stage_id: firstStage?.id || "initial",
        source: "manual",
        created_by: user.id,
        tags: [],
        custom_fields: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating opportunity:", error);
      return NextResponse.json(
        { error: "Failed to create opportunity" },
        { status: 500 }
      );
    }

    // Record creation in history
    await supabase.from("work_item_history").insert({
      work_item_id: opportunity.id,
      event_type: "created",
      to_stage_id: opportunity.current_stage_id,
      actor_id: user.id,
      actor_type: "user",
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error("Create opportunity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
