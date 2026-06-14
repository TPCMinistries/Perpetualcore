import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalPayload {
  title?: unknown;
  lane?: unknown;
  proposalText?: unknown;
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: proposals, error } = await supabase
      .from("lead_activities")
      .select("id, title, description, to_value, created_at")
      .eq("lead_id", id)
      .eq("activity_type", "proposal_draft")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching proposal history:", error);
      return Response.json({ error: "Failed to fetch proposals" }, { status: 500 });
    }

    return Response.json({ proposals: proposals || [] });
  } catch (error) {
    console.error("Lead proposals GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = (await req.json()) as ProposalPayload;
    const title = asTrimmedString(body.title) || "Proposal draft";
    const lane = asTrimmedString(body.lane) || "Proposal";
    const proposalText = asTrimmedString(body.proposalText);

    if (!proposalText) {
      return Response.json({ error: "Proposal text is required" }, { status: 400 });
    }

    const { data: proposal, error } = await supabase
      .from("lead_activities")
      .insert({
        lead_id: id,
        user_id: user.id,
        activity_type: "proposal_draft",
        title,
        description: proposalText,
        to_value: lane,
      })
      .select("id, title, description, to_value, created_at")
      .single();

    if (error) {
      console.error("Error saving proposal draft:", error);
      return Response.json({ error: "Failed to save proposal" }, { status: 500 });
    }

    if (lead.status !== "proposal" && lead.status !== "won" && lead.status !== "lost") {
      await supabase
        .from("leads")
        .update({
          status: "proposal",
          updated_at: new Date().toISOString(),
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);
    }

    return Response.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Lead proposals POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
