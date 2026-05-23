"use client";

/**
 * NaicsAssistantModal — "Help me pick" AI assistant for the NAICS field on
 * /orgs/new. User describes their organization in one sentence; GPT-4o-mini
 * returns 3–5 NAICS code suggestions with one-line rationales; user clicks
 * "Add" on the ones that fit.
 *
 * Designed to be a side door, not a replacement: users who already know
 * their codes type them directly into the input. This modal exists to
 * unblock the rest.
 */

import { useState } from "react";
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
import { Sparkles, Loader2, Plus, Check } from "lucide-react";

interface NaicsSuggestion {
  code: string;
  title: string;
  rationale: string;
}

interface NaicsAssistantModalProps {
  /** Called when the user clicks "Add" on a suggestion. Parent dedupes. */
  onAdd: (code: string) => void;
  /** Codes already in the form, used to render "Added" state instead of "Add". */
  existingCodes: string[];
}

export function NaicsAssistantModal({
  onAdd,
  existingCodes,
}: NaicsAssistantModalProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NaicsSuggestion[]>([]);

  const reset = () => {
    setDescription("");
    setSuggestions([]);
    setError(null);
    setLoading(false);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/orgs/naics-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_body"
            ? "Please write 10–500 characters."
            : data.error === "unauthorized"
              ? "Please sign in first."
              : "Something went wrong. Try again.",
        );
        return;
      }
      setSuggestions(data.suggestions ?? []);
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
          className="h-auto gap-1.5 px-2 py-1 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Help me pick
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Find your NAICS codes</DialogTitle>
          <DialogDescription>
            Describe what your organization does in one sentence. We&apos;ll
            suggest codes that match federal and state RFP filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. We train young adults in NYC for healthcare careers — CNA, EKG, phlebotomy — and place graduates with hospital partners."
            rows={3}
            maxLength={500}
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {description.length}/500
            </p>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={loading || description.trim().length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>Suggest codes</>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              Suggestions
            </h3>
            <div className="space-y-2">
              {suggestions.map((s) => {
                const already = existingCodes.includes(s.code);
                return (
                  <div
                    key={s.code}
                    className="rounded-lg border bg-muted/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold">
                            {s.code}
                          </span>
                          <span className="text-sm">{s.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.rationale}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={already ? "outline" : "default"}
                        disabled={already}
                        onClick={() => onAdd(s.code)}
                        className="shrink-0 gap-1"
                      >
                        {already ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
