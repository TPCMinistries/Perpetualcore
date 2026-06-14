/**
 * /blog — The Install. The open notebook of Perpetual Core.
 *
 * Reframed from "Notes" placeholder to a real publication surface with
 * masthead, featured letter, archive, queue, and subscription. URL stays
 * at /blog for backward link compatibility; the brand is "The Install"
 * everywhere a human reads it.
 *
 * Pattern: A16Z's "Future." / Stripe's "Increment" / Founders Fund Letters
 * model — the publication carries institutional intellectual leadership;
 * the studio benefits from the operator-grade voice it builds.
 *
 * Editorial register: Instrument Serif display for the masthead and
 * letter titles, JetBrains Mono for masthead labels, hairlines, no
 * decoration. Black-on-white. Single primary accent.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

export const metadata = {
  title: "The Install — Perpetual Core's open notebook",
  description:
    "Founder-written letters from the operating floor of an AI-native studio, fund, and institute. Edited by Lorenzo Daughtry-Chambers. Occasional, when there's something to say.",
};

// Letters of The Install, newest first. № 001 is the latest letter and
// receives the featured treatment; earlier essays appear in Archive.
const LETTERS = [
  {
    number: "001",
    slug: "the-75k-floor",
    title: "What an AI operating system actually takes.",
    subtitle:
      "The real work behind a durable AI install: operating map, data surface, workflow ownership, team adoption, governance, and expansion path.",
    date: "2026-05-22",
    readMinutes: 5,
    featured: true,
  },
  {
    number: "002",
    slug: "what-an-ai-install-actually-costs",
    title: "What an AI install actually costs.",
    subtitle:
      "An honest breakdown of the four cost buckets: vendor subscriptions, engineering time, integration debt, and outcome evaluation. The accounting the proposal usually hides.",
    date: "2026-05-20",
    readMinutes: 6,
    featured: false,
  },
  {
    number: "003",
    slug: "outcome-eval-the-line-item-every-ai-install-skips",
    title: "Outcome-eval, the line item every AI install skips.",
    subtitle:
      "Without it, you don't have an install — you have a demo that ran once. Why outcome evaluation is the most load-bearing line item in any production AI engagement.",
    date: "2026-05-20",
    readMinutes: 5,
    featured: false,
  },
] as const;

const FEATURED = LETTERS.find((l) => l.featured)!;
const ARCHIVE = LETTERS.filter((l) => !l.featured);

const MASTHEAD = [
  { label: "Publisher", value: "Perpetual Core" },
  { label: "Editor", value: "Lorenzo Daughtry-Chambers" },
  { label: "Founded", value: "May 2026" },
  { label: "Cadence", value: "Occasional — when there's something to say" },
];

const QUEUE = [
  {
    label: "On the Engine",
    body:
      "Why the Perpetual Engine connects company-building, operating systems, products, and institutional capacity.",
  },
  {
    label: "Field notes on installs",
    body:
      "What actually works when you put production AI into a 50-person organization that runs on HIPAA, FERPA, or PEPFAR data. Operational map, not vendor demo.",
  },
  {
    label: "Mission-driven AI",
    body:
      "IRB review, offline-first connectivity, consent regimes for sensitive populations. Why most AI-for-good vendors fail the audit, and what an honest install looks like instead.",
  },
  {
    label: "Atlas in the wild",
    body:
      "Six-to-ten-week portco installs for fund Ops leads. Outcome-eval scope. What moves the metric in the first quarter, what doesn't, and what the operating-partner shouldn't measure.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Masthead ──────────────────────────────────────────────────
       *  Names the publication, anchors it institutionally, dates its
       *  founding. Reads as the cover page of a small operator's journal.
       */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-10">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">
              § A publication of Perpetual Core
            </p>
          </div>

          <h1 className="display-hero text-[52px] sm:text-[80px] lg:text-[120px] text-foreground mb-10 leading-[0.95]">
            The Install.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            The open notebook of Perpetual Core. Founder-written letters from the
            operating floor of an AI-native studio, fund, and institute — what
            we&apos;re learning, what we&apos;re re-pricing, what we&apos;re
            willing to say out loud about how production AI actually gets built
            inside organizations that live on real constraints.
          </p>

          {/* Masthead block — institutional facts about the publication itself */}
          <div className="border-y border-border py-6 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5 max-w-4xl">
            {MASTHEAD.map((row) => (
              <div key={row.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                  {row.label}
                </p>
                <p className="text-sm font-semibold tracking-[-0.005em] text-foreground leading-[1.4]">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured letter — Letter #001 in full editorial treatment ─── */}
      <section className="border-t border-border py-20 sm:py-28 bg-card/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="§ 01" label="Latest letter" />
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
                № {FEATURED.number} · {FEATURED.date} · {FEATURED.readMinutes} min read
              </p>
              <Link
                href={`/blog/${FEATURED.slug}`}
                className="group block"
              >
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.025em] text-foreground mb-6 group-hover:text-primary transition-colors">
                  {FEATURED.title}
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-[1.6] mb-8 max-w-2xl">
                  {FEATURED.subtitle}
                </p>
                <p className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.22em] text-foreground group-hover:text-primary transition-colors">
                  Read the letter
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Archive — earlier letters in a hairline row layout ─────────── */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="§ 02" label="Archive" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
                Earlier letters.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="border-t border-border max-w-4xl">
              {ARCHIVE.map((letter) => (
                <Link
                  key={letter.number}
                  href={`/blog/${letter.slug}`}
                  className="group grid grid-cols-[80px_1fr] sm:grid-cols-[80px_120px_1fr_auto] gap-x-6 sm:gap-x-10 gap-y-2 py-8 px-1 sm:px-3 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
                >
                  <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground pt-1">
                    № {letter.number}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground col-span-1 sm:col-auto hidden sm:inline">
                    {letter.date}
                  </span>
                  <div className="col-span-2 sm:col-auto">
                    <h4 className="font-display text-2xl sm:text-[28px] leading-[1.15] tracking-[-0.015em] text-foreground group-hover:text-primary transition-colors mb-2">
                      {letter.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-[1.6] max-w-2xl">
                      {letter.subtitle}
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:hidden">
                      {letter.date} · {letter.readMinutes} min read
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center justify-end font-mono text-[10px] uppercase tracking-[0.22em] text-foreground whitespace-nowrap mt-2 sm:mt-0 self-start sm:self-baseline">
                    Read
                    <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Subscribe ─────────────────────────────────────────────────── */}
      <section className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="§ 03" label="Subscribe" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                Have the next letter delivered.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-8 max-w-xl">
                Letters arrive direct from Lorenzo, no marketing wrapper. Welcome
                email lands within a minute. One-click unsubscribe.
              </p>
              <NewsletterCapture variant="inline" source="the_install_index" />
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Or subscribe via{" "}
                <a
                  href="/blog/rss.xml"
                  className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  RSS
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Queue ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="§ 04" label="What's queued" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
                On the desk.
              </h3>
              <p className="mt-4 text-base text-muted-foreground leading-[1.7] max-w-xl">
                Letters drafted but not yet shipped. Order may shift; some may
                merge or break apart in the editing.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <dl className="divide-y divide-border border-y border-border max-w-4xl">
              {QUEUE.map((topic) => (
                <div
                  key={topic.label}
                  className="grid sm:grid-cols-[240px_1fr] gap-4 sm:gap-10 py-7"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground pt-1">
                    {topic.label}
                  </dt>
                  <dd className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                    {topic.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ─── Read elsewhere — founder writing across the institution ───── */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="§ —" label="Read elsewhere" />
            <div className="max-w-3xl">
              <p className="text-base sm:text-lg text-muted-foreground leading-[1.7] mb-8 max-w-2xl">
                The Install is one of several surfaces where the operator&apos;s
                writing lands. Lorenzo also publishes longer-form essays,
                Institute briefings, and fund thesis pieces on{" "}
                <a
                  href="https://lorenzodc.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  lorenzodc.com
                </a>
                . The cross-surface picture is closer to the operator&apos;s
                full thinking than any single channel.
              </p>

              <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
                <a
                  href="https://lorenzodc.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    Personal essays
                  </p>
                  <p className="text-base font-semibold tracking-[-0.005em] text-foreground inline-flex items-baseline gap-1.5">
                    lorenzodc.com
                    <ArrowUpRight className="h-3.5 w-3.5 translate-y-0.5" aria-hidden />
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground leading-[1.55]">
                    Long-form essays, IHA briefings, fund-thesis pieces.
                  </p>
                </a>
                <a
                  href="https://theiha.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    Institute briefings
                  </p>
                  <p className="text-base font-semibold tracking-[-0.005em] text-foreground inline-flex items-baseline gap-1.5">
                    theiha.org
                    <ArrowUpRight className="h-3.5 w-3.5 translate-y-0.5" aria-hidden />
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground leading-[1.55]">
                    Field reports, program briefs, mission-context writing.
                  </p>
                </a>
              </div>

              <p className="mt-8 text-sm text-muted-foreground">
                <Link
                  href="/"
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Back to Perpetual Core
                </Link>{" "}
                · or{" "}
                <Link
                  href="/engine"
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  read about the Engine
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
