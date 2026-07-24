/**
 * POST /api/rfp/orgs/[orgId]/vault/from-description
 *
 * Vault quick-seed side-door: expand a short natural-language org
 * description into a structured capacity narrative, then run it through
 * the canonical chunker → embedder → insert pipeline. Mirrors the auth +
 * persistence pattern of /vault/upload exactly — same chunker, same
 * embedder, same artifact rows, same audit hook. The only difference is
 * how the document body got generated.
 *
 * LLM cost-accounting note (Phase 17 — Pitfall 5):
 *   This route makes TWO model calls (expand via gpt-4o, then embed via
 *   text-embedding-3-large). Both are wrapped inside a SINGLE guardedLLMCall
 *   so budget is checked ONCE before expand fires and cost is recorded ONCE
 *   after embed completes — matching the existing single-insert pattern and
 *   producing exactly one rfp_agent_sessions row. The combined meta uses
 *   model: "gpt-4o" (dominant — expansion is the expensive half) and sums
 *   tokensIn (expand.tokens_in + embed.total_tokens), tokensOut
 *   (expand.tokens_out), and costUsd (expand.cost_usd + embed.cost_usd).
 *
 * Body: { description: string (80-3000), doc_title?: string (overrides
 *         the model's suggested title), doc_type?: VaultDocType (defaults
 *         to "policy" which is the best-fit closed-set value for a
 *         capacity statement) }
 *
 * Returns: same shape as /vault/upload — { doc_id, chunk_count, total_chars,
 *          tokens, cost_usd, model } plus { body, suggested_title, sections,
 *          expand_cost_usd } so the UI can show the user what got generated.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { expandOrgDescription, MIN_DESCRIPTION_CHARS, MAX_DESCRIPTION_CHARS } from "@/lib/rfp/vault/expand";
import { uploadDocument, VAULT_DOC_TYPES } from "@/lib/rfp/vault/upload";
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Expand (~3s) + embed (~3s) + insert (~1s). Headroom for slow paths.
export const maxDuration = 60;

const BodySchema = z.object({
  description: z.string().min(MIN_DESCRIPTION_CHARS).max(MAX_DESCRIPTION_CHARS),
  doc_title: z.string().min(1).max(200).optional(),
  doc_type: z.enum(VAULT_DOC_TYPES as unknown as [string, ...string[]]).optional(),
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

  // Both model calls (expand + embed) run inside ONE guardedLLMCall.
  //   - Budget is checked ONCE before expand fires.
  //   - Cost is recorded ONCE after embed completes (summed across both calls).
  //   - One rfp_agent_sessions row is produced — no double-counting.
  // model label = "gpt-4o" (the dominant / expensive half of the pair).
  let guardResult;
  try {
    guardResult = await guardedLLMCall(orgId, async () => {
      // Step 1: expand description into a structured capacity narrative.
      const expansion = await expandOrgDescription(body.description);

      const finalTitle = (body.doc_title ?? expansion.suggested_title).slice(0, 200);
      const finalDocType = (body.doc_type ?? "policy") as (typeof VAULT_DOC_TYPES)[number];

      // Step 2: run through the canonical upload pipeline (chunker → embed → insert).
      const result = await uploadDocument({
        orgId,
        docTitle: finalTitle,
        docType: finalDocType,
        body: expansion.body,
      });

      // Combined meta: sum both costs into one ledger row.
      return {
        agent: "vault_indexer_v1",
        // "gpt-4o" is the dominant (more expensive) model in this pair.
        model: "gpt-4o",
        tokensIn: expansion.tokens_in + result.tokens,
        tokensOut: expansion.tokens_out,
        costUsd: expansion.cost_usd + result.cost_usd,
        sessionId: `vault_qs_${result.doc_id}`,
        // Pass both payloads through for the response.
        _expansion: expansion,
        _result: result,
      };
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const msg = err instanceof Error ? err.message : "unknown";
    const status = msg.startsWith("upload_bad_input") || msg.startsWith("chunker_") ? 400 : 502;
    return NextResponse.json(
      {
        error: msg.startsWith("vault_expand") ? "expand_failed" : "upload_failed",
        detail: msg.slice(0, 300),
        // Surface any partial expansion so the user doesn't lose what the model wrote.
        // (Only available if expand succeeded but upload failed — not if expand threw.)
      },
      { status },
    );
  }

  const { _expansion: expansion, _result: result } = guardResult;

  return NextResponse.json({
    ...result,
    body: expansion.body,
    suggested_title: expansion.suggested_title,
    sections: expansion.sections,
    expand_cost_usd: expansion.cost_usd,
    source: "description",
  });
}
