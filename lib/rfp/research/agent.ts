/**
 * Deep Research — agentic web-search session for one vertical.
 *
 * One call = one Claude session with the server-side web_search tool enabled.
 * The agent searches, opens funder pages to verify, and finishes by calling
 * the client-defined `submit_leads` tool exactly once with structured leads.
 *
 * Anthropic's web_search is a SERVER tool: searches execute inside a single
 * messages.create call, so there is no client-side tool loop for search
 * itself. Two follow-up cases we do handle:
 *   - stop_reason "pause_turn": long server-tool turns can pause; we resume
 *     by replaying the conversation (bounded, MAX_CONTINUATIONS).
 *   - The final submit_leads tool_use arrives as a content block; we read it
 *     and end the session (no tool_result round-trip needed).
 *
 * Cost: token cost via RFP_MODEL_RATES + $10/1K web searches (WEB_SEARCH_USD),
 * both recorded through the Phase 17 guardrail by the caller (run.ts).
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchLead, ResearchVertical } from "./types";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 8_192;
const MAX_SEARCHES_PER_VERTICAL = 12;
const MAX_CONTINUATIONS = 4;
/** Anthropic web search list price: $10 per 1,000 searches. */
export const WEB_SEARCH_USD_PER_SEARCH = 0.01;

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

const SUBMIT_LEADS_TOOL: Anthropic.Tool = {
  name: "submit_leads",
  description:
    "Submit the final list of verified funding leads for this vertical. Call exactly once, when research is complete. Leads you could not verify on the funder's own page must have verified_on_funder_page=false.",
  input_schema: {
    type: "object" as const,
    properties: {
      leads: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            funder: { type: "string" },
            amount: {
              type: "string",
              description: 'Award size as stated, e.g. "$25K–$125K"; "unknown" if unstated',
            },
            amount_min: { type: ["number", "null"] },
            amount_max: { type: ["number", "null"] },
            deadline_iso: {
              type: ["string", "null"],
              description: "ISO 8601 date of the next hard deadline, or null for rolling/unknown",
            },
            status: {
              type: "string",
              enum: ["open_now", "opens_soon", "annual_cycle", "rolling", "uncertain"],
            },
            eligibility_fit: {
              type: "string",
              description: "1-2 sentences: why this org specifically qualifies",
            },
            url: { type: "string", description: "Deepest funder-page URL you confirmed" },
            notes: {
              type: "string",
              description: "LOI-first, match %, invite-only, next-cycle timing, partner requirements",
            },
            verified_on_funder_page: { type: "boolean" },
          },
          required: [
            "name",
            "funder",
            "amount",
            "status",
            "eligibility_fit",
            "url",
            "verified_on_funder_page",
          ],
        },
      },
    },
    required: ["leads"],
  },
};

export interface VerticalAgentResult {
  leads: ResearchLead[];
  tokensIn: number;
  tokensOut: number;
  searchesUsed: number;
  error?: string;
}

function isLeadShaped(v: unknown): v is ResearchLead {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.funder === "string" &&
    typeof o.url === "string" &&
    typeof o.eligibility_fit === "string" &&
    typeof o.status === "string"
  );
}

/** Pull leads out of a submit_leads tool_use block, defensively. */
function extractLeads(content: Anthropic.ContentBlock[]): ResearchLead[] | null {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "submit_leads") {
      const input = block.input as { leads?: unknown };
      if (Array.isArray(input?.leads)) {
        return input.leads.filter(isLeadShaped);
      }
    }
  }
  return null;
}

/**
 * Run one vertical's research session. Never throws — an errored vertical
 * returns { leads: [], error } so one bad vertical doesn't sink the run.
 */
export async function runVerticalAgent(
  vertical: ResearchVertical
): Promise<VerticalAgentResult> {
  const client = getAnthropic();
  if (!client) {
    return {
      leads: [],
      tokensIn: 0,
      tokensOut: 0,
      searchesUsed: 0,
      error: "ANTHROPIC_API_KEY not configured",
    };
  }

  const tools: Anthropic.ToolUnion[] = [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: MAX_SEARCHES_PER_VERTICAL,
    },
    SUBMIT_LEADS_TOOL,
  ];

  const system =
    "You are a meticulous grant-prospect researcher inside a capture-operations product. " +
    "Follow the evidence rules in the task exactly — a fabricated or stale lead is worse than no lead, because a nonprofit may spend days writing to it. " +
    "Work efficiently: batch what you can into few searches, verify the strongest candidates on funder pages, then call submit_leads exactly once with your final list. " +
    "Do not write a prose report; the submit_leads call is your entire deliverable.";

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: vertical.prompt },
  ];

  let tokensIn = 0;
  let tokensOut = 0;
  let searchesUsed = 0;

  try {
    for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools,
        messages,
      });

      tokensIn += resp.usage?.input_tokens ?? 0;
      tokensOut += resp.usage?.output_tokens ?? 0;
      searchesUsed += resp.usage?.server_tool_use?.web_search_requests ?? 0;

      const leads = extractLeads(resp.content);
      if (leads) {
        return { leads, tokensIn, tokensOut, searchesUsed };
      }

      if (resp.stop_reason === "pause_turn") {
        // Server-tool turn paused mid-flight — resume with the partial turn.
        messages.push({ role: "assistant", content: resp.content });
        continue;
      }

      // Finished without calling submit_leads — nudge once, then give up.
      if (turn < MAX_CONTINUATIONS) {
        messages.push({ role: "assistant", content: resp.content });
        messages.push({
          role: "user",
          content:
            "Finalize now: call submit_leads exactly once with every lead you verified. If you verified nothing, call it with an empty leads array.",
        });
        continue;
      }
    }
    return {
      leads: [],
      tokensIn,
      tokensOut,
      searchesUsed,
      error: "agent never called submit_leads",
    };
  } catch (err) {
    return {
      leads: [],
      tokensIn,
      tokensOut,
      searchesUsed,
      error: err instanceof Error ? err.message.slice(0, 300) : "unknown error",
    };
  }
}
