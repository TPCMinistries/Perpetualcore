/**
 * POST /api/rfp/orgs/[orgId]/voice/train
 *
 * Voice Fingerprint v1 — train an org's stylometric profile from 3–10 past
 * proposals / annual reports / founder letters. The route is RLS-checked
 * (owner or writer only) and writes to two tables:
 *
 *   1) rfp_orgs.voice_fingerprint           — the live JSONB used at draft time.
 *   2) rfp_capture_profiles                 — versioned audit/history snapshot.
 *
 * Also logs an rfp_agent_sessions row with agent="voice_fingerprint_extractor_v1"
 * so token + cost usage is visible alongside the rest of the agent surface.
 *
 * Honest framing: this is system-prompt augmentation, not fine-tuning, not
 * RAG. The drafter will speak in a closer cadence and use/avoid phrases the
 * org has historically used/avoided.
 *
 * Auth + RLS:
 *   - createClient() to authenticate the caller and confirm membership.
 *   - createAdminClient() for the multi-table write so version+1 insert,
 *     org-row update, and audit insert all complete even though some of
 *     those tables would otherwise refuse the write (e.g. profile_json
 *     upserts on a server-side timer in subsequent phases). Per CLAUDE.md.
 *   - Membership is re-validated against rfp_user_orgs via the request-scoped
 *     client BEFORE any admin write happens.
 *
 * Returns: { fingerprint, version, tokens_in, tokens_out, cost_usd, model }
 *          or { error, detail? } on failure.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  extractVoiceFingerprint,
  MAX_DOC_CHARS,
  MAX_DOCS,
  MIN_DOCS,
  type VoiceFingerprint,
} from "@/lib/rfp/voice/extract";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The Supabase-generated `Json` type uses an index signature; our concrete
 * VoiceFingerprint interface doesn't, so a direct assignment fails. Round-trip
 * the value through a plain object so the type checker sees a `Json`-compatible
 * structure without any structural risk (it's already JSON-safe data).
 */
function toJsonb(fp: VoiceFingerprint): Database["public"]["Tables"]["rfp_orgs"]["Update"]["voice_fingerprint"] {
  return JSON.parse(JSON.stringify(fp));
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Voice extraction with Opus on 3–10 long documents can take 30–60s.
export const maxDuration = 120;

const BodySchema = z.object({
  documents: z
    .array(z.string().min(100).max(MAX_DOC_CHARS + 1000))
    .min(MIN_DOCS)
    .max(MAX_DOCS),
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

  // Per-document hard cap — the API truncates internally but we want a clear
  // 400 if the caller is sending obviously too much.
  if (body.documents.some((d) => d.length > MAX_DOC_CHARS + 1000)) {
    return NextResponse.json(
      { error: "document_too_long", detail: `max ${MAX_DOC_CHARS} chars per document` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS-scoped membership check. 404 (not 403) on non-member to match the
  // rest of the rfp_* surface privacy pattern.
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

  // Extract via Opus.
  let extraction;
  try {
    extraction = await extractVoiceFingerprint(body.documents);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "extraction_failed", detail: msg.slice(0, 300) },
      { status: 502 },
    );
  }

  const admin = createAdminClient();

  // 1) Update rfp_orgs.voice_fingerprint with the live profile.
  const fingerprintJson = toJsonb(extraction.fingerprint);
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

  // 2) Versioned snapshot in rfp_capture_profiles. version = (current max + 1).
  const { data: maxRow } = await admin
    .from("rfp_capture_profiles")
    .select("version")
    .eq("org_id", orgId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<MaxVersionRow>();
  const nextVersion = (maxRow?.version ?? 0) + 1;

  const { error: snapErr } = await admin.from("rfp_capture_profiles").insert({
    org_id: orgId,
    version: nextVersion,
    profile_json: fingerprintJson as NonNullable<typeof fingerprintJson>,
    voice_examples: body.documents,
  });
  if (snapErr) {
    // The live row already updated. We don't try to revert — versioned
    // history is a nice-to-have; the live fingerprint is the source of truth.
    // But we DO surface the failure so the caller can re-train if needed.
    return NextResponse.json(
      {
        error: "snapshot_insert_failed",
        detail: snapErr.message.slice(0, 200),
        partial_success: true,
        fingerprint: extraction.fingerprint,
      },
      { status: 500 },
    );
  }

  // 3) Audit row.
  await admin.from("rfp_agent_sessions").insert({
    org_id: orgId,
    agent: "voice_fingerprint_extractor_v1",
    session_id: extraction.session_id,
    model: extraction.model,
    tokens_in: extraction.tokens_in,
    tokens_out: extraction.tokens_out,
    cost_usd: extraction.cost_usd,
  });

  return NextResponse.json({
    fingerprint: extraction.fingerprint,
    version: nextVersion,
    tokens_in: extraction.tokens_in,
    tokens_out: extraction.tokens_out,
    cost_usd: extraction.cost_usd,
    model: extraction.model,
  });
}
