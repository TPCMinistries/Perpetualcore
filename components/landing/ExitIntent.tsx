"use client";

/**
 * Exit-intent modal — fires when the cursor leaves the viewport through
 * the top edge (the standard signal for desktop visitors about to switch
 * tabs or close). Single-firing per visitor via localStorage. Touch
 * devices never trigger this (no mouseleave-top semantics on mobile).
 *
 * Gated to a small set of marketing surfaces (home, pricing, products,
 * studio, solutions). Skipped entirely on /dashboard, /auth, /admin,
 * checkout flows — anywhere a popup would interrupt actual work.
 *
 * Captures email via /api/leads/capture with source=exit_intent.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "pc_exit_intent_seen";
const TRIGGER_PATHS = ["/", "/pricing", "/products", "/studio", "/solutions"];
const DELAY_BEFORE_ARMING_MS = 8000; // don't fire on instant bounces

type State = "idle" | "open" | "submitting" | "success" | "error" | "dismissed";

function pathMatchesTrigger(path: string): boolean {
  return TRIGGER_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export function ExitIntent() {
  const [state, setState] = useState<State>("idle");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathMatchesTrigger(window.location.pathname)) return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    // Skip on touch devices — mouseleave doesn't carry the same intent
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, DELAY_BEFORE_ARMING_MS);

    const onMouseLeave = (e: MouseEvent) => {
      if (!armed) return;
      // Only fire when leaving through the TOP edge
      if (e.clientY > 0) return;
      window.localStorage.setItem(STORAGE_KEY, "1");
      setState("open");
      document.removeEventListener("mouseleave", onMouseLeave);
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setState("submitting");
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          source: "exit_intent",
          metadata: { path: window.location.pathname },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("success");
    } catch (err) {
      console.error("Exit intent submit failed:", err);
      setState("error");
    }
  };

  const dismiss = () => setState("dismissed");

  if (state === "idle" || state === "dismissed") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-heading"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-[8px] shadow-2xl p-7">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
        {state === "success" ? (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-600 mb-3">
              Got it
            </p>
            <h2
              id="exit-intent-heading"
              className="text-2xl font-semibold tracking-[-0.015em] text-foreground mb-3"
            >
              You're on the list.
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
              First dispatch lands in your inbox shortly. We write about AI
              installs that actually move the metric — not vendor demos.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="h-10 px-5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition rounded-[6px]"
            >
              Keep reading
            </button>
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Before you go
            </p>
            <h2
              id="exit-intent-heading"
              className="text-2xl font-semibold tracking-[-0.015em] text-foreground mb-3"
            >
              Get notes from the operating layer.
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
              Occasional dispatches on AI installs, the Engine commitment, what
              we're shipping. Written by Lorenzo. Unsubscribe any time.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                className="w-full h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition rounded-[6px]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                autoComplete="email"
                className="w-full h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition rounded-[6px]"
              />
              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full h-11 px-5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition disabled:opacity-60 rounded-[6px]"
              >
                {state === "submitting" ? "Sending…" : "Subscribe"}
              </button>
              {state === "error" && (
                <p className="text-xs text-red-500">
                  Submit failed. Try again, or email lorenzo@perpetualcore.com.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center pt-2">
                <Link href="/blog" className="underline hover:no-underline">
                  Read past notes
                </Link>{" "}
                ·{" "}
                <button
                  type="button"
                  onClick={dismiss}
                  className="underline hover:no-underline"
                >
                  No thanks
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
