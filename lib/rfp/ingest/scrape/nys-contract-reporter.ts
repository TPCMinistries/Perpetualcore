/**
 * New York State Contract Reporter (NYSCR) — statewide procurement ads.
 *
 * Source: https://www.nyscr.ny.gov/Ads/Search  (public search results)
 *
 * Every NYS agency, authority, SUNY/CUNY unit and many counties must advertise
 * procurements >= $50K here. The public results list is server-rendered,
 * 25 ads per page, paginated by the `Skip` query parameter. Ad detail pages
 * require a login, but the list itself carries everything we need: title,
 * CR#, agency, division, issue date, due date, location, category, ad type.
 *
 * Verified 2026-09-06: 823 open ads. We page until a page yields no new ad
 * ids, capped at MAX_PAGES, with a 1 req/sec throttle.
 *
 * Auth: none. Never throws — records drift and returns [].
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fetchHtml,
  normalizeKeywords,
  sleep,
  stripTags,
  toIsoDate,
} from "./utils";

const SOURCE = "nys_contract_reporter" as const;
const SEARCH_URL = "https://www.nyscr.ny.gov/Ads/Search";
const PAGE_SIZE = 25;
/** 40 pages × 25 = 1,000 ads — comfortably above the ~800 typically open. */
const MAX_PAGES = 40;
const PAGE_DELAY_MS = 1000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 (PerpetualCore-RFP-Engine; +https://rfp.perpetualcore.com)";

export interface NyscrAd {
  adId: string;
  title: string;
  fields: Record<string, string>;
}

export async function fetchNysContractReporterOpportunities(): Promise<
  OpportunityInput[]
> {
  const seen = new Set<string>();
  const ads: NyscrAd[] = [];
  let pagesFetched = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const skip = page * PAGE_SIZE;
    const url = skip === 0 ? SEARCH_URL : `${SEARCH_URL}?Skip=${skip}`;

    let html = "";
    let status = 0;
    try {
      const response = await fetchHtml(url, {
        headers: { "User-Agent": BROWSER_UA },
      });
      html = response.html;
      status = response.status;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await recordDrift({
        source: SOURCE,
        reason: "fetch_error",
        details: { message, endpoint: url, pages_fetched: pagesFetched },
      });
      break;
    }

    if (status >= 400) {
      await recordDrift({
        source: SOURCE,
        reason: "http_status",
        details: { status, endpoint: url, pages_fetched: pagesFetched },
      });
      break;
    }

    pagesFetched += 1;
    const pageAds = parseNyscrSearchPage(html);
    let fresh = 0;
    for (const ad of pageAds) {
      if (seen.has(ad.adId)) continue;
      seen.add(ad.adId);
      ads.push(ad);
      fresh += 1;
    }

    // Stop at the first page that adds nothing new (end of results, or the
    // site ignored Skip and served page 1 again).
    if (fresh === 0 || pageAds.length < PAGE_SIZE) break;
    await sleep(PAGE_DELAY_MS);
  }

  if (ads.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: pagesFetched === 0 ? "shape_mismatch" : "zero_nodes",
      details: {
        endpoint: SEARCH_URL,
        parser: "div.opp-list-item[data-ad-id]",
        pages_fetched: pagesFetched,
        hint: "NYSCR search markup changed or the site now requires a login for the list view.",
      },
    });
    return [];
  }

  return ads.map(toOpportunityInput);
}

/**
 * Parses the NYSCR search results page into ads. Each ad is a
 * `<div class="opp-list-item ..." data-ad-id="NNNNNNN">` block whose fields
 * are rendered as `<div class="w-exact-8 ...">Label:</div><div class="px-2">Value</div>`
 * pairs. The title lives in a `title="Full Title: ..."` attribute.
 */
export function parseNyscrSearchPage(html: string): NyscrAd[] {
  const ads: NyscrAd[] = [];
  const blocks = html.split(/<div class="opp-list-item[^"]*"/i);
  // blocks[0] is everything before the first ad.
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const adId = /data-ad-id="(\d+)"/i.exec(block)?.[1];
    if (!adId) continue;

    const titleAttr = /title="Full Title:\s*([^"]+)"/i.exec(block)?.[1];
    const title = titleAttr
      ? decodeEntities(titleAttr).replace(/\s+/g, " ").trim()
      : "";
    if (!title) continue;

    const fields: Record<string, string> = {};
    const pairRe =
      /<div class="w-exact-8[^"]*">\s*([^<]*?):?\s*<\/div>\s*<div class="px-2[^"]*">([\s\S]*?)<\/div>/gi;
    for (const m of block.matchAll(pairRe)) {
      const label = stripTags(m[1]).replace(/:$/, "").trim().toLowerCase();
      const value = stripTags(m[2]);
      if (label && value) fields[label] = value;
    }

    ads.push({ adId, title, fields });
  }
  return ads;
}

function toOpportunityInput(ad: NyscrAd): OpportunityInput {
  const f = ad.fields;
  const crNumber = f["cr#"] ?? ad.adId;
  // "Contractor Ads" (primes seeking M/WBE or SDVOB subcontractors) carry a
  // "Company" field instead of "Agency".
  const agency = f["agency"] ?? f["company"] ?? null;
  const dueRaw = f["due date"] ?? null;
  const deadline = toIsoDate(dueRaw);
  const category = f["category"] ?? null;
  const adType = f["ad type"] ?? null;
  const briefParts = [
    f["division"] ? `Division: ${f["division"]}` : null,
    category ? `Category: ${category}` : null,
    f["location"] ? `Location: ${f["location"]}` : null,
    adType ? `Ad type: ${adType}` : null,
    f["issue date"] ? `Issued: ${f["issue date"]}` : null,
    // Rolling / continuous submissions ("Proposals accepted continuously",
    // "First Wednesday of every month") don't parse to a date — keep the text.
    dueRaw && !deadline ? `Due: ${dueRaw}` : null,
  ].filter((p): p is string => Boolean(p));

  return {
    source: SOURCE,
    source_id: crNumber,
    title: ad.title.slice(0, 300),
    agency,
    type: category ? `${adType ? `${adType} · ` : ""}${category}` : adType,
    amount_min: null,
    amount_max: null,
    deadline,
    posted_at: toIsoDate(f["issue date"]),
    brief: briefParts.join(" • ") || null,
    keywords: normalizeKeywords(
      [ad.title, agency ?? "", category ?? ""].flatMap((s) =>
        s.split(/[\s,\-–()/&]+/)
      )
    ),
    geo: "NY",
    // Ad detail pages are login-walled; a keyword search on the CR# is the
    // stable public deep link.
    url: `${SEARCH_URL}?Keyword=${encodeURIComponent(crNumber)}`,
    needs_review: false,
    raw_json: {
      portal: "nyscr",
      ad_id: ad.adId,
      cr_number: crNumber,
      ...f,
    },
  };
}
