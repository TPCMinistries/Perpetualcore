import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TaskHealthFlagType, HealthFlagSeverity, HealthFlagStatus } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/executive/task-health - List task health flags
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check executive access
    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as HealthFlagStatus | null;
    const severity = searchParams.get("severity") as HealthFlagSeverity | null;
    const flag_type = searchParams.get("flag_type") as TaskHealthFlagType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("task_health_flags")
      .select(
        `
        *,
        task:work_items(title, current_stage_id),
        person:profiles(full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", profile.organization_id)
      .order("severity", { ascending: false })
      .order("detected_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    } else {
      // Default to active flags
      query = query.eq("status", "active");
    }
    if (severity) {
      query = query.eq("severity", severity);
    }
    if (flag_type) {
      query = query.eq("flag_type", flag_type);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: flags, error, count } = await query;

    if (error) {
      console.error("Error fetching task health flags:", error);
      return NextResponse.json(
        { error: "Failed to fetch flags" },
        { status: 500 }
      );
    }

    // Get summary counts
    const { data: summaryCounts } = await supabase
      .from("task_health_flags")
      .select("severity")
      .eq("organization_id", profile.organization_id)
      .eq("status", "active");

    const summary = {
      total: summaryCounts?.length || 0,
      critical: summaryCounts?.filter((f) => f.severity === "critical").length || 0,
      high: summaryCounts?.filter((f) => f.severity === "high").length || 0,
      medium: summaryCounts?.filter((f) => f.severity === "medium").length || 0,
      low: summaryCounts?.filter((f) => f.severity === "low").length || 0,
    };

    return NextResponse.json({
      flags: flags || [],
      summary,
      count: count || 0,
      pagination: { limit, offset, total: count || 0 },
    });
  } catch (error) {
    console.error("Task health API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/executive/task-health - Create health flag (usually by AI/system)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.flag_type) {
      return NextResponse.json({ error: "flag_type is required" }, { status: 400 });
    }
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.severity) {
      return NextResponse.json({ error: "severity is required" }, { status: 400 });
    }

    const { data: flag, error } = await supabase
      .from("task_health_flags")
      .insert({
        organization_id: profile.organization_id,
        flag_type: body.flag_type,
        task_id: body.task_id || null,
        person_id: body.person_id || null,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        severity: body.severity,
        ai_analysis: body.ai_analysis || null,
        ai_suggestion: body.ai_suggestion || null,
        ai_confidence: body.ai_confidence || null,
        status: "active",
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task health flag:", error);
      return NextResponse.json(
        { error: "Failed to create flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    console.error("Create flag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/executive/task-health - Acknowledge or resolve flag
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status: body.status,
    };

    if (body.status === "acknowledged") {
      updates.acknowledged_at = new Date().toISOString();
      updates.acknowledged_by = user.id;
    } else if (body.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.id;
      updates.resolution_notes = body.resolution_notes?.trim() || null;
    }

    const { data: flag, error } = await supabase
      .from("task_health_flags")
      .update(updates)
      .eq("id", body.id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating flag:", error);
      return NextResponse.json(
        { error: "Failed to update flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Update flag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
