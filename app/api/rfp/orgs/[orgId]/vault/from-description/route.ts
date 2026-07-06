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
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { expandOrgDescription, MIN_DESCRIPTION_CHARS, MAX_DESCRIPTION_CHARS } from "@/lib/rfp/vault/expand";
import { uploadDocument, VAULT_DOC_TYPES } from "@/lib/rfp/vault/upload";

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

  // Step 1: expand description into a structured capacity narrative.
  let expansion;
  try {
    expansion = await expandOrgDescription(body.description);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "expand_failed", detail: msg.slice(0, 300) },
      { status: 502 },
    );
  }

  const finalTitle = (body.doc_title ?? expansion.suggested_title).slice(0, 200);
  const finalDocType = (body.doc_type ?? "policy") as (typeof VAULT_DOC_TYPES)[number];

  // Step 2: run through the canonical upload pipeline. Same chunker, same
  // embedder, same artifact rows — the drafter cannot tell which path
  // produced the chunks.
  let result;
  try {
    result = await uploadDocument({
      orgId,
      docTitle: finalTitle,
      docType: finalDocType,
      body: expansion.body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    const status = msg.startsWith("upload_bad_input") || msg.startsWith("chunker_") ? 400 : 502;
    return NextResponse.json(
      {
        error: "upload_failed",
        detail: msg.slice(0, 300),
        // Surface the expansion so the user doesn't lose what the model wrote.
        expanded_body: expansion.body,
        suggested_title: expansion.suggested_title,
      },
      { status },
    );
  }

  // Step 3: audit row. Best-effort like the canonical route.
  try {
    const admin = createAdminClient();
    await admin.from("rfp_agent_sessions").insert({
      org_id: orgId,
      agent: "vault_indexer_v1",
      session_id: `vault_qs_${result.doc_id}`,
      model: result.model,
      tokens_in: result.tokens + expansion.tokens_in,
      tokens_out: expansion.tokens_out,
      cost_usd: result.cost_usd + expansion.cost_usd,
    });
  } catch {
    // Swallow audit failures.
  }

  return NextResponse.json({
    ...result,
    body: expansion.body,
    suggested_title: expansion.suggested_title,
    sections: expansion.sections,
    expand_cost_usd: expansion.cost_usd,
    source: "description",
  });
}
