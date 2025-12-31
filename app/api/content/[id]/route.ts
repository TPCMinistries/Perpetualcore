import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/content/[id]
 * Fetch a single content item
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

    const { data: content, error } = await supabase
      .from("content_queue")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !content) {
      return Response.json({ error: "Content not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      content,
    });

  } catch (error: any) {
    console.error("GET /api/content/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/content/[id]
 * Update content
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

    const updateData: Record<string, any> = {};
    const allowedFields = [
      "title",
      "content_type",
      "platform",
      "draft_content",
      "final_content",
      "hook",
      "call_to_action",
      "hashtags",
      "mentions",
      "ai_prompt",
      "status",
      "scheduled_for",
      "published_at",
      "publish_url",
      "metrics",
      "media_urls",
      "thumbnail_url",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Auto-set published_at when status changes to published
    if (body.status === "published" && !body.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data: content, error } = await supabase
      .from("content_queue")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update content:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      content,
    });

  } catch (error: any) {
    console.error("PATCH /api/content/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/content/[id]
 * Delete content
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
      .from("content_queue")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete content:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Content deleted",
    });

  } catch (error: any) {
    console.error("DELETE /api/content/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
