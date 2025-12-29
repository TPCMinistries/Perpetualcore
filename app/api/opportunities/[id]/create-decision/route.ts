import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/opportunities/[id]/create-decision - Create a decision from an opportunity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from("work_items")
      .select("*")
      .eq("id", opportunityId)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      context,
      priority,
      due_date,
      options,
      decision_type,
    } = body;

    // Create the decision
    const decisionTitle = title || `Decision: ${opportunity.title}`;
    const decisionDescription = description || opportunity.description;
    const decisionContext = context || `Created from opportunity: ${opportunity.title}`;

    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .insert({
        title: decisionTitle,
        description: decisionDescription,
        context: decisionContext,
        priority: priority || opportunity.priority || "medium",
        due_date: due_date || opportunity.deadline,
        decision_type: decision_type || "strategic",
        source_type: "opportunity",
        source_id: opportunityId,
        status: "pending",
        created_by: user.id,
        options: options || null,
      })
      .select()
      .single();

    if (decisionError) {
      console.error("Error creating decision:", decisionError);
      return NextResponse.json({ error: "Failed to create decision" }, { status: 500 });
    }

    // Create relationship between opportunity and decision
    const { error: relError } = await supabase
      .from("item_relationships")
      .insert({
        source_type: "opportunity",
        source_id: opportunityId,
        target_type: "decision",
        target_id: decision.id,
        relationship_type: "spawned",
        description: "Decision created from opportunity",
        created_by: user.id,
      });

    if (relError) {
      console.error("Error creating relationship:", relError);
      // Don't fail the request, relationship is secondary
    }

    // Copy stakeholders from opportunity to decision (if any)
    const { data: oppStakeholders } = await supabase
      .from("item_stakeholders")
      .select("*")
      .eq("item_type", "opportunity")
      .eq("item_id", opportunityId);

    if (oppStakeholders && oppStakeholders.length > 0) {
      const decisionStakeholders = oppStakeholders.map(s => ({
        item_type: "decision",
        item_id: decision.id,
        user_id: s.user_id,
        contact_id: s.contact_id,
        role: s.role,
        notes: s.notes,
        notify_on_updates: s.notify_on_updates,
        notify_on_decision: s.notify_on_decision,
        notify_on_comments: s.notify_on_comments,
        added_by: user.id,
      }));

      const { error: stakeholderError } = await supabase
        .from("item_stakeholders")
        .insert(decisionStakeholders);

      if (stakeholderError) {
        console.error("Error copying stakeholders:", stakeholderError);
        // Don't fail the request, stakeholder copy is secondary
      }
    }

    // Update opportunity to mark it has a linked decision
    const { error: updateError } = await supabase
      .from("work_items")
      .update({
        final_decision: "pending_decision",
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunityId);

    if (updateError) {
      console.error("Error updating opportunity:", updateError);
    }

    return NextResponse.json({
      decision,
      message: "Decision created successfully from opportunity",
      relationship_created: !relError,
      stakeholders_copied: oppStakeholders?.length || 0,
    }, { status: 201 });
  } catch (error) {
    console.error("Create decision from opportunity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
