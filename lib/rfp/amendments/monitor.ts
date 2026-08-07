import { createAdminClient } from "@/lib/supabase/server";
import { fetchUrlContent } from "@/lib/rfp/import/fetch-url";
import {
  buildSolicitationSnapshot,
  diffSolicitationSnapshots,
  type SolicitationDiff,
  type SolicitationSnapshot,
} from "@/lib/rfp/amendments/diff";

export const RFP_AMENDMENT_MONITOR_CRON = "rfp-amendment-monitor";

export interface AmendmentMonitorResult {
  scanned: number;
  baselined: number;
  unchanged: number;
  amendments: number;
  material: number;
  errors: string[];
}

interface ActiveProposalRow {
  id: string;
  org_id: string;
  opp_id: string;
  title: string;
  status: string;
  due_date: string | null;
  rfp_opportunities: {
    id: string;
    title: string;
    deadline: string | null;
    amount_min: number | null;
    amount_max: number | null;
    brief: string | null;
    url: string | null;
    raw_json: unknown;
  } | null;
}

interface PackageDocRow {
  id: string;
  source_url: string | null;
  extracted_text: string | null;
  created_at: string;
}

interface SnapshotRow {
  id: string;
  org_id: string;
  opp_id: string;
  proposal_id: string | null;
  package_doc_id: string | null;
  source_url: string | null;
  content_hash: string;
  title: string;
  deadline: string | null;
  amount_min: number | null;
  amount_max: number | null;
  snapshot_text: string;
  snapshot_json: Record<string, unknown>;
  created_at: string;
}

interface AmendmentRow {
  id: string;
}

function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

function rowToSnapshot(row: SnapshotRow): SolicitationSnapshot {
  return {
    content_hash: row.content_hash,
    title: row.title,
    deadline: row.deadline,
    amount_min: row.amount_min,
    amount_max: row.amount_max,
    source_url: row.source_url,
    snapshot_text: row.snapshot_text,
    snapshot_json: row.snapshot_json,
  };
}

async function loadActiveProposals(limit: number): Promise<ActiveProposalRow[]> {
  const admin = rfpAdmin();
  const { data, error } = await admin
    .from("rfp_proposals")
    .select(
      "id, org_id, opp_id, title, status, due_date, rfp_opportunities ( id, title, deadline, amount_min, amount_max, brief, url, raw_json )",
    )
    .not("opp_id", "is", null)
    .in("status", ["draft", "submitted"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`active_proposals_load_failed: ${error.message}`);
  return ((data ?? []) as ActiveProposalRow[]).filter((row) => row.opp_id && row.rfp_opportunities);
}

async function loadLatestPackageDoc(proposalId: string): Promise<PackageDocRow | null> {
  const admin = rfpAdmin();
  const { data, error } = await admin
    .from("rfp_package_documents")
    .select("id, source_url, extracted_text, created_at")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`package_doc_load_failed: ${error.message}`);
  return (data ?? null) as PackageDocRow | null;
}

async function loadLatestSnapshot(orgId: string, oppId: string): Promise<SnapshotRow | null> {
  const admin = rfpAdmin();
  const { data, error } = await admin
    .from("rfp_solicitation_snapshots")
    .select("*")
    .eq("org_id", orgId)
    .eq("opp_id", oppId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`snapshot_load_failed: ${error.message}`);
  return (data ?? null) as SnapshotRow | null;
}

async function fetchLiveText(url: string | null, enabled: boolean): Promise<string | null> {
  if (!enabled || !url) return null;
  try {
    const fetched = await fetchUrlContent(url);
    return fetched.text || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[rfp/amendments] live fetch skipped:", message.slice(0, 200));
    return null;
  }
}

async function insertSnapshot(args: {
  row: ActiveProposalRow;
  packageDoc: PackageDocRow | null;
  snapshot: SolicitationSnapshot;
}): Promise<SnapshotRow> {
  const admin = rfpAdmin();
  const { data, error } = await admin
    .from("rfp_solicitation_snapshots")
    .upsert(
      {
        org_id: args.row.org_id,
        opp_id: args.row.opp_id,
        proposal_id: args.row.id,
        package_doc_id: args.packageDoc?.id ?? null,
        source_url: args.snapshot.source_url,
        content_hash: args.snapshot.content_hash,
        title: args.snapshot.title,
        deadline: args.snapshot.deadline,
        amount_min: args.snapshot.amount_min,
        amount_max: args.snapshot.amount_max,
        snapshot_text: args.snapshot.snapshot_text,
        snapshot_json: args.snapshot.snapshot_json,
      },
      { onConflict: "org_id,opp_id,content_hash", ignoreDuplicates: false },
    )
    .select("*")
    .single();

  if (error) throw new Error(`snapshot_insert_failed: ${error.message}`);
  return data as SnapshotRow;
}

async function insertAmendment(args: {
  row: ActiveProposalRow;
  previousSnapshotId: string;
  currentSnapshotId: string;
  diff: SolicitationDiff;
}): Promise<AmendmentRow> {
  const admin = rfpAdmin();
  const { data, error } = await admin
    .from("rfp_solicitation_amendments")
    .upsert(
      {
        org_id: args.row.org_id,
        opp_id: args.row.opp_id,
        proposal_id: args.row.id,
        previous_snapshot_id: args.previousSnapshotId,
        current_snapshot_id: args.currentSnapshotId,
        material: args.diff.material,
        material_reasons: args.diff.material_reasons,
        diff_json: {
          summary: args.diff.summary,
          field_changes: args.diff.field_changes,
          added_lines: args.diff.added_lines,
          removed_lines: args.diff.removed_lines,
        },
      },
      {
        onConflict: "org_id,opp_id,previous_snapshot_id,current_snapshot_id",
        ignoreDuplicates: false,
      },
    )
    .select("id")
    .single();

  if (error) throw new Error(`amendment_insert_failed: ${error.message}`);
  return data as AmendmentRow;
}

async function createMaterialFollowUps(args: {
  row: ActiveProposalRow;
  amendmentId: string;
  diff: SolicitationDiff;
}): Promise<void> {
  const admin = rfpAdmin();
  const title = "Review material solicitation amendment";
  const detail = [
    args.diff.material_reasons.join("; "),
    args.diff.summary,
    "Re-run compliance and fit checks before relying on the current submission packet.",
  ].filter(Boolean).join(" ");

  await admin.from("rfp_submission_tasks").upsert(
    {
      proposal_id: args.row.id,
      source_type: "manual",
      source_id: `amendment:${args.amendmentId}`,
      title,
      detail,
      owner_label: "Proposal lead",
      status: "open",
      priority: "critical",
      due_date: args.row.due_date ? args.row.due_date.slice(0, 10) : null,
      notes: "",
      evidence: args.diff.added_lines[0] ?? args.diff.field_changes[0]?.field ?? "",
      created_by: null,
    },
    { onConflict: "proposal_id,source_type,source_id", ignoreDuplicates: false },
  );

  await admin.from("rfp_pursuit_decision_logs").insert({
    org_id: args.row.org_id,
    opp_id: args.row.opp_id,
    event_type: "risk",
    title: "Material amendment detected",
    body: detail,
    created_by: null,
  });
}

export async function runAmendmentMonitor(options: {
  limit?: number;
  fetchLive?: boolean;
} = {}): Promise<AmendmentMonitorResult> {
  const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
  const fetchLive = options.fetchLive ?? false;
  const rows = await loadActiveProposals(limit);
  const result: AmendmentMonitorResult = {
    scanned: 0,
    baselined: 0,
    unchanged: 0,
    amendments: 0,
    material: 0,
    errors: [],
  };

  for (const row of rows) {
    result.scanned += 1;
    try {
      const opp = row.rfp_opportunities;
      if (!opp) {
        result.errors.push(`missing_opp:${row.opp_id}`);
        continue;
      }
      const packageDoc = await loadLatestPackageDoc(row.id);
      const sourceUrl = packageDoc?.source_url || opp.url;
      const liveText = await fetchLiveText(sourceUrl, fetchLive);
      const snapshot = buildSolicitationSnapshot({
        title: opp.title,
        deadline: opp.deadline,
        amount_min: opp.amount_min,
        amount_max: opp.amount_max,
        brief: opp.brief,
        source_url: sourceUrl,
        package_text: packageDoc?.extracted_text ?? null,
        live_text: liveText,
        raw_json: opp.raw_json,
      });

      const previous = await loadLatestSnapshot(row.org_id, row.opp_id);
      if (!previous) {
        await insertSnapshot({ row, packageDoc, snapshot });
        result.baselined += 1;
        continue;
      }

      if (previous.content_hash === snapshot.content_hash) {
        result.unchanged += 1;
        continue;
      }

      const current = await insertSnapshot({ row, packageDoc, snapshot });
      const diff = diffSolicitationSnapshots(rowToSnapshot(previous), rowToSnapshot(current));
      if (!diff.changed) {
        result.unchanged += 1;
        continue;
      }

      const amendment = await insertAmendment({
        row,
        previousSnapshotId: previous.id,
        currentSnapshotId: current.id,
        diff,
      });
      result.amendments += 1;
      if (diff.material) {
        result.material += 1;
        await createMaterialFollowUps({ row, amendmentId: amendment.id, diff });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${row.id}:${message.slice(0, 200)}`);
    }
  }

  return result;
}
