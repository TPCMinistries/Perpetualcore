// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/activity - Get activity feed for the organization
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const organizationId = (profile as any).organization_id as string;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("activity_feed")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by entity if provided
    if (entityType && entityId) {
      query = query.eq("entity_type", entityType).eq("entity_id", entityId);
    }

    // Apply visibility filter
    query = query.or(`is_public.eq.true,visible_to_user_ids.cs.{${user.id}}`);

    const { data: activities, error: activitiesError, count } = await query;

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    // Calculate if there are more results
    const hasMore = count ? offset + limit < count : false;

    return NextResponse.json({
      activities: activities || [],
      hasMore,
      total: count || 0,
    });
  } catch (error) {
    console.error("Activity feed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/activity - Create activity log entry (for manual logging)
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      action_type,
      entity_type,
      entity_id,
      entity_name,
      metadata,
      is_public = true,
      visible_to_user_ids,
    } = body;

    if (!action_type || !entity_type || !entity_id) {
      return NextResponse.json(
        { error: "action_type, entity_type, and entity_id are required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validActionTypes = [
      "created",
      "updated",
      "deleted",
      "commented",
      "mentioned",
      "completed",
      "assigned",
      "shared",
      "archived",
      "restored",
      "uploaded",
      "downloaded",
    ];

    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    // Validate entity type
    const validEntityTypes = [
      "document",
      "task",
      "workflow",
      "email",
      "meeting",
      "agent",
      "comment",
      "file",
      "folder",
    ];

    if (!validEntityTypes.includes(entity_type)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    // Create activity
    const { data: activity, error: createError } = await supabase
      .from("activity_feed")
      .insert({
        organization_id: profile.organization_id,
        actor_user_id: user.id,
        actor_name: profile.full_name,
        action_type,
        entity_type,
        entity_id,
        entity_name: entity_name || "",
        metadata: metadata || {},
        is_public,
        visible_to_user_ids: visible_to_user_ids || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating activity:", createError);
      return NextResponse.json(
        { error: "Failed to create activity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Create activity API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
