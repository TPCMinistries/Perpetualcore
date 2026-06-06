"use client";

/**
 * BillingActions — client-side CTAs for the billing settings page.
 *
 * Owners with no active subscription see two Subscribe buttons (Pro,
 * Agency). Owners with an active subscription see Manage Subscription
 * (opens Stripe customer portal). Errors render inline.
 */

import { useCallback, useState } from "react";

interface BillingActionsProps {
  orgId: string;
  isActive: boolean;
}

type Tier = "pro" | "agency";

export function BillingActions({ orgId, isActive }: BillingActionsProps) {
  const [loading, setLoading] = useState<Tier | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubscribe = useCallback(
    async (tier: Tier) => {
      setLoading(tier);
      setError(null);
      try {
        const res = await fetch("/api/rfp/billing/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ org_id: orgId, tier }),
        });
        const payload = (await res.json()) as { url?: string; error?: string; detail?: string };
        if (!res.ok || !payload.url) {
          setError(payload.detail ?? payload.error ?? `http_${res.status}`);
          return;
        }
        window.location.href = payload.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "network error");
      } finally {
        setLoading(null);
      }
    },
    [orgId],
  );

  const onPortal = useCallback(async () => {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/rfp/billing/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      const payload = (await res.json()) as { url?: string; error?: string; detail?: string };
      if (!res.ok || !payload.url) {
        setError(payload.detail ?? payload.error ?? `http_${res.status}`);
        return;
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setLoading(null);
    }
  }, [orgId]);

  if (isActive) {
    return (
      <div>
        <button
          type="button"
          onClick={onPortal}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "portal" ? "Opening portal…" : "Manage subscription"}
        </button>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Stripe customer portal · upgrade / downgrade / cancel
        </p>
        {error ? (
          <p className="mt-2 text-[12px] text-rose-300">Error: {error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void onSubscribe("pro")}
          disabled={loading !== null}
          className="flex flex-col items-start rounded-md border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-left transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            Pro · $799/mo
          </span>
          <span className="mt-1 text-[13px] text-zinc-100">
            {loading === "pro" ? "Opening Stripe…" : "Start 14-day trial"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => void onSubscribe("agency")}
          disabled={loading !== null}
          className="flex flex-col items-start rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            Agency · $2,499/mo
          </span>
          <span className="mt-1 text-[13px] text-zinc-100">
            {loading === "agency" ? "Opening Stripe…" : "Start 14-day trial"}
          </span>
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-[12px] text-rose-300">Error: {error}</p>
      ) : null}
    </div>
  );
}
