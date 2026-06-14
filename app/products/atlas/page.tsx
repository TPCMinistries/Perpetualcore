/**
 * /products/atlas — Atlas, AI-native COO for fund-backed portcos.
 * By introduction only. No pricing visible. Intake form preserved.
 * Visual register matches homepage v6.
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

type SubmitState = "idle" | "submitting" | "success" | "error";

const ROLES = [
  { role: "Fund", body: "Standardized portco operating cadence. Board-ready dashboards by week 8. One install model across the portfolio." },
  { role: "CEO", body: "A chief of staff that survives turnover and reads every doc you sign. Decisions logged. Calendar earned, not consumed." },
  { role: "Operating partner", body: "The same eight registries across the portfolio. Read one portco, read the next — without re-learning their system." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

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
      <JsonLd
        data={[
          productSchema(PC_PRODUCTS.atlas),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: "Atlas", path: "/products/atlas" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero — scarcity register */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-status-pilot" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Atlas — In pilot · By introduction</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            AI-native COO for{" "}
            <span className="italic text-foreground/85">fund-backed portcos.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              For PE Operating Partners and fund Ops leads installing an AI operating system
              across a portco in 6 to 10 weeks, before the next quarterly board meeting.
            </p>
            <p>
              In pilot with select funds. We take a small number of Atlas installs per quarter,
              by introduction only.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <a href="https://atlas.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Visit Atlas <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="#intake" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Request introduction <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What Atlas is */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="What Atlas is" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
                An operator&apos;s system, installed inside a portco — not a deck.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  Atlas is the COO function, rebuilt as software, installed inside a fund-backed
                  company over six to ten weeks. The team that arrives is an engagement team —
                  three to five operators running a structured installation against the same
                  eight-registry Engine that powers everything else in the studio.
                </p>
                <p>
                  By the end of the install, the portco runs on a system the operator can read at
                  a glance: who owns what, what got decided last week, what&apos;s overdue, what
                  the board will ask in 30 days, and which of those answers actually exist
                  somewhere other than the CEO&apos;s head.
                </p>
                <p className="text-foreground font-medium">
                  We are not a SaaS subscription dropped over a chaotic operating cadence. We
                  install. The Engine stays after we leave; the engagement team does not.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For whom — 3 roles in table */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="For" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Atlas serves three roles inside a fund&apos;s portfolio.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {ROLES.map((r, i) => (
                <div key={r.role} className="grid grid-cols-[60px_180px_1fr] gap-6 py-7 border-b border-border items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    For the {r.role}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-[1.65] col-span-3 sm:col-auto">
                    {r.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Atlas Discovery cross-link */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="Lower-friction entry" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Not ready for the full install? Start with Atlas Discovery.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Atlas Discovery is a 2–3 week productized audit from $25,000 that maps
                the portco&apos;s operations, ranks AI opportunities, and produces an OP + CFO
                co-signable contract framework. Most funds start there before a full install.
              </p>
              <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <Link href="/products/atlas-discovery">See Atlas Discovery <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Intake form */}
      <section id="intake" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="Request introduction" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Tell us what you&apos;re trying to install.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                We respond personally within two business days. If your fund is already in the
                portfolio of someone who&apos;s introduced us, mention them — that&apos;s the
                fastest path in.
              </p>

              {state === "success" ? (
                <div className="border border-foreground/20 bg-card p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    Received
                  </p>
                  <p className="text-base text-foreground leading-[1.65]">
                    We&apos;ll reach out within two business days. If it&apos;s urgent, email{" "}
                    <a href="mailto:lorenzo@perpetualcore.com" className="text-primary underline underline-offset-4">
                      lorenzo@perpetualcore.com
                    </a>{" "}
                    directly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="atlas-name" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Your name
                      </Label>
                      <Input id="atlas-name" name="name" type="text" required autoComplete="name" maxLength={100} className="rounded-[6px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="atlas-email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Work email
                      </Label>
                      <Input id="atlas-email" name="email" type="email" required autoComplete="email" maxLength={254} className="rounded-[6px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="atlas-fund" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Fund or portco
                    </Label>
                    <Input id="atlas-fund" name="fund" type="text" required maxLength={200} placeholder="Acme Capital — or Acme Capital portco: Acme HealthCo" className="rounded-[6px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="atlas-install" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      What you&apos;re trying to install
                    </Label>
                    <Textarea
                      id="atlas-install"
                      name="install"
                      required
                      maxLength={1800}
                      rows={6}
                      placeholder="The function, the portco stage, the deadline, who's pushing for it — the operator-level brief, not a marketing pitch."
                      className="rounded-[6px]"
                    />
                  </div>

                  {state === "error" && errorMessage && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-destructive">{errorMessage}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-start gap-5 pt-2">
                    <Button type="submit" size="lg" disabled={state === "submitting"} className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                      {state === "submitting" ? "Sending…" : "Request introduction"}
                      {state !== "submitting" && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <a href="mailto:lorenzo@perpetualcore.com?subject=Atlas%20intro" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                      Email Lorenzo directly <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </div>

                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-3">
                    We don&apos;t share fund or portco names. No newsletter. Just an inbox.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cross-link — Engine */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Underneath" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Atlas runs on the same Engine the studio installs everywhere else.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                The eight registries, the install-not-subscribe model, the engagement team —
                documented in the Engine spec. Read them, then write us if it still sounds like
                the thing you need.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/engine">Read the Engine <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <Link href="/products" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Full portfolio <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
