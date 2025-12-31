import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/promises/[id]
 * Fetch a single promise with related meeting info
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch promise with meeting details
    const { data: promise, error: promiseError } = await supabase
      .from("promises")
      .select(`
        *,
        meetings(id, meeting_title, meeting_date, meeting_type),
        promiser:contacts!promiser_contact_id(id, name, email, company),
        promisee:contacts!promisee_contact_id(id, name, email, company)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (promiseError || !promise) {
      return Response.json({ error: "Promise not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      promise,
    });

  } catch (error: any) {
    console.error("GET /api/promises/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/promises/[id]
 * Update a promise
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    const allowedFields = [
      "promise_text",
      "promiser_contact_id",
      "promisee_contact_id",
      "due_date",
      "status",
      "context",
      "importance",
      "reminder_sent",
      "fulfilled_at",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Auto-set fulfilled_at when status changes to fulfilled
    if (body.status === "fulfilled" && !body.fulfilled_at) {
      updateData.fulfilled_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data: promise, error } = await supabase
      .from("promises")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update promise:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      promise,
    });

  } catch (error: any) {
    console.error("PATCH /api/promises/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/promises/[id]
 * Delete a promise
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("promises")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete promise:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Promise deleted",
    });

  } catch (error: any) {
    console.error("DELETE /api/promises/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
