/**
 * lib/rfp/review/generate.ts — Reviewer Agent v1 orchestrator.
 *
 * Single Opus pass that reads the five drafted sections against the funder's
 * opportunity brief and emits structured findings + an overall score + an
 * executive summary. No streaming, no inline annotation, no iterative critique
 * — those are Phase 2.
 *
 * Cost: ~$0.50-1.00/run at typical proposal size. Opus pricing $15/M input +
 * $75/M output. The route persists the actual measured cost on the audit row.
 *
 * Honest defaults:
 *  - If the model returns malformed JSON we throw rather than persist garbage.
 *    The route turns that into a 502 so the user can retry.
 *  - We trim excerpts to 280 chars before persistence to keep the row under
 *    the MAX_PERSISTED_BYTES ceiling.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  buildReviewerUserPrompt,
  REVIEWER_SYSTEM_PROMPT,
  ReviewerModelOutputSchema,
  type ReviewerInput,
  type ReviewerResult,
  type ReviewerFinding,
} from "./rubric";

const MODEL = "claude-opus-4-7";

// Opus 4 pricing (USD per million tokens). Keep in sync with
// lib/ai/model-selector.ts which uses the same per-1M numbers.
const PRICE_PER_M_INPUT = 15.0;
const PRICE_PER_M_OUTPUT = 75.0;

// Defensive cap for excerpt length before persistence. Keeps the persisted
// JSON well under MAX_PERSISTED_BYTES even with ~15 findings.
const MAX_EXCERPT_CHARS = 280;

/** Extract the first balanced JSON object from a string. Falls back to the
 * whole string when no fence is present. Survives the model occasionally
 * wrapping output in ```json``` despite the prompt saying not to. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced && fenced[1]) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return raw.trim();
  return raw.slice(first, last + 1);
}

function truncateExcerpt(f: ReviewerFinding): ReviewerFinding {
  if (f.excerpt && f.excerpt.length > MAX_EXCERPT_CHARS) {
    return { ...f, excerpt: f.excerpt.slice(0, MAX_EXCERPT_CHARS - 1) + "…" };
  }
  return f;
}

export async function generateReview(
  input: ReviewerInput,
): Promise<ReviewerResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const client = new Anthropic({ apiKey });
  const session_id = `review_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const res = await client.messages.create({
    model: MODEL,
    // Reviews are bounded — ~15 findings * ~300 chars + summary fits in <3k tokens.
    // 4096 leaves headroom without enabling rambling.
    max_tokens: 4096,
    system: REVIEWER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildReviewerUserPrompt(input) }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text.trim()) {
    throw new Error("reviewer model returned empty content");
  }

  const candidate = extractJson(text);
  let parsed;
  try {
    parsed = ReviewerModelOutputSchema.parse(JSON.parse(candidate));
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    throw new Error(`reviewer JSON parse failed: ${detail.slice(0, 200)}`);
  }

  const findings = parsed.findings.map(truncateExcerpt);

  const tokens_in = res.usage.input_tokens;
  const tokens_out = res.usage.output_tokens;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  return {
    findings,
    overall_score: Math.round(parsed.overall_score),
    summary: parsed.summary,
    tokens_in,
    tokens_out,
    cost_usd,
    model: MODEL,
    session_id,
  };
}
