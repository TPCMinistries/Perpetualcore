"use client";

/**
 * /lead-magnet — opt-in surface for the AI Implementation Buyer's Guide.
 *
 * Submit posts to /api/leads/capture with source=lead_magnet +
 * leadMagnet=buyers_guide. Triggers the Resend day-1 nurture email + adds
 * the lead to the 7-day product nurture sequence. On success, redirects
 * straight to /guide/ai-implementation-buyers-guide — we deliver the
 * value, we don't gate it behind their inbox.
 *
 * Visual register matches homepage v6.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SubmitState = "idle" | "submitting" | "success" | "error";

const GUIDE_HREF = "/guide/ai-implementation-buyers-guide";

const WHAT_IS_INSIDE = [
  {
    label: "01",
    title: "The four cost buckets",
    body: "Vendor subscriptions, engineering time, integration debt, outcome-eval. Year-one total is $75K-$250K regardless of who you hire.",
  },
  {
    label: "02",
    title: "Outcome-eval framework",
    body: "Three questions to answer before any code ships — and the decision rule that prevents the install getting quietly turned off in nine months.",
  },
  {
    label: "03",
    title: "Vendor evaluation rubric",
    body: "Three asks and three smells. Built from the conversations we have on our own first sales calls.",
  },
  {
    label: "04",
    title: "Eight contract clauses",
    body: "Metric-bound milestones, no-train, kill clause, audit-log retention, Engine commitment line item. None are legal advice — bring your counsel.",
  },
  {
    label: "05",
    title: "When not to install AI",
    body: "Four signals that defer or refer is the honest answer. Including from your own vendor.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function LeadMagnetPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setSubmitState("submitting");
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim() || undefined,
          source: "lead_magnet",
          leadMagnet: "buyers_guide",
          metadata: { magnet: "ai-implementation-buyers-guide" },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitState("success");
      // Deliver value immediately — don't gate behind their inbox.
      router.push(GUIDE_HREF);
    } catch (err) {
      console.error("Lead-magnet submit failed:", err);
      setSubmitState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero + form */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
          <div>
            <SectionRail index="00" label="Buyer's guide" />
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              The AI Implementation Buyer's Guide.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              What production AI actually costs, how to evaluate vendors, and
              when not to install AI at all. Written by the team installing it
              under PEPFAR rules, IRB review, and the kind of audits where the
              answer matters.
            </p>
            <p className="mt-6 text-base text-muted-foreground leading-[1.7] max-w-2xl">
              Vendor-agnostic. Free to read. Use it to evaluate any vendor —
              us included.
            </p>
          </div>

          {/* Form */}
          <aside className="border border-border bg-card p-7 self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
              Get the guide
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lm-first" className="sr-only">
                  First name
                </label>
                <input
                  id="lm-first"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  className="w-full h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition rounded-[6px]"
                />
              </div>
              <div>
                <label htmlFor="lm-email" className="sr-only">
                  Email
                </label>
                <input
                  id="lm-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  autoComplete="email"
                  className="w-full h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition rounded-[6px]"
                />
              </div>
              <div>
                <label htmlFor="lm-company" className="sr-only">
                  Company (optional)
                </label>
                <input
                  id="lm-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  autoComplete="organization"
                  className="w-full h-11 px-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition rounded-[6px]"
                />
              </div>
              <Button
                type="submit"
                disabled={submitState === "submitting"}
                className="w-full text-sm font-medium h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
              >
                {submitState === "submitting"
                  ? "Sending…"
                  : submitState === "success"
                  ? "Opening guide…"
                  : "Read the guide"}
                {submitState === "idle" && (
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                )}
              </Button>
              {submitState === "error" && (
                <p className="text-xs text-red-500 leading-[1.6]">
                  Submit failed. Try again, or read it directly:{" "}
                  <Link href={GUIDE_HREF} className="underline">
                    open the guide
                  </Link>
                  .
                </p>
              )}
              <p className="text-xs text-muted-foreground leading-[1.6] pt-2">
                We deliver the guide immediately — no waiting for an email. By
                submitting you agree to our{" "}
                <Link href="/privacy" className="underline hover:no-underline">
                  privacy policy
                </Link>
                . Unsubscribe any time.
              </p>
            </form>
            <div className="mt-6 pt-5 border-t border-border">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                Don't want the email?
              </p>
              <Link
                href={GUIDE_HREF}
                className="text-sm text-foreground hover:text-primary inline-flex items-center"
              >
                Read it without subscribing
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* What's inside */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="What's inside" />
            <div className="max-w-3xl">
              <ul className="divide-y divide-border border-y border-border">
                {WHAT_IS_INSIDE.map((item) => (
                  <li key={item.label} className="grid sm:grid-cols-[60px_1fr] gap-4 sm:gap-10 py-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      §{item.label}
                    </p>
                    <div>
                      <p className="text-base sm:text-lg font-medium text-foreground mb-1">
                        {item.title}
                      </p>
                      <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Honest framing */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Why we wrote it" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                The same conversations keep repeating on our own sales calls.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-6">
                Operators come in quoted by a freelancer at $5K, by a Big Four
                at $200K, by us at $75K — for what looks like the same SOW.
                They want to know what's real. This guide is what's real, with
                the parts that hurt us included.
              </p>
              <p className="text-base text-muted-foreground leading-[1.7]">
                If reading it lands you somewhere other than an engagement
                with us — including "you don't need AI yet" — that's the right
                outcome. We'd rather refer you out than sell you something
                you don't need.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
