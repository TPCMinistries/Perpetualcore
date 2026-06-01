/**
 * NY State grants scraper.
 *
 * OLD SOURCE 1 (broken, HTTP 404 since some time pre-May 2026):
 *   https://grantsmanagement.ny.gov/grant-opportunities
 *
 * OLD SOURCE 2 (retired SFS transition, now redirects to IntelliGrants error):
 *   https://grantsgateway.ny.gov/IntelliGrants_NYSGG/module/nysgg/goportal.aspx?NavItem1=2
 *
 * CURRENT SOURCE (2026-06-01):
 *   https://www.ny.gov/new-york-state-nonprofit-unit/new-york-state-nonprofit-unit
 *
 * New York retired Grants Gateway on January 9, 2025 and moved grantmaking to
 * SFS. The SFS search UI is public but PeopleSoft/cookie-gated, so raw fetch()
 * cannot reliably traverse it. The Governor's Nonprofit Unit publishes a static
 * "Funding Opportunities" section with current links/due dates. That static
 * page is our immediate reliable source while SFS browser automation is a
 * separate connector backlog item.
 *
 * Auth: none. HTML, not JS-rendered.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fallbackSourceId,
  fetchHtml,
  normalizeKeywords,
  stripTags,
  toIsoDate,
} from "./utils";

const SOURCE = "ny_state" as const;

const BASE_URL =
  "https://www.ny.gov/new-york-state-nonprofit-unit/new-york-state-nonprofit-unit";

export async function fetchNyStateOpportunities(): Promise<OpportunityInput[]> {
  let resp: Awaited<ReturnType<typeof fetchHtml>>;
  try {
    resp = await fetchHtml(BASE_URL);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: { message, url: BASE_URL },
    });
    return [];
  }

  if (resp.status >= 400) {
    await recordDrift({
      source: SOURCE,
      reason: "http_status",
      details: { status: resp.status, url: BASE_URL },
    });
    return [];
  }

  const records = parseNyNonprofitFundingSection(resp.html);

  if (records.length === 0) {
    const looksLikePortal =
      resp.html.includes("New York State Nonprofit Unit") &&
      resp.html.includes("Funding Opportunities");
    await recordDrift({
      source: SOURCE,
      reason: looksLikePortal ? "zero_nodes" : "shape_mismatch",
      details: {
        url: BASE_URL,
        html_bytes: resp.html.length,
        hint: `Verify ${BASE_URL} still renders the Funding Opportunities section; NY.gov may have changed the article layout.`,
      },
    });
    return [];
  }

  return records;
}

interface ParsedFundingLink {
  title: string;
  url: string;
  context: string;
}

function parseNyNonprofitFundingSection(html: string): OpportunityInput[] {
  const section = extractFundingSection(html);
  if (!section) return [];

  const links = extractFundingLinks(section);
  const records: OpportunityInput[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    const title = cleanTitle(link.title);
    if (!isFundingOpportunityTitle(title)) continue;

    const agency = inferAgency(title);
    const deadline = extractDeadline(link.context);
    records.push({
      source: SOURCE,
      source_id: fallbackSourceId([SOURCE, title, link.url]),
      title,
      agency,
      type: "State grant opportunity",
      deadline:
        deadline && deadline.trim() && !/^closed$/i.test(deadline)
          ? toIsoDate(deadline)
          : null,
      posted_at: null,
      brief: summarizeContext(link.context),
      geo: "NY",
      url: link.url,
      keywords: normalizeKeywords(title.split(/[\s,\-–()#]+/)),
      raw_json: {
        portal: "nygov_nonprofit_unit",
        page_url: BASE_URL,
        title,
        context: stripTags(link.context),
        inferred_agency: agency,
        deadline_raw: deadline,
      },
    });
  }

  return records;
}

function extractFundingSection(html: string): string | null {
  const heading =
    /<h2[^>]+id="funding_opportunities"[^>]*>[\s\S]*?<\/h2>/i.exec(html);
  if (!heading) return null;

  const start = heading.index + heading[0].length;
  const rest = html.slice(start);
  const nextSection = /<h2[^>]+id="resources_for_nonprofits"[^>]*>/i.exec(rest);
  if (!nextSection) return rest;
  return rest.slice(0, nextSection.index);
}

function extractFundingLinks(section: string): ParsedFundingLink[] {
  const items = Array.from(section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map(
    (m) => m[1],
  );
  const blocks = items.length > 0 ? items : [section];
  const out: ParsedFundingLink[] = [];

  for (const block of blocks) {
    const anchorMatches = Array.from(
      block.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    );
    for (const match of anchorMatches) {
      const href = decodeEntities(match[1]);
      const title = stripTags(match[2]);
      if (!title || title.length < 4) continue;
      out.push({
        title,
        url: toAbsoluteUrl(href),
        context: block,
      });
    }
  }

  return out;
}

function toAbsoluteUrl(href: string): string {
  try {
    return new URL(href, BASE_URL).toString();
  } catch {
    return BASE_URL;
  }
}

function cleanTitle(title: string): string {
  return decodeEntities(title)
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+$/g, "")
    .trim();
}

function isFundingOpportunityTitle(title: string): boolean {
  const normalized = title.toLowerCase();
  if (
    normalized.includes("prequalified") ||
    normalized.includes("notification") ||
    normalized.includes("learn more") ||
    normalized.includes("website") ||
    normalized.includes("form to be notified")
  ) {
    return false;
  }
  return (
    /\b(grant|rfa|rfp|funding|program|capacity|resilient|places for learning|securing communities)\b/i.test(
      title,
    ) || /^[A-Z]{2,5}\s+-/.test(title)
  );
}

function inferAgency(title: string): string | null {
  const prefix = /^([A-Z]{2,5})\s+-/.exec(title);
  if (prefix) return prefix[1];
  if (/NY PLAYS/i.test(title)) return "DASNY";
  if (/Securing Communities Against Hate Crimes|DCJS/i.test(title)) {
    return "DCJS";
  }
  if (/Regenerate New York/i.test(title)) return "DEC";
  if (/Resilient Watersheds|Community Resilience/i.test(title)) return "DOS";
  return "New York State";
}

function extractDeadline(context: string): string | null {
  const text = stripTags(context);
  const dueMatch =
    /\b(?:applications?\s+(?:are\s+)?(?:due|accepted)|deadline(?:\s+for\s+applications)?|proposal\s+due\s+date)\b[^.]*?(?:by|through|from)?\s*([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4}(?:\s+(?:at|by)\s+[\d:]+\s*(?:AM|PM|a\.m\.|p\.m\.)?)?)/i.exec(
      text,
    );
  if (dueMatch) return dueMatch[1];

  const dateMatch =
    /\b([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4}(?:\s+(?:at|by)\s+[\d:]+\s*(?:AM|PM|a\.m\.|p\.m\.)?)?)\b/.exec(
      text,
    );
  return dateMatch?.[1] ?? null;
}

function summarizeContext(context: string): string | null {
  const text = stripTags(context);
  if (!text) return null;
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}
