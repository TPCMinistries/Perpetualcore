"use client";

/**
 * OrgDetailsForm — inline edit form for owner-editable org fields.
 *
 * Editable: name, type, naics (comma-separated input), capacity_summary.
 * PATCH /api/rfp/orgs/[orgId] handles the write. Form disables itself
 * for non-owner roles so writers/reviewers see the current values but
 * can't transact.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type OrgType = "nonprofit" | "forprofit" | "dual";

interface OrgDetailsFormProps {
  orgId: string;
  canEdit: boolean;
  initialName: string;
  initialType: OrgType;
  initialNaics: string[];
  initialCapacitySummary: string;
}

const TYPE_LABEL: Record<OrgType, string> = {
  nonprofit: "Nonprofit",
  forprofit: "For-profit",
  dual: "Dual (nonprofit + for-profit)",
};

const MAX_CAPACITY_CHARS = 2000;

export function OrgDetailsForm({
  orgId,
  canEdit,
  initialName,
  initialType,
  initialNaics,
  initialCapacitySummary,
}: OrgDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<OrgType>(initialType);
  const [naicsRaw, setNaicsRaw] = useState(initialNaics.join(", "));
  const [capacitySummary, setCapacitySummary] = useState(initialCapacitySummary);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSave = useCallback(async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const naics = naicsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const res = await fetch(`/api/rfp/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          naics,
          capacity_summary: capacitySummary.trim() || null,
        }),
      });
      const payload = (await res.json()) as { error?: string; detail?: string };
      if (!res.ok) {
        setError(payload.detail ?? payload.error ?? `http_${res.status}`);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSaving(false);
    }
  }, [canEdit, saving, name, type, naicsRaw, capacitySummary, orgId, router]);

  const disabled = !canEdit || saving;

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          maxLength={200}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-[14px] text-zinc-900 disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OrgType)}
          disabled={disabled}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-[14px] text-zinc-900 disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
        >
          {(Object.keys(TYPE_LABEL) as OrgType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          "Dual" unions discovery across nonprofit and for-profit member orgs — fiscal sponsors, capture consultants.
        </p>
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          NAICS codes
        </label>
        <input
          type="text"
          value={naicsRaw}
          onChange={(e) => setNaicsRaw(e.target.value)}
          disabled={disabled}
          placeholder="e.g. 624190, 611310"
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-[13px] text-zinc-900 disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          Comma-separated. Used to score federal opportunities against your scope.
        </p>
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Capacity summary
        </label>
        <textarea
          value={capacitySummary}
          onChange={(e) => setCapacitySummary(e.target.value)}
          disabled={disabled}
          maxLength={MAX_CAPACITY_CHARS}
          rows={6}
          placeholder="2-4 paragraphs about what your org does, who you serve, scale of operations, named programs and outcomes. The drafter uses this to shape the organizational_capacity section."
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-900 disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          {capacitySummary.length.toLocaleString()} / {MAX_CAPACITY_CHARS.toLocaleString()} chars · feeds the drafter's system prompt.
        </p>
      </div>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="rounded-md bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-600">
              saved
            </span>
          ) : null}
          {error ? (
            <span className="text-[12px] text-rose-700">{error}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
