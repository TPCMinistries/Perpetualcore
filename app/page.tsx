/**
 * Studio homepage — repositioned per BRAND_ARCHITECTURE §7 + COPY_HOMEPAGE.md.
 *
 * Section composition (per UI audit §3):
 *   1. Hero (text-led, left-aligned, no orbs, no model pills)
 *   2. The Studio (1-line + link)
 *   3. Products — 3-card strip: Sentinel / Atlas / Sage (per §5.6 lock)
 *   4. Methodology teaser — Learn → Wire → Automate → Scale
 *   5. The Engine commitment — 10% / $7,500–$25,000+ to IHA
 *   6. Final CTA (desaturated, scarcity-as-quality-signal)
 *
 * Sharpening levers from UI audit §5: font-semibold not font-black,
 * gradient text capped to H1, mono-violet icon family, py-32 boundaries
 * on text-led sections.
 *
 * Retired from / (still present in repo, will move to /products/platform
 * in Session 2): BentoFeatures, InteractiveChatDemo, ComparisonTable,
 * ExecSuiteShowcase, UseCases. Deleted entirely: "Built for Everyone"
 * personas grid, "Stop juggling tools" CTA.
 *
 * Preserved from prior /: SocialProofBanner (re-purposed text), TrustBadges,
 * SecuritySection moved to /products/platform.
 */

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Cog,
  Workflow,
  Sparkles,
  ShieldCheck,
  Building2,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export const metadata = {
  title: "Perpetual Core — An AI-first studio",
  description:
    "We install operating systems for mission-driven organizations. Engagements start at $75,000.",
};

const PRODUCTS = [
  {
    name: "Sentinel",
    headline: "Sentinel — due diligence and intel for the people Kroll won't take calls from.",
    line1:
      "For attorneys, investigators, journalists, and operators running pre-deal or pre-hire diligence on subjects the legacy CRAs decline to touch.",
    line2:
      "Live at sentinel.perpetualcore.com. Production-grade. The first product we shipped from an engagement and kept running.",
    cta: { label: "Run a vet", href: "https://sentinel.perpetualcore.com" },
    icon: ShieldCheck,
  },
  {
    name: "Atlas",
    headline: "Atlas — AI-native COO for fund-backed portfolio companies.",
    line1:
      "For PE Operating Partners and fund Ops leads installing an AI operating system across a portco in 6 to 10 weeks, before the next quarterly board meeting.",
    line2: "In pilot with select funds — by introduction only.",
    cta: { label: "Request introduction", href: "/products/atlas" },
    icon: Building2,
  },
  {
    name: "Sage",
    headline: "Sage — the coach and chief of staff who never forgets you.",
    line1:
      "For operators who run two or more entities, live in voice memos, and want a relational AI partner — not a chatbot you re-explain yourself to every morning.",
    line2:
      "Lives wherever you do. Telegram, voice, web. 15% of every Sage subscription funds the Institute for Human Advancement.",
    cta: { label: "Meet Sage", href: "https://sage.perpetualcore.com" },
    icon: Heart,
  },
] as const;

const PHASES = [
  {
    title: "Learn.",
    body: "We read your org the way an operator does. Calls, docs, voice notes, the channels where decisions actually happen. Two weeks, no PowerPoint.",
    icon: Brain,
  },
  {
    title: "Wire.",
    body: "We install the eight registries — entities, people, projects, work items, knowledge, agents, workflows, events — in your Supabase, your storage, your stack.",
    icon: Workflow,
  },
  {
    title: "Automate.",
    body: "Skills get built against your real workflows. The Anthropic SKILL.md format, per-portco JSON. Versioned, auditable, yours.",
    icon: Cog,
  },
  {
    title: "Scale.",
    body: "Your team operates and extends the system. We document, train, and hand over. You own it.",
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageViewTracker />
      <Navbar />

      {/* 1. Hero — text-led, left-aligned, no orbs */}
      <section className="container mx-auto px-4 pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            An AI-first studio.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            We install <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">operating systems</span> for mission-driven organizations.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            Engagements start at $75,000. Production AI under PEPFAR rules, IRB review, GDPR-equivalent consent, and offline-first connectivity — not in PowerPoint.
          </p>
          <div className="space-y-5 text-base text-muted-foreground leading-relaxed mb-10">
            <p>
              The Anthropic-Blackstone and OpenAI-TPG joint ventures are embedding engineers inside Fortune 1000 portcos at $300K to $3M an engagement. They are not coming for foundations, faith institutions, community colleges, regional health systems, or UN-aligned humanitarian agencies.
            </p>
            <p>
              We are. We install the Perpetual Engine across your departments in 90 to 180 days, hand you a system your team owns, and stay on retainer if you want us to. We take a limited number of engagements per quarter.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/methodology">Read the methodology</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trusted-by strip — quiet, no marquee */}
      <section className="border-y border-border/40 bg-muted/20 py-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground tracking-wide">
            Trusted by leaders in healthcare, education, faith-based institutions,
            international development, and community workforce development.
          </p>
        </div>
      </section>

      {/* 2. The Studio */}
      <section className="container mx-auto px-4 py-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">The studio.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-8">
            We don&apos;t write decks. We install systems and walk away with your team running them.
          </h2>
          <div className="space-y-5 text-lg text-muted-foreground leading-relaxed mb-10">
            <p>
              A Perpetual Core engagement audits your operations, installs the Perpetual Engine — eight registries, the AI-First Framework, and a compounding skills library — across the departments that need it, and trains your team to operate and extend it without us.
            </p>
            <p>Then we leave. The system is yours.</p>
            <p>
              If you want us back, we keep a slot open on monthly retainer ($5,000–$15,000/month, scoped to engagement) for the operators who&apos;d rather we stay in the loop on what comes next.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/studio/process">How we work</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Products — 3-card strip: Sentinel / Atlas / Sage */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Proof, not promises.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Every product on this site is a working installation we shipped in an engagement and kept running.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The portfolio is the proof. The engagement is the work. Each of these is a live answer to &ldquo;have you actually shipped something like this before, and does it still run?&rdquo;
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            const isExternal = product.cta.href.startsWith("http");
            return (
              <Card
                key={product.name}
                className="border-border/60 hover:border-primary/40 transition-colors flex flex-col"
              >
                <CardContent className="p-7 flex flex-col h-full">
                  {/* Mono-violet icon family per UI audit §5.2 */}
                  <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold leading-snug mb-3">{product.headline}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {product.line1}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {product.line2}
                  </p>
                  <div className="mt-auto">
                    <Button variant="outline" size="sm" asChild>
                      {isExternal ? (
                        <a href={product.cta.href} target="_blank" rel="noopener noreferrer">
                          {product.cta.label} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link href={product.cta.href}>
                          {product.cta.label} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Link
          href="/products"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          See the full portfolio <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </section>

      {/* 4. Methodology teaser */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">How we work.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Four phases. One framework. Yours at the end.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-10 max-w-5xl mb-12">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            return (
              <div key={phase.title} className="flex gap-5">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{phase.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{phase.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/studio/methodology">
              Read the methodology <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/studio/process">See the engagement arc</Link>
          </Button>
        </div>
      </section>

      {/* 5. The Engine commitment */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The Perpetual Engine.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-8">
            10% of every engagement — $7,500 to $25,000+ per client — funds the Institute for Human Advancement.
          </h2>
          <div className="space-y-5 text-lg text-muted-foreground leading-relaxed mb-10">
            <p>
              This is structurally non-replicable. No VC-backed competitor can give away 10–15% of top-line revenue. No JV can either; their LPs won&apos;t allow it.
            </p>
            <p>
              The Institute for Human Advancement is our 501(c)(3) parent. It runs workforce development for low-income New Yorkers and field health programs in East Africa. Every engagement contributes. Audited annually, line-itemed on every invoice.
            </p>
            <p className="text-foreground font-medium">
              We didn&apos;t bolt this on for marketing. The studio exists to fund the mission.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/engine">
                How the Engine works <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://theiha.org" target="_blank" rel="noopener noreferrer">
                About the Institute
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Final CTA — left-aligned, desaturated per UI audit §5 */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Ready when you are.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            We take a limited number of engagements per quarter.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            If you&apos;re a foundation program officer, an executive director, a fund Operating Partner, or the COO of a regional health system — and you&apos;ve been waiting for an implementation team that understands your constraints — start here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/about">Talk to the founder</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
