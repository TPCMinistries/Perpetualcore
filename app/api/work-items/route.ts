import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  CreateWorkItemRequest,
  WorkItemFilterParams,
  TEAM_ITEM_TYPE_MAP,
} from "@/types/work";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/work-items - List work items with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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
    const filters: WorkItemFilterParams = {
      team_id: searchParams.get("team_id") || "",
      stage_id: searchParams.get("stage_id") || undefined,
      item_type: searchParams.get("item_type") || undefined,
      priority: (searchParams.get("priority") as WorkItemFilterParams["priority"]) || undefined,
      assigned_to: searchParams.get("assigned_to") || undefined,
      is_exception: searchParams.get("is_exception") === "true" ? true : undefined,
      is_archived: searchParams.get("is_archived") === "true",
      search: searchParams.get("search") || undefined,
      sort_by: (searchParams.get("sort_by") as WorkItemFilterParams["sort_by"]) || "created_at",
      sort_order: (searchParams.get("sort_order") as WorkItemFilterParams["sort_order"]) || "desc",
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    if (!filters.team_id) {
      return NextResponse.json(
        { error: "team_id is required" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from("work_items")
      .select(
        `
        *,
        assigned_user:profiles!work_items_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!work_items_created_by_fkey(id, full_name, email, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", profile.organization_id)
      .eq("team_id", filters.team_id)
      .eq("is_archived", filters.is_archived || false);

    // Apply filters
    if (filters.stage_id) {
      query = query.eq("current_stage_id", filters.stage_id);
    }
    if (filters.item_type) {
      query = query.eq("item_type", filters.item_type);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }
    if (filters.is_exception !== undefined) {
      query = query.eq("is_exception", filters.is_exception);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Sorting
    const sortColumn = filters.sort_by || "created_at";
    const sortAsc = filters.sort_order === "asc";
    query = query.order(sortColumn, { ascending: sortAsc });

    // Pagination
    query = query.range(
      filters.offset || 0,
      (filters.offset || 0) + (filters.limit || 50) - 1
    );

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Error fetching work items:", error);
      return NextResponse.json(
        { error: "Failed to fetch work items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: items || [],
      count: count || 0,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error("Work items API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/work-items - Create a new work item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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

    const body: CreateWorkItemRequest = await request.json();

    // Validation
    if (!body.team_id) {
      return NextResponse.json(
        { error: "team_id is required" },
        { status: 400 }
      );
    }
    if (!body.title || body.title.trim() === "") {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Verify team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", body.team_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this team" },
        { status: 403 }
      );
    }

    // Get team to determine item type and first stage
    const { data: team } = await supabase
      .from("teams")
      .select("template_id, workflow_stages")
      .eq("id", body.team_id)
      .single();

    const itemType =
      body.item_type || TEAM_ITEM_TYPE_MAP[team?.template_id || ""] || "item";
    const workflowStages = (team?.workflow_stages as Array<{ id: string; order: number }>) || [];
    const sortedStages = [...workflowStages].sort((a, b) => a.order - b.order);
    const firstStage = sortedStages.length > 0 ? sortedStages[0] : null;

    // Create work item
    const { data: workItem, error: insertError } = await supabase
      .from("work_items")
      .insert({
        organization_id: profile.organization_id,
        team_id: body.team_id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        external_id: body.external_id || null,
        current_stage_id: body.current_stage_id || firstStage?.id || "initial",
        item_type: itemType,
        priority: body.priority || "medium",
        assigned_to: body.assigned_to || null,
        assigned_at: body.assigned_to ? new Date().toISOString() : null,
        due_date: body.due_date || null,
        source: body.source || "manual",
        source_reference: body.source_reference || null,
        custom_fields: body.custom_fields || {},
        tags: body.tags || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating work item:", insertError);
      return NextResponse.json(
        { error: "Failed to create work item" },
        { status: 500 }
      );
    }

    // Record creation in history
    await supabase.from("work_item_history").insert({
      work_item_id: workItem.id,
      event_type: "created",
      to_stage_id: workItem.current_stage_id,
      actor_id: user.id,
      actor_type: "user",
    });

    return NextResponse.json({ item: workItem }, { status: 201 });
  } catch (error) {
    console.error("Create work item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
