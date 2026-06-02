"use client";

import { useState } from "react";

interface AlertRunSearch {
  search_id: string;
  name: string;
  org_id: string;
  frequency: "instant" | "daily" | "weekly";
  matches: number;
  would_send: boolean;
  sent: boolean;
}

interface AlertRunResult {
  checked: number;
  matched: number;
  sent: number;
  dry_run: boolean;
  force: boolean;
  skipped: {
    not_due: number;
    no_email: number;
    resend_not_configured: number;
  };
  searches: AlertRunSearch[];
}

export function SavedSearchAlertOpsPanel() {
  const [running, setRunning] = useState<"dry" | "send" | null>(null);
  const [result, setResult] = useState<AlertRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sendCount = result?.dry_run
    ? result.searches.filter((row) => row.would_send).length
    : result?.sent ?? 0;

  async function run(mode: "dry" | "send") {
    setRunning(mode);
    setError(null);
    try {
      const response = await fetch("/api/rfp/admin/saved-search-alerts/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dry_run: mode === "dry",
          force: true,
          limit: 100,
        }),
      });
      const payload = (await response.json()) as AlertRunResult & {
        error?: string;
        detail?: string;
      };
      if (!response.ok) {
        throw new Error(payload.detail ?? payload.error ?? "Alert run failed");
      }
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Alert run failed");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Manual validation
          </div>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-400">
            Run a forced dry check to verify current saved-search volume, or send
            eligible alerts now when you are validating production delivery.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => run("dry")}
            disabled={running !== null}
            className="rounded-md border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-200 hover:border-emerald-400/40 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running === "dry" ? "Checking..." : "Dry run"}
          </button>
          <button
            type="button"
            onClick={() => run("send")}
            disabled={running !== null}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-100 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running === "send" ? "Sending..." : "Send now"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-[13px] text-rose-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <ResultTile label="Checked" value={result.checked} />
          <ResultTile label="Matched" value={result.matched} />
          <ResultTile
            label={result.dry_run ? "Would send" : "Sent"}
            value={sendCount}
          />
          <ResultTile label="No email" value={result.skipped.no_email} />
        </div>
      ) : null}

      {result && result.searches.length > 0 ? (
        <div className="mt-4 max-h-64 overflow-auto rounded-md border border-white/5">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead>
              <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <th className="px-3 py-2">Search</th>
                <th className="px-3 py-2 text-right">Matches</th>
                <th className="px-3 py-2">Frequency</th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.searches.slice(0, 20).map((row) => (
                <tr
                  key={row.search_id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-3 py-2 text-zinc-300">{row.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-300">
                    {row.matches}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">
                    {row.frequency}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    {row.sent ? "sent" : row.would_send ? "ready" : "skipped"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function ResultTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/5 bg-black/20 p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}
