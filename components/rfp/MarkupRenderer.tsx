"use client";

/**
 * MarkupRenderer — renders proposal section text with two marker grammars:
 *
 *   [VERIFY: <claim>]      → amber-highlighted pill (placeholder to confirm)
 *   [CITE: vault-<N>]      → numbered emerald pill; popover surfaces the
 *                            source vault chunk (title, snippet, similarity).
 *
 * The N in `vault-N` is 1-indexed into the `vaultChunks` prop. If a citation
 * references an N out of range (older proposal predating vault_chunks_used
 * persistence, or a malformed model output), the pill still renders but
 * shows a "source unavailable" state — never crashes the proposal view.
 *
 * Read mode only. The editor textarea is plain text; markers are visible as
 * raw `[CITE:…]` / `[VERIFY:…]` during edit so writers can type/edit them.
 */

import { Fragment, useId } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CitationChunk {
  id?: string;
  doc_id?: string;
  doc_title: string;
  doc_type: string;
  chunk_index?: number;
  text_preview: string;
  similarity_score?: number;
}

interface MarkupRendererProps {
  text: string;
  vaultChunks?: CitationChunk[];
}

// Single regex captures both grammars. We rely on capture groups to discriminate:
//   group 1 (VERIFY body) OR group 2 (CITE N).
const MARKUP_RE = /\[VERIFY:([^\]]*)\]|\[CITE: vault-(\d+)\]/g;

type ParsedPart =
  | { kind: "text"; value: string }
  | { kind: "verify"; raw: string; body: string }
  | { kind: "cite"; raw: string; n: number };

function parse(text: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(MARKUP_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, start) });
    }
    if (match[1] !== undefined) {
      parts.push({ kind: "verify", raw: match[0], body: match[1] });
    } else if (match[2] !== undefined) {
      const n = parseInt(match[2], 10);
      if (Number.isFinite(n) && n > 0) {
        parts.push({ kind: "cite", raw: match[0], n });
      } else {
        parts.push({ kind: "text", value: match[0] });
      }
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }
  return parts;
}

function fmtSimilarity(score: number | undefined): string {
  if (score === undefined || !Number.isFinite(score)) return "—";
  return score.toFixed(2);
}

export function MarkupRenderer({ text, vaultChunks }: MarkupRendererProps) {
  const baseId = useId();
  if (!text) return null;
  const parts = parse(text);
  const chunks = vaultChunks ?? [];

  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "text") {
          return <Fragment key={`${baseId}-${i}`}>{p.value}</Fragment>;
        }
        if (p.kind === "verify") {
          return (
            <span
              key={`${baseId}-${i}`}
              className="rounded-sm border border-amber-200 bg-amber-50 px-1 text-amber-700"
              title="AI inferred this — please confirm before submission"
            >
              {p.raw}
            </span>
          );
        }
        // p.kind === "cite"
        const chunk = chunks[p.n - 1];
        if (!chunk) {
          return (
            <span
              key={`${baseId}-${i}`}
              className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-1.5 text-[10px] font-mono text-zinc-500"
              title={`Citation vault-${p.n} — source unavailable in this proposal's vault snapshot`}
            >
              vault-{p.n}
            </span>
          );
        }
        return (
          <Popover key={`${baseId}-${i}`}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="mx-0.5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 align-[1px] text-[10px] font-mono text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                aria-label={`Citation ${p.n} — source: ${chunk.doc_title}`}
              >
                {p.n}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-96 border-zinc-200 bg-white p-4 text-zinc-700"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-700">
                  Vault citation · {p.n}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                  sim {fmtSimilarity(chunk.similarity_score)}
                </span>
              </div>
              <div
                className="mt-2 text-[13px] italic text-zinc-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {chunk.doc_title}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {chunk.doc_type}
                {typeof chunk.chunk_index === "number"
                  ? ` · chunk ${chunk.chunk_index + 1}`
                  : ""}
              </div>
              <blockquote className="mt-3 max-h-48 overflow-y-auto border-l-2 border-zinc-300 pl-3 text-[12px] leading-relaxed text-zinc-600">
                {chunk.text_preview}
              </blockquote>
            </PopoverContent>
          </Popover>
        );
      })}
    </>
  );
}
