/**
 * GET /api/rfp/orgs/[orgId]/voice
 *
 * Lightweight read of the org's current voice fingerprint state. Returns
 * { trained: boolean, version: number | null, register: string | null,
 *   extracted_at: string | null }.
 *
 * RLS-scoped — non-members get a 404 (matches the rest of the rfp_*
 * surface privacy pattern). We do NOT return the full fingerprint here;
 * the settings page reads it server-side. This endpoint is used by client
 * components (e.g. DraftButton) that just need to know whether voice is
 * trained.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isVoiceFingerprint } from "@/lib/rfp/voice/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OrgRow {
  voice_fingerprint: unknown;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ orgId: string }> },
): Promise<NextResponse> {
  const { orgId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS-scoped read of rfp_orgs. Non-members get null → 404.
  const { data: org } = await supabase
    .from("rfp_orgs")
    .select("voice_fingerprint")
    .eq("id", orgId)
    .maybeSingle<OrgRow>();
  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!isVoiceFingerprint(org.voice_fingerprint)) {
    return NextResponse.json({
      trained: false,
      version: null,
      register: null,
      extracted_at: null,
    });
  }

  const fp = org.voice_fingerprint;
  return NextResponse.json({
    trained: true,
    version: fp.version,
    register: fp.register,
    extracted_at: fp.extracted_at,
  });
}
