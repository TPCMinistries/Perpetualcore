/**
 * DELETE /api/rfp/orgs/[orgId]/vault/[docId] — Vault Grounding v1.
 *
 * Deletes ALL rfp_vault_artifacts rows whose source_metadata.doc_id matches
 * the given docId, scoped to the given org. Owner-only.
 *
 * RLS: caller must be owner of the org. We re-validate ownership via the
 * request-scoped client BEFORE the admin-scoped delete.
 *
 * Returns: { deleted: number } — count of chunk rows removed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ orgId: string; docId: string }> },
): Promise<NextResponse> {
  const { orgId, docId } = await context.params;

  if (!docId || typeof docId !== "string") {
    return NextResponse.json({ error: "invalid_doc_id" }, { status: 400 });
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
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  // PostgREST jsonb path filter: ->>"doc_id" eq docId. Scoped to org_id as
  // a defense-in-depth check.
  const { data, error } = await admin
    .from("rfp_vault_artifacts")
    .delete()
    .eq("org_id", orgId)
    .eq("source_metadata->>doc_id", docId)
    .select("id");
  if (error) {
    return NextResponse.json(
      { error: "vault_delete_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: data?.length ?? 0 });
}
