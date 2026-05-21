"use client";

/**
 * VellumWaitlistClient — client-side CSV export button for /admin/vellum-waitlist.
 *
 * Receives rows as a prop from the server component, generates a CSV data URI
 * client-side, and triggers a download via <a download>. No server endpoint needed.
 */

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type WaitlistRow = {
  id: string;
  email: string;
  tier_preference: string | null;
  organization_type: string | null;
  is_501c3: boolean | null;
  source: string | null;
  setup_intent_id: string | null;
  created_at: string;
};

function toCSV(rows: WaitlistRow[]): string {
  const headers = [
    "id",
    "email",
    "tier_preference",
    "organization_type",
    "is_501c3",
    "source",
    "setup_intent_id",
    "created_at",
  ];

  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    // CSV escape: wrap in quotes if contains comma, quote, or newline
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escape(r.id),
        escape(r.email),
        escape(r.tier_preference),
        escape(r.organization_type),
        escape(r.is_501c3),
        escape(r.source),
        escape(r.setup_intent_id),
        escape(r.created_at),
      ].join(",")
    ),
  ];

  return lines.join("\n");
}

export function VellumWaitlistClient({ rows }: { rows: WaitlistRow[] }) {
  function handleExport() {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vellum-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-muted-foreground">
        {rows.length} signup{rows.length !== 1 ? "s" : ""} total
      </p>
      {rows.length > 0 && (
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Export CSV
        </Button>
      )}
    </div>
  );
}
