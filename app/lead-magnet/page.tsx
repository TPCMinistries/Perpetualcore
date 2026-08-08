"use client";

/**
 * /lead-magnet — opt-in surface for the AI Operating System Map.
 *
 * Submit posts to /api/leads/capture with source=lead_magnet +
 * leadMagnet=ai_os_map. Triggers the Resend day-1 nurture email + adds
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
    title: "10 places to inspect",
    body: "Sales, follow-up, proposals, customer service, knowledge, delivery, reporting, marketing, leadership visibility, and handoffs.",
  },
  {
    label: "02",
    title: "The first-wedge scorecard",
    body: "A simple way to choose the first workflow: visible pain, clear owner, measurable win, accessible data, and expansion potential.",
  },
  {
    label: "03",
    title: "Company-size translation",
    body: "How the same AI operating-system idea changes for a regional company, an owner-led local business, and a professional services firm.",
  },
  {
    label: "04",
    title: "Questions to bring to the first call",
    body: "The details that make a diagnostic useful: where work gets lost, who owns it, what tools exist, and what outcome would matter.",
  },
  {
    label: "05",
    title: "Expansion map",
    body: "How a lead follow-up, proposal, knowledge, or reporting workflow can grow into a full company AI operating system.",
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
          leadMagnet: "ai_os_map",
          metadata: { magnet: "ai-operating-system-map" },
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
            <SectionRail index="00" label="Free checklist" />
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              The AI Operating System Map.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              A practical checklist for finding where AI should touch your company first:
              sales, operations, knowledge, customer communication, reporting, or the
              handoffs where work keeps getting lost.
            </p>
            <p className="mt-6 text-base text-muted-foreground leading-[1.7] max-w-2xl">
              Use it before a call with us, before a call with another vendor, or before
              your team spends another month experimenting with disconnected tools.
            </p>
          </div>

          {/* Form */}
          <aside className="border border-border bg-card p-7 self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
              Get the map
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
                  ? "Opening map…"
                  : "Get the checklist"}
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
                We deliver the map immediately — no waiting for an email. By
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
                Read the full buyer's guide too
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
                Most companies do not need a chatbot. They need a map.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-6">
                The first mistake is usually picking a tool before naming the operating
                surface. This checklist helps a business owner, operator, or executive
                see the company clearly enough to choose the first workflow on purpose.
              </p>
              <p className="text-base text-muted-foreground leading-[1.7]">
                If it leads to a full AI operating-system conversation, good. If it only
                helps you clean up follow-up, proposals, service, or reporting, that is
                still useful work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
