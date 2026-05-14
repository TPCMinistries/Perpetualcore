/**
 * /products/atlas-discovery — Atlas Discovery, productized $5K-$15K audit.
 * Form payload + dual-write pattern preserved per STUDIO-AD-01.
 * Visual register matches homepage v6.
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SubmitState = "idle" | "submitting" | "success" | "error";

const DELIVERABLES = [
  { name: "Operational map", body: "We sit in the portco's operations the way an operator does. Calls, docs, voice notes, the channels where decisions actually happen. Two weeks, no PowerPoint. We come out with a written map of every workflow, every handoff, and every gap." },
  { name: "AI opportunity ranking", body: "Every AI install candidate the audit surfaces gets ranked by leverage (how many workflows it touches), time-to-value (how fast a skill ships), and lift (whether it removes manual work or replaces a vendor). The ranking is what the OP team uses to decide what to install first." },
  { name: "Outcome-eval scope", body: "Atlas Discovery defines what 'this worked' looks like before any code ships. Each ranked opportunity gets an outcome metric, a measurement window, and a fallback path if the metric doesn't move. Outcome-eval scope is what separates an Atlas install from a vendor demo." },
  { name: "OP + CFO co-signed contract framing", body: "The audit deliverable includes a draft contract framework your fund's Operating Partner and the portco's CFO can co-sign — scoped to the install candidates the audit ranked, with budget envelopes and decision rights spelled out." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

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
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("fund") || "").trim(),
      employees: "201-500" as const,
      plan: "Custom" as const,
      product: "atlas-discovery",
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

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Atlas Discovery</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            A productized audit{" "}
            <span className="italic text-foreground/85">before any install.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              For PE Operating Partners and fund Ops leads who want to see what an Atlas install
              would actually look like across a portco — before committing the operating partner
              team&apos;s calendar to a 6 to 10 week build.
            </p>
            <p>
              A 2–3 week diagnostic. We map the portco&apos;s operations, rank AI opportunities by
              leverage and time-to-value, scope an outcome-evaluation framework, and produce a
              contract framework your OP and the portco&apos;s CFO can co-sign. The audit
              deliverable is yours either way.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="#intake">Request the audit <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="/products/atlas" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See full Atlas <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing band */}
      <section className="border-t border-border py-20 sm:py-24 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="01" label="Pricing" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                $5,000–$15,000. 2–3 weeks. Audit is yours either way.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Scoped to portco size and operational complexity. We tell you the band on the
                intake call.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border border-border bg-card p-8 sm:p-10">
              <p className="text-5xl font-semibold tracking-[-0.025em] text-foreground mb-3">
                $5,000 – $15,000
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-8">
                One-time · 2–3 week diagnostic
              </p>
              <ul className="space-y-3">
                {[
                  "2 to 3 week diagnostic",
                  "Audit deliverable is yours either way — full Atlas install is optional",
                  "Pilot-extinction defense: outcome-eval scope and OP+CFO contract framing built in",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-muted-foreground leading-[1.65]">
                    <span className="font-mono text-foreground/40 mt-0.5">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's in the audit */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="What's in the audit" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Four deliverables. Built to be installed against.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {DELIVERABLES.map((d, i) => (
                <div key={d.name} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-7 border-b border-border">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.01em] text-foreground mb-3">
                      {d.name}
                    </h4>
                    <p className="text-base text-muted-foreground leading-[1.7]">{d.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Intake form */}
      <section id="intake" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="Request the audit" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Tell us which portco.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                We respond within five business days.
              </p>

              {state === "success" ? (
                <div className="border border-foreground/20 bg-card p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    Thanks
                  </p>
                  <p className="text-base text-foreground leading-[1.65]">
                    We&apos;ll reach out within five business days. If it&apos;s urgent, email{" "}
                    <a href="mailto:lorenzo@perpetualcore.com" className="text-primary underline underline-offset-4">
                      lorenzo@perpetualcore.com
                    </a>{" "}
                    directly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="ad-name" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Your name
                    </Label>
                    <Input id="ad-name" name="name" type="text" required autoComplete="name" maxLength={100} className="rounded-[6px]" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="ad-fund" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Fund or firm
                      </Label>
                      <Input id="ad-fund" name="fund" type="text" required maxLength={200} className="rounded-[6px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad-portco" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Portfolio company
                      </Label>
                      <Input id="ad-portco" name="portco" type="text" required maxLength={200} className="rounded-[6px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad-email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Work email
                    </Label>
                    <Input id="ad-email" name="email" type="email" required autoComplete="email" maxLength={254} className="rounded-[6px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad-install" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      What you&apos;d want installed
                    </Label>
                    <Textarea
                      id="ad-install"
                      name="install"
                      required
                      maxLength={1800}
                      rows={5}
                      placeholder="A sentence or three. The operator-level brief."
                      className="rounded-[6px]"
                    />
                  </div>

                  {state === "error" && errorMessage && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-destructive">{errorMessage}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-start gap-5 pt-2">
                    <Button type="submit" size="lg" disabled={state === "submitting"} className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                      {state === "submitting" ? "Submitting…" : "Request the audit"}
                      {state !== "submitting" && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <a href="mailto:lorenzo@perpetualcore.com?subject=Atlas%20Discovery" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                      Talk to the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </div>

                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-2">
                    We don&apos;t share fund or portco names outside the engagement team.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cross-link to full Atlas */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Next step" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Atlas Discovery is the entry. The full Atlas is the install.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                If the audit lands and the operating partner team and the portco are aligned, the
                next step is a 6 to 10 week Atlas install. The audit deliverable feeds directly
                into the install scope — no work is repeated.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/products/atlas">See the full Atlas <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <a href="mailto:lorenzo@perpetualcore.com" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  Talk to the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
