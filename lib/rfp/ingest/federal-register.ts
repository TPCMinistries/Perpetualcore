/**
 * Federal Register notices fetcher.
 *
 * Endpoint: GET https://www.federalregister.gov/api/v1/documents.json
 * Auth: none required.
 *
 * The Federal Register is the official daily journal for federal notices. This
 * connector targets documents matching the phrase "notice of funding
 * opportunity" and filters obvious information-collection notices out before
 * they enter the opportunity catalog.
 */

import {
  type OpportunityInput,
  extractTitleKeywords,
} from "@/lib/rfp/ingest/normalize";

const BASE_URL = "https://www.federalregister.gov/api/v1";
const SEARCH_TERM = '"notice of funding opportunity"';

interface FederalRegisterAgency {
  name?: string;
  raw_name?: string;
  slug?: string;
}

interface FederalRegisterDocument {
  title?: string;
  type?: string;
  abstract?: string | null;
  document_number?: string;
  html_url?: string;
  pdf_url?: string | null;
  publication_date?: string;
  agencies?: FederalRegisterAgency[];
  excerpts?: string | null;
  [key: string]: unknown;
}

interface FederalRegisterResponse {
  count?: number;
  total_pages?: number;
  results?: FederalRegisterDocument[];
}

export interface FetchFederalRegisterOptions {
  rows?: number;
  maxRecords?: number;
}

export async function fetchFederalRegisterOpportunities(
  opts: FetchFederalRegisterOptions = {},
): Promise<OpportunityInput[]> {
  const rows = opts.rows ?? 100;
  const maxRecords = opts.maxRecords ?? 200;
  const all: OpportunityInput[] = [];
  let page = 1;

  while (all.length < maxRecords) {
    const url = new URL(`${BASE_URL}/documents.json`);
    url.searchParams.set("conditions[type][]", "NOTICE");
    url.searchParams.set("conditions[term]", SEARCH_TERM);
    url.searchParams.set("order", "newest");
    url.searchParams.set("per_page", String(Math.min(rows, 100)));
    url.searchParams.set("page", String(page));

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "PerpetualCore-RFP-Engine/1.0 (contact: lorenzo@tpcmin.org)",
        },
      });
    } catch (err) {
      console.error("[error] fed_register: network error", err);
      break;
    }

    if (!res.ok) {
      console.error(
        `[error] fed_register: HTTP ${res.status}; aborting page loop`,
      );
      break;
    }

    const json = (await res.json()) as FederalRegisterResponse;
    const docs = json.results ?? [];
    if (docs.length === 0) break;

    for (const doc of docs) {
      const mapped = mapDocument(doc);
      if (mapped) all.push(mapped);
      if (all.length >= maxRecords) break;
    }

    if (docs.length < rows) break;
    if (json.total_pages && page >= json.total_pages) break;
    page += 1;
  }

  console.log(`[fetch] fed_register: ${all.length} records`);
  return all.slice(0, maxRecords);
}

function mapDocument(doc: FederalRegisterDocument): OpportunityInput | null {
  if (!doc.document_number || !doc.title || !doc.html_url) return null;

  const text = [doc.title, doc.abstract, stripHtml(doc.excerpts ?? "")]
    .filter(Boolean)
    .join(" ");
  if (!looksLikeFundingNotice(doc.title, text)) return null;

  const agency = inferAgency(doc.agencies ?? []);
  const amount = extractAmount(text);
  const deadline = extractDeadline(text);

  return {
    source: "fed_register",
    source_id: doc.document_number,
    title: doc.title,
    agency,
    type: "Federal Register notice",
    amount_min: null,
    amount_max: amount,
    deadline,
    posted_at: doc.publication_date ?? null,
    brief: doc.abstract ?? summarize(stripHtml(doc.excerpts ?? "")),
    keywords: [
      "federal-register",
      "nofo",
      ...extractTitleKeywords(doc.title, 10),
    ],
    geo: "US",
    url: doc.html_url,
    needs_review: !deadline,
    raw_json: doc as Record<string, unknown>,
  };
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeFundingNotice(title: string, text: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerText = text.toLowerCase();

  if (
    lowerTitle.includes("information collection") ||
    lowerTitle.includes("paperwork reduction") ||
    lowerTitle.includes("forms undergoing")
  ) {
    return /announces? the opportunity to apply|competitive funding opportunity|applications? (?:must|are) be submitted/.test(
      lowerText,
    );
  }

  return /notice of funding opportunity|competitive funding opportunity|announces? the opportunity to apply|applications? (?:must|are) be submitted/.test(
    lowerText,
  );
}

function inferAgency(agencies: FederalRegisterAgency[]): string | null {
  if (agencies.length === 0) return null;
  const preferred = agencies[agencies.length - 1] ?? agencies[0];
  return preferred.name ?? preferred.raw_name ?? null;
}

function extractAmount(text: string): number | null {
  const match =
    /\$([0-9]+(?:\.[0-9]+)?)\s*(million|billion|thousand|m|b|k)?/i.exec(text);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const suffix = (match[2] ?? "").toLowerCase();
  if (suffix === "billion" || suffix === "b") return Math.round(value * 1_000_000_000);
  if (suffix === "million" || suffix === "m") return Math.round(value * 1_000_000);
  if (suffix === "thousand" || suffix === "k") return Math.round(value * 1_000);
  return Math.round(value);
}

function extractDeadline(text: string): string | null {
  const match =
    /\b(?:by|before|no later than|through)\s+(?:11:59\s*p\.?m\.?\s*(?:eastern|et)?\s*)?([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i.exec(
      text,
    ) ??
    /\b([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})\b/.exec(text);
  if (!match) return null;
  const parsed = new Date(match[1]);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function summarize(text: string): string | null {
  if (!text) return null;
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}
