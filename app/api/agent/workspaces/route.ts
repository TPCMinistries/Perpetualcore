/**
 * Agent Workspaces API Route
 *
 * GET  /api/agent/workspaces - List all workspaces for authenticated user
 * POST /api/agent/workspaces - Create a new workspace
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspacesForUser,
  createWorkspace,
} from "@/lib/agent-workspace/workspace-router";
import { CreateWorkspaceInput } from "@/lib/agent-workspace/workspace-types";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await getWorkspacesForUser(userId);

    return NextResponse.json({ workspaces });
  } catch (error: any) {
    console.error("[Agent Workspaces API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const input: CreateWorkspaceInput = {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      persona: body.persona || {},
      channel_bindings: body.channel_bindings || [],
      context_filter: body.context_filter || {},
      skill_overrides: body.skill_overrides || [],
      is_default: body.is_default ?? false,
      is_active: body.is_active ?? true,
    };

    const workspace = await createWorkspace(userId, input);

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error: any) {
    console.error("[Agent Workspaces API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create workspace", details: error.message },
      { status: 500 }
    );
  }
}
