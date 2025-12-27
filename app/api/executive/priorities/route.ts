import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreatePriorityRequest, ExecutivePriority } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/executive/priorities - List priorities
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const status = searchParams.get("status") || "active";

    let query = supabase
      .from("executive_priorities")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("priority_date", date)
      .order("priority_rank", { ascending: true });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: priorities, error } = await query;

    if (error) {
      console.error("Error fetching priorities:", error);
      return NextResponse.json(
        { error: "Failed to fetch priorities" },
        { status: 500 }
      );
    }

    return NextResponse.json({ priorities: priorities || [] });
  } catch (error) {
    console.error("Priorities API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/executive/priorities - Create a new priority
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

    // Check executive access
    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const body: CreatePriorityRequest = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (!body.priority_rank || body.priority_rank < 1 || body.priority_rank > 10) {
      return NextResponse.json(
        { error: "priority_rank must be between 1 and 10" },
        { status: 400 }
      );
    }

    const priorityDate = body.priority_date || new Date().toISOString().split("T")[0];

    const { data: priority, error } = await supabase
      .from("executive_priorities")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        priority_rank: body.priority_rank,
        source_type: body.source_type || "manual",
        source_id: body.source_id || null,
        priority_date: priorityDate,
        status: "active",
        ai_generated: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating priority:", error);
      return NextResponse.json(
        { error: "Failed to create priority" },
        { status: 500 }
      );
    }

    return NextResponse.json({ priority }, { status: 201 });
  } catch (error) {
    console.error("Create priority error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/executive/priorities - Update priority ranks (bulk reorder)
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

    const body: { priorities: { id: string; priority_rank: number }[] } = await request.json();

    if (!Array.isArray(body.priorities)) {
      return NextResponse.json({ error: "priorities array is required" }, { status: 400 });
    }

    // Update each priority's rank
    const updates = body.priorities.map(async (p) => {
      return supabase
        .from("executive_priorities")
        .update({ priority_rank: p.priority_rank, updated_at: new Date().toISOString() })
        .eq("id", p.id)
        .eq("organization_id", profile.organization_id);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update priorities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
