"use client";

/**
 * FilterPills — the three filter controls above the feed.
 *
 * Per 05-CONTEXT.md "Feed layout" → "Default sort + filters":
 *   - Source (multi-select)
 *   - Deadline window (single-select: all / 30d / 7d)
 *   - Min amount (numeric input with $ prefix)
 *
 * Implementation choice: lightweight popovers built on Tailwind primitives
 * rather than shadcn DropdownMenu — we need multi-select with checkboxes for
 * Source, a tab-style toggle for Deadline, and a number input for Min amount.
 * Each is visually a "pill" (rounded, dark zinc, mono uppercase eyebrow).
 *
 * When any filter is active, a small × clear-all sits at the right end.
 */

import { useEffect, useRef, useState } from "react";

export type DeadlineWindow = 7 | 30 | null;

/**
 * Phase 05-06 — Mode filter, surfaced only to dual-org users. 'all' unions
 * scored matches across both nonprofit + forprofit member orgs; nonprofit and
 * forprofit narrow to one side. Single-mode users never see this control.
 */
export type ModeFilter = "all" | "nonprofit" | "forprofit";

export interface FilterValues {
  query: string;
  sources: string[];
  deadline_within_days: DeadlineWindow;
  min_amount: number | null;
}

interface FilterPillsProps {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  /** True only when the active org's type === 'dual'. Hides the Mode pill otherwise. */
  isDualMode?: boolean;
  /** Current dual-mode selection. Required when isDualMode is true. */
  mode?: ModeFilter;
  /** Notifier for Mode pill changes. Required when isDualMode is true. */
  onModeChange?: (next: ModeFilter) => void;
}

const SOURCE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "sam_gov", label: "SAM.gov" },
  { key: "grants_gov", label: "Grants.gov" },
  { key: "simpler_grants", label: "Simpler.Grants.gov" },
  { key: "sbir", label: "SBIR.gov" },
  { key: "ny_state", label: "NY State" },
  { key: "nyc_dycd", label: "NYC DYCD" },
  { key: "nyc_hra", label: "NYC HRA" },
  { key: "nyc_doe", label: "NYC DOE" },
  { key: "foundation_url", label: "Foundation URL" },
];

function pillBase(active: boolean): string {
  return `inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-150 motion-reduce:transition-none ${
    active
      ? "border-zinc-950 bg-zinc-950 text-white"
      : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950"
  }`;
}

// ── Mode pill (dual-org only) ─────────────────────────────────────────────────
//
// Phase 05-06. Renders ONLY when isDualMode prop is true. Same visual treatment
// as the Source pill — popover with three exclusive options. We deliberately use
// a popover instead of a click-to-cycle so the active value is always legible
// in the trigger ("Mode: All" / "Mode: Nonprofit" / "Mode: For-profit") and so
// the user doesn't have to discover the cycle order by clicking.

const MODE_OPTIONS: Array<{ key: ModeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "nonprofit", label: "Nonprofit" },
  { key: "forprofit", label: "For-profit" },
];

function modeLabel(m: ModeFilter): string {
  return MODE_OPTIONS.find((o) => o.key === m)?.label ?? "All";
}

function ModePill({
  value,
  onChange,
}: {
  value: ModeFilter;
  onChange: (next: ModeFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Treat any non-default selection as "active" (filtered) styling.
  const active = value !== "all";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={pillBase(active)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="mode-pill"
      >
        Mode
        <span className={active ? "text-emerald-200" : "text-zinc-500"}>
          · {modeLabel(value)}
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-40 rounded-lg border border-zinc-200 bg-white p-1 shadow-xl"
        >
          {MODE_OPTIONS.map((opt) => {
            const selected = opt.key === value;
            return (
              <button
                key={opt.key}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-sm text-left ${
                  selected
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span>{opt.label}</span>
                {selected && (
                    <span aria-hidden="true" className="text-emerald-600 text-xs">
                    ●
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Source pill (multi-select popover) ────────────────────────────────────────

function SourcePill({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={pillBase(selected.length > 0)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Source
        {selected.length > 0 && (
          <span className="text-emerald-300">· {selected.length}</span>
        )}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-zinc-200 bg-white p-1 shadow-xl"
        >
          {SOURCE_OPTIONS.map((opt) => {
            const checked = selected.includes(opt.key);
            return (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.key)}
                  className="accent-emerald-600"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Deadline pill (segmented control) ─────────────────────────────────────────

function DeadlinePill({
  value,
  onChange,
}: {
  value: DeadlineWindow;
  onChange: (next: DeadlineWindow) => void;
}) {
  const options: Array<{ key: DeadlineWindow; label: string }> = [
    { key: null, label: "All" },
    { key: 30, label: "30d" },
    { key: 7, label: "7d" },
  ];
  return (
    <div className="inline-flex rounded-md border border-zinc-300 bg-white p-0.5 font-mono text-[11px] uppercase tracking-[0.14em]">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={String(opt.key)}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`px-3 py-1 rounded-full transition-colors ${
              active
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Min amount pill (numeric input) ───────────────────────────────────────────

function MinAmountPill({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  const [draft, setDraft] = useState<string>(value !== null ? String(value) : "");

  // Sync external value -> draft when filters are cleared elsewhere
  useEffect(() => {
    setDraft(value !== null ? String(value) : "");
  }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && n > 0) {
      onChange(Math.round(n));
    } else {
      onChange(null);
    }
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[11px] ${
        value !== null
          ? "bg-zinc-950 border-zinc-950 text-white"
          : "bg-white border-zinc-300 text-zinc-600"
      }`}
    >
      <span className="uppercase tracking-wide pr-1">Min</span>
      <span className={value !== null ? "text-zinc-300" : "text-zinc-500"}>$</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="0"
        className="w-20 bg-transparent outline-none ml-1"
        aria-label="Minimum award amount in dollars"
      />
    </div>
  );
}

// ── Main pills row ────────────────────────────────────────────────────────────

export function FilterPills({
  value,
  onChange,
  isDualMode = false,
  mode = "all",
  onModeChange,
}: FilterPillsProps) {
  const hasAny =
    value.query.trim().length > 0 ||
    value.sources.length > 0 ||
    value.deadline_within_days !== null ||
    value.min_amount !== null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="pr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Filter
      </span>
      {/* Mode pill — dual-org users only. Renders to the left of Source per 05-06 plan. */}
      {isDualMode && onModeChange && (
        <ModePill value={mode} onChange={onModeChange} />
      )}
      <SourcePill
        selected={value.sources}
        onChange={(sources) => onChange({ ...value, sources })}
      />
      <DeadlinePill
        value={value.deadline_within_days}
        onChange={(deadline_within_days) =>
          onChange({ ...value, deadline_within_days })
        }
      />
      <MinAmountPill
        value={value.min_amount}
        onChange={(min_amount) => onChange({ ...value, min_amount })}
      />
      {hasAny && (
        <button
          type="button"
          onClick={() =>
            onChange({
              query: "",
              sources: [],
              deadline_within_days: null,
              min_amount: null,
            })
          }
          className="ml-1 text-xs text-zinc-500 underline-offset-2 hover:text-zinc-950 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
