"use client";

/**
 * VaultQuickSeedModal — side-door for the Seed Vault onboarding step.
 *
 * The canonical /vault/upload flow asks for an actual past document (200+
 * chars) — past proposal, annual report, founder letter, case study, etc.
 * A brand-new user staring at the onboarding checklist usually doesn't
 * have one queued up. Same cold-start problem the NAICS + Voice side-doors
 * solved.
 *
 * Flow: user describes what their org has actually done (programs,
 * outcomes, partners, geography, history) → gpt-4o expands into a
 * structured capacity narrative document → that document runs through
 * the canonical chunker → embedder → insert pipeline. The drafter
 * doesn't distinguish between the two paths; the chunks look identical.
 *
 * Honest framing on the surface: "Good enough to seed retrieval now —
 * add real past proposals later as you accumulate them."
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Check } from "lucide-react";

interface SeedResponse {
  doc_id: string;
  chunk_count: number;
  total_chars: number;
  body: string;
  suggested_title: string;
  sections: string[];
  cost_usd: number;
  expand_cost_usd: number;
}

interface VaultQuickSeedModalProps {
  orgId: string;
  onSeeded?: () => void;
}

const LOADING_STEPS = [
  "Reading your description…",
  "Expanding into a capacity narrative…",
  "Chunking for retrieval…",
  "Generating embeddings…",
] as const;

export function VaultQuickSeedModal({
  orgId,
  onSeeded,
}: VaultQuickSeedModalProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeedResponse | null>(null);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 700);
    return () => window.clearInterval(id);
  }, [loading]);

  const reset = () => {
    setDescription("");
    setLoading(false);
    setLoadingStep(0);
    setError(null);
    setResult(null);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/rfp/orgs/${orgId}/vault/from-description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: description.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_body"
            ? "Please write 80–3000 characters."
            : data.error === "unauthenticated"
              ? "Please sign in first."
              : data.error === "forbidden"
                ? "Owners and writers can seed the vault. Ask an owner to invite you with write access."
                : data.error === "expand_failed"
                  ? "The AI couldn't expand that description. Try adding more concrete details — programs you run, places you operate, who you serve."
                  : "Something went wrong. Try again.",
        );
        return;
      }
      setResult(data as SeedResponse);
      onSeeded?.();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Or describe what your org has done
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Seed vault from a description
          </DialogTitle>
          <DialogDescription>
            No past docs queued up? Describe what your org has actually
            done — programs, outcomes, partners, geography, history. The
            AI expands it into a structured capacity narrative and indexes
            it for retrieval. Drafts will cite it as a vault source.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4">
          {!result && (
            <div className="space-y-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. We've run a 14-week CNA + EKG training program in NYC since 2022. ~240 young adults from East New York, Brownsville, and the South Bronx have completed it. ~62% placed at SUNY Downstate, NYC Health+Hospitals, and Brooklyn Hospital Center. Median wage at placement is $42K. Founded by Lorenzo Daughtry-Chambers, who previously ran workforce programs at IHA. Partners include DYCD and the Robin Hood Foundation."
                rows={8}
                maxLength={3000}
                disabled={loading}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {description.length}/3000
                </p>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={loading || description.trim().length < 80}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Seed my vault
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              {LOADING_STEPS.map((step, i) => {
                const status =
                  i < loadingStep
                    ? "done"
                    : i === loadingStep
                      ? "active"
                      : "pending";
                return (
                  <div
                    key={step}
                    className={
                      "flex items-center gap-2 text-sm transition-opacity " +
                      (status === "pending"
                        ? "opacity-40"
                        : status === "done"
                          ? "opacity-70"
                          : "opacity-100")
                    }
                  >
                    {status === "done" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : status === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-zinc-300" />
                    )}
                    <span
                      className={
                        status === "active"
                          ? "text-emerald-900"
                          : "text-zinc-600"
                      }
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
            >
              {error}
            </p>
          )}

          {result && <SeedResultView result={result} onClose={() => setOpen(false)} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SeedResultView({
  result,
  onClose,
}: {
  result: SeedResponse;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-emerald-800">
            Vault seeded — {result.chunk_count} chunk
            {result.chunk_count === 1 ? "" : "s"} indexed
          </h3>
        </div>
        <p className="text-xs text-emerald-700 mt-1">
          &ldquo;{result.suggested_title}&rdquo;. Drafts can now cite these
          as vault sources. Add real past proposals later to deepen the
          ground.
        </p>
      </div>

      {result.sections.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
            Sections indexed
          </p>
          <ul className="text-xs text-zinc-700 mt-2 space-y-1 list-disc pl-4">
            {result.sections.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
          Preview the generated document
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-700 font-sans">
          {result.body}
        </pre>
      </details>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
        <p className="text-xs text-muted-foreground font-mono">
          {(result.cost_usd + result.expand_cost_usd).toFixed(4)} USD •{" "}
          {result.total_chars.toLocaleString()} chars indexed
        </p>
        <Button type="button" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
