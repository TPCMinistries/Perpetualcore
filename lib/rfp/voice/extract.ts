/**
 * lib/rfp/voice/extract.ts — Voice Fingerprint v1 extractor.
 *
 * Single GPT-4o pass over 3–10 user-supplied past proposals / annual reports /
 * founder letters. Produces a structured stylometric profile the drafter
 * prepends to its system prompt. This is NOT model fine-tuning, NOT RAG-
 * grounded retrieval, NOT a reviewer — it is a deterministic, structured
 * voice profile applied as system-prompt context. Subsequent phases (vault
 * grounding, reviewer, true fine-tuning) layer on top.
 *
 * Cost: GPT-4o pricing $2.50/M input + $10/M output. v1 input ~6K–25K tokens
 * (depending on doc count + length) and ~1.2K tokens output → measured
 * cost falls in $0.03–$0.10 per extraction. Cheap enough to re-run on each
 * org as their past work grows. JSON-mode is enforced so we never have to
 * fight code fences in the output.
 *
 * Honest defaults:
 *  - If the model returns malformed JSON we throw rather than persist garbage.
 *  - We cap input documents at 50K chars apiece before sending; longer
 *    documents are truncated with an explicit "[…truncated]" marker so the
 *    model sees the cutoff. Token budget on Opus is generous but cost is not.
 *  - The schema is conservative: we ask for the data we know how to apply,
 *    nothing speculative. Adding fields later is cheap; removing them costs us.
 */

import OpenAI from "openai";

/** Per-document cap before truncation. Keeps the worst-case input bounded. */
export const MAX_DOC_CHARS = 50_000;

/** Honest input cap — refuse more than this so we never accidentally burn $5 on a run. */
export const MIN_DOCS = 3;
export const MAX_DOCS = 10;

export const VOICE_FINGERPRINT_VERSION = 1 as const;

const MODEL = "gpt-4o";

// GPT-4o pricing (USD per million tokens). Keep in sync with
// lib/rfp/review/generate.ts and lib/rfp/draft/generate.ts.
const PRICE_PER_M_INPUT = 2.5;
const PRICE_PER_M_OUTPUT = 10.0;

const MAX_OUTPUT_TOKENS = 3000;

export type VoiceRegister =
  | "formal"
  | "neighborly"
  | "technical"
  | "evidentiary"
  | "narrative";

export const VOICE_REGISTERS: readonly VoiceRegister[] = [
  "formal",
  "neighborly",
  "technical",
  "evidentiary",
  "narrative",
] as const;

export interface VoiceFingerprint {
  version: 1;
  /** ISO 8601 timestamp recorded at extraction time. */
  extracted_at: string;
  /** Number of source documents fed to the extractor. */
  source_doc_count: number;
  /** Mean + stdev of sentence length in characters. */
  sentence_length: { mean: number; stdev: number };
  /** Mean + stdev of paragraph length in sentences. */
  paragraph_length: { mean: number; stdev: number };
  /** 5–10 distinctive phrases the org actually uses. */
  signature_phrases: string[];
  /** 3–5 framing patterns: how they introduce themselves, position need, etc. */
  framing_patterns: string[];
  /** 5–10 buzzwords/jargon they conspicuously DON'T use. */
  avoided_terms: string[];
  /** Register tag — one of formal/neighborly/technical/evidentiary/narrative. */
  register: VoiceRegister;
  /** 2–3 sentence voice summary the drafter prepends to its system prompt. */
  voice_summary: string;
}

export interface VoiceExtractionResult {
  fingerprint: VoiceFingerprint;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
  session_id: string;
}

/** Narrowest possible runtime check — sufficient to differentiate "trained"
 * vs "empty default" without depending on Zod. Persisted shape is JSONB so
 * we have to be defensive when reading it back. */
export function isVoiceFingerprint(value: unknown): value is VoiceFingerprint {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return false;
  if (typeof v.voice_summary !== "string" || v.voice_summary.length < 10) return false;
  if (typeof v.register !== "string") return false;
  if (!VOICE_REGISTERS.includes(v.register as VoiceRegister)) return false;
  return true;
}

const SYSTEM_PROMPT = `You are an expert stylometric analyst extracting the voice fingerprint of an organization from samples of its written work (past proposals, annual reports, founder letters, board memos).

You produce a structured JSON profile that another writer can apply to draft new proposals in the same voice. You measure, you do not invent. Where the documents do not support a claim, you say so or omit it.

Voice fingerprint definition:
- sentence_length: average characters per sentence across all docs, plus stdev. Count actual characters in actual sentences. Be honest about variance.
- paragraph_length: average number of sentences per paragraph, plus stdev. Count blank-line-delimited paragraphs.
- signature_phrases: 5–10 phrases that recur across documents AND are distinctive (avoid generic phrasing). Quote exactly as written. If you can't find 5 truly distinctive phrases, return fewer — do not pad.
- framing_patterns: 3–5 patterns describing HOW the org structures arguments. Examples: "leads with named beneficiary count before problem statement", "positions interventions as continuations of existing community work rather than new programs", "names a specific neighborhood/zip before naming the program". Each pattern is a single descriptive sentence.
- avoided_terms: 5–10 buzzwords or jargon the org conspicuously does NOT use given its sector (e.g. a community nonprofit that avoids "stakeholders", "leverage", "synergy"). Only include terms whose absence is meaningful given the sector.
- register: one of formal | neighborly | technical | evidentiary | narrative. Pick the dominant register; if mixed, pick the one that appears most in proposal-adjacent passages.
- voice_summary: 2–3 sentences describing this voice for use in another model's system prompt. Concrete and operational. Example: "Writes in plain second-person when describing community work, then shifts to evidentiary third-person for outcomes. Leads with a person, not a program. Avoids policy abstractions."

Output format — STRICT:
Return ONLY a single JSON object matching the schema below. No prose, no markdown, no code fences. Begin your response with '{' and end with '}'.

Schema:
{
  "sentence_length": { "mean": <number>, "stdev": <number> },
  "paragraph_length": { "mean": <number>, "stdev": <number> },
  "signature_phrases": [<5-10 strings>],
  "framing_patterns": [<3-5 strings>],
  "avoided_terms": [<5-10 strings>],
  "register": "<one of: formal|neighborly|technical|evidentiary|narrative>",
  "voice_summary": "<2-3 sentence description>"
}`;

function buildUserPrompt(documents: string[]): string {
  const truncated = documents.map((doc, i) => {
    const isTruncated = doc.length > MAX_DOC_CHARS;
    const body = isTruncated ? doc.slice(0, MAX_DOC_CHARS) + "\n[…truncated]" : doc;
    return `### Document ${i + 1} (${doc.length.toLocaleString()} chars${isTruncated ? ", truncated" : ""})\n\n${body}`;
  });

  return `The following ${documents.length} document(s) are samples of the organization's written work. Extract the voice fingerprint.

${truncated.join("\n\n---\n\n")}

Return the JSON profile now.`;
}

/** Extract the first balanced JSON object from a string. Survives the model
 * occasionally wrapping output in code fences despite the prompt saying not to. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced && fenced[1]) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return raw.trim();
  return raw.slice(first, last + 1);
}

interface ModelOutput {
  sentence_length: { mean: number; stdev: number };
  paragraph_length: { mean: number; stdev: number };
  signature_phrases: string[];
  framing_patterns: string[];
  avoided_terms: string[];
  register: VoiceRegister;
  voice_summary: string;
}

function validateModelOutput(parsed: unknown): ModelOutput {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("voice_extract_invalid_output: not an object");
  }
  const p = parsed as Record<string, unknown>;

  const sl = p.sentence_length as { mean?: unknown; stdev?: unknown } | undefined;
  const pl = p.paragraph_length as { mean?: unknown; stdev?: unknown } | undefined;
  if (
    !sl ||
    typeof sl.mean !== "number" ||
    typeof sl.stdev !== "number" ||
    !pl ||
    typeof pl.mean !== "number" ||
    typeof pl.stdev !== "number"
  ) {
    throw new Error("voice_extract_invalid_output: missing length stats");
  }

  if (
    !Array.isArray(p.signature_phrases) ||
    !p.signature_phrases.every((s) => typeof s === "string")
  ) {
    throw new Error("voice_extract_invalid_output: signature_phrases not string[]");
  }
  if (
    !Array.isArray(p.framing_patterns) ||
    !p.framing_patterns.every((s) => typeof s === "string")
  ) {
    throw new Error("voice_extract_invalid_output: framing_patterns not string[]");
  }
  if (
    !Array.isArray(p.avoided_terms) ||
    !p.avoided_terms.every((s) => typeof s === "string")
  ) {
    throw new Error("voice_extract_invalid_output: avoided_terms not string[]");
  }
  if (
    typeof p.register !== "string" ||
    !VOICE_REGISTERS.includes(p.register as VoiceRegister)
  ) {
    throw new Error(`voice_extract_invalid_output: bad register ${String(p.register)}`);
  }
  if (typeof p.voice_summary !== "string" || p.voice_summary.length < 10) {
    throw new Error("voice_extract_invalid_output: voice_summary missing or too short");
  }

  return {
    sentence_length: { mean: sl.mean, stdev: sl.stdev },
    paragraph_length: { mean: pl.mean, stdev: pl.stdev },
    signature_phrases: p.signature_phrases as string[],
    framing_patterns: p.framing_patterns as string[],
    avoided_terms: p.avoided_terms as string[],
    register: p.register as VoiceRegister,
    voice_summary: p.voice_summary as string,
  };
}

export async function extractVoiceFingerprint(
  documents: string[],
): Promise<VoiceExtractionResult> {
  if (documents.length < MIN_DOCS || documents.length > MAX_DOCS) {
    throw new Error(
      `voice_extract_bad_input: need ${MIN_DOCS}-${MAX_DOCS} documents, got ${documents.length}`,
    );
  }
  if (documents.some((d) => typeof d !== "string" || d.length < 100)) {
    throw new Error(
      "voice_extract_bad_input: each document must be a string of at least 100 chars",
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const session_id = `voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(documents) },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch (err) {
    throw new Error(
      `voice_extract_invalid_json: ${err instanceof Error ? err.message : "parse error"}`,
    );
  }

  const validated = validateModelOutput(parsed);

  const fingerprint: VoiceFingerprint = {
    version: VOICE_FINGERPRINT_VERSION,
    extracted_at: new Date().toISOString(),
    source_doc_count: documents.length,
    ...validated,
  };

  const tokens_in = res.usage?.prompt_tokens ?? 0;
  const tokens_out = res.usage?.completion_tokens ?? 0;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  return {
    fingerprint,
    tokens_in,
    tokens_out,
    cost_usd,
    model: MODEL,
    session_id,
  };
}
