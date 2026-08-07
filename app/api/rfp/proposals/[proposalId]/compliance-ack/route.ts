/**
 * PATCH /api/rfp/proposals/[proposalId]/compliance-ack
 *
 * Persists the user's explicit acknowledgment that this proposal was drafted
 * with AI assistance and they have reviewed the AI-use disclosure at /ai-disclosure.
 *
 * After acknowledgment the next POST /compliance run will emit the "ai-disclosure"
 * checklist item as status "met" rather than "needs_review".
 *
 * Auth + RLS:
 *   - createClient() → getUser() → RLS-enforced proposal read to verify org membership.
 *   - Role gate: owner / writer / reviewer (same as compliance route).
 *   - createAdminClient() for the actual UPDATE (background/server write).
 *
 * Body: { acknowledged: true } — un-acknowledging is not supported in v1.
 * Returns: { ok: true, acknowledged_at: string }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["owner", "writer", "reviewer"]);

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

const BodySchema = z.object({
  acknowledged: z.literal(true, {
    message: "acknowledged must be exactly true",
  }),
});

interface ProposalRow {
  id: string;
  org_id: string;
}

type DbClient = {
  from: (table: string) => DbQuery;
};

type DbQuery = {
  select: (cols: string) => DbQuery;
  update: (values: Record<string, unknown>) => DbQuery;
  eq: (col: string, val: unknown) => DbQuery;
  maybeSingle: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
  then: Promise<{ data: unknown; error: { message: string } | null }>["then"];
};

function db(client: unknown): DbClient {
  return client as DbClient;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  // Validate params
  let params: z.infer<typeof ParamsSchema>;
  try {
    params = ParamsSchema.parse(await context.params);
  } catch {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }

  // Validate body
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : "invalid_body";
    return NextResponse.json({ error: message ?? "invalid_body" }, { status: 400 });
  }

  // Authenticate caller
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS-enforced proposal read — also verifies the proposal belongs to this org
  const userDb = db(supabase);
  const { data: proposal, error: pErr } = await userDb
    .from("rfp_proposals")
    .select("id, org_id")
    .eq("id", params.proposalId)
    .maybeSingle<ProposalRow>();
  if (pErr || !proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Role gate
  const { data: membership, error: memErr } = await userDb
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!ALLOWED_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Persist acknowledgment with admin client (service-role write)
  const acknowledgedAt = new Date().toISOString();
  const admin = createAdminClient();
  const adminDb = db(admin);
  const { error: updateErr } = await adminDb
    .from("rfp_proposals")
    .update({
      ai_disclosure_acknowledged: true,
      ai_disclosure_acknowledged_at: acknowledgedAt,
    })
    .eq("id", proposal.id);

  if (updateErr) {
    return NextResponse.json(
      { error: "ack_failed", detail: (updateErr as { message: string }).message.slice(0, 200) },
      { status: 500 },
    );
  }

  // Suppress unused-variable warning — body.acknowledged is validated above (must be true)
  void body;

  return NextResponse.json({ ok: true, acknowledged_at: acknowledgedAt });
}
