/**
 * lib/rfp/voice/from-description.ts — Voice Fingerprint side-door extractor.
 *
 * Solves the cold-start problem: the canonical /train flow needs 3-10 past
 * proposals or annual reports, which most first-time users don't have queued
 * up. This module accepts a natural-language description of the org's voice
 * (plus an optional single writing sample) and synthesizes a usable
 * VoiceFingerprint via gpt-4o.
 *
 * Honest framing: the resulting fingerprint is GOOD ENOUGH TO DRAFT NOW. It's
 * a training-wheels version; the user should re-train via /train with real
 * past proposals once they have any. The drafter doesn't care which path
 * produced the fingerprint — the schema is identical.
 *
 * Cost: ~$0.005 per call (small input + ~1k output tokens). Same OpenAI key
 * as the canonical extractor.
 */

import OpenAI from "openai";
import type {
  VoiceFingerprint,
  VoiceRegister,
  VoiceExtractionResult,
} from "./extract";
import { VOICE_REGISTERS, VOICE_FINGERPRINT_VERSION } from "./extract";

export const MIN_DESCRIPTION_CHARS = 50;
export const MAX_DESCRIPTION_CHARS = 2000;
export const MAX_SAMPLE_CHARS = 8000;

const MODEL = "gpt-4o";
const MAX_OUTPUT_TOKENS = 1500;

// gpt-4o pricing (USD per million tokens). Mirrors lib/rfp/voice/extract.ts.
const PRICE_PER_M_INPUT = 2.5;
const PRICE_PER_M_OUTPUT = 10.0;

const SYSTEM_PROMPT = `You are an expert stylometric analyst building an organization's voice fingerprint from a SHORT NATURAL-LANGUAGE DESCRIPTION written by the user, plus optionally a single writing sample.

This is the "training wheels" path — the user does not have 3+ past proposals to feed the canonical extractor. Your job is to produce a VoiceFingerprint shape that is GOOD ENOUGH for the drafter to use immediately, knowing the user will re-train against real documents later.

Inputs:
1. A description from the user — how they describe their org's voice in their own words. Sentences about formality, what kinds of phrases they use, what jargon they avoid, etc.
2. (Optional) A single writing sample — a paragraph or two of something the org has actually written. Treat this as AUTHORITATIVE for measurable fields when present.

Outputs (return ONLY a JSON object matching this schema):
{
  "sentence_length": { "mean": <number>, "stdev": <number> },
  "paragraph_length": { "mean": <number>, "stdev": <number> },
  "signature_phrases": [<3-8 strings>],
  "framing_patterns": [<2-4 strings>],
  "avoided_terms": [<3-8 strings>],
  "register": "<one of: formal|neighborly|technical|evidentiary|narrative>",
  "voice_summary": "<2-3 sentence description>"
}

How to derive each field:
- **sentence_length / paragraph_length**:
  - If a sample is provided: MEASURE from the sample. Count characters per actual sentence; count sentences per blank-line-delimited paragraph. Report real mean + stdev.
  - If no sample: synthesize plausible values consistent with the described register. Rough anchors: formal/technical/evidentiary → sentence mean ~120-160 chars, stdev ~40; neighborly → ~70-110 chars, stdev ~25; narrative → ~100-140 chars, stdev ~35. Paragraph mean ~3-5 sentences, stdev ~1.5.
- **signature_phrases**: 3-8 phrases. If the description quotes specific phrases the org uses, use those verbatim. If not, infer 3-5 plausible phrases consistent with the described voice. Be honest — fewer is better than padded.
- **framing_patterns**: 2-4 descriptive sentences about HOW the org structures things, derived from the description. Example: "leads with the people served, then names the program", "frames interventions as continuations of existing community work."
- **avoided_terms**: 3-8 buzzwords the description implies the org avoids. If the user explicitly names terms they avoid, use those. If they describe a register (e.g. "plain-spoken, neighborly"), infer the jargon they'd avoid given their sector.
- **register**: pick the dominant one from formal | neighborly | technical | evidentiary | narrative. If the description says "we sound like X", honor that.
- **voice_summary**: 2-3 concrete operational sentences ANOTHER MODEL will use as system prompt context when drafting. Example: "Writes in plain second-person when describing community work, then shifts to evidentiary third-person for outcomes. Leads with a person, not a program."

Hard rules:
- Output is a single JSON object. No prose, no markdown, no code fences.
- Numeric means must be positive integers; stdevs must be non-negative numbers.
- All arrays must have at least the minimum number of items per the schema above.
- register must be one of the five enum values exactly.`;

function buildUserPrompt(description: string, sample: string | null): string {
  const parts: string[] = [];
  parts.push("DESCRIPTION OF VOICE (user's own words):");
  parts.push(description.trim());
  if (sample && sample.trim()) {
    parts.push("");
    parts.push("WRITING SAMPLE (use for measurable fields when possible):");
    parts.push(sample.trim());
  } else {
    parts.push("");
    parts.push("(No writing sample provided — synthesize sentence_length and paragraph_length from the description's described register.)");
  }
  return parts.join("\n");
}

function validateModelOutput(parsed: unknown): {
  sentence_length: { mean: number; stdev: number };
  paragraph_length: { mean: number; stdev: number };
  signature_phrases: string[];
  framing_patterns: string[];
  avoided_terms: string[];
  register: VoiceRegister;
  voice_summary: string;
} {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("voice_from_desc_invalid_shape: top-level not an object");
  }
  const p = parsed as Record<string, unknown>;

  function num(field: string): number {
    const v = p[field];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`voice_from_desc_invalid_shape: ${field} must be a finite number`);
    }
    return v;
  }
  function numIn(parent: string, key: string): number {
    const sub = (p[parent] as Record<string, unknown> | undefined) ?? {};
    const v = sub[key];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`voice_from_desc_invalid_shape: ${parent}.${key} must be a finite number`);
    }
    return v;
  }
  function stringArray(field: string, min: number): string[] {
    const v = p[field];
    if (!Array.isArray(v)) {
      throw new Error(`voice_from_desc_invalid_shape: ${field} must be an array`);
    }
    const cleaned = v.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
    if (cleaned.length < min) {
      throw new Error(`voice_from_desc_invalid_shape: ${field} needs at least ${min} items`);
    }
    return cleaned;
  }
  // Use the parent num helper unused-warning shut up — kept for symmetry / future fields.
  void num;

  const register = typeof p.register === "string" ? p.register : "";
  if (!(VOICE_REGISTERS as readonly string[]).includes(register)) {
    throw new Error(`voice_from_desc_invalid_shape: register "${register}" not in allowed enum`);
  }
  const voice_summary = typeof p.voice_summary === "string" ? p.voice_summary.trim() : "";
  if (voice_summary.length < 20) {
    throw new Error("voice_from_desc_invalid_shape: voice_summary too short");
  }

  return {
    sentence_length: {
      mean: Math.max(1, Math.round(numIn("sentence_length", "mean"))),
      stdev: Math.max(0, numIn("sentence_length", "stdev")),
    },
    paragraph_length: {
      mean: Math.max(1, Math.round(numIn("paragraph_length", "mean"))),
      stdev: Math.max(0, numIn("paragraph_length", "stdev")),
    },
    signature_phrases: stringArray("signature_phrases", 3),
    framing_patterns: stringArray("framing_patterns", 2),
    avoided_terms: stringArray("avoided_terms", 3),
    register: register as VoiceRegister,
    voice_summary,
  };
}

/**
 * Extract a VoiceFingerprint from a natural-language description and an
 * optional single writing sample. Throws on bad input or malformed output.
 */
export async function extractFingerprintFromDescription(
  description: string,
  sample?: string | null,
): Promise<VoiceExtractionResult> {
  const trimmedDesc = description.trim();
  if (
    trimmedDesc.length < MIN_DESCRIPTION_CHARS ||
    trimmedDesc.length > MAX_DESCRIPTION_CHARS
  ) {
    throw new Error(
      `voice_from_desc_bad_input: description must be ${MIN_DESCRIPTION_CHARS}-${MAX_DESCRIPTION_CHARS} chars, got ${trimmedDesc.length}`,
    );
  }
  const trimmedSample = sample?.trim() ?? "";
  if (trimmedSample.length > MAX_SAMPLE_CHARS) {
    throw new Error(
      `voice_from_desc_bad_input: sample must be ≤${MAX_SAMPLE_CHARS} chars, got ${trimmedSample.length}`,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("voice_from_desc_no_api_key: OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });
  const session_id = `voice_qt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(trimmedDesc, trimmedSample || null) },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `voice_from_desc_invalid_json: ${err instanceof Error ? err.message : "parse error"}`,
    );
  }

  const validated = validateModelOutput(parsed);

  const fingerprint: VoiceFingerprint = {
    version: VOICE_FINGERPRINT_VERSION,
    extracted_at: new Date().toISOString(),
    source_doc_count: trimmedSample ? 1 : 0,
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
