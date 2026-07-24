"use client";

/**
 * Newsletter capture — posts to /api/leads/capture, which writes to the
 * `leads` Supabase table, segments via lib/leads/segmentation, and sends
 * the day-1 Resend nurture email. The endpoint requires firstName + email.
 *
 * Used by:
 * - components/landing/Footer.tsx (compact variant)
 * - app/page.tsx (inline section, variant="inline")
 */

import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";

type Variant = "inline" | "footer";

type Props = {
  variant?: Variant;
  source?: string;
  className?: string;
  tone?: "light" | "dark";
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export function NewsletterCapture({
  variant = "footer",
  source = "newsletter",
  className = "",
  tone = "light",
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const handleSubmit = async (e: FormEvent) => {
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
          source,
          metadata: { variant },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("success");
    } catch (err) {
      console.error("Newsletter capture error:", err);
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div
        className={`flex items-center gap-3 text-sm ${
          variant === "inline"
            ? "text-foreground"
            : tone === "dark"
              ? "text-white/72"
              : "text-muted-foreground"
        } ${className}`}
      >
        <Check className="h-4 w-4 text-emerald-500" />
        <span>You're on the list. Watch for the first email shortly.</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form
        onSubmit={handleSubmit}
        className={`grid sm:grid-cols-[140px_1fr_auto] gap-3 max-w-2xl ${className}`}
      >
        <label className="sr-only" htmlFor="nl-first-inline">
          First name
        </label>
        <input
          id="nl-first-inline"
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          autoComplete="given-name"
          className="h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition"
        />
        <label className="sr-only" htmlFor="nl-email-inline">
          Email
        </label>
        <input
          id="nl-email-inline"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          autoComplete="email"
          className="h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition"
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="h-11 px-5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition inline-flex items-center justify-center disabled:opacity-60 rounded-[6px]"
        >
          {state === "submitting" ? "Sending…" : "Subscribe"}
          {state !== "submitting" && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
        </button>
        {state === "error" && (
          <p className="sm:col-span-3 text-xs text-red-500">
            Submit failed. Try again, or email lorenzo@perpetualcore.com.
          </p>
        )}
      </form>
    );
  }

  // footer variant — single row, compact
  const dark = tone === "dark";

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid grid-cols-[1fr_auto] gap-2 max-w-md ${className}`}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="sr-only" htmlFor="nl-first-footer">
          First name
        </label>
        <input
          id="nl-first-footer"
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          autoComplete="given-name"
          className={`h-10 border px-3 text-xs transition focus:outline-none focus:ring-2 ${
            dark
              ? "border-white/16 bg-white/[0.04] text-white placeholder:text-white/48 focus:border-[#8b7cff] focus:ring-[#8b7cff]/40"
              : "border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-[#5548d9]/20"
          }`}
        />
        <label className="sr-only" htmlFor="nl-email-footer">
          Email
        </label>
        <input
          id="nl-email-footer"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className={`h-10 border px-3 text-xs transition focus:outline-none focus:ring-2 ${
            dark
              ? "border-white/16 bg-white/[0.04] text-white placeholder:text-white/48 focus:border-[#8b7cff] focus:ring-[#8b7cff]/40"
              : "border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-[#5548d9]/20"
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={state === "submitting"}
        className={`h-10 px-4 text-xs font-semibold transition disabled:opacity-60 ${
          dark
            ? "rounded-none bg-white text-black hover:bg-[#54e6b1]"
            : "rounded-[6px] bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        {state === "submitting" ? "…" : "Subscribe"}
      </button>
      {state === "error" && (
        <p className="col-span-2 text-xs text-red-500">
          Submit failed. Try again.
        </p>
      )}
    </form>
  );
}
