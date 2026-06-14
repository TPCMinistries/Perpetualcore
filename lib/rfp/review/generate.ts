/**
 * lib/rfp/review/generate.ts — Reviewer Agent v1 orchestrator.
 *
 * Phase 19-02 upgrade: Anthropic-first model chain
 * (claude-sonnet-4-5-20250929 → claude-haiku-4-5-20251001 → gpt-4o fallback),
 * rubric-anchored criterion_id
 * sanitization, and computeCostUsd from the guardrail.
 *
 * Contract (preserved from v1):
 *   - Returns ReviewerResult on success.
 *   - Throws only when the full model chain has been exhausted — the route
 *     turns that into a 502 so the user can retry rather than store junk.
 *
 * Honest defaults:
 *  - If a model returns malformed JSON or a Zod parse failure, we fall through
 *    to the next model in the chain. Only after all three fail do we throw.
 *  - We trim excerpts to 280 chars before persistence to keep the row under
 *    the MAX_PERSISTED_BYTES ceiling.
 *  - criterion_id values are sanitized against the provided rubric_criteria ids
 *    after Zod parse — unknown ids are set to null, the finding is kept.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  buildReviewerUserPrompt,
  REVIEWER_SYSTEM_PROMPT,
  ReviewerModelOutputSchema,
  type ReviewerInput,
  type ReviewerResult,
  type ReviewerFinding,
} from "./rubric";
import { computeCostUsd } from "@/lib/rfp/ai/guardrail";

// ---------------------------------------------------------------------------
// Model chain (mirrors lib/rfp/scoring/summary.ts pattern exactly)
// ---------------------------------------------------------------------------

const MODEL_PRIMARY = "claude-sonnet-4-5-20250929";
const MODEL_FALLBACK = "claude-haiku-4-5-20251001";
const MODEL_OPENAI_FALLBACK = "gpt-4o";
const MODEL_CHAIN = [MODEL_PRIMARY, MODEL_FALLBACK, MODEL_OPENAI_FALLBACK];

// ---------------------------------------------------------------------------
// Lazy client init (matches summary.ts pattern)
// ---------------------------------------------------------------------------

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

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

/**
 * Sanitize criterion_id values against provided criteria ids.
 * Unknown/malformed ids → null; finding is kept (never dropped).
 */
function sanitizeCriterionId(
  f: ReviewerFinding,
  knownIds: Set<string>,
): ReviewerFinding {
  if (f.criterion_id == null) return f;
  if (!knownIds.has(f.criterion_id)) {
    return { ...f, criterion_id: null };
  }
  return f;
}

/**
 * Call one model and return raw text + usage, or null on any per-model failure.
 * Dispatches on model id: gpt-* → OpenAI, else → Anthropic. Never throws.
 */
async function callModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ rawText: string; tokensIn: number; tokensOut: number } | null> {
  try {
    if (model.startsWith("gpt-")) {
      const client = getOpenAI();
      if (!client) return null;
      const resp = await client.chat.completions.create({
        model,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const rawText = (resp.choices[0]?.message?.content ?? "").trim();
      if (!rawText) return null;
      return {
        rawText,
        tokensIn: resp.usage?.prompt_tokens ?? 0,
        tokensOut: resp.usage?.completion_tokens ?? 0,
      };
    } else {
      // Anthropic branch
      const client = getAnthropic();
      if (!client) return null;
      const resp = await client.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const rawText = resp.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("")
        .trim();
      if (!rawText) return null;
      return {
        rawText,
        tokensIn: resp.usage?.input_tokens ?? 0,
        tokensOut: resp.usage?.output_tokens ?? 0,
      };
    }
  } catch {
    return null;
  }
}

export async function generateReview(
  input: ReviewerInput,
): Promise<ReviewerResult> {
  const session_id = `review_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const userPrompt = buildReviewerUserPrompt(input);
  const knownCriterionIds = new Set(
    (input.rubric_criteria ?? []).map((c) => c.id),
  );

  let lastError = "all models in chain failed";

  for (const model of MODEL_CHAIN) {
    let raw: { rawText: string; tokensIn: number; tokensOut: number } | null =
      null;
    try {
      raw = await callModel(model, REVIEWER_SYSTEM_PROMPT, userPrompt);
    } catch {
      // callModel never throws, but be safe
      continue;
    }

    if (!raw) continue;
    if (!raw.rawText.trim()) continue;

    // Attempt Zod parse — fall through on failure
    const candidate = extractJson(raw.rawText);
    let parsed;
    try {
      parsed = ReviewerModelOutputSchema.parse(JSON.parse(candidate));
    } catch (err) {
      lastError =
        err instanceof Error
          ? `${model}: JSON/Zod parse failed: ${err.message.slice(0, 200)}`
          : `${model}: parse failed`;
      continue;
    }

    // Sanitize findings: truncate excerpts + null-out unknown criterion_ids
    const findings = parsed.findings
      .map(truncateExcerpt)
      .map((f) =>
        knownCriterionIds.size > 0 ? sanitizeCriterionId(f, knownCriterionIds) : f,
      );

    const tokens_in = raw.tokensIn;
    const tokens_out = raw.tokensOut;
    const cost_usd = computeCostUsd(model, tokens_in, tokens_out);

    return {
      findings,
      overall_score: Math.round(parsed.overall_score),
      summary: parsed.summary,
      tokens_in,
      tokens_out,
      cost_usd,
      model,
      session_id,
    };
  }

  // Full chain exhausted — throw (route converts to 502, user can retry)
  throw new Error(`reviewer model chain exhausted: ${lastError}`);
}
