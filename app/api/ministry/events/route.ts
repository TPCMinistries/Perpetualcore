import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ministry/events
 * Fetch ministry events
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("event_type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("ministry_events")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("start_time", { ascending: true })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("start_time", startDate);
    }

    if (endDate) {
      query = query.lte("start_time", endDate);
    }

    const { data: events, error, count } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return Response.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    return Response.json({
      events: events || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Ministry events GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ministry/events
 * Create a ministry event
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      all_day,
      recurring_pattern,
      recurring_end_date,
      location_type,
      location_name,
      location_address,
      virtual_link,
      expected_attendance,
      notes,
      tags,
    } = body;

    if (!title || !event_type || !start_time) {
      return Response.json({ error: "Title, event_type, and start_time are required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: event, error } = await supabase
      .from("ministry_events")
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        title,
        description,
        event_type,
        start_time,
        end_time,
        all_day,
        recurring_pattern,
        recurring_end_date,
        location_type,
        location_name,
        location_address,
        virtual_link,
        expected_attendance,
        notes,
        tags,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return Response.json({ error: "Failed to create event" }, { status: 500 });
    }

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Ministry events POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
