import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/workflows/[id]/executions
 * Get execution history for a workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

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

    // Verify workflow exists and belongs to organization
    const { data: workflow } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("workflow_executions")
      .select("*")
      .eq("workflow_id", params.id)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status && ["pending", "running", "completed", "failed", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: executions, error } = await query;

    if (error) {
      console.error("Error fetching executions:", error);
      return NextResponse.json(
        { error: "Failed to fetch executions", details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("workflow_executions")
      .select("*", { count: "exact", head: true })
      .eq("workflow_id", params.id);

    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      executions: executions || [],
      count: executions?.length || 0,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get executions error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
