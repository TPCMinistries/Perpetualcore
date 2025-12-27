import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DecideRequest } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/decisions/[id]/decide - Record a decision
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

    const body: DecideRequest = await request.json();

    if (!body.decision_made || body.decision_made.trim() === "") {
      return NextResponse.json(
        { error: "decision_made is required" },
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

    if (currentDecision.status === "decided") {
      return NextResponse.json(
        { error: "Decision has already been made" },
        { status: 400 }
      );
    }

    const decidedAt = new Date().toISOString();

    // Update decision
    const { data: decision, error } = await supabase
      .from("decisions")
      .update({
        status: "decided",
        decision_made: body.decision_made.trim(),
        decision_rationale: body.decision_rationale?.trim() || null,
        decided_at: decidedAt,
        decided_by: user.id,
        updated_at: decidedAt,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      console.error("Error recording decision:", error);
      return NextResponse.json(
        { error: "Failed to record decision" },
        { status: 500 }
      );
    }

    // Record decision event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "decided",
      from_status: currentDecision.status,
      to_status: "decided",
      comment: body.decision_rationale || null,
      performed_by: user.id,
      performed_by_system: false,
      metadata: { decision_made: body.decision_made },
    });

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("Decide error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
