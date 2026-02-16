/**
 * Agent Inbox API
 *
 * GET  /api/agent/inbox - List inbox items for authenticated user
 * POST /api/agent/inbox - Queue a new inbox item
 *
 * Requires authentication. Uses cookie-based client for user-facing requests.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { queueItem } from "@/lib/agents/inbox/processor";
import type { InboxSource, InboxPriority } from "@/lib/agents/inbox/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: List inbox items for the authenticated user.
 *
 * Query params:
 * - status: Filter by status (pending, processing, completed, failed, cancelled)
 * - limit: Max items to return (default 20, max 100)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("agent_inbox")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: items, error: queryError, count } = await query;

    if (queryError) {
      console.error("[InboxAPI] Query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch inbox items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: items || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error("[InboxAPI] GET error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Queue a new inbox item for the authenticated user.
 *
 * Body:
 * {
 *   source: InboxSource (required)
 *   payload: { type: string, ... } (required)
 *   priority?: InboxPriority (default: "normal")
 *   scheduled_for?: string (ISO timestamp, default: now)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.source) {
      return NextResponse.json(
        { error: "Missing required field: source" },
        { status: 400 }
      );
    }

    if (!body.payload || !body.payload.type) {
      return NextResponse.json(
        { error: "Missing required field: payload.type" },
        { status: 400 }
      );
    }

    const validSources: InboxSource[] = [
      "channel",
      "cron",
      "webhook",
      "schedule",
      "trigger",
      "user",
      "system",
    ];
    if (!validSources.includes(body.source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(", ")}` },
        { status: 400 }
      );
    }

    const validPriorities: InboxPriority[] = ["low", "normal", "high", "urgent"];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        {
          error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const itemId = await queueItem(user.id, body.source, body.payload, {
      priority: body.priority || "normal",
      scheduledFor: body.scheduled_for
        ? new Date(body.scheduled_for)
        : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        item_id: itemId,
        message: "Item queued successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[InboxAPI] POST error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
