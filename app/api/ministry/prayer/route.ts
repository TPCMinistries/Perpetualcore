import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ministry/prayer
 * Fetch prayer requests
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const requestType = searchParams.get("request_type");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("prayer_requests")
      .select(`
        *,
        requester:contacts(id, first_name, last_name, email)
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (requestType) {
      query = query.eq("request_type", requestType);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: requests, error, count } = await query;

    if (error) {
      console.error("Error fetching prayer requests:", error);
      return Response.json({ error: "Failed to fetch prayer requests" }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabase
      .from("prayer_requests")
      .select("status")
      .eq("user_id", user.id);

    const statusCounts = (stats || []).reduce((acc: Record<string, number>, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});

    return Response.json({
      requests: requests || [],
      total: count || 0,
      limit,
      offset,
      stats: statusCounts,
    });
  } catch (error) {
    console.error("Prayer requests GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ministry/prayer
 * Create a prayer request
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
      request_type,
      requester_name,
      requester_contact_id,
      is_confidential,
      priority,
    } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: request, error } = await supabase
      .from("prayer_requests")
      .insert({
        user_id: user.id,
        title,
        description,
        request_type,
        requester_name,
        requester_contact_id,
        is_confidential,
        priority,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating prayer request:", error);
      return Response.json({ error: "Failed to create prayer request" }, { status: 500 });
    }

    return Response.json({ request }, { status: 201 });
  } catch (error) {
    console.error("Prayer requests POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/ministry/prayer
 * Update a prayer request (mark as answered, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const allowedFields = [
      "title",
      "description",
      "request_type",
      "requester_name",
      "is_confidential",
      "status",
      "priority",
      "answer_notes",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates[field] = updateFields[field];
      }
    }

    // Handle answered status
    if (updateFields.status === "answered") {
      updates.answered_at = new Date().toISOString();
    }

    const { data: request, error } = await supabase
      .from("prayer_requests")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating prayer request:", error);
      return Response.json({ error: "Failed to update prayer request" }, { status: 500 });
    }

    return Response.json({ request });
  } catch (error) {
    console.error("Prayer requests PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/ministry/prayer
 * Delete a prayer request
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("prayer_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting prayer request:", error);
      return Response.json({ error: "Failed to delete prayer request" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Prayer requests DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
