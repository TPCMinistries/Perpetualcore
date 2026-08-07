/**
 * POST /api/rfp/orgs/[orgId]/voice/from-description
 *
 * Voice Fingerprint side-door: extracts a fingerprint from a natural-language
 * description (and optional single writing sample) instead of 3-10 past
 * proposals. Lowers the cold-start bar for first-time users on the onboarding
 * checklist. Persistence is identical to the canonical /train route — the
 * downstream drafter doesn't distinguish between the two extraction paths.
 *
 * LLM usage is budget-gated via guardedLLMCall (Phase 17). The wrapper records
 * the rfp_agent_sessions row — do NOT insert a separate audit row here.
 *
 * Auth + RLS mirror /train exactly:
 *   - createClient() to authenticate the caller and confirm membership.
 *   - createAdminClient() for the multi-table write (org row update +
 *     versioned snapshot + audit), justified per CLAUDE.md.
 *   - owner or writer role required; viewer/reviewer get 403.
 *
 * Body: { description: string (50-2000), sample?: string (≤8000) }
 * Returns: { fingerprint, version, tokens_in, tokens_out, cost_usd, model, source: "description" }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  extractFingerprintFromDescription,
  MIN_DESCRIPTION_CHARS,
  MAX_DESCRIPTION_CHARS,
  MAX_SAMPLE_CHARS,
} from "@/lib/rfp/voice/from-description";
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";
import type { VoiceFingerprint } from "@/lib/rfp/voice/extract";
import type { Database } from "@/lib/supabase/database.types";

function toJsonb(
  fp: VoiceFingerprint,
): Database["public"]["Tables"]["rfp_orgs"]["Update"]["voice_fingerprint"] {
  return JSON.parse(JSON.stringify(fp));
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  description: z.string().min(MIN_DESCRIPTION_CHARS).max(MAX_DESCRIPTION_CHARS),
  sample: z.string().max(MAX_SAMPLE_CHARS).optional(),
});

interface MaxVersionRow {
  version: number;
}

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

  // Extract via GPT-4o — budget-gated. The wrapper checks spend before calling
  // fn() and records the session row after; no separate audit insert needed.
  let extraction;
  try {
    extraction = await guardedLLMCall(orgId, async () => {
      const result = await extractFingerprintFromDescription(body.description, body.sample);
      return {
        agent: "voice_fingerprint_extractor_v1",
        model: result.model,
        tokensIn: result.tokens_in,
        tokensOut: result.tokens_out,
        costUsd: result.cost_usd,
        sessionId: result.session_id,
        // Pass the full result through so the route can use it.
        _result: result,
      };
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "extraction_failed", detail: msg.slice(0, 300) },
      { status: 502 },
    );
  }

  const result = extraction._result;

  const admin = createAdminClient();
  const fingerprintJson = toJsonb(result.fingerprint);

  const { error: orgUpdateErr } = await admin
    .from("rfp_orgs")
    .update({ voice_fingerprint: fingerprintJson })
    .eq("id", orgId);
  if (orgUpdateErr) {
    return NextResponse.json(
      { error: "org_update_failed", detail: orgUpdateErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const { data: maxRow } = await admin
    .from("rfp_capture_profiles")
    .select("version")
    .eq("org_id", orgId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<MaxVersionRow>();
  const nextVersion = (maxRow?.version ?? 0) + 1;

  // The voice_examples column carries the source material for this snapshot.
  // For the description path we record the description (and sample if any)
  // as the "examples" so future audits can see exactly what produced this
  // fingerprint version. Matches the canonical /train path's intent — record
  // the inputs that produced the fingerprint.
  const examples: string[] = [`[description]\n${body.description.trim()}`];
  if (body.sample && body.sample.trim()) {
    examples.push(`[sample]\n${body.sample.trim()}`);
  }

  const { error: snapErr } = await admin.from("rfp_capture_profiles").insert({
    org_id: orgId,
    version: nextVersion,
    profile_json: fingerprintJson as NonNullable<typeof fingerprintJson>,
    voice_examples: examples,
  });
  if (snapErr) {
    return NextResponse.json(
      {
        error: "snapshot_insert_failed",
        detail: snapErr.message.slice(0, 200),
        partial_success: true,
        fingerprint: result.fingerprint,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    fingerprint: result.fingerprint,
    version: nextVersion,
    tokens_in: result.tokens_in,
    tokens_out: result.tokens_out,
    cost_usd: result.cost_usd,
    model: result.model,
    source: "description",
  });
}
