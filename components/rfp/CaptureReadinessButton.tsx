"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";

interface CaptureReadinessButtonProps {
  proposalId: string;
}

export function CaptureReadinessButton({ proposalId }: CaptureReadinessButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfp/proposals/${proposalId}/compliance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const payload = (await res.json()) as { error?: string; detail?: string };
      if (!res.ok) {
        setError(payload.detail ?? payload.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ListChecks className="h-4 w-4" aria-hidden="true" />
        {busy ? "Checking capture readiness..." : "Run capture readiness"}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Deterministic bid/no-bid · compliance matrix · packet checklist
      </p>
      {error ? (
        <p className="text-[12px] text-rose-600">Readiness failed: {error}</p>
      ) : null}
    </div>
  );
}
