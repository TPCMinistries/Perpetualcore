import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DelegateRequest } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/decisions/[id]/delegate - Delegate a decision
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

    const body: DelegateRequest = await request.json();

    if (!body.delegated_to) {
      return NextResponse.json(
        { error: "delegated_to is required" },
        { status: 400 }
      );
    }

    // Verify delegatee exists in organization
    const { data: delegatee } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", body.delegated_to)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!delegatee) {
      return NextResponse.json(
        { error: "Delegatee not found in organization" },
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

    const delegatedAt = new Date().toISOString();

    // Update decision
    const { data: decision, error } = await supabase
      .from("decisions")
      .update({
        status: "delegated",
        delegated_to: body.delegated_to,
        delegated_at: delegatedAt,
        delegation_notes: body.delegation_notes?.trim() || null,
        delegation_due_date: body.delegation_due_date || null,
        updated_at: delegatedAt,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      console.error("Error delegating decision:", error);
      return NextResponse.json(
        { error: "Failed to delegate decision" },
        { status: 500 }
      );
    }

    // Record delegation event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "delegated",
      from_status: currentDecision.status,
      to_status: "delegated",
      comment: body.delegation_notes || null,
      performed_by: user.id,
      performed_by_system: false,
      metadata: {
        delegated_to: body.delegated_to,
        delegatee_name: delegatee.full_name,
        due_date: body.delegation_due_date,
      },
    });

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("Delegate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
