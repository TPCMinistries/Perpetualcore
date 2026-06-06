"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, WandSparkles } from "lucide-react";

interface PackageRedraftButtonProps {
  proposalId: string;
  packageCount: number;
  canEdit: boolean;
}

export function PackageRedraftButton({
  proposalId,
  packageCount,
  canEdit,
}: PackageRedraftButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);

  async function run() {
    if (busy || !canEdit || packageCount === 0) return;
    setBusy(true);
    setError(null);
    setStep("Regenerating draft");
    try {
      const redraftRes = await fetch(`/api/rfp/proposals/${proposalId}/redraft`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const redraftPayload = (await redraftRes.json().catch(() => null)) as
        | { error?: string; detail?: string }
        | null;
      if (!redraftRes.ok) {
        setError(redraftPayload?.detail ?? redraftPayload?.error ?? `HTTP ${redraftRes.status}`);
        return;
      }

      setStep("Refreshing readiness");
      const complianceRes = await fetch(`/api/rfp/proposals/${proposalId}/compliance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!complianceRes.ok) {
        const body = (await complianceRes.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        setError(body?.detail ?? body?.error ?? "Readiness refresh failed.");
        router.refresh();
        return;
      }

      setStep("Syncing tasks");
      const tasksRes = await fetch(`/api/rfp/proposals/${proposalId}/submission-tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!tasksRes.ok) {
        const body = (await tasksRes.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        setError(body?.detail ?? body?.error ?? "Task sync failed.");
        router.refresh();
        return;
      }

      setStep("Updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  const disabled = busy || !canEdit || packageCount === 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {step ?? "Regenerating"}
          </>
        ) : (
          <>
            {packageCount > 0 ? (
              <WandSparkles className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Regenerate from package
          </>
        )}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {packageCount > 0
          ? `${packageCount} imported package${packageCount === 1 ? "" : "s"} · redraft sections`
          : "Import package first"}
      </p>
      {error ? <p className="text-[12px] text-rose-300">Redraft failed: {error}</p> : null}
    </div>
  );
}
