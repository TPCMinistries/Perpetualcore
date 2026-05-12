/**
 * Studio homepage — Editorial Gravity v2
 *
 * Visual system: VISUAL_SYSTEM.md
 * Copy locked: COPY_HOMEPAGE.md
 * Brand locked: BRAND_ARCHITECTURE.md §9
 *
 * Section composition:
 *   1. Hero (Newsreader display, left-aligned, no orbs, no gradient slab)
 *   2. Trusted-by strip (italic Newsreader sentence, border-y)
 *   3. The Studio (prose, serif headlines)
 *   4. Products — 3-card strip: Sentinel / Atlas / Sage (editorial cards)
 *   5. Methodology teaser — Learn → Wire → Automate → Scale
 *   6. The Engine commitment — dark surface block
 *   7. Final CTA (quiet, scarcity-as-quality)
 *
 * What is NOT here: animated orbs, gradient text on H2s, colored icon tiles,
 *   outline buttons on dark bg, model pills, marquee animations, font-black.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    index: "01",
    name: "Sentinel",
    headline: "Due diligence and intel for the people Kroll won't take calls from.",
    body: "For attorneys, investigators, journalists, and operators running pre-deal or pre-hire diligence on subjects the legacy CRAs decline to touch. Live at sentinel.perpetualcore.com. Production-grade. The first product we shipped from an engagement and kept running.",
    cta: { label: "Run a vet", href: "https://sentinel.perpetualcore.com" },
    status: "Live",
  },
  {
    index: "02",
    name: "Atlas",
    headline: "AI-native COO for fund-backed portfolio companies.",
    body: "For PE Operating Partners and fund Ops leads installing an AI operating system across a portco in 6 to 10 weeks, before the next quarterly board meeting. In pilot with select funds — by introduction only.",
    cta: { label: "Request introduction", href: "/products/atlas" },
    status: "Pilot",
  },
  {
    index: "03",
    name: "Sage",
    headline: "The coach and chief of staff who never forgets you.",
    body: "For operators who run two or more entities, live in voice memos, and want a relational AI partner — not a chatbot you re-explain yourself to every morning. 15% of every Sage subscription funds the Institute for Human Advancement.",
    cta: { label: "Meet Sage", href: "https://sage.perpetualcore.com" },
    status: "Coming",
  },
] as const;

const PHASES = [
  {
    step: "Learn.",
    body: "We read your org the way an operator does. Calls, docs, voice notes, the channels where decisions actually happen. Two weeks, no PowerPoint.",
  },
  {
    step: "Wire.",
    body: "We install the eight registries — entities, people, projects, work items, knowledge, agents, workflows, events — in your Supabase, your storage, your stack.",
  },
  {
    step: "Automate.",
    body: "Skills get built against your real workflows. The Anthropic SKILL.md format, per-portco JSON. Versioned, auditable, yours.",
  },
  {
    step: "Scale.",
    body: "Your team operates and extends the system. We document, train, and hand over. You own it.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageViewTracker />
      <Navbar />

      {/* ─── 1. Hero ─────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 sm:px-8 pt-28 pb-36 sm:pt-36 sm:pb-48">
        <div className="max-w-3xl">
          {/* Eyebrow — all caps, Inter, quiet */}
          <p className="eyebrow mb-8">An AI-first studio.</p>

          {/* H1 — Newsreader light, no gradient, no font-black */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-foreground mb-8">
            We install operating systems for mission-driven organizations.
          </h1>

          {/* Subhead — the PEPFAR/IRB proof sentence, inline prose */}
          <p className="text-xl text-muted-foreground leading-[1.75] mb-8 max-w-2xl">
            Engagements start at $75,000. Production AI under PEPFAR rules, IRB review,
            GDPR-equivalent consent, and offline-first connectivity — not in PowerPoint.
          </p>

          {/* Body — the JV-exclusion argument + "We are." */}
          <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-[1.75] mb-12 max-w-2xl">
            <p>
              The Anthropic-Blackstone and OpenAI-TPG joint ventures are embedding engineers
              inside Fortune 1000 portcos at $300K to $3M an engagement. They are not coming
              for foundations, faith institutions, community colleges, regional health systems,
              or UN-aligned humanitarian agencies.
            </p>
            <p>
              We are. We install the Perpetual Engine across your departments in 90 to 180 days,
              hand you a system your team owns, and stay on retainer if you want us to. We take
              a limited number of engagements per quarter.
            </p>
          </div>

          {/* CTAs — primary filled + text-link secondary */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 shadow-none">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/studio/methodology"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
            >
              Read the methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 2. Trusted-by strip ─────────────────────────────────────── */}
      <section className="border-y border-border/60 py-10">
        <div className="container mx-auto px-6 sm:px-8">
          <p className="text-center font-serif text-base font-normal italic text-muted-foreground">
            Trusted by leaders in healthcare, education, faith-based institutions,
            international development, and community workforce development.
          </p>
        </div>
      </section>

      {/* ─── 3. The Studio ───────────────────────────────────────────── */}
      <section className="container mx-auto px-6 sm:px-8 py-28 sm:py-36">
        <div className="max-w-2xl">
          <p className="eyebrow mb-8">The studio.</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight text-foreground mb-8">
            We don&apos;t write decks. We install systems and walk away with your team running them.
          </h2>
          <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-[1.75] mb-10">
            <p>
              A Perpetual Core engagement audits your operations, installs the Perpetual
              Engine — eight registries, the AI-First Framework, and a compounding skills
              library — across the departments that need it, and trains your team to operate
              and extend it without us.
            </p>
            <p>Then we leave. The system is yours.</p>
            <p>
              If you want us back, we keep a slot open on monthly retainer ($5,000–$15,000/month,
              scoped to engagement) for the operators who&apos;d rather we stay in the loop on what
              comes next.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button asChild className="text-sm font-medium shadow-none">
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Link
              href="/studio/process"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              How we work <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. Products — 3-card editorial strip ────────────────────── */}
      <section className="border-t border-border/60 py-28 sm:py-36">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-16">
            <p className="eyebrow mb-8">Proof, not promises.</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight text-foreground mb-6">
              Every product on this site is a working installation we shipped in an engagement
              and kept running.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-[1.75]">
              The portfolio is the proof. The engagement is the work. Each of these is a live
              answer to &ldquo;have you actually shipped something like this before, and does it
              still run?&rdquo;
            </p>
          </div>

          {/* Editorial card grid — white on parchment, no gradient tiles */}
          <div className="grid md:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-sm overflow-hidden mb-10">
            {PRODUCTS.map((product) => {
              const isExternal = product.cta.href.startsWith("http");
              return (
                <article
                  key={product.name}
                  className="bg-card p-8 sm:p-10 flex flex-col group hover:bg-surface-hover transition-colors duration-200"
                >
                  {/* Index + status row */}
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-mono text-xs text-muted-foreground/60 tracking-wider">
                      {product.index}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium">
                      {product.status}
                    </span>
                  </div>

                  {/* Product name — eyebrow style */}
                  <p className="text-xs uppercase tracking-widest font-medium text-primary mb-3">
                    {product.name}
                  </p>

                  {/* Headline — Newsreader */}
                  <h3 className="font-serif text-xl sm:text-2xl font-normal leading-snug text-foreground mb-5">
                    {product.headline}
                  </h3>

                  {/* Body */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                    {product.body}
                  </p>

                  {/* CTA — plain text link */}
                  <div className="mt-auto">
                    {isExternal ? (
                      <a
                        href={product.cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors"
                      >
                        {product.cta.label}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    ) : (
                      <Link
                        href={product.cta.href}
                        className="inline-flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors"
                      >
                        {product.cta.label}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <Link
            href="/products"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            See the full portfolio <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ─── 5. Methodology teaser ───────────────────────────────────── */}
      <section className="border-t border-border/60 py-28 sm:py-36">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-16">
            <p className="eyebrow mb-8">How we work.</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight text-foreground">
              Four phases. One framework. Yours at the end.
            </h2>
          </div>

          {/* Phase list — numbered, full-width table feel */}
          <div className="max-w-4xl mb-14">
            {PHASES.map((phase, i) => (
              <div
                key={phase.step}
                className={`flex gap-8 sm:gap-12 py-8 ${
                  i < PHASES.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                {/* Step number — small, fixed width */}
                <div className="flex-shrink-0 w-6 sm:w-8 pt-0.5">
                  <span className="font-mono text-xs text-muted-foreground/50 tracking-wider">
                    0{i + 1}
                  </span>
                </div>
                {/* Step content */}
                <div className="flex-1 grid sm:grid-cols-[200px_1fr] gap-4 sm:gap-12">
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    {phase.step}
                  </h3>
                  <p className="text-base text-muted-foreground leading-[1.75]">{phase.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button asChild className="text-sm font-medium shadow-none">
              <Link href="/studio/methodology">
                Read the methodology <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Link
              href="/studio/process"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              See the engagement arc <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 6. The Engine commitment — dark surface ─────────────────── */}
      <section
        className="py-28 sm:py-36"
        style={{ backgroundColor: "hsl(var(--surface-dark))" }}
      >
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl">
            {/* Eyebrow — light on dark */}
            <p className="text-xs uppercase tracking-widest font-medium text-white/40 mb-8">
              The Perpetual Engine.
            </p>

            {/* Headline — Newsreader light, white */}
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight text-white mb-10">
              10% of every engagement — $7,500 to $25,000+ per client — funds the Institute
              for Human Advancement.
            </h2>

            {/* Divider */}
            <div className="border-t border-white/10 mb-10" />

            {/* Body — warm gray on dark */}
            <div className="space-y-5 text-base sm:text-lg leading-[1.75] text-white/60 mb-12">
              <p>
                This is structurally non-replicable. No VC-backed competitor can give away
                10–15% of top-line revenue. No JV can either; their LPs won&apos;t allow it.
              </p>
              <p>
                The Institute for Human Advancement is our 501(c)(3) parent. It runs workforce
                development for low-income New Yorkers and field health programs in East Africa.
                Every engagement contributes. Audited annually, line-itemed on every invoice.
              </p>
              <p className="text-white/80 font-medium">
                We didn&apos;t bolt this on for marketing. The studio exists to fund the mission.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                asChild
                variant="outline"
                className="text-sm font-medium border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white shadow-none"
              >
                <Link href="/engine">
                  How the Engine works <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <a
                href="https://theiha.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-white/50 hover:text-white/80 transition-colors py-2"
              >
                About the Institute <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Final CTA ────────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-28 sm:py-40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow mb-8">Ready when you are.</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight text-foreground mb-6">
              We take a limited number of engagements per quarter.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-[1.75] mb-12">
              If you&apos;re a foundation program officer, an executive director, a fund Operating
              Partner, or the COO of a regional health system — and you&apos;ve been waiting for
              an implementation team that understands your constraints — start here.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" asChild className="text-sm font-medium px-7 shadow-none">
                <Link href="/studio/engagements">
                  Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/about"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-3"
              >
                Talk to the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
