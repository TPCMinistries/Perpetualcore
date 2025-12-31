import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/meetings
 * Fetch all meetings for the authenticated user
 *
 * Query params:
 * - type: filter by meeting_type
 * - from: start date (ISO)
 * - to: end date (ISO)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("meetings")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("meeting_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("meeting_type", type);
    }
    if (from) {
      query = query.gte("meeting_date", from);
    }
    if (to) {
      query = query.lte("meeting_date", to);
    }

    const { data: meetings, count, error } = await query;

    if (error) {
      console.error("Failed to fetch meetings:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      meetings,
      total: count,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error("GET /api/meetings error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/meetings
 * Create a new meeting manually (without n8n processing)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.meeting_title) {
      return Response.json({ error: "meeting_title is required" }, { status: 400 });
    }

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        user_id: user.id,
        meeting_title: body.meeting_title,
        meeting_date: body.meeting_date || new Date().toISOString(),
        meeting_type: body.meeting_type || "other",
        attendees: body.attendees || [],
        transcript: body.transcript || null,
        executive_summary: body.executive_summary || null,
        key_topics: body.key_topics || [],
        decisions_made: body.decisions_made || [],
        next_steps: body.next_steps || [],
        project_tags: body.project_tags || [],
        sentiment: body.sentiment || null,
        source: body.source || "manual",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create meeting:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      meeting,
    });

  } catch (error: any) {
    console.error("POST /api/meetings error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
