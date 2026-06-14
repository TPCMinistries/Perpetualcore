/**
 * lib/rfp/rubric/extract.ts — Phase 19-01: Structured rubric extraction
 *
 * Extracts structured evaluation criteria (Section L/M for federal RFPs;
 * funder priority / review criteria sections for grants) from solicitation
 * text using Claude Structured Outputs + Zod schema validation.
 *
 * Model chain (Anthropic-first, mirrors lib/rfp/scoring/summary.ts exactly):
 *   Primary:    claude-sonnet-4-5
 *   Fallback:   claude-haiku-4-5
 *   Last resort: gpt-4o (added because Anthropic credit can exhaust)
 *
 * Hallucination guards (PITFALLS.md Pitfall 2 + Pitfall 6):
 *   - criterion_text MUST be a verbatim sentence from the solicitation
 *   - is_inferred: true when weight/max_points are derived not stated
 *   - Returns empty criteria array when no criteria exist — never invents
 *
 * Caching: caller is responsible for checking rfp_rubric_criteria before
 * calling. This module is a pure generator; cache logic lives in the route.
 *
 * Budget: callers MUST wrap extractRubricCriteria in guardedLLMCall.
 * This module does NOT call guardedLLMCall internally (same contract as
 * generateExplainedSummary in summary.ts — caller wraps, never this fn).
 *
 * @returns ExtractionOutput with criteria + metadata | null on total failure.
 * Never throws.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { computeCostUsd } from '@/lib/rfp/ai/guardrail';

// ---------------------------------------------------------------------------
// Zod schemas (per 19-RESEARCH.md Pattern 2)
// ---------------------------------------------------------------------------

export const RubricCriterionSchema = z.object({
  section_ref: z.string().min(1).max(160),
  criterion_text: z.string().min(1),
  max_points: z.number().nullable(),
  weight: z.number().min(0).max(1).nullable(),
  is_inferred: z.boolean(),
});

export const RubricExtractionOutputSchema = z.object({
  criteria: z.array(RubricCriterionSchema).max(30),
  document_type: z.enum([
    'federal_rfp',
    'federal_grant',
    'foundation_grant',
    'state_rfp',
    'other',
  ]),
  has_explicit_scoring: z.boolean(),
});

export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;
export type RubricExtractionOutput = z.infer<typeof RubricExtractionOutputSchema>;

// ---------------------------------------------------------------------------
// Return type from extractRubricCriteria
// ---------------------------------------------------------------------------

export interface RubricExtractionResult extends RubricExtractionOutput {
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
  session_id: string;
}

// ---------------------------------------------------------------------------
// Lazy clients — same pattern as lib/rfp/scoring/summary.ts
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

// ---------------------------------------------------------------------------
// Model chain
// ---------------------------------------------------------------------------

const MODEL_PRIMARY = 'claude-sonnet-4-5';
const MODEL_FALLBACK = 'claude-haiku-4-5';
const MODEL_OPENAI_FALLBACK = 'gpt-4o';
const MODEL_CHAIN = [MODEL_PRIMARY, MODEL_FALLBACK, MODEL_OPENAI_FALLBACK];

/** ~120k chars — well inside Sonnet 200k context window; matches route ceiling */
const MAX_SOLICITATION_CHARS = 120_000;

/** Max tokens for the structured JSON response (~30 criteria * ~300 chars each + envelope) */
const MAX_TOKENS = 4096;

// ---------------------------------------------------------------------------
// Prompt builder (hallucination-guarded per PITFALLS.md Pitfall 2)
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return [
    'You are a federal proposal expert that extracts structured evaluation criteria from solicitation documents.',
    '',
    'Your task: locate and extract the ACTUAL evaluation criteria from the uploaded solicitation.',
    '',
    'For federal RFPs (FAR-based): look for Section L (Instructions to Offerors) and Section M',
    '(Evaluation Factors for Award) headers by their exact section title. Extract every factor listed.',
    '',
    'For grants (federal, foundation, state): look for sections titled "Evaluation Criteria",',
    '"Review Criteria", "Funder Priorities", "Selection Criteria", or similar by exact section title.',
    '',
    'RULES — follow these exactly:',
    '1. criterion_text MUST be a verbatim sentence or passage copied directly from the document.',
    '   Do not paraphrase, summarize, or reconstruct.',
    '2. For max_points and weight: if the value is EXPLICITLY stated in the document, record it',
    '   and set is_inferred: false. If the value is derivable from context (e.g., "the following',
    '   three factors are weighted equally" with a total of 100 points), set the derived value',
    '   AND set is_inferred: true. Otherwise set the field to null and is_inferred: true.',
    '3. weight must be normalized to 0.0–1.0 (e.g., 30% = 0.3). If only max_points is stated',
    '   (e.g., "30 out of 100 total points"), derive weight = max_points / total_points and',
    '   set is_inferred: true.',
    '4. section_ref should be the exact section identifier + title, e.g.:',
    '   "Section M.1: Technical Approach" or "Funder Priority: Health Equity".',
    '5. If the document contains NO evaluation criteria, return criteria: [] — do NOT invent',
    '   generic federal criteria. An empty array is correct and safe.',
    '6. Return a single JSON object only. No prose, no markdown fences, no preamble.',
    '',
    'Output format (strictly):',
    '{"criteria":[{"section_ref":"...","criterion_text":"verbatim quote","max_points":null,"weight":null,"is_inferred":true},...],',
    '"document_type":"federal_rfp|federal_grant|foundation_grant|state_rfp|other",',
    '"has_explicit_scoring":true|false}',
  ].join('\n');
}

function buildUserPrompt(
  solicitationText: string,
  hints?: { scoring_criteria?: string[] },
): string {
  const lines: string[] = [];

  if (hints?.scoring_criteria && hints.scoring_criteria.length > 0) {
    lines.push(
      'The following sentences were flagged by a keyword scan as potential scoring criteria.',
      'These are INPUT HINTS ONLY — not authoritative. Verify each against the document before',
      'including it as a criterion:',
      '',
      ...hints.scoring_criteria.slice(0, 20).map((s, i) => `[Hint ${i + 1}] ${s}`),
      '',
    );
  }

  lines.push(
    'Solicitation document:',
    '---',
    solicitationText.slice(0, MAX_SOLICITATION_CHARS),
    '---',
    '',
    'Extract all evaluation criteria following the rules in the system prompt.',
    'Return ONLY the JSON object described above.',
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// JSON extraction helper (reuses extractJson pattern from review/generate.ts)
// ---------------------------------------------------------------------------

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced && fenced[1]) return fenced[1].trim();
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return raw.trim();
  return raw.slice(first, last + 1);
}

// ---------------------------------------------------------------------------
// Per-model call (never throws — returns null on any failure)
// ---------------------------------------------------------------------------

async function callModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ rawText: string; tokensIn: number; tokensOut: number } | null> {
  try {
    if (model.startsWith('gpt-')) {
      const client = getOpenAI();
      if (!client) return null;
      const resp = await client.chat.completions.create({
        model,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const rawText = (resp.choices[0]?.message?.content ?? '').trim();
      if (!rawText) return null;
      return {
        rawText,
        tokensIn: resp.usage?.prompt_tokens ?? 0,
        tokensOut: resp.usage?.completion_tokens ?? 0,
      };
    }

    // Anthropic path
    const client = getAnthropic();
    if (!client) return null;
    const resp = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const block = resp.content[0];
    if (!block || block.type !== 'text') return null;
    const rawText = block.text.trim();
    if (!rawText) return null;
    return {
      rawText,
      tokensIn: resp.usage.input_tokens,
      tokensOut: resp.usage.output_tokens,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[rubric/extract] ${model} failed: ${msg.slice(0, 200)}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Extract structured rubric criteria from a solicitation document.
 *
 * @param solicitationText  The extracted text of the uploaded solicitation.
 * @param hints             Optional keyword-scan hints (scoring_criteria strings
 *                          from extractPackageRequirements) — hints only, not
 *                          authoritative.
 * @returns RubricExtractionResult with criteria + token/cost metadata, or null
 *          if the full model chain fails. Never throws.
 */
export async function extractRubricCriteria(
  solicitationText: string,
  hints?: { scoring_criteria?: string[] },
): Promise<RubricExtractionResult | null> {
  const session_id = `rubric_extract_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(solicitationText, hints);

  for (const model of MODEL_CHAIN) {
    const raw = await callModel(model, systemPrompt, userPrompt);
    if (!raw) continue;

    const { rawText, tokensIn, tokensOut } = raw;
    const costUsd = computeCostUsd(model, tokensIn, tokensOut);

    // Strip fences and attempt Zod parse; fall through on failure
    try {
      const jsonStr = extractJson(rawText);
      const parsed = RubricExtractionOutputSchema.parse(JSON.parse(jsonStr));
      return {
        ...parsed,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
        model,
        session_id,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[rubric/extract] ${model} Zod/JSON parse failed — trying next model: ${msg.slice(0, 200)}`,
      );
      // Fall through to next model
    }
  }

  // Full chain exhausted — return null per graceful-degradation contract
  console.error('[rubric/extract] all models failed; returning null');
  return null;
}
