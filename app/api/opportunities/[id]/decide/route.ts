import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FinalDecision } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FinalDecisionRequest {
  final_decision: FinalDecision;
  decision_notes?: string;
}

// POST /api/opportunities/[id]/decide - Record final decision on opportunity
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
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check executive access for final decisions
    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const body: FinalDecisionRequest = await request.json();

    if (!body.final_decision) {
      return NextResponse.json(
        { error: "final_decision is required" },
        { status: 400 }
      );
    }

    const validDecisions: FinalDecision[] = ["approved", "rejected", "pending", "withdrawn"];
    if (!validDecisions.includes(body.final_decision)) {
      return NextResponse.json(
        { error: "Invalid final_decision value" },
        { status: 400 }
      );
    }

    // Get current opportunity
    const { data: currentOpportunity } = await supabase
      .from("work_items")
      .select("final_decision, weighted_composite_score")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity")
      .single();

    if (!currentOpportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const decisionDate = new Date().toISOString();

    // Update opportunity with final decision
    const { data: opportunity, error } = await supabase
      .from("work_items")
      .update({
        final_decision: body.final_decision,
        decision_notes: body.decision_notes?.trim() || null,
        decision_date: decisionDate,
        decision_by: user.id,
        updated_at: decisionDate,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity")
      .select()
      .single();

    if (error) {
      console.error("Error recording final decision:", error);
      return NextResponse.json(
        { error: "Failed to record decision" },
        { status: 500 }
      );
    }

    // Record decision in history
    await supabase.from("work_item_history").insert({
      work_item_id: id,
      event_type: "final_decision",
      actor_id: user.id,
      actor_type: "user",
      metadata: {
        previous_decision: currentOpportunity.final_decision,
        new_decision: body.final_decision,
        decision_notes: body.decision_notes,
        composite_score: currentOpportunity.weighted_composite_score,
      },
    });

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("Final decision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
