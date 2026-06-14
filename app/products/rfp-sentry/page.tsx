/**
 * /products/rfp-sentry — bid intelligence + compliance gate (BUILD status).
 * Form posts to /api/early-access. Visual register matches homepage v6.
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

type SubmitState = "idle" | "submitting" | "success" | "error";

const CAPABILITIES = [
  { name: "Fit scoring", body: "RFPs scored against your capability statement, past wins, and team capacity. The bid/no-bid call gets a number behind it." },
  { name: "Discovery cadence", body: "Federal, state, and foundation pipelines monitored on a fixed cadence. The RFPs you'd miss surface; the noise gets filtered." },
  { name: "Compliance flags", body: "Set-aside, sub, page-limit, and conflicting-eval traps surfaced before draft. Protest-class issues caught at the gate." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function RfpSentryPage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") || "").trim(),
      product: "rfp-sentry",
      source: "/products/rfp-sentry",
    };

    try {
      const res = await fetch("/api/early-access?product=rfp-sentry", {
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
          productSchema(PC_PRODUCTS["rfp-sentry"]),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: "RFP Sentry", path: "/products/rfp-sentry" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-status-invite" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · RFP Sentry — In build</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Bid intelligence and{" "}
            <span className="italic text-foreground/85">compliance gate.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              For capture teams who&apos;d rather lose a deal at the bid/no-bid step than after
              writing the proposal.
            </p>
            <p>
              Sister product to RFP Engine. Score RFPs for fit before you write. Compliance flags
              surface before submission, not after a debrief.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="#early-list">Join the early list <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="/studio/retainers" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Or hire Capture Pipeline ($7.5K-$35K/mo) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Sentry exists */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Why Sentry exists" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
                The bid/no-bid decision is where most capture teams already lose.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  RFP Engine helps a team draft a strong response in their own voice. RFP Sentry
                  sits one step earlier: it scores incoming RFPs for fit, surfaces the qualifying
                  questions before anyone touches a Word doc, and flags the compliance landmines —
                  set-aside requirements, mandatory subs, page-limit traps, conflicting eval
                  criteria — that bury an otherwise winnable bid in the protest pile. Sentry is
                  the gate; Engine is what runs after the gate clears.
                </p>
                <p>
                  In build means in build. We&apos;re shipping Sentry into a small set of capture
                  teams in the studio&apos;s existing engagement portfolio first — the same
                  install-then-productize path Sentinel and Vellum took.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="What Sentry does" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Three capabilities, in build, against real capture pipelines.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {CAPABILITIES.map((c, i) => (
              <div key={c.name} className="p-6 sm:p-7 flex flex-col">
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {c.name}
                </h4>
                <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-4">
                  {c.name}.
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early list */}
      <section id="early-list" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="Early list" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Join the early list.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                We&apos;ll email you when Sentry ships, when we open the early cohort, and when
                there&apos;s something concrete to show. No newsletter, no drip — just the launch
                note.
              </p>

              {state === "success" ? (
                <div className="border border-foreground/20 bg-card p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    On the list
                  </p>
                  <p className="text-base text-foreground leading-[1.65]">
                    We&apos;ll be in touch. In the meantime,{" "}
                    <Link href="/rfp" className="text-primary underline underline-offset-4">
                      RFP Engine is live
                    </Link>{" "}
                    if drafting is the bottleneck.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="sentry-email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Work email
                    </Label>
                    <Input
                      id="sentry-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={254}
                      placeholder="you@yourorg.com"
                      className="rounded-[6px]"
                    />
                  </div>

                  {state === "error" && errorMessage && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-destructive">{errorMessage}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-start gap-5 pt-2">
                    <Button type="submit" size="lg" disabled={state === "submitting"} className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                      {state === "submitting" ? "Adding…" : "Join the early list"}
                      {state !== "submitting" && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <Link href="/rfp" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                      See RFP Engine (live) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The pair */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="The pair" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Sentry decides what you bid. Engine writes what you bid.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Sister products on purpose. RFP Engine is live; RFP Sentry is the missing front
                half of the same workflow. Use Engine now; subscribe to the early list for Sentry.
                Or hire both as a managed Capture Pipeline retainer ($7.5K-$35K/mo).
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/rfp">See RFP Engine <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <Link href="/studio/retainers" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Hire Capture Pipeline <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
