/**
 * POST /api/rfp/draft
 *
 * Generate a first-pass proposal draft for an opportunity. v1 of the
 * drafting wedge — single Sonnet round, no voice fingerprint, no vault
 * retrieval, no reviewer. Honest framing per `lib/rfp/draft/sections.ts`.
 *
 * Input: { org_id: uuid, opp_id: uuid }
 *
 * Side effects:
 *   - INSERT rfp_proposals (status='drafting' → 'draft')
 *   - INSERT rfp_proposal_sections (one per section, version=1)
 *   - INSERT rfp_agent_sessions (audit row with model/tokens/cost; we do
 *     NOT yet write the encrypted prompt/response — Phase 7 will add that
 *     once an encryption key with bytea handling is wired)
 *
 * Auth + RLS:
 *   - createClient() to authenticate the caller and verify membership in
 *     org_id via rfp_user_orgs (RLS-enforced read).
 *   - createAdminClient() for the multi-table write so the proposal /
 *     sections / session insert is atomic in the face of RLS. Per CLAUDE.md
 *     "Background/server operations: ALWAYS use createAdminClient()."
 *   - We re-check the membership AFTER the auth check and BEFORE the admin
 *     write to close the obvious privilege-escalation gap.
 *
 * Returns: { proposal_id, sections_generated, tokens_in, tokens_out,
 *            cost_usd, model } or { error } on failure.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/rfp/draft/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  opp_id: z.string().uuid(),
});

interface OppRow {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

interface OrgRow {
  name: string;
  type: "nonprofit" | "forprofit" | "dual";
  capacity_summary: string | null;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Membership check via RLS-scoped read. If the caller is not a member of
  // org_id, the row is invisible and we return 404 (same shape as the
  // /api/rfp/opps/[id] route).
  const { data: membership, error: memErr } = await supabase
    .from("rfp_user_orgs")
    .select("org_id, role")
    .eq("org_id", body.org_id)
    .maybeSingle();

  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!["owner", "writer"].includes(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Load the org + opp via admin client (we've already authorized the caller).
  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("rfp_orgs")
    .select("name, type, capacity_summary")
    .eq("id", body.org_id)
    .maybeSingle<OrgRow>();
  if (orgErr || !org) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const { data: opp, error: oppErr } = await admin
    .from("rfp_opportunities")
    .select("title, agency, brief, amount_min, amount_max, deadline, url")
    .eq("id", body.opp_id)
    .maybeSingle<OppRow>();
  if (oppErr || !opp) {
    return NextResponse.json({ error: "opp_not_found" }, { status: 404 });
  }

  // Generate.
  let draft;
  try {
    draft = await generateDraft({ opportunity: opp, org });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "generation_failed", detail: msg.slice(0, 200) },
      { status: 502 },
    );
  }

  if (draft.sections.length === 0) {
    return NextResponse.json(
      { error: "no_sections_parsed", detail: "model output had no recognized section markers" },
      { status: 502 },
    );
  }

  // Persist proposal + sections + audit row.
  const proposalTitle = `Draft: ${opp.title.slice(0, 160)}`;
  const { data: proposal, error: pErr } = await admin
    .from("rfp_proposals")
    .insert({
      org_id: body.org_id,
      opp_id: body.opp_id,
      title: proposalTitle,
      status: "draft",
      due_date: opp.deadline,
      owner_user_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();
  if (pErr || !proposal) {
    return NextResponse.json(
      { error: "proposal_insert_failed", detail: pErr?.message?.slice(0, 200) },
      { status: 500 },
    );
  }

  const sectionRows = draft.sections.map((s) => ({
    proposal_id: proposal.id,
    section_type: s.type,
    content: s.content,
    version: 1,
    last_drafted_by_agent_at: new Date().toISOString(),
  }));
  const { error: sErr } = await admin.from("rfp_proposal_sections").insert(sectionRows);
  if (sErr) {
    return NextResponse.json(
      { error: "sections_insert_failed", detail: sErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  // Audit row — model/tokens/cost only for v1; encrypted prompt/response in Phase 7.
  await admin.from("rfp_agent_sessions").insert({
    proposal_id: proposal.id,
    org_id: body.org_id,
    agent: "drafter_v1",
    session_id: draft.session_id,
    model: draft.model,
    tokens_in: draft.tokens_in,
    tokens_out: draft.tokens_out,
    cost_usd: draft.cost_usd,
  });

  return NextResponse.json({
    proposal_id: proposal.id,
    sections_generated: draft.sections.length,
    tokens_in: draft.tokens_in,
    tokens_out: draft.tokens_out,
    cost_usd: draft.cost_usd,
    model: draft.model,
  });
}
