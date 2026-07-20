"use client";

/**
 * AI OS Map capture — appears only after meaningful engagement: scroll depth,
 * time on page, or desktop exit intent. Single-firing per visitor via
 * localStorage.
 *
 * Gated to a small set of marketing surfaces (home, pricing, products,
 * studio, solutions). Skipped entirely on /dashboard, /auth, /admin,
 * checkout flows — anywhere a popup would interrupt actual work.
 *
 * Captures email via /api/leads/capture with source=ai_os_map_prompt.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "pc_ai_os_map_prompt_seen";
const TRIGGER_PATHS = ["/", "/pricing", "/products", "/studio", "/solutions"];
const EXCLUDED_TRIGGER_PATHS = ["/products/development-intelligence"];
const TIME_TRIGGER_MS = 42000;
const EXIT_ARMING_DELAY_MS = 8000;
const SCROLL_TRIGGER_RATIO = 0.52;

type State = "idle" | "open" | "submitting" | "success" | "error" | "dismissed";

function pathMatchesTrigger(path: string): boolean {
  if (EXCLUDED_TRIGGER_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    return false;
  }
  return TRIGGER_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export function ExitIntent() {
  const [state, setState] = useState<State>("idle");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathMatchesTrigger(window.location.pathname)) return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    let exitArmed = false;
    let opened = false;

    const openPrompt = () => {
      if (opened) return;
      opened = true;
      window.localStorage.setItem(STORAGE_KEY, "1");
      setState("open");
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(timeTimer);
      window.clearTimeout(exitArmTimer);
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const ratio = window.scrollY / scrollable;
      if (ratio >= SCROLL_TRIGGER_RATIO) openPrompt();
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (!exitArmed) return;
      // Only fire when leaving through the TOP edge
      if (e.clientY > 0) return;
      openPrompt();
    };

    const timeTimer = window.setTimeout(openPrompt, TIME_TRIGGER_MS);
    const exitArmTimer = window.setTimeout(() => {
      exitArmed = true;
    }, EXIT_ARMING_DELAY_MS);

    window.addEventListener("scroll", onScroll, { passive: true });
    // Touch devices do not have useful mouseleave-top semantics, but they can
    // still trigger by scroll depth or time on page.
    if (!window.matchMedia("(pointer: coarse)").matches) {
      document.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      window.clearTimeout(timeTimer);
      window.clearTimeout(exitArmTimer);
      window.removeEventListener("scroll", onScroll);
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
          company: company.trim() || undefined,
          source: "ai_os_map_prompt",
          leadMagnet: "ai_os_map",
          metadata: {
            magnet: "ai-operating-system-map",
            path: window.location.pathname,
            prompt: "engagement-triggered",
          },
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
              Sent
            </p>
            <h2
              id="exit-intent-heading"
              className="text-2xl font-semibold tracking-[-0.015em] text-foreground mb-3"
            >
              The map is yours.
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
              I sent the AI Operating System Map to your inbox. You can also
              open the buyer's guide now and use it before a call.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/guide/ai-implementation-buyers-guide"
                className="h-10 px-5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition rounded-[6px] inline-flex items-center justify-center"
              >
                Open the guide
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="h-10 px-5 border border-border text-foreground text-sm font-medium hover:bg-accent transition rounded-[6px]"
              >
                Keep reading
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Free operating map
            </p>
            <h2
              id="exit-intent-heading"
              className="text-2xl font-semibold tracking-[-0.015em] text-foreground mb-3"
            >
              Get the AI Operating System Map.
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
              See where AI should enter your company first across sales,
              operations, knowledge, customer communication, and leadership
              visibility.
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
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (optional)"
                autoComplete="organization"
                className="w-full h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition rounded-[6px]"
              />
              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full h-11 px-5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition disabled:opacity-60 rounded-[6px]"
              >
                {state === "submitting" ? "Sending…" : "Send me the map"}
              </button>
              {state === "error" && (
                <p className="text-xs text-red-500">
                  Submit failed. Try again, or email lorenzo@perpetualcore.com.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center pt-2">
                <Link href="/lead-magnet" className="underline hover:no-underline">
                  Preview what is inside
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
