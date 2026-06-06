import { csvDocument } from "@/lib/rfp/export/csv";

export interface RfpAuditTrailRow {
  created_at: string;
  agent: string;
  model: string | null;
  session_id: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  proposal_id: string | null;
  org_id: string;
}

export const AUDIT_TRAIL_CSV_HEADER = [
  "Created at",
  "Agent",
  "Model",
  "Session ID",
  "Tokens in",
  "Tokens out",
  "Cost USD",
  "Proposal ID",
  "Org ID",
] as const;

export function auditTrailCsvDocument(rows: RfpAuditTrailRow[]): string {
  return csvDocument([
    [...AUDIT_TRAIL_CSV_HEADER],
    ...rows.map((row) => [
      row.created_at,
      row.agent,
      row.model ?? "",
      row.session_id ?? "",
      row.tokens_in ?? 0,
      row.tokens_out ?? 0,
      row.cost_usd ?? 0,
      row.proposal_id ?? "",
      row.org_id,
    ]),
  ]);
}
