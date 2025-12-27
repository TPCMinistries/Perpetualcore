import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DeferRequest } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/decisions/[id]/defer - Defer a decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: DeferRequest = await request.json();

    if (!body.deferred_until) {
      return NextResponse.json(
        { error: "deferred_until date is required" },
        { status: 400 }
      );
    }

    // Validate date is in the future
    const deferDate = new Date(body.deferred_until);
    if (deferDate <= new Date()) {
      return NextResponse.json(
        { error: "deferred_until must be a future date" },
        { status: 400 }
      );
    }

    // Get current decision
    const { data: currentDecision } = await supabase
      .from("decisions")
      .select("status")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!currentDecision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update decision
    const { data: decision, error } = await supabase
      .from("decisions")
      .update({
        status: "deferred",
        deferred_until: body.deferred_until,
        defer_reason: body.defer_reason?.trim() || null,
        updated_at: now,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      console.error("Error deferring decision:", error);
      return NextResponse.json(
        { error: "Failed to defer decision" },
        { status: 500 }
      );
    }

    // Record deferral event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "deferred",
      from_status: currentDecision.status,
      to_status: "deferred",
      comment: body.defer_reason || null,
      performed_by: user.id,
      performed_by_system: false,
      metadata: { deferred_until: body.deferred_until },
    });

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("Defer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
