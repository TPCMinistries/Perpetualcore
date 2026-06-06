/**
 * lib/rfp/voice/apply.ts — turns a VoiceFingerprint into a system-prompt
 * fragment the drafter prepends ahead of its own system prompt.
 *
 * Honest framing: this is system-prompt augmentation, not fine-tuning, not
 * RAG. The drafter still doesn't know any organization-specific facts — it
 * just speaks in a closer cadence and uses/avoids phrases the org has
 * actually used/avoided in the past.
 *
 * The fragment is intentionally short. Sonnet handles long context but the
 * highest-leverage stylistic guidance lives in the first ~400 tokens.
 */

import type { VoiceFingerprint } from "./extract";

/**
 * Build a system-prompt fragment from a fingerprint. Format is human-readable
 * because the model treats it as content, not config. We avoid markdown
 * headings (no `#`) since the drafter system prompt itself is plain text.
 */
export function applyVoiceFingerprint(fp: VoiceFingerprint): string {
  const sl = fp.sentence_length;
  const pl = fp.paragraph_length;

  const phrases =
    fp.signature_phrases.length > 0 ? fp.signature_phrases.join("; ") : "(none extracted)";
  const avoided =
    fp.avoided_terms.length > 0 ? fp.avoided_terms.join(", ") : "(none extracted)";
  const framings =
    fp.framing_patterns.length > 0
      ? fp.framing_patterns.map((p, i) => `  ${i + 1}. ${p}`).join("\n")
      : "  (none extracted)";

  return `Voice fingerprint for this organization (apply throughout — don't quote it back, internalize it):
- Register: ${fp.register}
- Voice summary: ${fp.voice_summary}
- Use these phrases when they fit: ${phrases}
- AVOID these terms (the org explicitly doesn't use them): ${avoided}
- Sentence rhythm: keep average sentence length near ${Math.round(sl.mean)} chars (±${Math.round(sl.stdev)}); paragraphs run ~${Math.round(pl.mean)} sentences.
- Framing patterns:
${framings}`;
}
