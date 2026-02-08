/**
 * Agent Identity API Route
 * GET: Return current agent identity for authenticated user
 * PUT: Update/create agent identity
 * DELETE: Remove agent identity
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getAgentIdentity,
  createAgentIdentity,
  updateAgentIdentity,
  deleteAgentIdentity,
} from "@/lib/agent-workspace";
import { invalidateIdentityCache } from "@/lib/agent-workspace/identity-loader";
import { AgentIdentityUpdate } from "@/lib/agent-workspace/types";

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

    const identity = await getAgentIdentity(userId);

    return NextResponse.json({ identity });
  } catch (error: any) {
    console.error("[Agent Identity API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent identity", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AgentIdentityUpdate = await req.json();

    // Check if identity exists
    const existing = await getAgentIdentity(userId);

    let identity;
    if (existing) {
      identity = await updateAgentIdentity(userId, body);
    } else {
      identity = await createAgentIdentity(userId, body);
    }

    // Invalidate cache so next chat request picks up the changes
    invalidateIdentityCache(userId);

    return NextResponse.json({ identity });
  } catch (error: any) {
    console.error("[Agent Identity API] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save agent identity", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteAgentIdentity(userId);

    // Invalidate cache
    invalidateIdentityCache(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Agent Identity API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete agent identity", details: error.message },
      { status: 500 }
    );
  }
}
