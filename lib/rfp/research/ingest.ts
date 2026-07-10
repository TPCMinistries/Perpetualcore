/**
 * Deep Research — lead ingestion.
 *
 * Maps verified ResearchLeads onto rfp_opportunities rows under
 * source='ai_research' and upserts idempotently on (source, source_id).
 * A lead the agent could not verify on the funder's own page is still
 * ingested but flagged needs_review=true so the UI can badge it.
 *
 * Dedupe: besides the (source, source_id) key, we skip leads whose URL
 * already exists under ANY other source — the scrapers own those rows and
 * a second copy would double-show in the feed.
 */

import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { extractTitleKeywords } from "@/lib/rfp/ingest/normalize";
import type { ResearchLead } from "./types";

/** Stable slug for (funder, name) so re-runs update rather than duplicate. */
export function leadSourceId(lead: ResearchLead): string {
  const base = `${lead.funder} ${lead.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const hash = createHash("sha256")
    .update(`${lead.funder}|${lead.name}`)
    .digest("hex")
    .slice(0, 8);
  return `${base}-${hash}`;
}

function toDeadlineIso(lead: ResearchLead): string | null {
  if (!lead.deadline_iso) return null;
  const d = new Date(lead.deadline_iso);
  if (Number.isNaN(d.getTime())) return null;
  // A hard deadline in the past is stale by the time it lands — store null
  // so the feed's deadline chips don't advertise a dead date.
  if (d.getTime() < Date.now()) return null;
  return d.toISOString();
}

function leadKeywords(lead: ResearchLead): string[] {
  const kws = new Set<string>(extractTitleKeywords(`${lead.name} ${lead.funder}`));
  for (const tok of lead.eligibility_fit.toLowerCase().split(/[^a-z0-9]+/)) {
    if (tok.length >= 4 && kws.size < 14) kws.add(tok);
  }
  return Array.from(kws);
}

export interface IngestResult {
  ingested: number;
  skippedExistingUrl: number;
  opportunityIds: string[];
}

/**
 * Upsert leads for one vertical. `geo` is the geography this vertical was
 * scoped to (from the research plan), used for the scoring geo component.
 */
export async function ingestLeads(
  leads: ResearchLead[],
  geo: string
): Promise<IngestResult> {
  const admin = createAdminClient();
  if (leads.length === 0) {
    return { ingested: 0, skippedExistingUrl: 0, opportunityIds: [] };
  }

  // Skip URLs the scrapers already own (any source except ai_research).
  const urls = leads.map((l) => l.url).filter(Boolean);
  const { data: existing } = await admin
    .from("rfp_opportunities")
    .select("url, source")
    .in("url", urls);
  const ownedUrls = new Set(
    (existing ?? [])
      .filter((r) => r.source !== "ai_research")
      .map((r) => r.url as string)
  );

  const rows = leads
    .filter((l) => !ownedUrls.has(l.url))
    .map((lead) => ({
      source: "ai_research",
      source_id: leadSourceId(lead),
      title: lead.name,
      agency: lead.funder,
      funder_name: lead.funder,
      type: "grant",
      amount_min: lead.amount_min ?? null,
      amount_max: lead.amount_max ?? null,
      deadline: toDeadlineIso(lead),
      posted_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      geo,
      url: lead.url,
      brief: [
        lead.eligibility_fit,
        lead.notes ?? "",
        `Amount: ${lead.amount}. Status: ${lead.status.replace(/_/g, " ")}.`,
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 900),
      keywords: leadKeywords(lead),
      eligibility_types: ["nonprofit"],
      needs_review: !lead.verified_on_funder_page,
      raw_json: {
        ai_research: true,
        status: lead.status,
        amount_text: lead.amount,
        verified_on_funder_page: lead.verified_on_funder_page,
        notes: lead.notes ?? null,
      },
    }));

  if (rows.length === 0) {
    return {
      ingested: 0,
      skippedExistingUrl: leads.length,
      opportunityIds: [],
    };
  }

  const { data: upserted, error } = await admin
    .from("rfp_opportunities")
    .upsert(rows, { onConflict: "source,source_id" })
    .select("id");

  if (error) {
    throw new Error(`ai_research upsert failed: ${error.message}`);
  }

  return {
    ingested: upserted?.length ?? 0,
    skippedExistingUrl: leads.length - rows.length,
    opportunityIds: (upserted ?? []).map((r) => r.id as string),
  };
}
