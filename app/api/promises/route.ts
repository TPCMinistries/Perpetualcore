import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/promises
 * Fetch all promises for the authenticated user
 *
 * Query params:
 * - status: filter by status (pending, fulfilled, broken)
 * - meeting_id: filter by source meeting
 * - contact_id: filter by promiser/promisee
 * - direction: "made" (user made) or "received" (made to user)
 * - due_before: ISO date
 * - due_after: ISO date
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
    const status = searchParams.get("status");
    const meetingId = searchParams.get("meeting_id");
    const contactId = searchParams.get("contact_id");
    const direction = searchParams.get("direction");
    const dueBefore = searchParams.get("due_before");
    const dueAfter = searchParams.get("due_after");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("promises")
      .select("*, meetings(meeting_title, meeting_date)", { count: "exact" })
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (meetingId) {
      query = query.eq("meeting_id", meetingId);
    }
    if (contactId) {
      query = query.or(`promiser_contact_id.eq.${contactId},promisee_contact_id.eq.${contactId}`);
    }
    if (direction === "made") {
      // Promises made by the user (user is promiser)
      query = query.is("promiser_contact_id", null);
    } else if (direction === "received") {
      // Promises made to the user (user is promisee)
      query = query.is("promisee_contact_id", null);
    }
    if (dueBefore) {
      query = query.lte("due_date", dueBefore);
    }
    if (dueAfter) {
      query = query.gte("due_date", dueAfter);
    }

    const { data: promises, count, error } = await query;

    if (error) {
      console.error("Failed to fetch promises:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      promises,
      total: count,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error("GET /api/promises error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/promises
 * Create a new promise manually
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

    if (!body.promise_text) {
      return Response.json({ error: "promise_text is required" }, { status: 400 });
    }

    const { data: promise, error } = await supabase
      .from("promises")
      .insert({
        user_id: user.id,
        meeting_id: body.meeting_id || null,
        promise_text: body.promise_text,
        promiser_contact_id: body.promiser_contact_id || null,
        promisee_contact_id: body.promisee_contact_id || null,
        due_date: body.due_date || null,
        status: body.status || "pending",
        context: body.context || null,
        importance: body.importance || "medium",
        reminder_sent: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create promise:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      promise,
    });

  } catch (error: any) {
    console.error("POST /api/promises error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
