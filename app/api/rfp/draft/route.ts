/**
 * POST /api/rfp/draft
 *
 * Generate or resume a first-pass proposal draft for an opportunity. If the
 * org already has an active draft/submitted proposal for the same opportunity,
 * the route returns that proposal_id instead of creating a duplicate. Otherwise
 * it runs a single Sonnet round. As of Voice Fingerprint v1 the
 * route loads `rfp_orgs.voice_fingerprint` and (when populated) passes the
 * profile to the drafter, which prepends it to its system prompt. When the
 * column is empty / unset the drafter behaves exactly as it did pre-voice.
 *
 * Input: { org_id: uuid, opp_id: uuid }
 *
 * Side effects:
 *   - INSERT rfp_proposals (status='drafting' → 'draft')
 *   - INSERT rfp_proposal_sections (one per section, version=1)
 *   - INSERT rfp_agent_sessions (audit row with model/tokens/cost AND
 *     session_id suffix `__voice=<true|false>` so we can read voice_applied
 *     downstream without a schema change. Encrypted prompt/response in a
 *     subsequent phase once an encryption key with bytea handling is wired.)
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
 *            cost_usd, model, reused_existing? } or { error } on failure.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/rfp/draft/generate";
import { isVoiceFingerprint, type VoiceFingerprint } from "@/lib/rfp/voice/extract";
import { retrieveVaultChunks } from "@/lib/rfp/vault/retrieve";

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
  voice_fingerprint: unknown;
}

interface ExistingProposalRow {
  id: string;
  status: string;
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

  // Switch to admin client after authorization. First, avoid duplicate active
  // proposal workspaces for the same org + opportunity.
  const admin = createAdminClient();
  const { data: existingProposal, error: existingErr } = await admin
    .from("rfp_proposals")
    .select("id, status")
    .eq("org_id", body.org_id)
    .eq("opp_id", body.opp_id)
    .in("status", ["draft", "submitted"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingProposalRow>();
  if (existingErr) {
    return NextResponse.json(
      {
        error: "existing_proposal_lookup_failed",
        detail: existingErr.message.slice(0, 200),
      },
      { status: 500 },
    );
  }
  if (existingProposal) {
    return NextResponse.json({
      proposal_id: existingProposal.id,
      sections_generated: 0,
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
      model: "reused_existing",
      reused_existing: true,
      status: existingProposal.status,
      voice_applied: false,
      vault_applied: false,
      vault_chunks_used: 0,
    });
  }

  // Load the org + opp via admin client (we've already authorized the caller).
  // We also pull voice_fingerprint to optionally apply at draft time —
  // Voice Fingerprint v1. When the column is the empty `{}` default it
  // fails isVoiceFingerprint() and the drafter behaves identically to
  // pre-voice.
  const { data: org, error: orgErr } = await admin
    .from("rfp_orgs")
    .select("name, type, capacity_summary, voice_fingerprint")
    .eq("id", body.org_id)
    .maybeSingle<OrgRow>();
  if (orgErr || !org) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const voiceFingerprint: VoiceFingerprint | undefined = isVoiceFingerprint(
    org.voice_fingerprint,
  )
    ? org.voice_fingerprint
    : undefined;

  const { data: opp, error: oppErr } = await admin
    .from("rfp_opportunities")
    .select("title, agency, brief, amount_min, amount_max, deadline, url")
    .eq("id", body.opp_id)
    .maybeSingle<OppRow>();
  if (oppErr || !opp) {
    return NextResponse.json({ error: "opp_not_found" }, { status: 404 });
  }

  // Vault grounding — retrieve top-K chunks against the opportunity title +
  // brief. Best-effort: if the org has no vault rows or retrieval fails we
  // proceed with no chunks (drafter behaves identically to pre-vault).
  const vaultQuery = [opp.title, opp.agency, opp.brief?.slice(0, 800)]
    .filter(Boolean)
    .join(" — ");
  let vaultChunks: Awaited<ReturnType<typeof retrieveVaultChunks>> = [];
  try {
    vaultChunks = await retrieveVaultChunks(body.org_id, vaultQuery, { k: 6 });
  } catch (err) {
    // Non-fatal — log shape only, no PII.
    console.warn(
      "[draft] vault retrieval skipped:",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
  }

  // Generate.
  let draft;
  try {
    draft = await generateDraft({
      opportunity: opp,
      org: {
        name: org.name,
        type: org.type,
        capacity_summary: org.capacity_summary,
      },
      voiceFingerprint,
      vaultChunks,
    });
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
  //
  // vaultChunksUsed shape (ordered, 1-indexed in [CITE: vault-N] markers):
  //   [{ id, doc_id, doc_title, doc_type, chunk_index, text_preview,
  //      similarity_score }]
  // Text is truncated to ~400 chars so the row stays small; full chunk
  // bodies remain in rfp_vault_artifacts for any deep-dive lookup.
  const vaultChunksUsed = vaultChunks.map((c) => ({
    id: c.id,
    doc_id: c.doc_id,
    doc_title: c.doc_title,
    doc_type: c.doc_type,
    chunk_index: c.chunk_index,
    text_preview: c.text.length > 400 ? `${c.text.slice(0, 400)}…` : c.text,
    similarity_score: Math.round(c.similarity_score * 10000) / 10000,
  }));

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
      vault_chunks_used: vaultChunksUsed,
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

  // Audit row — model/tokens/cost only for v1; encrypted prompt/response in
  // a subsequent phase. The voice_applied + vault_chunks_used flags are
  // encoded as session_id suffixes so they're visible without a schema
  // change. Format:
  //   `<draft.session_id>__voice=<true|false>__vault=<N>`
  // Downstream readers can parse `/__voice=(true|false)/` and `/__vault=(\d+)/`.
  const sessionIdWithFlags = `${draft.session_id}__voice=${draft.voice_applied ? "true" : "false"}__vault=${draft.vault_chunks_used}`;
  await admin.from("rfp_agent_sessions").insert({
    proposal_id: proposal.id,
    org_id: body.org_id,
    agent: "drafter_v1",
    session_id: sessionIdWithFlags,
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
    voice_applied: draft.voice_applied,
    vault_applied: draft.vault_applied,
    vault_chunks_used: draft.vault_chunks_used,
  });
}
