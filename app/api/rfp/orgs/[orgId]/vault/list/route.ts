/**
 * GET /api/rfp/orgs/[orgId]/vault/list — Vault Grounding v1.
 *
 * Lists uploaded documents (grouped by source_metadata.doc_id). Embeddings
 * are NEVER returned over the wire — each row is ~12KB of vector noise we
 * don't need on the client.
 *
 * Auth: owner / writer / viewer membership in the org via rfp_user_orgs.
 *
 * Returns: { docs: Array<{ doc_id, doc_title, doc_type, chunk_count,
 *                          total_chars, created_at }> }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ListedDoc {
  doc_id: string;
  doc_title: string;
  doc_type: string;
  chunk_count: number;
  total_chars: number;
  created_at: string;
}

interface VaultListRow {
  body: string | null;
  type: string;
  title: string;
  source_metadata: unknown;
  created_at: string;
}

interface ChunkMetadata {
  doc_id?: unknown;
  doc_title?: unknown;
  doc_type?: unknown;
}

export async function GET(
  _req: NextRequest,
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

  const { data: membership, error: memErr } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .maybeSingle();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // All roles allowed for read.
  if (!["owner", "writer", "viewer", "reviewer"].includes(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rfp_vault_artifacts")
    .select("body, type, title, source_metadata, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: "vault_list_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  // Group by doc_id, falling back to title+type for legacy / hand-inserted rows.
  const grouped = new Map<string, ListedDoc>();
  for (const row of (data ?? []) as VaultListRow[]) {
    const meta = (row.source_metadata ?? {}) as ChunkMetadata;
    const doc_id =
      typeof meta.doc_id === "string"
        ? meta.doc_id
        : `__legacy_${row.type}_${row.title}`;
    const doc_title =
      typeof meta.doc_title === "string" ? meta.doc_title : row.title;
    const doc_type =
      typeof meta.doc_type === "string" ? meta.doc_type : row.type;

    const existing = grouped.get(doc_id);
    if (existing) {
      existing.chunk_count += 1;
      existing.total_chars += row.body?.length ?? 0;
      // Earliest created_at wins (rows in a batch share a timestamp).
      if (row.created_at < existing.created_at) {
        existing.created_at = row.created_at;
      }
    } else {
      grouped.set(doc_id, {
        doc_id,
        doc_title,
        doc_type,
        chunk_count: 1,
        total_chars: row.body?.length ?? 0,
        created_at: row.created_at,
      });
    }
  }

  // Newest doc first.
  const docs = [...grouped.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  return NextResponse.json({ docs });
}
