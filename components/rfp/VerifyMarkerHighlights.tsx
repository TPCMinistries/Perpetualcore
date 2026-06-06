"use client";

/**
 * VerifyMarkerHighlights — renders proposal section text with [VERIFY: ...]
 * markers wrapped in a styled span so a writer can spot them at a glance.
 *
 * Used in read mode only. Edit mode is plain text in a <textarea>.
 *
 * The marker grammar matches what the drafter emits (see lib/rfp/draft/sections.ts):
 *   [VERIFY: <claim>]
 * The match is intentionally non-greedy and stops at the first `]` so nested
 * brackets in the claim don't break highlighting.
 */

import { Fragment } from "react";

const VERIFY_RE = /\[VERIFY:[^\]]*\]/g;

export function VerifyMarkerHighlights({ text }: { text: string }) {
  if (!text) return null;
  const parts: Array<{ kind: "text" | "verify"; value: string }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(VERIFY_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, start) });
    }
    parts.push({ kind: "verify", value: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.kind === "verify" ? (
          <span
            key={i}
            className="rounded-sm bg-amber-300/15 px-1 text-amber-300"
          >
            {p.value}
          </span>
        ) : (
          <Fragment key={i}>{p.value}</Fragment>
        ),
      )}
    </>
  );
}
