"use client";

/**
 * VaultUploadForm — Vault Grounding v1 upload form.
 *
 * Single textarea (plaintext only — PDF/Docx is Phase 2), a doc_type select,
 * a title input. On submit POSTs to /api/rfp/orgs/[orgId]/vault/upload and
 * surfaces chunk count + cost in a success card.
 *
 * On success we call onUploaded() so the parent can refresh the artifact
 * list without a full route reload.
 */

import { useState } from "react";

const DOC_TYPES = [
  { value: "past_proposal", label: "Past proposal" },
  { value: "annual_report", label: "Annual report" },
  { value: "founder_letter", label: "Founder letter" },
  { value: "case_study", label: "Case study" },
  { value: "policy", label: "Policy" },
  { value: "other", label: "Other" },
] as const;

type DocType = (typeof DOC_TYPES)[number]["value"];

const MIN_BODY_CHARS = 200;
const MAX_BODY_CHARS = 200_000;

interface UploadResponse {
  doc_id: string;
  chunk_count: number;
  total_chars: number;
  tokens: number;
  cost_usd: number;
  model: string;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

interface VaultUploadFormProps {
  orgId: string;
  onUploaded?: (result: UploadResponse) => void;
}

function fmtCost(c: number): string {
  if (c < 0.01) return `$${c.toFixed(4)}`;
  return `$${c.toFixed(2)}`;
}

export function VaultUploadForm({ orgId, onUploaded }: VaultUploadFormProps) {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("past_proposal");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const bodyLen = body.trim().length;
  const titleLen = title.trim().length;
  const canSubmit =
    !busy && titleLen > 0 && bodyLen >= MIN_BODY_CHARS && bodyLen <= MAX_BODY_CHARS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/vault/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_title: title.trim(),
          doc_type: docType,
          body,
        }),
      });
      const json = (await res.json()) as UploadResponse | ErrorResponse;
      if (!res.ok || "error" in json) {
        const errPayload = json as ErrorResponse;
        setError(errPayload.detail ?? errPayload.error ?? `HTTP ${res.status}`);
        return;
      }
      const ok = json as UploadResponse;
      setResult(ok);
      // Reset form on success so the operator can immediately upload another.
      setTitle("");
      setBody("");
      onUploaded?.(ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-zinc-900 bg-zinc-950 p-6"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="vault-title"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500"
        >
          Document title
        </label>
        <input
          id="vault-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 2024 DYCD Workforce Concept Paper"
          maxLength={200}
          disabled={busy}
          className="rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="vault-doctype"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500"
        >
          Document type
        </label>
        <select
          id="vault-doctype"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
          disabled={busy}
          className="rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="vault-body"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500"
          >
            Paste body (plaintext)
          </label>
          <span
            className={`font-mono text-[10px] ${
              bodyLen >= MIN_BODY_CHARS && bodyLen <= MAX_BODY_CHARS
                ? "text-zinc-500"
                : "text-amber-400"
            }`}
          >
            {bodyLen.toLocaleString()} / {MAX_BODY_CHARS.toLocaleString()} chars
            {bodyLen > 0 && bodyLen < MIN_BODY_CHARS
              ? ` · need ${MIN_BODY_CHARS - bodyLen} more`
              : ""}
          </span>
        </div>
        <textarea
          id="vault-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          placeholder="Paste the full document body here. Plaintext only — PDF and Docx upload arrives in Phase 2."
          disabled={busy}
          className="rounded-md border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-300">
          Indexed {result.chunk_count} chunk{result.chunk_count === 1 ? "" : "s"} (
          {result.total_chars.toLocaleString()} chars) · {result.tokens.toLocaleString()} tokens
          · {fmtCost(result.cost_usd)} · model {result.model}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Indexing…" : "Upload + index"}
        </button>
      </div>
    </form>
  );
}
