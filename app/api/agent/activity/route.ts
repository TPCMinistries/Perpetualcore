/**
 * Agent Activity Feed API
 *
 * GET /api/agent/activity - Paginated activity feed for the authenticated user
 *
 * Query params:
 * - page (optional, default 1): Page number
 * - limit (optional, default 20, max 100): Items per page
 * - eventType (optional): Filter by event type
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActivity } from "@/lib/activity-feed/tracker";
import { ActivityEventType } from "@/lib/activity-feed/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Retrieve paginated activity feed events.
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

    // Parse query parameters
    const page = Math.max(
      parseInt(request.nextUrl.searchParams.get("page") || "1", 10),
      1
    );
    const limit = Math.min(
      Math.max(
        parseInt(request.nextUrl.searchParams.get("limit") || "20", 10),
        1
      ),
      100
    );
    const eventType = request.nextUrl.searchParams.get(
      "eventType"
    ) as ActivityEventType | null;

    const result = await getActivity(user.id, {
      page,
      limit,
      eventType: eventType || undefined,
    });

    return NextResponse.json({
      events: result.events,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasMore: result.page * result.limit < result.total,
      },
    });
  } catch (error: any) {
    console.error("[ActivityAPI] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
