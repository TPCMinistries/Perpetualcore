"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, Save, Trash2 } from "lucide-react";
import type { FilterValues, ModeFilter } from "./FilterPills";
import type {
  RfpSavedSearch,
  RfpSavedSearchWithPreview,
} from "@/lib/rfp/saved-searches";

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
    filters.actionability !== null ||
    filters.sort !== "fit" ||
    mode !== "all"
  );
}

function defaultName(filters: FilterValues): string {
  if (filters.query.trim()) return filters.query.trim().slice(0, 80);
  if (filters.sources.length > 0) return `${filters.sources.length} source filter`;
  if (filters.deadline_within_days) return `Due in ${filters.deadline_within_days} days`;
  if (filters.min_amount) return `$${filters.min_amount.toLocaleString()}+ opportunities`;
  if (filters.actionability === "ready") return "Ready to pursue";
  if (filters.actionability === "needs_review") return "Needs review";
  if (filters.actionability === "missing_info") return "Missing info";
  if (filters.sort === "readiness") return "Pursuit-ready opportunities";
  if (filters.sort === "deadline") return "Deadline-priority opportunities";
  return "Saved opportunity search";
}

function describeSearch(row: RfpSavedSearch): string {
  const parts: string[] = [];
  if (row.filters.query) parts.push(row.filters.query);
  if (row.filters.sources.length > 0) parts.push(`${row.filters.sources.length} sources`);
  if (row.filters.deadline_within_days) parts.push(`${row.filters.deadline_within_days}d`);
  if (row.filters.min_amount) parts.push(`$${row.filters.min_amount.toLocaleString()}+`);
  if (row.filters.actionability) parts.push(row.filters.actionability.replace("_", " "));
  if (row.filters.sort !== "fit") parts.push(`sort ${row.filters.sort}`);
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
  const [rows, setRows] = useState<RfpSavedSearchWithPreview[]>([]);
  const [name, setName] = useState(defaultName(filters));
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertFrequency, setAlertFrequency] =
    useState<RfpSavedSearch["alert_frequency"]>("weekly");
  const [minFitScore, setMinFitScore] = useState(70);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      .then((data: { rows: RfpSavedSearchWithPreview[] }) => {
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
          alert_frequency: alertFrequency,
          min_fit_score: minFitScore,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as { row: RfpSavedSearchWithPreview };
      setRows((prev) => [data.row, ...prev]);
    } catch {
      setError("Could not save this search.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSearch(
    searchId: string,
    patch: Partial<
      Pick<RfpSavedSearch, "alert_enabled" | "alert_frequency" | "min_fit_score">
    >,
  ) {
    setError(null);
    setUpdatingId(searchId);
    const previous = rows;
    setRows((current) =>
      current.map((row) => (row.id === searchId ? { ...row, ...patch } : row)),
    );
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/saved-searches/${searchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("update failed");
      const data = (await res.json()) as { row: RfpSavedSearchWithPreview };
      setRows((current) =>
        current.map((row) => (row.id === searchId ? { ...row, ...data.row } : row)),
      );
    } catch {
      setRows(previous);
      setError("Could not update that saved search.");
    } finally {
      setUpdatingId(null);
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
              Send me alerts when new matches fit this search
            </label>
            {alertEnabled ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-xs text-zinc-600">
                  <span className="mb-1 block">Frequency</span>
                  <select
                    value={alertFrequency}
                    onChange={(event) =>
                      setAlertFrequency(
                        event.target.value as RfpSavedSearch["alert_frequency"],
                      )
                    }
                    className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-zinc-500"
                  >
                    <option value="instant">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <label className="text-xs text-zinc-600">
                  <span className="mb-1 block">Minimum fit</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minFitScore}
                    onChange={(event) =>
                      setMinFitScore(
                        Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                      )
                    }
                    className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-zinc-500"
                  />
                </label>
              </div>
            ) : null}
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
                      {row.preview && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-700">
                          {row.preview.matches_now} matches now ·{" "}
                          {row.preview.new_since_last_run} new
                        </p>
                      )}
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={updatingId === row.id}
                        onClick={() =>
                          updateSearch(row.id, {
                            alert_enabled: !row.alert_enabled,
                          })
                        }
                        className={`rounded-md p-1.5 transition ${
                          row.alert_enabled
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        } disabled:opacity-50`}
                        aria-label={
                          row.alert_enabled
                            ? `Disable alerts for ${row.name}`
                            : `Enable alerts for ${row.name}`
                        }
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                      {row.alert_enabled ? (
                        <>
                          <select
                            value={row.alert_frequency}
                            disabled={updatingId === row.id}
                            onChange={(event) =>
                              updateSearch(row.id, {
                                alert_frequency:
                                  event.target.value as RfpSavedSearch["alert_frequency"],
                              })
                            }
                            className="h-7 rounded-md border border-zinc-200 bg-white px-1 text-[11px] text-zinc-600 outline-none hover:border-zinc-300 disabled:opacity-50"
                            aria-label={`Alert frequency for ${row.name}`}
                          >
                            <option value="instant">1h</option>
                            <option value="daily">1d</option>
                            <option value="weekly">1w</option>
                          </select>
                          <input
                            key={`${row.id}-${row.min_fit_score}`}
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={row.min_fit_score}
                            disabled={updatingId === row.id}
                            onBlur={(event) => {
                              const nextScore = Math.max(
                                0,
                                Math.min(100, Number(event.target.value) || 0),
                              );
                              if (nextScore !== row.min_fit_score) {
                                void updateSearch(row.id, {
                                  min_fit_score: nextScore,
                                });
                              }
                            }}
                            className="h-7 w-12 rounded-md border border-zinc-200 bg-white px-1 text-[11px] text-zinc-600 outline-none hover:border-zinc-300 disabled:opacity-50"
                            aria-label={`Minimum fit score for ${row.name}`}
                          />
                        </>
                      ) : null}
                    </div>
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
