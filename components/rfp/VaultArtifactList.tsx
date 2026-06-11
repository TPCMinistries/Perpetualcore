"use client";

/**
 * VaultArtifactList — Vault Grounding v1 artifact list.
 *
 * Renders the org's uploaded docs grouped by doc_id with a delete button per
 * doc. The parent (the settings/vault page) passes a `refreshKey` that gets
 * bumped after each upload so we re-fetch the list.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface VaultDoc {
  doc_id: string;
  doc_title: string;
  doc_type: string;
  chunk_count: number;
  total_chars: number;
  created_at: string;
}

interface ListResponse {
  docs: VaultDoc[];
}

interface VaultArtifactListProps {
  orgId: string;
  /** Bump this number after an upload to trigger a refetch. */
  refreshKey: number;
  /** If false, the delete buttons are hidden (read-only roles). */
  canDelete: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  past_proposal: "Past proposal",
  annual_report: "Annual report",
  founder_letter: "Founder letter",
  case_study: "Case study",
  policy: "Policy",
  other: "Other",
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function VaultArtifactList({
  orgId,
  refreshKey,
  canDelete,
}: VaultArtifactListProps) {
  const [docs, setDocs] = useState<VaultDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/vault/list`, {
        method: "GET",
        cache: "no-store",
      });
      const json = (await res.json()) as ListResponse | { error: string; detail?: string };
      if (!res.ok || "error" in json) {
        const e = json as { error: string; detail?: string };
        setError(e.detail ?? e.error ?? `HTTP ${res.status}`);
        setDocs([]);
        return;
      }
      setDocs((json as ListResponse).docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setDocs([]);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function handleDelete(doc_id: string, title: string) {
    if (!canDelete) return;
    if (
      !window.confirm(
        `Delete "${title}"? All chunks for this document will be removed and cannot be recovered.`,
      )
    ) {
      return;
    }
    setDeletingDocId(doc_id);
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/vault/${doc_id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { deleted: number } | { error: string; detail?: string };
      if (!res.ok || "error" in json) {
        const e = json as { error: string; detail?: string };
        setError(e.detail ?? e.error ?? `HTTP ${res.status}`);
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setDeletingDocId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Vault contents
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-700"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {docs === null ? (
        <div className="rounded-md border border-zinc-200 bg-white p-6 text-xs text-zinc-500">
          Loading…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
            Vault empty
          </p>
          <h3 className="mt-3 text-base font-semibold text-zinc-900">
            Add one evidence source before the first qualified draft.
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Paste a past proposal, annual report, outcome summary, or use the
            quick-seed panel above. The drafter can then cite real capacity
            facts instead of leaving every org-specific claim as VERIFY.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a
              href="#vault-upload"
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Add evidence
            </a>
            <Link
              href={`/org/${orgId}/discovery`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Open Discovery
            </Link>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => (
            <li
              key={d.doc_id}
              className="flex items-start justify-between gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm text-zinc-900">{d.doc_title}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {TYPE_LABEL[d.doc_type] ?? d.doc_type} · {d.chunk_count} chunk
                  {d.chunk_count === 1 ? "" : "s"} · {d.total_chars.toLocaleString()} chars ·{" "}
                  {fmtDate(d.created_at)}
                </p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => void handleDelete(d.doc_id, d.doc_title)}
                  disabled={deletingDocId === d.doc_id}
                  className="shrink-0 rounded-md border border-red-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingDocId === d.doc_id ? "Deleting…" : "Delete"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
