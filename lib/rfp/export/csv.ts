export function csvCell(value: string | number | boolean | null | undefined): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvDocument(rows: Array<Array<string | number | boolean | null | undefined>>): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function exportFilename(input: string, suffix: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "proposal"}-${suffix}.csv`;
}
