"use client";

/**
 * VoiceQuickTrainModal — side-door for the Train Voice onboarding step.
 *
 * The canonical /train flow asks for 3-10 past proposals, which most first-
 * time users don't have queued up. This modal accepts a natural-language
 * description of the org's voice (plus optional single writing sample) and
 * synthesizes a usable VoiceFingerprint. Honest framing on the surface:
 * "Good enough to draft now — replace with real proposals later."
 *
 * Mirrors the NaicsAssistantModal pattern: trigger button → modal with
 * textarea + AI extraction → result preview → save.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface VoiceFingerprintPreview {
  register: string;
  voice_summary: string;
  signature_phrases: string[];
  framing_patterns: string[];
  avoided_terms: string[];
}

interface SaveResponse {
  fingerprint: VoiceFingerprintPreview;
  version: number;
  cost_usd: number;
  source: "description";
}

interface VoiceQuickTrainModalProps {
  orgId: string;
}

const LOADING_STEPS = [
  "Reading your description…",
  "Inferring stylometric defaults…",
  "Extracting signature phrases…",
  "Composing voice summary…",
] as const;

export function VoiceQuickTrainModal({ orgId }: VoiceQuickTrainModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [sample, setSample] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SaveResponse | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 600);
    return () => window.clearInterval(id);
  }, [loading]);

  const reset = () => {
    setDescription("");
    setSample("");
    setLoading(false);
    setLoadingStep(0);
    setError(null);
    setPreview(null);
    setSaved(false);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/rfp/orgs/${orgId}/voice/from-description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            sample: sample.trim() || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_body"
            ? "Please write 50–2000 characters."
            : data.error === "unauthenticated"
              ? "Please sign in first."
              : data.error === "forbidden"
                ? "Owners and writers can train voice. Ask an owner to invite you with write access."
                : data.error === "extraction_failed"
                  ? "The AI couldn't extract a fingerprint from that. Try a longer or more concrete description."
                  : "Something went wrong. Try again.",
        );
        return;
      }
      setPreview(data as SaveResponse);
      setSaved(true);
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
        if (!next) {
          // If we saved successfully, refresh the parent page so the new
          // fingerprint renders in the canonical "trained voice" card.
          if (saved) router.refresh();
          reset();
        }
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
          Or describe your voice
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Describe your voice
          </DialogTitle>
          <DialogDescription>
            Don&apos;t have past proposals handy? Describe how your org writes
            in your own words. We&apos;ll synthesize a starting fingerprint
            you can replace later with real documents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4">
          {!saved && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  How does your org sound? (required)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. We sound plain-spoken and neighborly, not corporate. We lead with the people we serve, then name the program. We avoid jargon like 'stakeholders' or 'leverage'. We use 'young adults' not 'youth'. Our proposals are evidence-driven but never read like academic papers."
                  rows={6}
                  maxLength={2000}
                  disabled={loading}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/2000
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Paste a writing sample (optional but helpful)
                </label>
                <Textarea
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  placeholder="A paragraph or two from anything your org has written — an annual letter, a newsletter intro, a past grant narrative. If you provide a sample, we measure sentence/paragraph length from it. If not, we'll synthesize defaults from your description."
                  rows={5}
                  maxLength={8000}
                  disabled={loading}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {sample.length}/8000
                </p>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  onClick={submit}
                  disabled={loading || description.trim().length < 50}
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
                      Build my fingerprint
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
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
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : status === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-zinc-700" />
                    )}
                    <span
                      className={
                        status === "active"
                          ? "text-emerald-200"
                          : "text-zinc-400"
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

          {saved && preview && (
            <FingerprintPreview
              fp={preview.fingerprint}
              version={preview.version}
              cost={preview.cost_usd}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FingerprintPreview({
  fp,
  version,
  cost,
  onClose,
}: {
  fp: VoiceFingerprintPreview;
  version: number;
  cost: number;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-emerald-200">
            Fingerprint saved — version {version}
          </h3>
        </div>
        <p className="text-xs text-emerald-100/70 mt-1">
          Drafts will now use this voice. You can replace it any time with
          real past proposals via the main training form.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
            Register
          </p>
          <p className="text-sm text-zinc-200 capitalize mt-0.5">{fp.register}</p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
            Voice summary
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 mt-0.5">
            {fp.voice_summary}
          </p>
        </div>

        <FingerprintList label="Signature phrases" items={fp.signature_phrases} />
        <FingerprintList label="Framing patterns" items={fp.framing_patterns} />
        <FingerprintList label="Avoided terms" items={fp.avoided_terms} />
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <p className="text-xs text-muted-foreground font-mono">
          {cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`} •{" "}
          gpt-4o
        </p>
        <Button type="button" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

function FingerprintList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
        {label}
      </p>
      <ul className="text-xs text-zinc-300 mt-1 space-y-0.5 list-disc pl-4">
        {items.map((s, i) => (
          <li key={`${label}-${i}`}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
