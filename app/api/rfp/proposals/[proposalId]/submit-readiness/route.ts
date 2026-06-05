import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadSubmitReadinessGate } from "@/lib/rfp/submission/readiness-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

interface ProposalRow {
  id: string;
  org_id: string;
  status: string;
}

type ProposalAccess =
  | { proposal: ProposalRow; role: string }
  | { error: NextResponse };

async function requireProposalAccess(proposalId: string): Promise<ProposalAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, status")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (!proposal) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (!membership) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  return { proposal, role: membership.role };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }

  const access = await requireProposalAccess(parsed.data.proposalId);
  if ("error" in access) return access.error;

  try {
    const readiness = await loadSubmitReadinessGate(parsed.data.proposalId);
    return NextResponse.json({
      proposal_id: parsed.data.proposalId,
      proposal_status: access.proposal.status,
      role: access.role,
      can_submit: readiness.gate.status === "ready",
      enforced_on_status: "submitted",
      generated_at: readiness.generatedAt,
      gate: readiness.gate,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "submit_gate_load_failed",
        detail: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      },
      { status: 500 },
    );
  }
}
