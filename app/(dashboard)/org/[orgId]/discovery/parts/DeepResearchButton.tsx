"use client";

/**
 * DeepResearchButton — triggers an agentic web-research sweep for this org.
 *
 * Flow: GET /research for the org's vertical plan, then POST one vertical at
 * a time (each is a 60–150s serverless call; final=true on the last so the
 * rescore fires exactly once), narrating progress on the button. Reloads the
 * feed when done so the new ai_research rows rank in.
 *
 * 409 → capture profile has no keywords yet; 402 → org AI budget reached.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, Sparkles } from "lucide-react";

type Phase = "idle" | "planning" | "running" | "done" | "error";

interface PlanVertical {
  key: string;
  label: string;
}

export function DeepResearchButton({ orgId }: { orgId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setPhase("planning");
    setError(null);
    try {
      const planRes = await fetch(`/api/rfp/orgs/${orgId}/research`);
      if (planRes.status === 409) {
        setError("Complete your capture profile first — research needs your capacity keywords.");
        setPhase("error");
        return;
      }
      if (!planRes.ok) throw new Error(`plan ${planRes.status}`);
      const { verticals } = (await planRes.json()) as { verticals: PlanVertical[] };

      setPhase("running");
      let found = 0;
      for (let i = 0; i < verticals.length; i++) {
        const v = verticals[i];
        setProgress(`${i + 1}/${verticals.length} · ${v.label} — searching the web…`);
        const res = await fetch(`/api/rfp/orgs/${orgId}/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vertical: v.key, final: i === verticals.length - 1 }),
        });
        if (res.status === 402) {
          const body = await res.json().catch(() => null);
          setError(body?.message ?? "AI budget reached for this month.");
          setPhase("error");
          return;
        }
        if (res.ok) {
          const summary = (await res.json()) as { leads_ingested?: number };
          found += summary.leads_ingested ?? 0;
          setProgress(`${i + 1}/${verticals.length} · ${v.label} — ${found} leads so far`);
        }
        // A single failed vertical shouldn't kill the sweep; keep going.
      }

      setPhase("done");
      setProgress(`${found} new opportunities found — reloading feed…`);
      window.setTimeout(() => window.location.reload(), 2500);
    } catch {
      setError("Research run failed. Try again in a minute.");
      setPhase("error");
    }
  };

  const busy = phase === "planning" || phase === "running";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={run}
        disabled={busy || phase === "done"}
        className="h-9 gap-2 rounded-lg bg-emerald-700 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-70"
        title="AI agent searches the live web for grants and RFPs that fit this org, verifies them on funder pages, and adds them to your feed."
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : phase === "done" ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        {phase === "idle" && "Deep Research"}
        {phase === "planning" && "Planning sweep…"}
        {phase === "running" && "Researching…"}
        {phase === "done" && "Done"}
        {phase === "error" && "Deep Research"}
      </Button>
      {busy && progress && (
        <p className="max-w-[280px] truncate text-right font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
          {progress}
        </p>
      )}
      {phase === "done" && progress && (
        <p className="max-w-[280px] truncate text-right font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" className="max-w-[280px] text-right text-[11px] text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
