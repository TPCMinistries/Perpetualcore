/**
 * /about — founder + ecosystem + how-we-work + final CTA.
 *
 * Per COPY_ABOUT.md and UI audit §6: real founder photo is required for
 * launch. We use the existing LDC-style placeholder for this commit and
 * mark it with an explicit TODO — the visual pass swaps in a real photo
 * before merge.
 *
 * Section 3 (the ecosystem) names IHA, Uplift Communities, DeepFutures
 * Capital — IHA full name links to https://theiha.org.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "About — Perpetual Core",
  description:
    "A studio built to fund a mission, not the other way around. Lorenzo Daughtry-Chambers and the Institute for Human Advancement.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Section 1 — Hero */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">About.</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            A studio built to fund a{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              mission
            </span>
            , not the other way around.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">
            Perpetual Core is the for-profit infrastructure entity inside the Institute for Human Advancement ecosystem. Lorenzo Daughtry-Chambers founded it in 2024 to install AI operating systems for the mid-market mission-driven organizations the joint ventures don&apos;t serve.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/engine">How the Engine works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2 — Founder */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-5xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">Founder.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-12">
            Lorenzo Daughtry-Chambers.
          </h2>

          <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
            {/* TODO: replace placeholder with real Lorenzo photo */}
            <div className="aspect-square w-full max-w-[280px] rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/10 border border-border/60 flex items-center justify-center">
              <span className="text-5xl font-semibold tracking-tight text-primary/80">LDC</span>
            </div>

            <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
              <p className="text-foreground font-medium text-xl">I built Perpetual Core because I needed it.</p>
              <p>
                I run multiple organizations at once — the Institute for Human Advancement (501(c)(3) parent), Uplift Communities (operating arm), DeepFutures Capital (investment fund), and a portfolio of programs that includes a community-college healthcare workforce track in New York, a parish-network field deployment in East Africa, and a faith-institution platform serving multi-state networks.
              </p>
              <p>
                None of those programs run on PowerPoint. They run on production systems — under HIPAA in the workforce program, under PEPFAR data-sovereignty rules and IRB review in East Africa, under offline-first connectivity assumptions in places where the cellular fallback you&apos;re imagining doesn&apos;t exist. I needed an operating system that could hold all of it without dropping the thread.
              </p>
              <p>So I built one. Then I started installing it for other people.</p>
              <p>
                That&apos;s the whole story. A studio falls out of an operator&apos;s tool, not out of a strategy deck.
              </p>
              <p className="text-foreground">— Lorenzo</p>

              <div className="pt-4">
                <Button variant="outline" asChild>
                  <Link href="/contact-sales">
                    Talk to Lorenzo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — The ecosystem */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">The ecosystem.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-12">
            Perpetual Core sits inside three things, and is one of them.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          <Card className="border-border/60">
            <CardContent className="p-7">
              <h3 className="text-xl font-semibold mb-3">
                The{" "}
                <a
                  href="https://theiha.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Institute for Human Advancement
                </a>{" "}
                (theiha.org).
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Our 501(c)(3) parent. Workforce development for low-income New Yorkers, healthcare-pathway training, field health programs in East Africa. The mission the studio funds. 10 to 15% of every revenue dollar across Perpetual Core flows here.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <h3 className="text-xl font-semibold mb-3">Uplift Communities.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                The operating arm. Where the on-the-ground programs run — the community-college workforce track, the case-management infrastructure, the staff and intern teams. Perpetual Core&apos;s installs are battle-tested here first; the field work is the credential.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <h3 className="text-xl font-semibold mb-3">DeepFutures Capital.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                The investment fund. Mission-aligned founders building toward acquisition; we invest where the operating system we install becomes a strategic asset on the cap table.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <h3 className="text-xl font-semibold mb-3">Field research.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                The Institute for Human Advancement&apos;s Kenya work — production AI deployments under PEPFAR rules, IRB review, and offline-first connectivity, built across parish networks in East Africa — is the field-research arm that informs Perpetual Core methodology. The constraints we name in our positioning aren&apos;t theoretical. They&apos;re what our team works under every quarter.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Button variant="outline" asChild>
            <a href="https://theiha.org" target="_blank" rel="noopener noreferrer">
              Visit the Institute <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Section 4 — How we work */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">How we operate.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-12">
            Five things to know before you hire us.
          </h2>

          <ol className="space-y-8 text-base leading-relaxed">
            <li>
              <p className="font-semibold text-lg mb-1">1. We take a limited number of engagements per quarter.</p>
              <p className="text-muted-foreground">
                Engagements start at $75,000. Retainer $5,000–$15,000/month, scoped to engagement. Capacity is the bottleneck, not lead flow.
              </p>
            </li>
            <li>
              <p className="font-semibold text-lg mb-1">2. We don&apos;t write decks.</p>
              <p className="text-muted-foreground">
                We install systems. If you want a transformation strategy document, we have several good referrals. None of them are us.
              </p>
            </li>
            <li>
              <p className="font-semibold text-lg mb-1">3. We don&apos;t name our clients.</p>
              <p className="text-muted-foreground">
                Mission-driven buyers don&apos;t want their data on our website, and we respect that — even when it costs us marketing surface. Case studies on this site are abstracted to sector and constraint regime.
              </p>
            </li>
            <li>
              <p className="font-semibold text-lg mb-1">4. We don&apos;t lock you in.</p>
              <p className="text-muted-foreground">
                Every engagement ends with documentation, training, and handover. The system is yours after we leave. Retainer is optional, monthly, cancellable.
              </p>
            </li>
            <li>
              <p className="font-semibold text-lg mb-1">5. The Perpetual Engine commitment is structural.</p>
              <p className="text-muted-foreground">
                10% of every engagement — $7,500 to $25,000+ per client — funds the Institute for Human Advancement. Audited annually. Line-itemed on every invoice. This is why we built the studio.
              </p>
            </li>
          </ol>

          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/engine">How the Engine works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 5 — Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            We&apos;re a small studio. We pick engagements carefully.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            If you&apos;re an executive director, a foundation program officer, a fund Operating Partner, a regional health system COO, or a mission-aligned founder — and the joint ventures haven&apos;t called you back — we should talk.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <a href="mailto:lorenzo@perpetualcore.com">Email the founder</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
