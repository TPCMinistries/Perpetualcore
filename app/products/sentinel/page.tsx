/**
 * /products/sentinel — Sentinel due-diligence + intel landing.
 *
 * Per COPY_PRODUCTS.md Card 1 + Session 3 brief Step 2.
 *
 * Minimal landing surface. The actual product runs on the live
 * subdomain at https://sentinel.perpetualcore.com — this page is the
 * studio-site marketing entrypoint that hands buyers off cleanly to
 * the live application. Per memory note: Sentinel is awaiting a
 * dedicated Supabase migration; the live surface continues to operate
 * while that is queued, and this entrypoint links to it.
 *
 * Hard rules:
 *   - Hero + 3-line value prop + outbound CTA. No pricing, no advisor
 *     panel, no feature grid — minimal by design.
 *   - "The first product we shipped from an engagement and kept
 *     running" — the proof point is the live URL.
 */

import Link from "next/link";
import { ArrowRight, ShieldCheck, Search, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Sentinel — Perpetual Core",
  description:
    "Due diligence and intel for the people Kroll won't take calls from. Live at sentinel.perpetualcore.com.",
};

export default function SentinelPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            Live at sentinel.perpetualcore.com.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            Sentinel — due diligence and intel for the people{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Kroll won&apos;t take calls from
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            For attorneys, investigators, journalists, and operators running pre-deal or pre-hire diligence on subjects the legacy CRAs decline to touch.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Production-grade. The first product we shipped from an engagement and kept running.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <a href="https://sentinel.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Run a vet at sentinel.perpetualcore.com <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/products">See the full portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Three-line value prop expanded as cards */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            What Sentinel does.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Three things, in production, on every vet.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border/60">
            <CardContent className="p-7">
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Open-source intelligence, structured.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Public records, court filings, sanctions lists, news, and the long tail of social and forum surface. Pulled, deduped, and rendered as a coherent timeline — not a search results page.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <FileSearch className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Adverse-media synthesis.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Read across thousands of sources for a single subject in minutes. The synthesis surfaces the disqualifying detail before you draft the engagement letter.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Reports your client can read.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Defensible, citation-anchored reports — not a wall of links. Use them in deal memos, board packets, or your own write-up. The work product is the deliverable.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Closing — outbound CTA prominence */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The product is the proof.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Run a vet. The live site is the demo.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Most marketing pages describe what a product would do if it shipped. Sentinel ships. The studio installed it for a client. We kept it running. Open it and try it on a name you already know the answer to.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <a href="https://sentinel.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Run a vet <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/engagements">Install one inside your firm</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
