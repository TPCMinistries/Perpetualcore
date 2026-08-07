import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/rfp/draft/generate";
import { SECTION_TYPES } from "@/lib/rfp/draft/sections";
import type { PackageExtraction } from "@/lib/rfp/package/extract";
import { isVoiceFingerprint, type VoiceFingerprint } from "@/lib/rfp/voice/extract";
import { retrieveVaultChunks } from "@/lib/rfp/vault/retrieve";
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const ALLOWED_ROLES = new Set(["owner", "writer"]);

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

interface ProposalRow {
  id: string;
  org_id: string;
  opp_id: string | null;
  title: string;
  due_date: string | null;
}

interface OrgRow {
  name: string;
  type: "nonprofit" | "forprofit" | "dual";
  capacity_summary: string | null;
  voice_fingerprint: unknown;
}

interface OppRow {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

interface PackageDocRow {
  extracted_json: unknown;
}

function isPackageExtraction(value: unknown): value is PackageExtraction {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { kind?: unknown; requirements?: unknown };
  return candidate.kind === "package_requirements_v1" && Array.isArray(candidate.requirements);
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: proposal, error: proposalErr } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, opp_id, title, due_date")
    .eq("id", parsed.data.proposalId)
    .maybeSingle<ProposalRow>();
  if (proposalErr || !proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!proposal.opp_id) {
    return NextResponse.json({ error: "missing_opportunity" }, { status: 400 });
  }

  const { data: membership, error: membershipErr } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (membershipErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!ALLOWED_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("rfp_orgs")
    .select("name, type, capacity_summary, voice_fingerprint")
    .eq("id", proposal.org_id)
    .maybeSingle<OrgRow>();
  if (orgErr || !org) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const { data: opp, error: oppErr } = await admin
    .from("rfp_opportunities")
    .select("title, agency, brief, amount_min, amount_max, deadline, url")
    .eq("id", proposal.opp_id)
    .maybeSingle<OppRow>();
  if (oppErr || !opp) {
    return NextResponse.json({ error: "opp_not_found" }, { status: 404 });
  }

  const { data: packageDocs, error: packageErr } = await admin
    .from("rfp_package_documents")
    .select("extracted_json")
    .eq("proposal_id", proposal.id)
    .order("created_at", { ascending: false })
    .returns<PackageDocRow[]>();
  if (packageErr) {
    return NextResponse.json(
      { error: "package_load_failed", detail: packageErr.message.slice(0, 200) },
      { status: 500 },
    );
  }
  const packageExtractions = (packageDocs ?? [])
    .map((row) => row.extracted_json)
    .filter(isPackageExtraction);
  if (packageExtractions.length === 0) {
    return NextResponse.json(
      { error: "no_package_imported", detail: "Import the RFP package before package-aware redraft." },
      { status: 400 },
    );
  }

  const voiceFingerprint: VoiceFingerprint | undefined = isVoiceFingerprint(
    org.voice_fingerprint,
  )
    ? org.voice_fingerprint
    : undefined;

  const vaultQuery = [
    opp.title,
    opp.agency,
    opp.brief?.slice(0, 800),
    packageExtractions
      .flatMap((pkg) => pkg.requirements.slice(0, 6).map((item) => item.requirement))
      .join(" "),
  ]
    .filter(Boolean)
    .join(" — ");
  let vaultChunks: Awaited<ReturnType<typeof retrieveVaultChunks>> = [];
  try {
    vaultChunks = await retrieveVaultChunks(proposal.org_id, vaultQuery, { k: 6 });
  } catch (err) {
    console.warn(
      "[redraft] vault retrieval skipped:",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
  }

  // Generate — gated by per-tenant AI budget (Phase 17).
  // guardedLLMCall runs checkBudget() BEFORE generateDraft fires, so an
  // over-budget org never reaches the model. recordCost() is called by the
  // wrapper after the draft returns; the inline rfp_agent_sessions insert
  // that used to live below has been removed to avoid double-counting.
  // proposal_id is known here so it is included in the session meta.
  let draft: Awaited<ReturnType<typeof generateDraft>> & { agent: string; tokensIn: number; tokensOut: number; costUsd: number; sessionId?: string };
  try {
    draft = await guardedLLMCall(proposal.org_id, async () => {
      const result = await generateDraft({
        opportunity: opp,
        org: {
          name: org.name,
          type: org.type,
          capacity_summary: org.capacity_summary,
        },
        voiceFingerprint,
        vaultChunks,
        packageExtractions,
      });
      const sessionIdWithFlags = `${result.session_id}__redraft=package__voice=${result.voice_applied ? "true" : "false"}__vault=${result.vault_chunks_used}__package=${packageExtractions.length}`;
      return {
        ...result,
        agent: "drafter_v1" as const,
        model: result.model,
        tokensIn: result.tokens_in,
        tokensOut: result.tokens_out,
        costUsd: result.cost_usd,
        sessionId: sessionIdWithFlags,
        proposalId: proposal.id,
      };
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
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

  const { error: deleteErr } = await admin
    .from("rfp_proposal_sections")
    .delete()
    .eq("proposal_id", proposal.id)
    .in("section_type", SECTION_TYPES);
  if (deleteErr) {
    return NextResponse.json(
      { error: "section_clear_failed", detail: deleteErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const sectionRows = draft.sections.map((section) => ({
    proposal_id: proposal.id,
    section_type: section.type,
    content: section.content,
    version: 1,
    last_drafted_by_agent_at: new Date().toISOString(),
  }));
  const { error: insertErr } = await admin.from("rfp_proposal_sections").insert(sectionRows);
  if (insertErr) {
    return NextResponse.json(
      { error: "section_insert_failed", detail: insertErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const vaultChunksUsed = vaultChunks.map((chunk) => ({
    id: chunk.id,
    doc_id: chunk.doc_id,
    doc_title: chunk.doc_title,
    doc_type: chunk.doc_type,
    chunk_index: chunk.chunk_index,
    text_preview: chunk.text.length > 400 ? `${chunk.text.slice(0, 400)}...` : chunk.text,
    similarity_score: Math.round(chunk.similarity_score * 10000) / 10000,
  }));
  await admin
    .from("rfp_proposals")
    .update({
      status: "draft",
      vault_chunks_used: vaultChunksUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposal.id);

  // The rfp_agent_sessions audit row is recorded by guardedLLMCall → recordCost
  // (wrapper owns the single insert). No inline insert here.

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
    package_count: packageExtractions.length,
  });
}
