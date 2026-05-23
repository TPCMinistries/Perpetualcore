/**
 * /blog — blog index, currently an inbox for the newsletter rather than a
 * full content surface. Removes the 404 the audit flagged for /blog and
 * gives AI crawlers + Google a real route to discover when posts ship.
 *
 * When a real CMS / MDX backend is wired, replace the body here with the
 * post list. Keep the route shape stable so existing links survive.
 *
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

export const metadata = {
  title: "Notes — Perpetual Core",
  description:
    "Occasional dispatches from the studio. AI installs, the Engine commitment, what we're shipping. Subscribe for first dispatch.",
};

const PUBLISHED_POSTS = [
  {
    slug: "the-75k-floor",
    title: "Why we don't take engagements under $75,000",
    subtitle:
      "Letter #001 of The Install — and what we built for everyone below the floor.",
    date: "2026-05-22",
    readMinutes: 5,
  },
  {
    slug: "outcome-eval-the-line-item-every-ai-install-skips",
    title: "Outcome-eval, the line item every AI install skips",
    subtitle:
      "Without it, you don't have an install — you have a demo that ran once.",
    date: "2026-05-20",
    readMinutes: 5,
  },
  {
    slug: "what-an-ai-install-actually-costs",
    title: "What an AI install actually costs",
    subtitle: "And why we price engagements at $75,000",
    date: "2026-05-20",
    readMinutes: 6,
  },
];

const PLACEHOLDER_TOPICS = [
  {
    label: "On the Engine",
    body: "Why every AI engagement we sign gives 10–15% to the Institute, audited annually, line-itemed on every invoice.",
  },
  {
    label: "Field notes on installs",
    body: "What actually works when you put production AI into a 50-person organization. Operational map, not vendor demo.",
  },
  {
    label: "Mission-driven AI",
    body: "PEPFAR rules, IRB review, GDPR-equivalent consent. Why most AI-for-good vendors fail the audit, and what we do instead.",
  },
  {
    label: "Atlas in the wild",
    body: "Six-to-ten-week portco installs. Outcome-eval scope. What moves the metric, what doesn't.",
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

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="Notes" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Notes from the operating layer.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Occasional dispatches. AI installs we shipped, the Engine
              commitment in practice, what mission-driven AI actually looks like
              when you write the audit log. Written by Lorenzo, read by
              operators.
            </p>
          </div>
        </div>
      </section>

      {/* Published posts */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Published" />
            <div className="max-w-3xl">
              <ul className="divide-y divide-border border-y border-border">
                {PUBLISHED_POSTS.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group block py-6 hover:opacity-80 transition"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                        {post.date} · {post.readMinutes} min read
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-2 group-hover:underline">
                        {post.title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-[1.65]">
                        {post.subtitle}
                      </p>
                      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground inline-flex items-center gap-2">
                        Read
                        <ArrowRight className="h-3 w-3" />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter capture */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="Get the next one" />
            <div className="max-w-2xl">
              <NewsletterCapture variant="inline" source="blog_index" />
              <p className="mt-4 text-xs text-muted-foreground">
                Welcome email arrives within a minute. Unsubscribe in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Topics queued */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="What's queued" />
            <div className="max-w-3xl">
              <p className="text-base text-muted-foreground leading-[1.7] mb-12 max-w-2xl">
                A preview of upcoming dispatches. Subscribe above and they
                arrive direct.
              </p>
              <dl className="divide-y divide-border border-y border-border">
                {PLACEHOLDER_TOPICS.map((topic) => (
                  <div key={topic.label} className="grid sm:grid-cols-[220px_1fr] gap-4 sm:gap-10 py-6">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
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
        </div>
      </section>

      {/* Read elsewhere */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Read elsewhere" />
            <div className="max-w-2xl">
              <p className="text-base text-muted-foreground leading-[1.7] mb-8">
                Lorenzo writes long-form on{" "}
                <a
                  href="https://lorenzodc.com"
                  className="text-foreground underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  lorenzodc.com
                </a>{" "}
                — personal essays, IHA briefings, fund thesis pieces. Studio
                dispatches land here once the cadence is set.
              </p>
              <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                <Link href="/about">
                  Read about Perpetual Core <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
