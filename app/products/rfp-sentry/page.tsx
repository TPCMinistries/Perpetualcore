/**
 * /products/rfp-sentry — bid intelligence + compliance gate stub.
 *
 * Per BRAND_ARCHITECTURE §5.3 lock + COPY_PRODUCTS Card 6 + Session
 * 3 brief Step 6.
 *
 * Status: in build. This is a stub page until the product ships —
 * hero, two-paragraph explainer, and an email capture for the early
 * list. The form posts to /api/early-access?product=rfp-sentry,
 * which best-efforts inserts into Supabase `early_access` and
 * gracefully degrades if the table isn't there yet (per the existing
 * contact-sales soft-fail pattern).
 *
 * RFP Engine = response/drafting (LIVE at /rfp).
 * RFP Sentry = discovery/intel/scoring (this page, stubbed).
 *
 * NOTE: We do not import or modify anything inside (rfp-marketing),
 * lib/rfp/, or components/rfp/ per the active second-RFP build.
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, ScanSearch, Filter, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SubmitState = "idle" | "submitting" | "success" | "error";

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
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            In build.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            RFP Sentry — bid intelligence and{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              compliance gate
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            For capture teams who&apos;d rather lose a deal at the bid/no-bid step than after writing the proposal.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Sister product to RFP Engine. Score RFPs for fit before you write. Compliance flags surface before submission, not after a debrief.
          </p>
        </div>
      </section>

      {/* Two-paragraph explainer */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Why Sentry exists.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-10">
            The bid/no-bid decision is where most capture teams already lose.
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              RFP Engine helps a team draft a strong response in their own voice. RFP Sentry sits one step earlier: it scores incoming RFPs for fit, surfaces the qualifying questions before anyone touches a Word doc, and flags the compliance landmines — set-aside requirements, mandatory subs, page-limit traps, conflicting eval criteria — that bury an otherwise winnable bid in the protest pile. Sentry is the gate; Engine is what runs after the gate clears.
            </p>
            <p>
              In build means in build. We&apos;re shipping Sentry into a small set of capture teams in the studio&apos;s existing engagement portfolio first — the same install-then-productize path Sentinel and Vellum took. If you want a seat in the early-list cohort, drop your email below. We&apos;ll tell you what we&apos;ve learned, what shipped, and when the standalone surface goes live.
            </p>
          </div>

          {/* Three pillars */}
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Fit scoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  RFPs scored against your capability statement, past wins, and team capacity. The bid/no-bid call gets a number behind it.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <ScanSearch className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Discovery cadence</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Federal, state, and foundation pipelines monitored on a fixed cadence. The RFPs you&apos;d miss surface; the noise gets filtered.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <AlertOctagon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Compliance flags</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Set-aside, sub, page-limit, and conflicting-eval traps surfaced before draft. Protest-class issues caught at the gate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Early list */}
      <section id="early-list" className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Early list.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Join the early list.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We&apos;ll email you when Sentry ships, when we open the early cohort, and when there&apos;s something concrete to show. No newsletter, no drip, no &quot;this might interest you&quot; — just the launch note.
          </p>

          {state === "success" ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-7">
                <h3 className="text-lg font-semibold mb-2">You&apos;re on the list.</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  We&apos;ll be in touch when there&apos;s something to show. In the meantime,{" "}
                  <Link href="/rfp" className="text-primary underline underline-offset-4">
                    RFP Engine is live
                  </Link>{" "}
                  if drafting is the bottleneck.
                </p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="sentry-email">Work email</Label>
                <Input
                  id="sentry-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@yourorg.com"
                />
              </div>

              {state === "error" && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" size="lg" disabled={state === "submitting"} className="text-base px-7">
                  {state === "submitting" ? "Adding…" : "Join the early list"}
                  {state !== "submitting" && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <Button type="button" size="lg" variant="outline" asChild className="text-base px-7">
                  <Link href="/rfp">See RFP Engine (live)</Link>
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Closing */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The pair.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Sentry decides what you bid. Engine writes what you bid.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            They&apos;re sister products on purpose. RFP Engine is live; RFP Sentry is the missing front half of the same workflow. Use Engine now; subscribe to the early list for Sentry.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/rfp">
                See RFP Engine <ArrowRight className="ml-2 h-4 w-4" />
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
