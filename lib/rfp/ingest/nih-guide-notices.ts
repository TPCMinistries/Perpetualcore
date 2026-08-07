/**
 * NIH Guide notices fetcher.
 *
 * NIH no longer publishes NIH NOFOs in the Guide after October 2025; Grants.gov
 * remains the active NIH NOFO source. This feed captures Guide notices,
 * RFIs, policy updates, and funding-opportunity change notices as research
 * intelligence records.
 */

import {
  extractTitleKeywords,
  type OpportunityInput,
} from "@/lib/rfp/ingest/normalize";

const NIH_GUIDE_RSS_URL =
  "https://grants.nih.gov/grants/guide/newsfeed/fundingopps.xml";
const NOTICE_ID_RE = /\b(?:NOT|PAR|RFA|PA|RFI|OTA)-[A-Z]{2,}-\d{2}-\d{3}\b/i;

export interface FetchNihGuideNoticesOptions {
  feedUrl?: string;
  maxRecords?: number;
}

interface NihGuideRssItem {
  title: string;
  link: string;
  description: string | null;
  pubDate: string | null;
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanText(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = decodeXmlEntities(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

function firstTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return cleanText(match?.[1]);
}

function parseRssItems(xml: string): NihGuideRssItem[] {
  const matches = xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  const items: NihGuideRssItem[] = [];

  for (const match of matches) {
    const block = match[1] ?? "";
    const title = firstTag(block, "title");
    const link = firstTag(block, "link");
    if (!title || !link) continue;
    items.push({
      title,
      link: link.replace(/^http:\/\//i, "https://"),
      description: firstTag(block, "description"),
      pubDate: firstTag(block, "pubDate"),
    });
  }

  return items;
}

function inferNoticeType(title: string, description: string | null): string {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();
  if (haystack.includes("request for information") || haystack.includes("(rfi)")) {
    return "NIH Guide RFI";
  }
  if (haystack.includes("notice of change") || haystack.includes("early expiration")) {
    return "NIH Guide Change Notice";
  }
  if (haystack.includes("policy")) {
    return "NIH Guide Policy Notice";
  }
  return "NIH Guide Notice";
}

function sourceIdFor(item: NihGuideRssItem): string {
  const noticeId =
    item.link.match(NOTICE_ID_RE)?.[0] ?? item.description?.match(NOTICE_ID_RE)?.[0];
  if (noticeId) return noticeId.toUpperCase();

  return item.link
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function toOpportunityInput(item: NihGuideRssItem): OpportunityInput {
  const sourceId = sourceIdFor(item);
  const noticeCode = sourceId.match(NOTICE_ID_RE)?.[0]?.toLowerCase() ?? null;
  const titleKeywords = extractTitleKeywords(item.title, 10);
  const keywords = [
    "nih",
    "nih guide",
    "notice",
    noticeCode,
    ...titleKeywords,
  ].filter((keyword): keyword is string => Boolean(keyword));

  return {
    source: "nih_guide_notices",
    source_id: sourceId,
    title: item.title,
    agency: "National Institutes of Health",
    type: inferNoticeType(item.title, item.description),
    amount_min: null,
    amount_max: null,
    deadline: null,
    posted_at: item.pubDate,
    brief: item.description,
    keywords,
    geo: "US",
    url: item.link,
    needs_review: true,
    raw_json: {
      ...item,
      feed_url: NIH_GUIDE_RSS_URL,
      source_note:
        "NIH Guide notice feed. Active NIH NOFOs are sourced from Grants.gov, not this Guide feed.",
    },
  };
}

export async function fetchNihGuideNotices(
  opts: FetchNihGuideNoticesOptions = {},
): Promise<OpportunityInput[]> {
  const feedUrl = opts.feedUrl ?? NIH_GUIDE_RSS_URL;
  const maxRecords = opts.maxRecords ?? 100;

  let response: Response;
  try {
    response = await fetch(feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
        "User-Agent": "IHA-RFP-Discovery/1.0 (+https://upliftcommunities.org)",
      },
    });
  } catch (err) {
    console.error("[error] nih_guide_notices: network error", err);
    return [];
  }

  if (!response.ok) {
    console.error(`[error] nih_guide_notices: HTTP ${response.status}`);
    return [];
  }

  const xml = await response.text();
  const inputs = parseRssItems(xml)
    .slice(0, maxRecords)
    .map(toOpportunityInput);

  console.log(`[fetch] nih_guide_notices: ${inputs.length} records`);
  return inputs;
}
