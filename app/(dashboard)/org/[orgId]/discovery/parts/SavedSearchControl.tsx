"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, Save, Trash2 } from "lucide-react";
import type { FilterValues, ModeFilter } from "./FilterPills";
import type { RfpSavedSearch } from "@/lib/rfp/saved-searches";

interface SavedSearchControlProps {
  orgId: string;
  filters: FilterValues;
  mode: ModeFilter;
  onApply: (filters: FilterValues, mode: ModeFilter) => void;
}

function hasFilters(filters: FilterValues, mode: ModeFilter): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.sources.length > 0 ||
    filters.deadline_within_days !== null ||
    filters.min_amount !== null ||
    mode !== "all"
  );
}

function defaultName(filters: FilterValues): string {
  if (filters.query.trim()) return filters.query.trim().slice(0, 80);
  if (filters.sources.length > 0) return `${filters.sources.length} source filter`;
  if (filters.deadline_within_days) return `Due in ${filters.deadline_within_days} days`;
  if (filters.min_amount) return `$${filters.min_amount.toLocaleString()}+ opportunities`;
  return "Saved opportunity search";
}

function describeSearch(row: RfpSavedSearch): string {
  const parts: string[] = [];
  if (row.filters.query) parts.push(row.filters.query);
  if (row.filters.sources.length > 0) parts.push(`${row.filters.sources.length} sources`);
  if (row.filters.deadline_within_days) parts.push(`${row.filters.deadline_within_days}d`);
  if (row.filters.min_amount) parts.push(`$${row.filters.min_amount.toLocaleString()}+`);
  if (row.mode !== "all") parts.push(row.mode);
  return parts.length > 0 ? parts.join(" · ") : "All opportunities";
}

export function SavedSearchControl({
  orgId,
  filters,
  mode,
  onApply,
}: SavedSearchControlProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RfpSavedSearch[]>([]);
  const [name, setName] = useState(defaultName(filters));
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const canSave = useMemo(() => hasFilters(filters, mode), [filters, mode]);

  useEffect(() => {
    setName(defaultName(filters));
  }, [filters]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/rfp/orgs/${orgId}/saved-searches`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load failed"))))
      .then((data: { rows: RfpSavedSearch[] }) => {
        if (!cancelled) setRows(data.rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Saved searches are unavailable right now.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, orgId]);

  async function saveCurrent() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/saved-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || defaultName(filters),
          filters,
          mode,
          is_shared: false,
          alert_enabled: alertEnabled,
          alert_frequency: "weekly",
          min_fit_score: 70,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as { row: RfpSavedSearch };
      setRows((prev) => [data.row, ...prev]);
    } catch {
      setError("Could not save this search.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSearch(searchId: string) {
    setError(null);
    const previous = rows;
    setRows((prev) => prev.filter((row) => row.id !== searchId));
    const res = await fetch(`/api/rfp/orgs/${orgId}/saved-searches/${searchId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setRows(previous);
      setError("Could not delete that search.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Save className="h-4 w-4" />
        Saved searches
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,420px)] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950">Save current search</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Preserve this exact filter set for repeat sourcing.
                </p>
              </div>
              {alertEnabled && <Bell className="h-4 w-4 text-emerald-700" />}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500"
                maxLength={80}
              />
              <button
                type="button"
                disabled={!canSave || saving}
                onClick={saveCurrent}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(event) => setAlertEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Alert me weekly when new matches fit this search
            </label>
            {!canSave && (
              <p className="mt-2 text-xs text-zinc-500">
                Add a keyword, filter, source, deadline, amount, or mode first.
              </p>
            )}
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto">
            {rows.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-zinc-500">
                No saved searches yet.
              </p>
            ) : (
              <div className="space-y-1">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onApply(row.filters, row.mode);
                        setOpen(false);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-zinc-950">
                        {row.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {describeSearch(row)}
                        {row.alert_enabled ? ` · ${row.alert_frequency} alerts` : ""}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSearch(row.id)}
                      className="rounded-md p-1.5 text-zinc-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
