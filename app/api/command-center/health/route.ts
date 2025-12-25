import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RecordHealthRequest } from "@/types/command-center";

// GET /api/command-center/health - Get system health summary
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  // Get latest health for each area
  const { data: healthData, error: healthError } = await supabase
    .from("system_health")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("recorded_at", { ascending: false });

  if (healthError) {
    console.error("Error fetching system health:", healthError);
    return NextResponse.json(
      { error: "Failed to fetch system health" },
      { status: 500 }
    );
  }

  // Get unique latest entries per area
  const latestByArea = new Map();
  for (const health of healthData || []) {
    if (!latestByArea.has(health.area)) {
      latestByArea.set(health.area, health);
    }
  }

  // If no health data exists, return default healthy status for all areas
  const areas = ["agents", "workflows", "integrations", "webhooks"];
  const healthSummary = areas.map((area) => {
    const existing = latestByArea.get(area);
    if (existing) {
      return {
        area: existing.area,
        status: existing.status,
        total_operations: existing.total_operations,
        failed_operations: existing.failed_operations,
        success_rate:
          existing.total_operations > 0
            ? Math.round(
                (existing.successful_operations / existing.total_operations) *
                  100
              )
            : 100,
        last_failure_at: existing.last_failure_at,
      };
    }
    return {
      area,
      status: "healthy",
      total_operations: 0,
      failed_operations: 0,
      success_rate: 100,
      last_failure_at: null,
    };
  });

  // Calculate overall status
  let overallStatus = "healthy";
  if (healthSummary.some((h) => h.status === "unhealthy")) {
    overallStatus = "unhealthy";
  } else if (healthSummary.some((h) => h.status === "degraded")) {
    overallStatus = "degraded";
  }

  // Get exception counts
  const { data: openExceptions } = await supabase
    .from("exceptions")
    .select("id, severity")
    .eq("organization_id", profile.organization_id)
    .in("status", ["open", "acknowledged", "in_progress"]);

  const exceptionCounts = {
    total: openExceptions?.length || 0,
    critical: openExceptions?.filter((e) => e.severity === "critical").length || 0,
    high: openExceptions?.filter((e) => e.severity === "high").length || 0,
  };

  return NextResponse.json({
    overall_status: overallStatus,
    health: healthSummary,
    exceptions: exceptionCounts,
  });
}

// POST /api/command-center/health - Record health snapshot
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const body: RecordHealthRequest = await request.json();

  const { data, error } = await supabase
    .from("system_health")
    .insert({
      organization_id: profile.organization_id,
      area: body.area,
      status: body.status,
      total_operations: body.total_operations || 0,
      successful_operations: body.successful_operations || 0,
      failed_operations: body.failed_operations || 0,
      pending_operations: body.pending_operations || 0,
      details: body.details || {},
      last_error: body.last_error,
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording health:", error);
    return NextResponse.json(
      { error: "Failed to record health" },
      { status: 500 }
    );
  }

  return NextResponse.json({ health: data });
}
