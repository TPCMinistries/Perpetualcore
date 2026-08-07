/**
 * POST /api/rfp/orgs/[orgId]/vault/upload — Vault Grounding v1.
 *
 * Plaintext-paste-only upload. Accepts { doc_title, doc_type, body }, runs
 * the chunker → embedder → batch insert pipeline, returns counts + cost.
 *
 * Honest framing: PDF/Docx upload is Phase 2. The drafter does NOT yet
 * consume vault retrieval — that wiring is a follow-up commit.
 *
 * LLM usage is budget-gated via guardedLLMCall (Phase 17). The wrapper records
 * the rfp_agent_sessions row — do NOT insert a separate audit row here.
 *
 * Auth + RLS pattern mirrors app/api/rfp/draft/route.ts:
 *   - createClient() to authenticate and verify owner/writer membership
 *     against rfp_user_orgs.
 *   - createAdminClient() (inside uploadDocument) for the multi-row insert,
 *     since vault rows are written behind RLS but the membership has just
 *     been verified.
 *
 * Returns: { doc_id, chunk_count, total_chars, tokens, cost_usd, model }.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  uploadDocument,
  VAULT_DOC_TYPES,
  MIN_DOC_BODY_CHARS,
  MAX_DOC_BODY_CHARS,
} from "@/lib/rfp/vault/upload";
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Embedding a 200-chunk doc is one API call; well under the default timeout,
// but allow headroom for slow network paths.
export const maxDuration = 60;

const BodySchema = z.object({
  doc_title: z.string().min(1).max(200),
  doc_type: z.enum(
    VAULT_DOC_TYPES as unknown as [string, ...string[]],
  ),
  body: z.string().min(MIN_DOC_BODY_CHARS).max(MAX_DOC_BODY_CHARS),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> },
): Promise<NextResponse> {
  const { orgId } = await context.params;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "schema error";
    return NextResponse.json({ error: "invalid_body", detail }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS-scoped membership check; 404 on non-member to match the rest of the
  // rfp_* surface privacy pattern.
  const { data: membership, error: memErr } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .maybeSingle();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!["owner", "writer"].includes(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Run the pipeline — budget-gated. The wrapper checks spend before calling
  // fn() and records the session row after; no separate audit insert needed.
  // Embeddings have no output tokens (tokensOut: 0); cost is input-only.
  let guardResult;
  try {
    guardResult = await guardedLLMCall(orgId, async () => {
      const result = await uploadDocument({
        orgId,
        docTitle: body.doc_title,
        docType: body.doc_type as (typeof VAULT_DOC_TYPES)[number],
        body: body.body,
      });
      return {
        agent: "vault_indexer_v1",
        model: result.model,
        tokensIn: result.tokens,
        tokensOut: 0,
        costUsd: result.cost_usd,
        sessionId: `vault_${result.doc_id}`,
        // Pass the full result through so the route can return it.
        _result: result,
      };
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const msg = err instanceof Error ? err.message : "unknown";
    // Distinguish operator error from infra error.
    const status = msg.startsWith("upload_bad_input") || msg.startsWith("chunker_") ? 400 : 502;
    return NextResponse.json(
      { error: "upload_failed", detail: msg.slice(0, 300) },
      { status },
    );
  }

  return NextResponse.json(guardResult._result);
}
