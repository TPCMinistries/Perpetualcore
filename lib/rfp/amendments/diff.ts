import { createHash } from "crypto";

export interface SolicitationSnapshotInput {
  title: string;
  deadline: string | null;
  amount_min: number | null;
  amount_max: number | null;
  brief: string | null;
  source_url: string | null;
  package_text?: string | null;
  live_text?: string | null;
  raw_json?: unknown;
}

export interface SolicitationSnapshot {
  content_hash: string;
  title: string;
  deadline: string | null;
  amount_min: number | null;
  amount_max: number | null;
  source_url: string | null;
  snapshot_text: string;
  snapshot_json: Record<string, unknown>;
}

export interface SolicitationDiff {
  changed: boolean;
  material: boolean;
  material_reasons: string[];
  field_changes: Array<{
    field: string;
    before: string | number | null;
    after: string | number | null;
  }>;
  added_lines: string[];
  removed_lines: string[];
  summary: string;
}

const MATERIAL_PATTERNS =
  /\b(amendment|addendum|deadline|due date|closing date|scope|eligib|budget|cost share|match|submission|portal|attachment|page limit|evaluation|scoring|questions due)\b/i;

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function canonicalNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function lineSet(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\n+|(?<=[.!?])\s+/)) {
    const cleaned = cleanText(line);
    if (cleaned.length < 24) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= 200) break;
  }
  return out;
}

function hashSnapshot(value: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildSolicitationSnapshot(
  input: SolicitationSnapshotInput,
): SolicitationSnapshot {
  const text = cleanText(input.live_text) || cleanText(input.package_text) || cleanText(input.brief);
  const snapshotJson = {
    title: cleanText(input.title),
    deadline: input.deadline,
    amount_min: canonicalNumber(input.amount_min),
    amount_max: canonicalNumber(input.amount_max),
    source_url: input.source_url,
    text,
    raw_json: input.raw_json ?? null,
  };

  return {
    content_hash: hashSnapshot(snapshotJson),
    title: snapshotJson.title,
    deadline: input.deadline,
    amount_min: snapshotJson.amount_min,
    amount_max: snapshotJson.amount_max,
    source_url: input.source_url,
    snapshot_text: text,
    snapshot_json: snapshotJson,
  };
}

export function diffSolicitationSnapshots(
  previous: SolicitationSnapshot,
  current: SolicitationSnapshot,
): SolicitationDiff {
  const fieldChanges: SolicitationDiff["field_changes"] = [];
  for (const field of ["title", "deadline", "amount_min", "amount_max", "source_url"] as const) {
    if (previous[field] !== current[field]) {
      fieldChanges.push({
        field,
        before: previous[field],
        after: current[field],
      });
    }
  }

  const previousLines = lineSet(previous.snapshot_text);
  const currentLines = lineSet(current.snapshot_text);
  const prevKeys = new Set(previousLines.map((line) => line.toLowerCase()));
  const currKeys = new Set(currentLines.map((line) => line.toLowerCase()));
  const addedLines = currentLines.filter((line) => !prevKeys.has(line.toLowerCase())).slice(0, 12);
  const removedLines = previousLines.filter((line) => !currKeys.has(line.toLowerCase())).slice(0, 12);

  const materialReasons: string[] = [];
  if (fieldChanges.some((change) => change.field === "deadline")) {
    materialReasons.push("Deadline changed");
  }
  if (fieldChanges.some((change) => change.field === "amount_min" || change.field === "amount_max")) {
    materialReasons.push("Award or budget amount changed");
  }
  if (addedLines.some((line) => MATERIAL_PATTERNS.test(line))) {
    materialReasons.push("Material amendment language added");
  }
  if (removedLines.some((line) => MATERIAL_PATTERNS.test(line))) {
    materialReasons.push("Material solicitation language removed");
  }
  if (fieldChanges.some((change) => change.field === "title")) {
    materialReasons.push("Solicitation title changed");
  }

  const changed =
    fieldChanges.length > 0 || addedLines.length > 0 || removedLines.length > 0;

  return {
    changed,
    material: materialReasons.length > 0,
    material_reasons: materialReasons,
    field_changes: fieldChanges,
    added_lines: addedLines,
    removed_lines: removedLines,
    summary: changed
      ? `${fieldChanges.length} field change(s), ${addedLines.length} added line(s), ${removedLines.length} removed line(s).`
      : "No solicitation change detected.",
  };
}
