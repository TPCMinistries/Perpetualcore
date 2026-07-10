"use client";

/**
 * FunderDossierPanel — agentic funder intelligence for foundation/grant opps.
 *
 * On mount, GETs any cached dossier for this opportunity's funder. The
 * "Research this funder" button POSTs to /api/rfp/orgs/[orgId]/funder-dossier,
 * which runs a guarded web-research session (60-120s) and persists the dossier
 * to rfp_funder_profiles. 402 = org AI budget reached (same handling as
 * FitReasoningPanel).
 */

import { useEffect, useState } from "react";
import { Globe, Loader2 } from "lucide-react";

interface DossierGrantee {
  name: string;
  amount: string;
  year: string;
  similar_to_org: boolean;
}

interface Dossier {
  summary: string;
  giving_history: string;
  typical_award_min: number | null;
  typical_award_max: number | null;
  focus_areas: string[];
  geo_focus: string[];
  recent_grantees: DossierGrantee[];
  application_process: string;
  next_cycle: string;
  fit_note: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
  researched_at?: string;
}

function money(n: number | null): string | null {
  if (n === null || !Number.isFinite(n)) return null;
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${Math.round(n / 1000)}K`;
}

export function FunderDossierPanel({
  orgId,
  oppId,
  funderLabel,
}: {
  orgId: string;
  oppId: string;
  funderLabel: string | null;
}) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [phase, setPhase] = useState<"loading" | "idle" | "running" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDossier(null);
    setPhase("loading");
    setError(null);
    fetch(
      `/api/rfp/orgs/${orgId}/funder-dossier?opportunityId=${encodeURIComponent(oppId)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        setDossier(body?.dossier ?? null);
        setPhase("idle");
      })
      .catch(() => {
        if (!cancelled) setPhase("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, oppId]);

  const research = async (force: boolean) => {
    setPhase("running");
    setError(null);
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/funder-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: oppId, force }),
      });
      if (res.status === 402) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "AI budget reached for this month.");
        setPhase("error");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      setDossier(body?.dossier ?? null);
      setPhase("idle");
    } catch {
      setError("Funder research failed. Try again in a minute.");
      setPhase("error");
    }
  };

  const range =
    dossier && (money(dossier.typical_award_min) || money(dossier.typical_award_max))
      ? [money(dossier.typical_award_min), money(dossier.typical_award_max)]
          .filter(Boolean)
          .join("–")
      : null;

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Funder dossier{funderLabel ? ` · ${funderLabel}` : ""}
        </h3>
        <button
          type="button"
          onClick={() => research(Boolean(dossier))}
          disabled={phase === "running" || phase === "loading"}
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-medium text-white transition-colors duration-150 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none"
        >
          {phase === "running" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Researching funder…
            </>
          ) : (
            <>
              <Globe className="h-3.5 w-3.5" />
              {dossier ? "Refresh dossier" : "Research this funder"}
            </>
          )}
        </button>
      </div>

      {phase === "loading" && (
        <p className="mt-3 text-xs text-zinc-500">Checking for an existing dossier…</p>
      )}

      {phase !== "loading" && !dossier && phase !== "running" && (
        <p className="mt-3 text-xs leading-5 text-zinc-600">
          No dossier yet. The research agent will read this funder&apos;s site and
          public filings to report giving history, typical award size, recent
          grantees, and how your organization fits their pattern.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
          {error}
        </p>
      )}

      {dossier && (
        <div className="mt-3 space-y-3">
          <p className="text-[13px] leading-relaxed text-zinc-800">{dossier.summary}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Typical award
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">
                {range ?? "Not published"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Next cycle
              </p>
              <p className="mt-1 text-sm text-zinc-800">{dossier.next_cycle || "Unknown"}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Focus
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-800">
                {dossier.focus_areas.slice(0, 4).join(" · ") || "—"}
              </p>
            </div>
          </div>

          {dossier.fit_note && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                Fit for your org
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-900">{dossier.fit_note}</p>
            </div>
          )}

          {dossier.recent_grantees.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Recent grantees
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-700">
                {dossier.recent_grantees.slice(0, 6).map((g) => (
                  <li key={`${g.name}-${g.year}`} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-zinc-900">{g.name}</span>
                    <span className="text-zinc-500">
                      {g.amount} · {g.year}
                    </span>
                    {g.similar_to_org && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Like you
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-zinc-400">
            {dossier.confidence === "high"
              ? "High-confidence dossier"
              : dossier.confidence === "medium"
                ? "Medium confidence — verify key facts before relying on them"
                : "Low confidence — treat as a starting point only"}
            {dossier.researched_at
              ? ` · researched ${new Date(dossier.researched_at).toLocaleDateString()}`
              : ""}
            {dossier.sources.length > 0 ? ` · ${dossier.sources.length} sources` : ""}
          </p>
        </div>
      )}
    </section>
  );
}
