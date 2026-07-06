"use client";

/**
 * VaultUploadForm — Vault Grounding upload form.
 *
 * Two input modes:
 *   - Paste plaintext (original v1 flow)
 *   - Upload a PDF or DOCX file (extracts text server-side via pdf-parse
 *     or mammoth, then routes into the same chunk/embed/insert pipeline)
 *
 * On success we call onUploaded() so the parent can refresh the artifact
 * list without a full route reload.
 */

import { useRef, useState } from "react";

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

type InputMode = "paste" | "file";

export function VaultUploadForm({ orgId, onUploaded }: VaultUploadFormProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("past_proposal");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bodyLen = body.trim().length;
  const titleLen = title.trim().length;
  const canSubmit =
    !busy &&
    titleLen > 0 &&
    (mode === "paste"
      ? bodyLen >= MIN_BODY_CHARS && bodyLen <= MAX_BODY_CHARS
      : file !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      let res: Response;
      if (mode === "file" && file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("doc_title", title.trim());
        fd.append("doc_type", docType);
        res = await fetch(`/api/rfp/orgs/${orgId}/vault/upload-file`, {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetch(`/api/rfp/orgs/${orgId}/vault/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doc_title: title.trim(),
            doc_type: docType,
            body,
          }),
        });
      }
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
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      <div className="flex gap-1 rounded-md border border-zinc-800 bg-black p-1">
        <button
          type="button"
          onClick={() => setMode("paste")}
          disabled={busy}
          className={`flex-1 rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
            mode === "paste"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Paste text
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          disabled={busy}
          className={`flex-1 rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
            mode === "file"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Upload PDF / DOCX
        </button>
      </div>

      {mode === "paste" ? (
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
            placeholder="Paste the full document body here."
            disabled={busy}
            className="rounded-md border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="vault-file"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500"
          >
            File (PDF or DOCX, max 20 MB)
          </label>
          <input
            ref={fileInputRef}
            id="vault-file"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
            className="block w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-100 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-[11px] file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
          />
          {file ? (
            <div className="font-mono text-[10px] text-zinc-500">
              {file.name} · {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
            </div>
          ) : (
            <div className="font-mono text-[10px] text-zinc-600">
              Server extracts text via pdf-parse or mammoth, then runs the same chunk + embed pipeline as paste mode.
            </div>
          )}
        </div>
      )}

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
