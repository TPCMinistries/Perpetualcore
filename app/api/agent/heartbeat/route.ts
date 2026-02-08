/**
 * Heartbeat Agent API
 *
 * POST /api/agent/heartbeat - Trigger a manual heartbeat check
 * GET  /api/agent/heartbeat - Get the most recent heartbeat results
 *
 * Requires authentication. Runs heartbeat for the authenticated user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runHeartbeat } from "@/lib/agents/heartbeat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: Trigger a manual heartbeat check for the authenticated user.
 *
 * Optional body:
 * {
 *   checks?: { email?: boolean, calendar?: boolean, tasks?: boolean, contacts?: boolean }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse optional config overrides from the request body
    let configOverride: any = {};
    try {
      const body = await request.json();
      if (body.checks) {
        configOverride.checks = body.checks;
      }
    } catch {
      // No body or invalid JSON -- use defaults
    }

    // Run the heartbeat
    const result = await runHeartbeat(user.id, configOverride);

    return NextResponse.json({
      success: true,
      heartbeat: {
        id: result.id,
        status: result.status,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        checksRun: result.checkResults.map((r) => r.type),
        totalItems: result.checkResults.reduce(
          (sum, r) => sum + r.items.length,
          0
        ),
        insights: result.insights,
        errorMessage: result.errorMessage,
      },
    });
  } catch (error: any) {
    console.error("[HeartbeatAPI] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve the most recent heartbeat run for the authenticated user.
 *
 * Query params:
 * - limit (optional, default 1): Number of recent runs to return
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "1", 10),
      20
    );

    const { data: runs, error: queryError } = await supabase
      .from("heartbeat_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (queryError) {
      console.error("[HeartbeatAPI] Query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch heartbeat runs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      runs: runs || [],
      count: runs?.length || 0,
    });
  } catch (error: any) {
    console.error("[HeartbeatAPI] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
