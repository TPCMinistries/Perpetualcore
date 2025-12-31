import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/research/[id]
 * Fetch a single research request with full details
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

    const { data: request, error } = await supabase
      .from("research_requests")
      .select(`
        *,
        contacts(id, name, email, company, role, linkedin_url),
        opportunities(id, title, status, stage, estimated_value),
        projects(id, name, status, description),
        decisions(id, title, status, category)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !request) {
      return Response.json({ error: "Research request not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      request,
    });

  } catch (error: any) {
    console.error("GET /api/research/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/research/[id]
 * Update a research request
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

    // Build update object
    const updateData: Record<string, any> = {};
    const allowedFields = [
      "request_type",
      "subject",
      "context",
      "specific_questions",
      "priority",
      "status",
      "contact_id",
      "opportunity_id",
      "project_id",
      "decision_id",
      "assigned_to",
      "estimated_hours",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: request, error } = await supabase
      .from("research_requests")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update research request:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      request,
    });

  } catch (error: any) {
    console.error("PATCH /api/research/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/research/[id]
 * Delete a research request
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
      .from("research_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete research request:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Research request deleted",
    });

  } catch (error: any) {
    console.error("DELETE /api/research/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
