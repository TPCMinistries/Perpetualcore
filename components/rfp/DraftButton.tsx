"use client";

/**
 * DraftButton — kicks off a first-pass draft for an opportunity.
 *
 * Lives inside DetailPane. POSTs to /api/rfp/draft and on success routes
 * the user to the new proposal's page. The subtitle reflects which
 * augmentations are available for the org:
 *  - voice-trained draft · vault-grounded
 *  - voice-trained draft · no vault yet
 *  - plain draft · vault-grounded
 *  - plain draft · no voice or vault yet
 *
 * Voice + vault state are fetched once on mount. Failures are silent and
 * we fall back to the pre-augmentation copy.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, WandSparkles } from "lucide-react";

interface DraftButtonProps {
  orgId: string;
  oppId: string;
}

interface VoiceState {
  trained: boolean;
}

interface VaultListResponse {
  docs?: unknown[];
}

export function DraftButton({ orgId, oppId }: DraftButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [voiceTrained, setVoiceTrained] = useState<boolean | null>(null);
  const [vaultPopulated, setVaultPopulated] = useState<boolean | null>(null);

  // Lightweight one-shot voice + vault state fetch. Failures are silent —
  // we fall back to the pre-augmentation copy if we can't tell.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rfp/orgs/${encodeURIComponent(orgId)}/voice`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`voice_state_${res.status}`);
        return (await res.json()) as VoiceState;
      })
      .then((data) => {
        if (!cancelled) setVoiceTrained(data.trained);
      })
      .catch(() => {
        if (!cancelled) setVoiceTrained(false);
      });
    fetch(`/api/rfp/orgs/${encodeURIComponent(orgId)}/vault/list`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`vault_state_${res.status}`);
        return (await res.json()) as VaultListResponse;
      })
      .then((data) => {
        if (!cancelled) setVaultPopulated((data.docs?.length ?? 0) > 0);
      })
      .catch(() => {
        if (!cancelled) setVaultPopulated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStep("Drafting proposal");
    try {
      const res = await fetch("/api/rfp/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ org_id: orgId, opp_id: oppId }),
      });
      const payload = (await res.json()) as
        | { proposal_id: string }
        | { error: string; detail?: string };
      if (!res.ok || !("proposal_id" in payload)) {
        const msg =
          "error" in payload
            ? `${payload.error}${payload.detail ? `: ${payload.detail}` : ""}`
            : `http_${res.status}`;
        setError(msg);
        return;
      }
      const proposalId = payload.proposal_id;

      const runOptionalStep = async (
        label: string,
        url: string,
      ): Promise<boolean> => {
        setStep(label);
        try {
          const stepRes = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
          });
          if (!stepRes.ok) {
            const body = (await stepRes.json().catch(() => null)) as
              | { error?: string; detail?: string }
              | null;
            console.warn("[rfp pursuit] optional step failed", {
              label,
              status: stepRes.status,
              error: body?.error,
              detail: body?.detail,
            });
            return false;
          }
          return true;
        } catch (err) {
          console.warn(
            "[rfp pursuit] optional step errored",
            label,
            err instanceof Error ? err.message : "unknown",
          );
          return false;
        }
      };

      const reviewOk = await runOptionalStep(
        "Running reviewer",
        `/api/rfp/proposals/${proposalId}/review`,
      );
      const complianceOk = await runOptionalStep(
        "Building readiness matrix",
        `/api/rfp/proposals/${proposalId}/compliance`,
      );
      const tasksOk = await runOptionalStep(
        "Creating submission workroom",
        `/api/rfp/proposals/${proposalId}/submission-tasks`,
      );

      const status = reviewOk && complianceOk && tasksOk ? "ready" : "partial";
      setStep("Opening workspace");
      router.push(`/org/${orgId}/proposals/${proposalId}?pursuit=${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {step ?? "Building pursuit"}
          </>
        ) : (
          <>
            <WandSparkles className="h-4 w-4" />
            Start pursuit workflow
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {[
          busy ? "Engine running" : "Draft",
          voiceTrained ? "voice-trained draft" : "plain draft",
          vaultPopulated ? "vault-grounded" : "no vault yet",
        ].join(" · ")}
      </p>
      {error ? (
        <p className="text-[12px] text-rose-700">Draft failed: {error}</p>
      ) : null}
    </div>
  );
}
