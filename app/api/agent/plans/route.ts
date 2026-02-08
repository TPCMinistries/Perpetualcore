/**
 * Agent Plans API
 *
 * POST - Create a new plan (called from delegate_to_agent tool or directly)
 * GET  - List user's plans with optional status filter
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAndStartPlan } from "@/lib/agents/executor";
import { listPlans } from "@/lib/agents/executor/state-manager";
import { PlanStatus } from "@/lib/agents/executor/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goal, steps_hint, urgency } = body;

    if (!goal || typeof goal !== "string") {
      return NextResponse.json(
        { error: "goal is required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { createAdminClient } = await import("@/lib/supabase/server");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const organizationId = profile?.organization_id || user.id;

    const plan = await createAndStartPlan(
      { goal, steps_hint, urgency },
      {
        userId: user.id,
        organizationId,
        conversationId: body.conversationId,
      }
    );

    return NextResponse.json({ plan });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create plan";
    console.error("[Plans API] POST error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PlanStatus | null;

    const plans = await listPlans(
      user.id,
      status || undefined
    );

    return NextResponse.json({ plans });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to list plans";
    console.error("[Plans API] GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
