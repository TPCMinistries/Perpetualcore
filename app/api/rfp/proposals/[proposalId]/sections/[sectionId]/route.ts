/**
 * PATCH /api/rfp/proposals/:proposalId/sections/:sectionId
 *
 * Inline section editor write-path. Used by ProposalSectionEditor to save a
 * human-edited section body without re-running the drafter.
 *
 * "Edited by human vs agent" convention (schema is locked — no new column):
 *   - `last_drafted_by_agent_at` is set ONLY by the drafter / reviewer agents.
 *     This route NEVER touches that column.
 *   - `version` starts at 1 (set by the drafter) and is incremented by 1 on
 *     every human save through this endpoint.
 *   - Therefore: if `last_drafted_by_agent_at` is non-null AND `version > 1`,
 *     the row was drafted by an agent and then edited by a human. The diff
 *     between the agent-drafted text and the current text is the human edit.
 *     We do not persist that diff in v1 — Phase 2 question.
 *   - Audit trail: every human save inserts a row into rfp_agent_sessions
 *     with agent='proposal_editor_v1', model=null, tokens_in=0, tokens_out=0,
 *     cost_usd=0, and session_id='human_edit_<ts>_<rand>' so a downstream
 *     reader can distinguish human edits from agent runs without a column.
 *
 * Auth + RLS:
 *   - createClient() to authenticate the caller via cookies and verify the
 *     proposal is visible to them via RLS (read-then-write split, mirrors the
 *     /api/rfp/draft pattern).
 *   - Role gate: owner or writer only. Reviewer role is read-only.
 *   - createAdminClient() for the actual UPDATE + audit INSERT after auth.
 *
 * Input: { content: string }   (max 100k chars — defensive cap, not a DB limit)
 * Output: { version: number, updated_at: string }  on success
 *         { error, detail? } on failure
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITER_ROLES = new Set(["owner", "writer"]);
const MAX_CONTENT_CHARS = 100_000;

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

const BodySchema = z.object({
  content: z.string().max(MAX_CONTENT_CHARS),
});

interface ProposalRow {
  id: string;
  org_id: string;
}

interface SectionRow {
  id: string;
  proposal_id: string;
  version: number;
}

function newHumanEditSessionId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `human_edit_${ts}_${rand}`;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ proposalId: string; sectionId: string }> },
): Promise<NextResponse> {
  let params: z.infer<typeof ParamsSchema>;
  try {
    params = ParamsSchema.parse(await ctx.params);
  } catch {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

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

  // RLS-scoped read of the proposal to confirm caller can see it.
  const { data: proposal, error: pErr } = await supabase
    .from("rfp_proposals")
    .select("id, org_id")
    .eq("id", params.proposalId)
    .maybeSingle<ProposalRow>();
  if (pErr || !proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Role gate.
  const { data: membership, error: memErr } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .maybeSingle<{ role: string }>();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!WRITER_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Authorization passed — switch to admin client.
  const admin = createAdminClient();

  // Load the section to confirm it belongs to this proposal + read current version.
  const { data: section, error: sErr } = await admin
    .from("rfp_proposal_sections")
    .select("id, proposal_id, version")
    .eq("id", params.sectionId)
    .maybeSingle<SectionRow>();
  if (sErr || !section) {
    return NextResponse.json({ error: "section_not_found" }, { status: 404 });
  }
  if (section.proposal_id !== proposal.id) {
    // Section exists but belongs to a different proposal. 404 to avoid leaking.
    return NextResponse.json({ error: "section_not_found" }, { status: 404 });
  }

  const nextVersion = section.version + 1;

  // Save. We intentionally do NOT touch last_drafted_by_agent_at — see header.
  const { error: updErr } = await admin
    .from("rfp_proposal_sections")
    .update({
      content: body.content,
      version: nextVersion,
    })
    .eq("id", section.id);
  if (updErr) {
    return NextResponse.json(
      { error: "section_update_failed", detail: updErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  // Audit row — human edit.
  await admin.from("rfp_agent_sessions").insert({
    proposal_id: proposal.id,
    org_id: proposal.org_id,
    agent: "proposal_editor_v1",
    session_id: newHumanEditSessionId(),
    model: null,
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
  });

  return NextResponse.json({
    version: nextVersion,
    updated_at: new Date().toISOString(),
  });
}
