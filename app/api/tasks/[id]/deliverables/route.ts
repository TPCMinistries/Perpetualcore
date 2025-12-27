import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]/deliverables
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { id: taskId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = supabase
      .from("task_deliverables")
      .select("*")
      .eq("task_id", taskId);

    if (status && status !== "all") {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "archived");
    }

    const { data: deliverables, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching deliverables:", error);
      return NextResponse.json(
        { error: "Failed to fetch deliverables" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deliverables: deliverables || [],
      count: deliverables?.length || 0,
    });
  } catch (error) {
    console.error("Deliverables GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliverables" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/deliverables
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { id: taskId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      content_type,
      title,
      content,
      platform,
      format,
      metadata,
      ai_generated,
      ai_model,
    } = body;

    if (!content_type || !content) {
      return NextResponse.json(
        { error: "content_type and content are required" },
        { status: 400 }
      );
    }

    const { data: deliverable, error } = await supabase
      .from("task_deliverables")
      .insert({
        task_id: taskId,
        user_id: user.id,
        content_type,
        title: title || null,
        content,
        platform: platform || null,
        format: format || "plain",
        metadata: metadata || {},
        status: "draft",
        ai_generated: ai_generated ?? true,
        ai_model: ai_model || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating deliverable:", error);
      return NextResponse.json(
        { error: "Failed to create deliverable" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (error) {
    console.error("Deliverables POST error:", error);
    return NextResponse.json(
      { error: "Failed to create deliverable" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]/deliverables
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { id: taskId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { deliverable_id, title, content, platform, format, metadata, status } =
      body;

    if (!deliverable_id) {
      return NextResponse.json(
        { error: "deliverable_id is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (platform !== undefined) updates.platform = platform;
    if (format !== undefined) updates.format = format;
    if (metadata !== undefined) updates.metadata = metadata;
    if (status !== undefined) {
      updates.status = status;
      if (status === "published") {
        updates.published_at = new Date().toISOString();
      }
    }

    if (content !== undefined) {
      const { data: existing } = await supabase
        .from("task_deliverables")
        .select("version")
        .eq("id", deliverable_id)
        .single();

      if (existing) {
        updates.version = (existing.version || 1) + 1;
      }
    }

    const { data: deliverable, error } = await supabase
      .from("task_deliverables")
      .update(updates)
      .eq("id", deliverable_id)
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating deliverable:", error);
      return NextResponse.json(
        { error: "Failed to update deliverable" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deliverable });
  } catch (error) {
    console.error("Deliverables PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update deliverable" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]/deliverables?id=xxx
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { id: taskId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deliverableId = req.nextUrl.searchParams.get("id");

    if (!deliverableId) {
      return NextResponse.json(
        { error: "Deliverable ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("task_deliverables")
      .delete()
      .eq("id", deliverableId)
      .eq("task_id", taskId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting deliverable:", error);
      return NextResponse.json(
        { error: "Failed to delete deliverable" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deliverables DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete deliverable" },
      { status: 500 }
    );
  }
}
