/**
 * Proactive Behaviors API
 *
 * GET    /api/agent/behaviors - List user's proactive behaviors + available templates
 * POST   /api/agent/behaviors - Create new behavior from template
 * PATCH  /api/agent/behaviors - Update behavior (toggle active, change schedule)
 * DELETE /api/agent/behaviors - Remove behavior
 *
 * Requires authentication. Uses cookie-based client for user-facing requests.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getUserBehaviors,
  updateBehavior,
  deleteBehavior,
} from "@/lib/agents/inbox/scheduler";
import {
  getAllTemplatesWithAccess,
  instantiateBehavior,
} from "@/lib/agents/proactive/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: List user's active proactive behaviors and available templates.
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

    // Get user's current plan
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const userPlan = subscription?.plan || "free";

    // Get user's active behaviors
    const behaviors = await getUserBehaviors(user.id);

    // Get all templates with access info
    const templates = getAllTemplatesWithAccess(userPlan);

    return NextResponse.json({
      behaviors,
      templates,
      plan: userPlan,
    });
  } catch (error: unknown) {
    console.error("[BehaviorsAPI] GET error:", error);
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
 * POST: Create a new proactive behavior from a template.
 *
 * Body:
 * {
 *   template_id: string (required)
 *   config?: Record<string, unknown> (optional overrides)
 *   schedule?: string (optional custom cron schedule)
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

    if (!body.template_id) {
      return NextResponse.json(
        { error: "Missing required field: template_id" },
        { status: 400 }
      );
    }

    // Validate schedule format if provided
    if (body.schedule) {
      const parts = body.schedule.trim().split(/\s+/);
      if (parts.length !== 5) {
        return NextResponse.json(
          {
            error:
              "Invalid schedule format. Must be a 5-field cron expression (e.g., '0 8 * * 1-5')",
          },
          { status: 400 }
        );
      }
    }

    const behavior = await instantiateBehavior(
      user.id,
      body.template_id,
      body.config,
      body.schedule
    );

    return NextResponse.json(
      {
        success: true,
        behavior,
        message: "Behavior created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[BehaviorsAPI] POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Unknown behavior template")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error", message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update an existing proactive behavior.
 *
 * Body:
 * {
 *   id: string (required)
 *   name?: string
 *   description?: string
 *   schedule?: string
 *   config?: Record<string, unknown>
 *   is_active?: boolean
 * }
 */
export async function PATCH(request: NextRequest) {
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

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Verify the behavior belongs to this user
    const { data: existing } = await supabase
      .from("proactive_behaviors")
      .select("user_id")
      .eq("id", body.id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Behavior not found" },
        { status: 404 }
      );
    }

    // Validate schedule format if provided
    if (body.schedule) {
      const parts = body.schedule.trim().split(/\s+/);
      if (parts.length !== 5) {
        return NextResponse.json(
          {
            error:
              "Invalid schedule format. Must be a 5-field cron expression (e.g., '0 8 * * 1-5')",
          },
          { status: 400 }
        );
      }
    }

    // Build updates — only include provided fields
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.schedule !== undefined) updates.schedule = body.schedule;
    if (body.config !== undefined) updates.config = body.config;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    await updateBehavior(body.id, updates);

    return NextResponse.json({
      success: true,
      message: "Behavior updated successfully",
    });
  } catch (error: unknown) {
    console.error("[BehaviorsAPI] PATCH error:", error);
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
 * DELETE: Remove a proactive behavior.
 *
 * Query params:
 * - id: The behavior ID to delete (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required query param: id" },
        { status: 400 }
      );
    }

    // Verify the behavior belongs to this user
    const { data: existing } = await supabase
      .from("proactive_behaviors")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Behavior not found" },
        { status: 404 }
      );
    }

    await deleteBehavior(id);

    return NextResponse.json({
      success: true,
      message: "Behavior deleted successfully",
    });
  } catch (error: unknown) {
    console.error("[BehaviorsAPI] DELETE error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
