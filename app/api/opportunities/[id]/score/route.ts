import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UpdateOpportunityScoreRequest } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/opportunities/[id]/score - Update opportunity decision framework scores
export async function PUT(
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

    // Check executive access for scoring
    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const body: UpdateOpportunityScoreRequest = await request.json();

    // Build update object with scoring fields
    const scoreFields = [
      "hurdle_category",
      "risk_financial",
      "risk_operational",
      "risk_reputational",
      "risk_legal",
      "brand_values_alignment",
      "brand_quality_standards",
      "brand_audience_fit",
      "brand_longterm_impact",
      "strategic_goals_alignment",
      "strategic_future_opportunities",
      "strategic_competencies_match",
      "strategic_revenue_diversification",
      "resource_time_required",
      "resource_capital_required",
      "resource_energy_required",
      "resource_opportunity_cost",
    ];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of scoreFields) {
      if ((body as Record<string, unknown>)[field] !== undefined) {
        updates[field] = (body as Record<string, unknown>)[field];
      }
    }

    // Note: The database trigger will automatically calculate composite scores
    // when individual scores are updated

    const { data: opportunity, error } = await supabase
      .from("work_items")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .eq("item_type", "opportunity")
      .select()
      .single();

    if (error) {
      console.error("Error updating opportunity scores:", error);
      return NextResponse.json(
        { error: "Failed to update scores" },
        { status: 500 }
      );
    }

    // Record scoring update in history
    await supabase.from("work_item_history").insert({
      work_item_id: id,
      event_type: "score_updated",
      actor_id: user.id,
      actor_type: "user",
      metadata: {
        updated_scores: Object.keys(updates).filter((k) => k !== "updated_at"),
        weighted_composite: opportunity.weighted_composite_score,
        recommendation: opportunity.score_recommendation,
      },
    });

    return NextResponse.json({
      opportunity,
      score_breakdown: {
        hurdle_rate_score: opportunity.hurdle_rate_score,
        risk_composite_score: opportunity.risk_composite_score,
        brand_composite_score: opportunity.brand_composite_score,
        strategic_composite_score: opportunity.strategic_composite_score,
        resource_composite_score: opportunity.resource_composite_score,
        weighted_composite_score: opportunity.weighted_composite_score,
        score_recommendation: opportunity.score_recommendation,
      },
    });
  } catch (error) {
    console.error("Update scores error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
