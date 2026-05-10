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

export interface FilterValues {
  sources: string[];
  deadline_within_days: DeadlineWindow;
  min_amount: number | null;
}

interface FilterPillsProps {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
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
  return `inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs uppercase tracking-wide font-mono transition-colors ${
    active
      ? "bg-zinc-900 border-zinc-600 text-zinc-100"
      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
  }`;
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
          className="absolute left-0 top-full mt-2 w-56 z-50 rounded-md border border-zinc-800 bg-zinc-950 shadow-xl p-1"
        >
          {SOURCE_OPTIONS.map((opt) => {
            const checked = selected.includes(opt.key);
            return (
              <label
                key={opt.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-200 hover:bg-zinc-900 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.key)}
                  className="accent-emerald-400"
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
    <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-950 p-0.5 font-mono text-xs uppercase tracking-wide">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={String(opt.key)}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`px-3 py-1 rounded-full transition-colors ${
              active
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
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
      className={`inline-flex items-center rounded-full border px-2 py-1 font-mono text-xs ${
        value !== null
          ? "bg-zinc-900 border-zinc-600 text-zinc-100"
          : "bg-zinc-950 border-zinc-800 text-zinc-400"
      }`}
    >
      <span className="uppercase tracking-wide pr-1">Min</span>
      <span className="text-zinc-500">$</span>
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

export function FilterPills({ value, onChange }: FilterPillsProps) {
  const hasAny =
    value.sources.length > 0 ||
    value.deadline_within_days !== null ||
    value.min_amount !== null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono pr-1">
        Filter
      </span>
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
              sources: [],
              deadline_within_days: null,
              min_amount: null,
            })
          }
          className="text-xs text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
