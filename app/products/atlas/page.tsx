/**
 * /products/atlas — Atlas, AI-native COO for fund-backed portfolio companies.
 *
 * Per BRAND_ARCHITECTURE §5.2 + COPY_PRODUCTS.md Card 2.
 *
 * Hard rules for this page (Session 3 Step 1):
 *   - Scarcity framing — "by introduction only" / "in pilot with select funds"
 *   - NO pricing visible
 *   - 3-paragraph operator-register explainer that references the Engine
 *   - Intake form posts to /api/contact-sales (the existing engagement intake)
 *     so a fund/portco intro becomes a sales_contacts row immediately —
 *     no new endpoint, no new schema. The Calendly URL is left as a
 *     fallback secondary CTA that Lorenzo can wire later when his calendar
 *     subdomain is ready.
 *
 * The intake fields:
 *   name | fund or portco | email | what you're trying to install
 *
 * We map "fund or portco" → company, set plan = "Custom", employees =
 * "201-500" by default (PE-portco scale), and stuff the textarea into
 * `message`. That keeps the intake inside the existing schema without
 * forking validation.
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, BookText, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function AtlasPage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("fund") || "").trim(),
      employees: "201-500" as const,
      plan: "Custom" as const,
      message: `[Atlas intake] ${String(data.get("install") || "").trim()}`,
    };

    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Submission failed.");
      }
      setState("success");
      form.reset();
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — scarcity, no pricing */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            By introduction only.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            Atlas — AI-native COO for{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              fund-backed portfolio companies
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            For PE Operating Partners and fund Ops leads installing an AI operating system across a portco in 6 to 10 weeks, before the next quarterly board meeting.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            In pilot with select funds. We take a small number of Atlas installs per quarter, by introduction only.
          </p>
        </div>
      </section>

      {/* 3-paragraph explainer */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            What Atlas is.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-10">
            An operator&apos;s system, installed inside a portco — not a deck.
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Atlas is the COO function, rebuilt as software, installed inside a fund-backed company over six to ten weeks. The team that arrives is an engagement team — three to five operators who run a structured installation against the same eight-registry Engine that powers everything else in the studio: identity, knowledge, decisions, work, communications, money, signal, and trust.
            </p>
            <p>
              By the end of the install, the portco runs on a system the operator can read at a glance: who owns what, what got decided last week, what&apos;s overdue, what the board will ask in 30 days, and which of those answers actually exist somewhere other than a CEO&apos;s head. The fund gets a portco that reports the same way every other Atlas portco reports. The CEO gets a chief of staff that doesn&apos;t leave.
            </p>
            <p>
              We are not a SaaS subscription dropped over the top of a chaotic operating cadence. We install. The Engine stays after we leave; the engagement team does not. That is the difference between Atlas and the dozen AI tools your portco has already paid for and stopped using.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">For the fund</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Standardized portco operating cadence. Board-ready dashboards by week 8. One install model across the portfolio.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Compass className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">For the CEO</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A chief of staff that survives turnover and reads every doc you sign. Decisions logged. Calendar earned, not consumed.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <BookText className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">For the operating partner</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The same eight registries across the portfolio. Read one portco, read the next without re-learning their system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Intake form */}
      <section id="intake" className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Request introduction.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Tell us what you&apos;re trying to install.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We respond personally within two business days. If your fund is already in the portfolio of someone who&apos;s introduced us, mention them — that is the fastest path in.
          </p>

          {state === "success" ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-7">
                <h3 className="text-lg font-semibold mb-2">Received.</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  We&apos;ll reach out within two business days. If it&apos;s urgent, email{" "}
                  <a
                    href="mailto:lorenzo@perpetualcore.com"
                    className="text-primary underline underline-offset-4"
                  >
                    lorenzo@perpetualcore.com
                  </a>{" "}
                  directly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="atlas-name">Your name</Label>
                  <Input
                    id="atlas-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="atlas-email">Work email</Label>
                  <Input
                    id="atlas-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="atlas-fund">Fund or portco</Label>
                <Input
                  id="atlas-fund"
                  name="fund"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Acme Capital — or Acme Capital portco: Acme HealthCo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atlas-install">What you&apos;re trying to install</Label>
                <Textarea
                  id="atlas-install"
                  name="install"
                  required
                  maxLength={1800}
                  rows={6}
                  placeholder="The function, the portco stage, the deadline, who's pushing for it — the operator-level brief, not a marketing pitch."
                />
              </div>

              {state === "error" && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" size="lg" disabled={state === "submitting"} className="text-base px-7">
                  {state === "submitting" ? "Sending…" : "Request introduction"}
                  {state !== "submitting" && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <Button type="button" size="lg" variant="outline" asChild className="text-base px-7">
                  <a href="mailto:lorenzo@perpetualcore.com?subject=Atlas%20intro">
                    Email Lorenzo directly
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                We don&apos;t share fund or portco names with anyone outside the engagement team. No newsletter, no list — just an inbox.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Final CTA — point back to portfolio + engine */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Read the methodology before you write us.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Atlas runs on the same Engine the studio installs in every engagement.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            The eight registries, the install-not-subscribe model, the engagement team — they&apos;re documented. Read them, then write us if it still sounds like the thing you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/engine">
                Read the Engine <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/products">See the full portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
