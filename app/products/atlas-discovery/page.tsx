/**
 * /products/atlas-discovery — Atlas Discovery, a productized audit.
 *
 * Per BRAND_ARCHITECTURE §7 IA + STUDIO-AD-01 spec.
 *
 * URL: /products/atlas-discovery — sibling of /products/atlas.
 * Rationale: Atlas Discovery is a product (productized SKU with its own price
 * band), not an engagement tier. Placing it under /products/ is consistent
 * with /products/atlas and preserves buyer mental model per §7.
 *
 * Hard rules:
 *   - Pricing string: "$5,000–$15,000" (en-dash U+2013) per STUDIO-AD-01
 *   - Form payload MUST include explicit `product: "atlas-discovery"` field
 *   - Message prefix: "[Atlas Discovery intake]" (dual-write for filtering)
 *   - No client, fund, or portco names anywhere in copy
 *   - Mono-violet icon family — no pink/cyan/emerald gradients (UI_AUDIT §5)
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Map,
  BarChart3,
  Target,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function AtlasDiscoveryPage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    // Dual-write pattern per STUDIO-AD-01:
    //   1. Explicit `product` field (preferred filter)
    //   2. Message prefix (legacy-compatible filter)
    // Both patterns must return the row in Supabase. See /api/contact-sales
    // routing comment block for query examples.
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("fund") || "").trim(),
      employees: "201-500" as const,
      plan: "Custom" as const,
      product: "atlas-discovery", // explicit product tag — added per STUDIO-AD-01 spec
      message: `[Atlas Discovery intake] portco=${String(data.get("portco") || "").trim()} | install=${String(data.get("install") || "").trim()}`,
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

      {/* 1. Hero — text-only, single column, max-w-3xl */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            Atlas Discovery.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            A $5,000–$15,000 productized audit before any install.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            For PE Operating Partners and fund Ops leads who want to see what
            an Atlas install would actually look like across a portco — before
            committing the operating partner team&apos;s calendar to a 6 to 10
            week build.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Atlas Discovery is a 2 to 3 week diagnostic. We map the portco&apos;s
            operations, rank AI opportunities by leverage and time-to-value,
            scope an outcome-evaluation framework, and produce a contract
            framework your OP and the portco&apos;s CFO can co-sign. The audit
            deliverable is yours either way — whether you proceed to a full
            Atlas install or not. Pilot-extinction defense by design.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <a href="#intake">
                Request the audit <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/products/atlas">See full Atlas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. What's Included — 4-card grid, mono-violet */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-12">
            What&apos;s in the audit.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardContent className="p-7">
                <div className="rounded-lg bg-primary/10 p-2 w-fit mb-4">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Operational map</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  We sit in the portco&apos;s operations the way an operator does.
                  Calls, docs, voice notes, the channels where decisions actually
                  happen. Two weeks, no PowerPoint. We come out with a written
                  map of every workflow, every handoff, and every gap.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-7">
                <div className="rounded-lg bg-primary/10 p-2 w-fit mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  AI opportunity ranking
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Every AI install candidate the audit surfaces gets ranked by
                  leverage (how many workflows it touches), time-to-value (how
                  fast a skill ships), and lift (whether it removes manual work
                  or replaces a vendor). The ranking is the input the OP team
                  uses to decide what to install first.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-7">
                <div className="rounded-lg bg-primary/10 p-2 w-fit mb-4">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Outcome-eval scope
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Atlas Discovery defines what &apos;this worked&apos; looks like before
                  any code ships. Each ranked opportunity gets an outcome metric,
                  a measurement window, and a fallback path if the metric
                  doesn&apos;t move. Outcome-eval scope is what separates an Atlas
                  install from a vendor demo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-7">
                <div className="rounded-lg bg-primary/10 p-2 w-fit mb-4">
                  <FileSignature className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  OP + CFO co-signed contract framing
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  The audit deliverable includes a draft contract framework your
                  fund&apos;s Operating Partner and the portco&apos;s CFO can co-sign —
                  scoped to the install candidates the audit ranked, with budget
                  envelopes and decision rights spelled out. It&apos;s the contract
                  you&apos;d write anyway, but written by the team that&apos;d execute it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Pricing band — 1-card centered, max-w-3xl */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-8">
            Atlas Discovery — $5,000 to $15,000.
          </h2>
          <Card className="border-primary/40">
            <CardContent className="p-10">
              <p className="text-3xl font-semibold mb-3">$5,000 – $15,000</p>
              <p className="text-muted-foreground mb-6">
                Scoped to portco size and operational complexity. We tell you the
                band on the intake call.
              </p>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold mt-0.5">—</span>
                  <span>2 to 3 week diagnostic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold mt-0.5">—</span>
                  <span>
                    Audit deliverable is yours either way — full Atlas install is
                    optional
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold mt-0.5">—</span>
                  <span>
                    Pilot-extinction defense: outcome-eval scope and OP+CFO
                    contract framing built in
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Intake form */}
      <section
        id="intake"
        className="container mx-auto px-4 py-32 border-t border-border/40"
      >
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-4">
            Request the audit.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We&apos;re taking a limited number of audits per quarter. Tell us which
            portco and we&apos;ll respond within five business days.
          </p>

          {state === "success" ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-7">
                <h3 className="text-lg font-semibold mb-2">Thanks.</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  We&apos;ll reach out within five business days. If it&apos;s urgent,
                  email{" "}
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
              <div className="space-y-2">
                <Label htmlFor="ad-name">Your name</Label>
                <Input
                  id="ad-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-fund">Fund or firm name</Label>
                <Input
                  id="ad-fund"
                  name="fund"
                  type="text"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-portco">Portfolio company</Label>
                <Input
                  id="ad-portco"
                  name="portco"
                  type="text"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-email">Work email</Label>
                <Input
                  id="ad-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-install">
                  What you&apos;d want installed if it were possible — a sentence or
                  three is enough.
                </Label>
                <Textarea
                  id="ad-install"
                  name="install"
                  required
                  maxLength={1800}
                  rows={5}
                />
              </div>

              {state === "error" && errorMessage && (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setState("idle");
                        setErrorMessage(null);
                      }}
                      className="text-sm text-destructive underline underline-offset-4 mt-2"
                    >
                      Try again
                    </button>
                  </CardContent>
                </Card>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={state === "submitting"}
                  className="text-base px-7"
                >
                  {state === "submitting" ? "Submitting…" : "Request the audit"}
                  {state !== "submitting" && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                We don&apos;t share fund or portco names outside the engagement team.
                No newsletter, no list — just an inbox.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Atlas Discovery is the entry. The full Atlas is the install.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            If the audit lands and the operating partner team and the portco are
            aligned, the next step is a 6 to 10 week Atlas install. The audit
            deliverable feeds directly into the install scope — no work is
            repeated. See the full Atlas page for what an install actually
            contains.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/products/atlas">
                See the full Atlas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <a href="mailto:lorenzo@perpetualcore.com">
                Talk to the founder
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
