/**
 * lib/rfp/vault/expand.ts — Vault quick-seed expander.
 *
 * Solves the cold-start problem on the Seed Vault onboarding step. The
 * canonical upload flow asks the user to paste a 200+ char past document —
 * a perfectly reasonable bar that brand-new users with nothing queued up
 * can't clear. This module accepts a short natural-language description
 * of what the org has actually done and expands it into a structured
 * capacity-narrative document (~2-4K chars) suitable for the existing
 * chunker → embedder pipeline.
 *
 * Output is one document, multi-section:
 *   - Mission & Purpose
 *   - Programs (each as its own paragraph)
 *   - Outcomes (with whatever numbers the user gave; preserves uncertainty)
 *   - Partners & Funders
 *   - Geography & Population Served
 *   - History & Capacity Statement
 *
 * The chunker treats each section as its own retrieval unit (blank-line
 * separated). At draft time, the drafter retrieves the most relevant
 * sections by cosine similarity to the opportunity's keywords — so a
 * youth-mentoring RFP pulls the Programs/Outcomes sections, a budget
 * question pulls the History/Capacity section.
 *
 * Honest framing for the UI: this is GOOD ENOUGH to seed retrieval now.
 * The user should add real past proposals via the canonical upload as
 * they accumulate.
 */

import OpenAI from "openai";

export const MIN_DESCRIPTION_CHARS = 80;
export const MAX_DESCRIPTION_CHARS = 3000;

/** Target output band — we ask for 1.5-4K chars to match what the chunker
 * splits cleanly into ~6-12 retrieval-grade chunks. */
const TARGET_OUTPUT_MIN_CHARS = 1500;
const TARGET_OUTPUT_MAX_CHARS = 4000;

const MODEL = "gpt-4o";
const MAX_OUTPUT_TOKENS = 1800;

// gpt-4o pricing (USD per million tokens).
const PRICE_PER_M_INPUT = 2.5;
const PRICE_PER_M_OUTPUT = 10.0;

export interface VaultExpandResult {
  /** Expanded document body — ready to pass to uploadDocument. */
  body: string;
  /** Suggested doc title derived from the description. */
  suggested_title: string;
  /** Section labels actually present in the output (in order). */
  sections: string[];
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
}

const SYSTEM_PROMPT = `You are a grant-writing analyst helping a nonprofit or social-impact organization seed its capacity vault for AI-powered proposal drafting.

The user has given you a short natural-language description of their organization. Your job is to expand it into a STRUCTURED CAPACITY NARRATIVE document that another model will later split into retrieval chunks and use to ground proposal drafts in real facts.

Hard constraints on the output:
1. Output is plaintext only. No markdown, no code fences, no JSON wrapper.
2. Use these EXACT section headers, each on its own line, in this order:
   MISSION & PURPOSE
   PROGRAMS
   OUTCOMES
   PARTNERS & FUNDERS
   GEOGRAPHY & POPULATION SERVED
   HISTORY & CAPACITY
3. Each section is one or two paragraphs of plain prose. Separate sections with a single blank line.
4. Total length: ${TARGET_OUTPUT_MIN_CHARS}-${TARGET_OUTPUT_MAX_CHARS} characters.

Content rules:
- Use ONLY facts the user provided. Do not invent numbers, dates, partners, awards, or accolades. If the user doesn't mention something, write a one-sentence general statement in that section ("Outcomes data is currently being compiled.") rather than fabricating specifics.
- Preserve the user's voice and word choices where they're distinctive. If they say "young adults" not "youth", use "young adults" throughout.
- Where the user is vague ("we work with a few hospitals"), keep it vague in the output — do not invent specific hospital names.
- Write in third person ("The organization", "Uplift Communities") not first person — the drafter will speak in the org's voice; this document is FACTUAL substrate.

Output format:
After the document body, append a single line in this exact format (this is the only metadata-like content allowed):
TITLE: <a 4-10 word suggested document title derived from the description>

Example output:

MISSION & PURPOSE
The organization exists to connect young adults from underserved NYC neighborhoods to credentialed healthcare careers, with wraparound case management that keeps graduates in their jobs after placement.

PROGRAMS
The CNA + EKG training program is the organization's flagship offering. It runs 14-week cohorts of 12-18 young adults, combining classroom credentialing with hospital clinical placements.

[... more sections ...]

TITLE: NYC Healthcare Workforce Training Capacity Statement`;

export async function expandOrgDescription(
  description: string,
): Promise<VaultExpandResult> {
  const trimmed = description.trim();
  if (
    trimmed.length < MIN_DESCRIPTION_CHARS ||
    trimmed.length > MAX_DESCRIPTION_CHARS
  ) {
    throw new Error(
      `vault_expand_bad_input: description must be ${MIN_DESCRIPTION_CHARS}-${MAX_DESCRIPTION_CHARS} chars, got ${trimmed.length}`,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("vault_expand_no_api_key: OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    throw new Error("vault_expand_empty_output");
  }

  // Split out the TITLE: line from the body.
  const titleMatch = raw.match(/\n\s*TITLE:\s*(.+?)\s*$/i);
  const suggested_title = titleMatch ? titleMatch[1].trim().slice(0, 200) : "Org Capacity Statement";
  const body = (titleMatch ? raw.slice(0, titleMatch.index).trimEnd() : raw).trim();

  if (body.length < TARGET_OUTPUT_MIN_CHARS / 2) {
    throw new Error(
      `vault_expand_too_short: model returned ${body.length} chars, expected ≥${TARGET_OUTPUT_MIN_CHARS / 2}`,
    );
  }

  // Identify the canonical section headers actually present so the UI can
  // surface what's in the doc.
  const KNOWN_SECTIONS = [
    "MISSION & PURPOSE",
    "PROGRAMS",
    "OUTCOMES",
    "PARTNERS & FUNDERS",
    "GEOGRAPHY & POPULATION SERVED",
    "HISTORY & CAPACITY",
  ];
  const sections = KNOWN_SECTIONS.filter((h) =>
    new RegExp(`^\\s*${h.replace(/&/g, "&")}\\s*$`, "m").test(body),
  );

  const tokens_in = res.usage?.prompt_tokens ?? 0;
  const tokens_out = res.usage?.completion_tokens ?? 0;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  return {
    body,
    suggested_title,
    sections,
    tokens_in,
    tokens_out,
    cost_usd,
    model: MODEL,
  };
}
