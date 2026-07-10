/**
 * Cycle-watch — periodic re-verification of opportunities whose application
 * window is not yet confirmed open.
 *
 * Two kinds of rows are watched:
 *   - source='ai_research' rows still in a not-open-now status (opens_soon,
 *     annual_cycle, uncertain) — the Deep Research agent (agent.ts) found
 *     them but couldn't confirm a live window.
 *   - ANY opportunity a user has explicitly triaged to 'watch' or 'pursuing'
 *     (rfp_opp_matches.triage_status), regardless of source.
 *
 * For each candidate, one cheap haiku session (mirroring the agent.ts
 * pattern) re-checks the funder's own page and reports the current window.
 * A row that flips into open_now, or that gains a deadline it didn't have
 * before, fires a one-time email to the org members watching it — dedup'd
 * through rfp_watch_alert_log (unique on opp_id, user_id, kind).
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { computeCostUsd, recordCost } from "@/lib/rfp/ai/guardrail";
import { WEB_SEARCH_USD_PER_SEARCH } from "./agent";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2048;
const MAX_SEARCHES = 3;
const MAX_CONTINUATIONS = 2;
const AGENT_NAME = "watch_v1";
const DEFAULT_LIMIT = 25;
const FAR_FUTURE_MS = 14 * 24 * 60 * 60 * 1000;

const WATCHABLE_AI_RESEARCH_STATUSES = new Set([
  "opens_soon",
  "annual_cycle",
  "uncertain",
]);

// ---------------------------------------------------------------------------
// selectWatchCandidates — pure, unit-tested selection logic
// ---------------------------------------------------------------------------

export interface WatchCandidateRow {
  id: string;
  source: string;
  deadline: string | null;
  raw_json: unknown;
  last_seen_at: string | null;
  watched: boolean;
}

function rawStatus(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return null;
  const status = (raw as Record<string, unknown>).status;
  return typeof status === "string" ? status : null;
}

/**
 * PURE. Decides which candidate rows get a fresh verification pass this run.
 *
 * Include when: (source==='ai_research' AND status is opens_soon/annual_cycle/
 * uncertain) OR watched===true.
 * Exclude when: deadline is already >14 days in the future AND status is
 * open_now — there's nothing to verify.
 * Sort: last_seen_at ascending, nulls first. Capped at `limit`.
 */
export function selectWatchCandidates(
  rows: WatchCandidateRow[],
  now: Date,
  limit: number,
): string[] {
  const nowMs = now.getTime();

  const eligible = rows.filter((row) => {
    const status = rawStatus(row.raw_json);
    const isWatchableAiResearch =
      row.source === "ai_research" &&
      status !== null &&
      WATCHABLE_AI_RESEARCH_STATUSES.has(status);

    if (!isWatchableAiResearch && !row.watched) return false;

    if (status === "open_now" && row.deadline) {
      const deadlineMs = new Date(row.deadline).getTime();
      if (!Number.isNaN(deadlineMs) && deadlineMs - nowMs > FAR_FUTURE_MS) {
        return false;
      }
    }
    return true;
  });

  eligible.sort((a, b) => {
    const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : -Infinity;
    const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : -Infinity;
    return aTime - bTime;
  });

  return eligible.slice(0, Math.max(0, limit)).map((row) => row.id);
}

// ---------------------------------------------------------------------------
// Verification agent session — one call per candidate opportunity
// ---------------------------------------------------------------------------

interface OpportunityRow {
  id: string;
  title: string;
  agency: string | null;
  funder_name: string | null;
  url: string | null;
  deadline: string | null;
  raw_json: unknown;
  last_seen_at: string | null;
}

type VerificationStatus =
  | "open_now"
  | "opens_soon"
  | "annual_cycle"
  | "rolling"
  | "uncertain";

interface SubmitVerificationInput {
  still_exists: boolean;
  window_open_now: boolean;
  deadline_iso: string | null;
  corrected_url: string | null;
  status: VerificationStatus;
  note: string;
}

interface VerificationSessionResult {
  verification: SubmitVerificationInput | null;
  tokensIn: number;
  tokensOut: number;
  searchesUsed: number;
  error?: string;
}

const SUBMIT_VERIFICATION_TOOL: Anthropic.Tool = {
  name: "submit_verification",
  description:
    "Submit your final verification of this ONE funding opportunity's current application window, based on the funder's own page. Call exactly once. Prefer null over a guess.",
  input_schema: {
    type: "object" as const,
    properties: {
      still_exists: { type: "boolean", description: "False if the program appears discontinued or the page is gone." },
      window_open_now: { type: "boolean", description: "True only if applications can be submitted today." },
      deadline_iso: {
        type: ["string", "null"],
        description: "ISO 8601 date of the next hard deadline you confirmed, or null if rolling/unknown/none.",
      },
      corrected_url: {
        type: ["string", "null"],
        description: "Updated deepest funder-page URL if the stored one is stale/redirected, else null.",
      },
      status: {
        type: "string",
        enum: ["open_now", "opens_soon", "annual_cycle", "rolling", "uncertain"],
      },
      note: {
        type: "string",
        description: "1-2 sentences on what you found, or why you couldn't verify.",
      },
    },
    required: [
      "still_exists",
      "window_open_now",
      "deadline_iso",
      "corrected_url",
      "status",
      "note",
    ],
  },
};

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

function isVerificationShaped(v: unknown): v is SubmitVerificationInput {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.still_exists === "boolean" &&
    typeof o.window_open_now === "boolean" &&
    typeof o.status === "string" &&
    typeof o.note === "string"
  );
}

function extractVerification(
  content: Anthropic.ContentBlock[],
): SubmitVerificationInput | null {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "submit_verification") {
      const input = block.input;
      if (isVerificationShaped(input)) {
        return {
          still_exists: input.still_exists,
          window_open_now: input.window_open_now,
          deadline_iso: input.deadline_iso ?? null,
          corrected_url: input.corrected_url ?? null,
          status: input.status as VerificationStatus,
          note: input.note,
        };
      }
    }
  }
  return null;
}

function buildVerificationPrompt(row: OpportunityRow, todayIso: string): string {
  const funder = row.funder_name ?? row.agency ?? "unknown funder";
  const storedStatus = rawStatus(row.raw_json) ?? "uncertain";
  return [
    `Verify the CURRENT application window for this funding opportunity, on the funder's own page:`,
    `Title: ${row.title}`,
    `Funder: ${funder}`,
    `URL: ${row.url ?? "none on file"}`,
    `Stored status: ${storedStatus}`,
    `Stored deadline: ${row.deadline ?? "none on file"}`,
    `Today's date: ${todayIso}`,
    ``,
    `Search the funder's site (and the stored URL if given) to confirm whether this program still exists, whether applications are open right now, and the next hard deadline if any. If you cannot confirm something on the funder's own page, prefer null/uncertain over guessing. Call submit_verification exactly once when done.`,
  ].join("\n");
}

/** Never throws — an errored verification returns { verification: null, error }. */
async function runVerificationAgent(
  row: OpportunityRow,
): Promise<VerificationSessionResult> {
  const client = getAnthropic();
  if (!client) {
    return {
      verification: null,
      tokensIn: 0,
      tokensOut: 0,
      searchesUsed: 0,
      error: "ANTHROPIC_API_KEY not configured",
    };
  }

  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES },
    SUBMIT_VERIFICATION_TOOL,
  ];

  const system =
    "You are a meticulous grant-cycle monitor inside a capture-operations product. " +
    "A false 'now open' is worse than no update, because a nonprofit may rush to apply to a closed program. " +
    "Search efficiently, verify on the funder's own page, then call submit_verification exactly once.";

  const todayIso = new Date().toISOString().slice(0, 10);
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildVerificationPrompt(row, todayIso) },
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

      const verification = extractVerification(resp.content);
      if (verification) {
        return { verification, tokensIn, tokensOut, searchesUsed };
      }

      if (resp.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: resp.content });
        continue;
      }

      if (turn < MAX_CONTINUATIONS) {
        messages.push({ role: "assistant", content: resp.content });
        messages.push({
          role: "user",
          content:
            "Finalize now: call submit_verification exactly once with your best-evidenced answer. Use uncertain/null fields if you couldn't confirm something.",
        });
        continue;
      }
    }
    return {
      verification: null,
      tokensIn,
      tokensOut,
      searchesUsed,
      error: "agent never called submit_verification",
    };
  } catch (err) {
    return {
      verification: null,
      tokensIn,
      tokensOut,
      searchesUsed,
      error: err instanceof Error ? err.message.slice(0, 300) : "unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Run orchestrator
// ---------------------------------------------------------------------------

export interface WatchRunResult {
  checked: number;
  updated: number;
  became_open: number;
  alerts_sent: number;
  cost_usd: number;
  errors: string[];
}

type RfpTableClient = { from: (table: string) => any };

function rfpAdmin(): RfpTableClient {
  return createAdminClient() as unknown as RfpTableClient;
}

/** opp_id -> distinct org_ids watching it (triage_status in watch/pursuing). */
async function loadWatchingOrgsByOpp(
  admin: RfpTableClient,
): Promise<{ map: Map<string, string[]>; error: string | null }> {
  const { data, error } = await admin
    .from("rfp_opp_matches")
    .select("opp_id, org_id")
    .in("triage_status", ["watch", "pursuing"]);

  const map = new Map<string, string[]>();
  if (error) {
    console.error("[rfp-research-watch] matches load failed", error.message);
    return { map, error: `watching-orgs load failed: ${error.message}` };
  }
  for (const row of (data ?? []) as Array<{ opp_id: string; org_id: string }>) {
    const list = map.get(row.opp_id);
    if (list) {
      if (!list.includes(row.org_id)) list.push(row.org_id);
    } else {
      map.set(row.opp_id, [row.org_id]);
    }
  }
  return { map, error: null };
}

async function loadCandidateOpportunities(
  admin: RfpTableClient,
  watchedOppIds: string[],
): Promise<{ rows: OpportunityRow[]; error: string | null }> {
  const orParts = ["source.eq.ai_research"];
  if (watchedOppIds.length > 0) {
    orParts.push(`id.in.(${watchedOppIds.join(",")})`);
  }

  const { data, error } = await admin
    .from("rfp_opportunities")
    .select("id, title, agency, funder_name, url, deadline, raw_json, last_seen_at, source")
    .or(orParts.join(","));

  if (error) {
    console.error("[rfp-research-watch] opportunities load failed", error.message);
    return { rows: [], error: `candidate opportunities load failed: ${error.message}` };
  }
  return {
    rows: (data ?? []) as unknown as (OpportunityRow & { source: string })[],
    error: null,
  };
}

function toStoredDeadline(iso: string | null, now: Date): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() < now.getTime()) return null;
  return d.toISOString();
}

/**
 * PURE. Decides what deadline to store after a verification pass.
 *
 * A confirmed future date always wins. When the agent couldn't confirm one,
 * an unconfirmed check preserves the previously-known deadline — only an
 * affirmative "program no longer exists" clears it. This prevents a vague
 * verification from clobbering a deadline a prior pass (or ingest) already
 * confirmed.
 */
export function resolveWatchDeadline(args: {
  deadlineIso: string | null;
  stillExists: boolean;
  previousDeadline: string | null;
  now: Date;
}): string | null {
  const confirmed = toStoredDeadline(args.deadlineIso, args.now);
  if (confirmed) return confirmed;
  if (args.stillExists === false) return null;
  return args.previousDeadline;
}

/** PURE. `discontinued` is terminal — not in WATCHABLE_AI_RESEARCH_STATUSES, so it exits watch rotation. */
export function resolveWatchStatus(verification: {
  still_exists: boolean;
  status: string;
}): string {
  return verification.still_exists === false ? "discontinued" : verification.status;
}

function resolveWatchNote(verification: SubmitVerificationInput): string {
  return verification.still_exists === false
    ? `Discontinued: ${verification.note}`
    : verification.note;
}

async function loadEmail(
  userId: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  if (cache.has(userId)) return cache.get(userId) ?? null;
  const { data, error } = await createAdminClient().auth.admin.getUserById(userId);
  const email = error ? null : (data.user?.email ?? null);
  cache.set(userId, email);
  return email;
}

function buildAlertHtml(args: {
  kind: "window_open" | "deadline_set";
  title: string;
  funder: string;
  deadline: string | null;
  oppUrl: string;
  sourceUrl: string | null;
}): string {
  const headline =
    args.kind === "window_open"
      ? "This watched opportunity is now open"
      : "A deadline has been set for this watched opportunity";
  const deadlineLine = args.deadline
    ? `<p style="margin:8px 0 0;font-size:14px;color:#3f3f46;">Deadline: ${new Date(args.deadline).toLocaleDateString("en-US")}</p>`
    : "";
  const sourceLine = args.sourceUrl
    ? `<p style="margin:12px 0 0;"><a href="${args.sourceUrl}" style="color:#047857;font-size:13px;">View on funder's page</a></p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:28px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
        <tr><td>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#047857;">Cycle watch</div>
          <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;color:#111827;">${headline}</h1>
          <p style="margin:10px 0 0;font-size:15px;font-weight:700;color:#111827;">${args.title}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#52525b;">${args.funder}</p>
          ${deadlineLine}
          <p style="margin:16px 0 0;"><a href="${args.oppUrl}" style="display:inline-block;color:#ffffff;background:#047857;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">Open in Discovery</a></p>
          ${sourceLine}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendAlertsForOpp(args: {
  oppId: string;
  title: string;
  funder: string;
  sourceUrl: string | null;
  deadline: string | null;
  orgIds: string[];
  kinds: Array<"window_open" | "deadline_set">;
  emailCache: Map<string, string | null>;
}): Promise<number> {
  if (args.orgIds.length === 0 || args.kinds.length === 0) return 0;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://rfp.perpetualcore.com").replace(/\/$/, "");
  const rfp = rfpAdmin();

  const { data: members, error } = await rfp
    .from("rfp_user_orgs")
    .select("user_id, org_id")
    .in("org_id", args.orgIds)
    .in("role", ["owner", "writer"]);

  if (error) {
    console.error("[rfp-research-watch] member load failed", error.message);
    return 0;
  }

  let sent = 0;
  for (const member of (members ?? []) as Array<{ user_id: string; org_id: string }>) {
    for (const kind of args.kinds) {
      const { data: inserted, error: insertError } = await rfp
        .from("rfp_watch_alert_log")
        .upsert(
          { opp_id: args.oppId, user_id: member.user_id, org_id: member.org_id, kind },
          { onConflict: "opp_id,user_id,kind", ignoreDuplicates: true },
        )
        .select("id");

      if (insertError) {
        console.error("[rfp-research-watch] alert dedup insert failed", insertError.message);
        continue;
      }
      if (!inserted || inserted.length === 0) continue; // already alerted

      const email = await loadEmail(member.user_id, args.emailCache);
      if (!email) continue;

      const subject =
        kind === "window_open"
          ? `Watched opportunity is now open: ${args.title}`
          : `Deadline set for watched opportunity: ${args.title}`;
      const oppUrl = `${appUrl}/org/${member.org_id}/pursuits/${args.oppId}`;
      const html = buildAlertHtml({
        kind,
        title: args.title,
        funder: args.funder,
        deadline: args.deadline,
        oppUrl,
        sourceUrl: args.sourceUrl,
      });

      const result = await sendEmail(email, subject, html);
      if (result.success) sent++;
    }
  }
  return sent;
}

export interface RunResearchWatchOptions {
  limit?: number;
}

export async function runResearchWatch(
  options: RunResearchWatchOptions = {},
): Promise<WatchRunResult> {
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 200);
  const now = new Date();
  const admin = createAdminClient();
  const rfp = admin as unknown as RfpTableClient;

  const result: WatchRunResult = {
    checked: 0,
    updated: 0,
    became_open: 0,
    alerts_sent: 0,
    cost_usd: 0,
    errors: [],
  };

  const { map: watchingOrgsByOpp, error: matchesError } = await loadWatchingOrgsByOpp(rfp);
  if (matchesError) result.errors.push(matchesError);
  const watchedOppIds = Array.from(watchingOrgsByOpp.keys());
  const { rows: opportunities, error: opportunitiesError } = await loadCandidateOpportunities(
    rfp,
    watchedOppIds,
  );
  if (opportunitiesError) result.errors.push(opportunitiesError);

  const rows: WatchCandidateRow[] = opportunities.map((o) => ({
    id: o.id,
    source: (o as OpportunityRow & { source: string }).source,
    deadline: o.deadline,
    raw_json: o.raw_json,
    last_seen_at: o.last_seen_at,
    watched: watchingOrgsByOpp.has(o.id),
  }));

  const candidateIds = new Set(selectWatchCandidates(rows, now, limit));
  const candidates = opportunities.filter((o) => candidateIds.has(o.id));

  const emailCache = new Map<string, string | null>();

  for (const row of candidates) {
    result.checked++;
    const session = await runVerificationAgent(row);

    const costUsd =
      computeCostUsd(MODEL, session.tokensIn, session.tokensOut) +
      session.searchesUsed * WEB_SEARCH_USD_PER_SEARCH;
    result.cost_usd += costUsd;

    const watchingOrgIds = watchingOrgsByOpp.get(row.id) ?? [];
    if (watchingOrgIds.length > 0) {
      const perOrgCostUsd = costUsd / watchingOrgIds.length;
      await Promise.all(
        watchingOrgIds.map((orgId) =>
          recordCost(orgId, {
            agent: AGENT_NAME,
            model: MODEL,
            tokensIn: session.tokensIn,
            tokensOut: session.tokensOut,
            costUsd: perOrgCostUsd,
          }).catch((err: unknown) => {
            console.error(
              "[rfp-research-watch] recordCost failed (non-fatal)",
              err instanceof Error ? err.message : String(err),
            );
          }),
        ),
      );
    }

    if (session.error || !session.verification) {
      result.errors.push(`${row.id}: ${session.error ?? "no verification returned"}`);
      continue;
    }

    const verification = session.verification;
    const oldStatus = rawStatus(row.raw_json) ?? "uncertain";
    const oldDeadline = row.deadline;
    const isDiscontinued = verification.still_exists === false;
    const newDeadline = resolveWatchDeadline({
      deadlineIso: verification.deadline_iso,
      stillExists: verification.still_exists,
      previousDeadline: oldDeadline,
      now,
    });
    const newStatus = resolveWatchStatus(verification);
    const nowIso = now.toISOString();

    const becameOpen =
      !isDiscontinued &&
      oldStatus !== "open_now" &&
      (verification.window_open_now || verification.status === "open_now");
    const deadlineSet = !isDiscontinued && oldDeadline === null && newDeadline !== null;

    const priorRaw =
      typeof row.raw_json === "object" && row.raw_json !== null
        ? (row.raw_json as Record<string, unknown>)
        : {};

    const { error: updateError } = await admin
      .from("rfp_opportunities")
      .update({
        deadline: newDeadline,
        url: verification.corrected_url ?? row.url,
        last_seen_at: nowIso,
        raw_json: {
          ...priorRaw,
          status: newStatus,
          watch: { last_checked: nowIso, note: resolveWatchNote(verification) },
        },
      })
      .eq("id", row.id);

    if (updateError) {
      result.errors.push(`${row.id}: update failed — ${updateError.message}`);
      continue;
    }

    result.updated++;
    if (becameOpen) result.became_open++;

    const kinds: Array<"window_open" | "deadline_set"> = [];
    if (becameOpen) kinds.push("window_open");
    if (deadlineSet) kinds.push("deadline_set");

    if (kinds.length > 0 && watchingOrgIds.length > 0) {
      const sent = await sendAlertsForOpp({
        oppId: row.id,
        title: row.title,
        funder: row.funder_name ?? row.agency ?? "Funder not listed",
        sourceUrl: verification.corrected_url ?? row.url,
        deadline: newDeadline,
        orgIds: watchingOrgIds,
        kinds,
        emailCache,
      }).catch((err: unknown) => {
        result.errors.push(
          `${row.id}: alert send failed — ${err instanceof Error ? err.message : String(err)}`,
        );
        return 0;
      });
      result.alerts_sent += sent;
    }
  }

  return result;
}
