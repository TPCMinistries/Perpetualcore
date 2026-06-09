"use client";

/**
 * VoiceTrainingForm — Voice Fingerprint v1 trainer.
 *
 * Lives at /org/[orgId]/settings/voice. 3–10 textareas for past documents.
 * Honest copy: "Better data = better drafts. Opus extracts a stylometric
 * profile — this is not fine-tuning, it's a structured voice profile applied
 * to the drafter's system prompt."
 *
 * On success the extracted fingerprint renders below the form as a card with
 * the structured fields. Errors surface inline. No optimistic updates.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { VoiceFingerprint } from "@/lib/rfp/voice/extract";
import { VoiceQuickTrainModal } from "@/components/rfp/VoiceQuickTrainModal";

const MIN_DOCS = 3;
const MAX_DOCS = 10;
const MIN_CHARS_PER_DOC = 100;
const MAX_CHARS_PER_DOC = 50_000;

interface VoiceTrainingFormProps {
  orgId: string;
  initialFingerprint: VoiceFingerprint | null;
}

interface TrainResponse {
  fingerprint: VoiceFingerprint;
  version: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
}

interface ErrorResponse {
  error: string;
  detail?: string;
  partial_success?: boolean;
  fingerprint?: VoiceFingerprint;
}

function fmtCost(c: number): string {
  if (c < 0.01) return `$${c.toFixed(4)}`;
  return `$${c.toFixed(2)}`;
}

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

export function VoiceTrainingForm({ orgId, initialFingerprint }: VoiceTrainingFormProps) {
  const router = useRouter();
  const [docs, setDocs] = useState<string[]>(() => Array.from({ length: MIN_DOCS }, () => ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainResponse | null>(null);
  const [fingerprint, setFingerprint] = useState<VoiceFingerprint | null>(initialFingerprint);

  const filledDocs = useMemo(() => docs.filter((d) => d.trim().length >= MIN_CHARS_PER_DOC), [docs]);
  const canSubmit = !busy && filledDocs.length >= MIN_DOCS && filledDocs.length <= MAX_DOCS;

  function updateDoc(i: number, value: string) {
    setDocs((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function addSlot() {
    if (docs.length >= MAX_DOCS) return;
    setDocs((prev) => [...prev, ""]);
  }

  function removeSlot(i: number) {
    if (docs.length <= MIN_DOCS) return;
    setDocs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/rfp/orgs/${encodeURIComponent(orgId)}/voice/train`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documents: filledDocs }),
      });
      const payload = (await res.json()) as TrainResponse | ErrorResponse;
      if (!res.ok || "error" in payload) {
        const errPayload = payload as ErrorResponse;
        const msg =
          errPayload.error +
          (errPayload.detail ? `: ${errPayload.detail}` : "") +
          (errPayload.partial_success ? " (history snapshot failed but live profile saved)" : "");
        setError(msg);
        // If partial success, still show the fingerprint.
        if (errPayload.partial_success && errPayload.fingerprint) {
          setFingerprint(errPayload.fingerprint);
        }
        return;
      }
      const ok = payload as TrainResponse;
      setResult(ok);
      setFingerprint(ok.fingerprint);
      // Refresh the server-rendered page so the "trained" state propagates.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Honest framing block */}
      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Voice training · preview
          </p>
          <VoiceQuickTrainModal orgId={orgId} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-700">
          Paste 3–10 past proposals, annual reports, founder letters, or board
          memos. Better data = better drafts. Opus extracts a stylometric
          profile — this is not fine-tuning, it&apos;s a structured voice
          profile applied to the drafter&apos;s system prompt.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Each document needs at least {MIN_CHARS_PER_DOC} characters and is
          capped at {MAX_CHARS_PER_DOC.toLocaleString()} characters. No past
          docs handy? Use{" "}
          <span className="text-emerald-600">Or describe your voice</span> at
          the top to synthesize a starting fingerprint you can replace later.
        </p>
      </div>

      {/* Document slots */}
      <div className="flex flex-col gap-6">
        {docs.map((doc, i) => {
          const chars = doc.length;
          const tooShort = chars > 0 && chars < MIN_CHARS_PER_DOC;
          const tooLong = chars > MAX_CHARS_PER_DOC;
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`doc-${i}`}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500"
                >
                  Document {i + 1}
                  {chars > 0 ? (
                    <span
                      className={`ml-3 normal-case tracking-normal ${tooShort || tooLong ? "text-amber-700" : "text-zinc-400"}`}
                    >
                      {chars.toLocaleString()} chars
                      {tooShort ? " · too short" : ""}
                      {tooLong ? " · too long" : ""}
                    </span>
                  ) : null}
                </label>
                {docs.length > MIN_DOCS ? (
                  <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    disabled={busy}
                    className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-rose-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <textarea
                id={`doc-${i}`}
                value={doc}
                onChange={(e) => updateDoc(i, e.target.value)}
                disabled={busy}
                rows={8}
                placeholder="Paste full text. Plain text only. No PDFs."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          );
        })}

        {docs.length < MAX_DOCS ? (
          <button
            type="button"
            onClick={addSlot}
            disabled={busy}
            className="self-start font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-emerald-600 disabled:opacity-40"
          >
            + Add document slot ({docs.length}/{MAX_DOCS})
          </button>
        ) : null}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Extracting voice…" : "Train voice fingerprint"}
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {filledDocs.length}/{MAX_DOCS} valid · 30–60s on Opus
        </p>
      </div>

      {error ? (
        <p className="text-sm text-rose-700">Training failed: {error}</p>
      ) : null}

      {result ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
            Voice trained · v{result.version}
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            {result.tokens_in.toLocaleString()} in · {result.tokens_out.toLocaleString()} out ·{" "}
            {fmtCost(result.cost_usd)} on {result.model}
          </p>
        </div>
      ) : null}

      {/* Current fingerprint card */}
      {fingerprint ? <FingerprintCard fp={fingerprint} /> : null}
    </div>
  );
}

function FingerprintCard({ fp }: { fp: VoiceFingerprint }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <header className="flex items-baseline justify-between border-b border-zinc-200 pb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Current voice fingerprint
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
          v{fp.version} · {fp.source_doc_count} docs · {fmtDate(fp.extracted_at)}
        </span>
      </header>

      <div className="mt-5 space-y-5 text-sm">
        <Field label="Register">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-600">
            {fp.register}
          </span>
        </Field>

        <Field label="Voice summary">
          <p
            className="text-zinc-700 italic leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {fp.voice_summary}
          </p>
        </Field>

        <Field label="Sentence rhythm">
          <p className="font-mono text-xs text-zinc-700">
            ~{Math.round(fp.sentence_length.mean)} chars/sentence (±
            {Math.round(fp.sentence_length.stdev)}) · ~
            {Math.round(fp.paragraph_length.mean)} sentences/paragraph (±
            {Math.round(fp.paragraph_length.stdev)})
          </p>
        </Field>

        <Field label={`Signature phrases (${fp.signature_phrases.length})`}>
          <ul className="space-y-1 text-sm text-zinc-700">
            {fp.signature_phrases.map((p, i) => (
              <li key={i}>
                <span className="text-zinc-400">·</span> {p}
              </li>
            ))}
          </ul>
        </Field>

        <Field label={`Avoided terms (${fp.avoided_terms.length})`}>
          <p className="text-sm text-zinc-700">{fp.avoided_terms.join(", ")}</p>
        </Field>

        <Field label={`Framing patterns (${fp.framing_patterns.length})`}>
          <ol className="space-y-1 text-sm text-zinc-700">
            {fp.framing_patterns.map((p, i) => (
              <li key={i}>
                <span className="text-zinc-400">{i + 1}.</span> {p}
              </li>
            ))}
          </ol>
        </Field>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr] sm:items-baseline sm:gap-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
