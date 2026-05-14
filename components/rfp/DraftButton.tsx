"use client";

/**
 * DraftButton — kicks off a first-pass draft for an opportunity.
 *
 * Lives inside DetailPane. POSTs to /api/rfp/draft and on success routes the
 * user to the new proposal's page. Honest copy: when the org has not yet
 * trained its voice we say "no voice or vault yet"; once Voice Fingerprint
 * v1 is trained we flip to "voice-trained draft · no vault yet".
 *
 * Voice state is fetched once on mount from /api/rfp/orgs/[orgId]/voice.
 * The endpoint is RLS-checked and cheap (single column read).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DraftButtonProps {
  orgId: string;
  oppId: string;
}

interface VoiceState {
  trained: boolean;
}

export function DraftButton({ orgId, oppId }: DraftButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceTrained, setVoiceTrained] = useState<boolean | null>(null);

  // Lightweight one-shot voice-state fetch. Failures are silent — we just
  // fall back to the pre-voice copy if we can't tell.
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
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setError(null);
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
      router.push(`/org/${orgId}/proposals/${payload.proposal_id}`);
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
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Drafting…" : "Generate first-pass draft"}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {voiceTrained
          ? "Preview · voice-trained draft · no vault yet"
          : "Preview · plain draft · no voice or vault yet"}
      </p>
      {error ? (
        <p className="text-[12px] text-rose-300">Draft failed: {error}</p>
      ) : null}
    </div>
  );
}
