/**
 * Agent Workspace API Route (by ID)
 *
 * PATCH  /api/agent/workspaces/[id] - Update a workspace
 * DELETE /api/agent/workspaces/[id] - Delete a workspace
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  updateWorkspace,
  deleteWorkspace,
} from "@/lib/agent-workspace/workspace-router";
import { UpdateWorkspaceInput } from "@/lib/agent-workspace/workspace-types";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: UpdateWorkspaceInput = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.persona !== undefined) updates.persona = body.persona;
    if (body.channel_bindings !== undefined)
      updates.channel_bindings = body.channel_bindings;
    if (body.context_filter !== undefined)
      updates.context_filter = body.context_filter;
    if (body.skill_overrides !== undefined)
      updates.skill_overrides = body.skill_overrides;
    if (body.is_default !== undefined) updates.is_default = body.is_default;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const workspace = await updateWorkspace(id, userId, updates);

    return NextResponse.json({ workspace });
  } catch (error: any) {
    console.error("[Agent Workspaces API] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update workspace", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await deleteWorkspace(id, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Agent Workspaces API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace", details: error.message },
      { status: 500 }
    );
  }
}
