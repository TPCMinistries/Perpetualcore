/**
 * Letter #001 of "The Install" — published as a blog post for permalink/SEO.
 * Source: ~/Documents/LDC-Command-Center-Vault/06-Resources/the-install/letter-001-the-75k-floor.md
 * Voice: Lorenzo's, intact. Featured on home as institutional founder-writing surface.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

const POST_TITLE = "Why we don't take engagements under $75,000";
const POST_SUBTITLE = "Letter #001 of The Install — and what we built for everyone below the floor.";
const POST_DATE = "2026-05-22";
const POST_AUTHOR = "Lorenzo Daughtry-Chambers";
const READ_MINUTES = 5;

export const metadata = {
  title: `${POST_TITLE} — The Install · Perpetual Core`,
  description:
    "Last year I started turning down work. Not because I had too much — because the math stopped working below $75K. Letter #001 of The Install.",
  openGraph: {
    type: "article",
    title: POST_TITLE,
    description:
      "Why we set a $75,000 floor for institutional engagements — and the four things we built for everyone below it.",
    publishedTime: `${POST_DATE}T00:00:00Z`,
    authors: [POST_AUTHOR],
  },
};

function articleSchema() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com")
    .replace(/\s+/g, "")
    .replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: POST_TITLE,
    description:
      "Why Perpetual Core sets a $75,000 floor for institutional engagements.",
    image: `${baseUrl}/og-image.png`,
    datePublished: `${POST_DATE}T00:00:00Z`,
    dateModified: `${POST_DATE}T00:00:00Z`,
    author: {
      "@type": "Person",
      name: POST_AUTHOR,
      url: "https://lorenzodc.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Perpetual Core",
      logo: { "@type": "ImageObject", url: `${baseUrl}/og-image.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/the-75k-floor`,
    },
  };
}

export default function PostPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          articleSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Notes", path: "/blog" },
            { name: POST_TITLE, path: "/blog/the-75k-floor" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-baseline gap-3 mb-8 text-muted-foreground">
            <Link
              href="/blog"
              className="font-mono text-[10px] uppercase tracking-[0.22em] hover:text-foreground transition"
            >
              ← Notes
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
              · {POST_DATE} · {READ_MINUTES} min read · The Install · #001
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.025em] text-foreground mb-4">
            {POST_TITLE}
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground leading-[1.4]">
            {POST_SUBTITLE}
          </p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            By Lorenzo Daughtry-Chambers
          </p>
        </div>
      </section>

      {/* Body */}
      <article className="container mx-auto px-6 sm:px-8 pb-20">
        <div className="max-w-2xl mx-auto prose-content">
          <p>I started turning down work last year.</p>

          <p>Not because I had too much. Because the math stopped working.</p>

          <p>
            Here&apos;s what was happening: a nonprofit director would email me
            — usually a great human, running something that actually mattered —
            asking for &ldquo;an AI strategy session, maybe a few hours of your
            time.&rdquo; They had $3,000 in the budget. Maybe $5,000.
          </p>

          <p>
            I&apos;d say yes. I&apos;d show up. I&apos;d build them something
            genuinely useful. And then six weeks later it would be sitting
            unused on a shelf, because nobody on their team had the bandwidth
            or technical fluency to keep it running.
          </p>

          <p>
            We&apos;d both walk away losing. Me, because I burned a week of
            capacity. Them, because they paid for something that turned into a
            paperweight.
          </p>

          <p>
            So we set a floor:{" "}
            <strong>$75,000 for any institutional engagement at Perpetual Core.</strong>
          </p>

          <p>That number isn&apos;t arbitrary. It&apos;s the smallest amount where the math works:</p>

          <ul>
            <li>90 days of real work, not a &ldquo;deliverable&rdquo;</li>
            <li>A tenanted instance the client actually owns</li>
            <li>Training that takes the team from zero to operating it without me</li>
            <li>An on-call period after launch so the thing doesn&apos;t die in week three</li>
          </ul>

          <p>Below $75K, I&apos;m not selling AI infrastructure. I&apos;m selling false hope.</p>

          <h2>The honest question</h2>

          <p>So what about everyone below the floor?</p>

          <p>The first answer most people expect is &ldquo;tough luck.&rdquo; It isn&apos;t.</p>

          <p>The second answer most people expect is &ldquo;I&apos;ll make an exception.&rdquo; I won&apos;t.</p>

          <p>
            The real answer is that we built four different things for four
            different scales, because pretending one product fits everyone is
            the whole problem with AI consulting right now.
          </p>

          <p>
            <strong>If you&apos;re a solo operator or small team</strong> —
            coach, consultant, creator, small business owner —{" "}
            <Link href="https://lorenzodc.com/catalyst" className="text-foreground underline hover:no-underline">
              Catalyst
            </Link>{" "}
            exists. $2,500 to $15,000. Productized builds: an automation, a
            portal, an agent. Ships in 2–4 weeks. Same standards. Smaller surface.
          </p>

          <p>
            <strong>If you&apos;re not sure where you are</strong> — that&apos;s the{" "}
            <Link href="https://lorenzodc.com/catalyst/diagnostic" className="text-foreground underline hover:no-underline">
              Diagnostic
            </Link>
            . $497 for a real conversation and a written plan. (New this month.
            I&apos;ll talk about it more in Letter #2.)
          </p>

          <p>
            <strong>If you&apos;re a nonprofit under $1M operating budget</strong>{" "}
            — Perpetual Core Studio at 50% off, $174.50/month. The same suite
            the institutional clients use. Just priced for your math.
          </p>

          <p>
            <strong>If you&apos;re building from inside an existing organization</strong>{" "}
            —{" "}
            <Link href="https://academy.theiha.org" className="text-foreground underline hover:no-underline">
              IHA Academy
            </Link>{" "}
            is where you go. Real training. Real cohorts. Real teachers. $99 to
            $2,500 depending on the track.
          </p>

          <p>
            None of these are &ldquo;lite versions&rdquo; of the $75K
            engagement. They&apos;re different products for different operating
            realities. Trying to flatten them into a single &ldquo;AI consulting&rdquo;
            service is what produces the paperweights.
          </p>

          <h2>Why I&apos;m telling you this in Letter #1</h2>

          <p>Because the AI advisory market right now is full of two failure modes:</p>

          <ol>
            <li>
              <strong>The vapor consultant</strong> — sells you &ldquo;strategy,&rdquo;
              delivers a 40-page PDF, vanishes.
            </li>
            <li>
              <strong>The free-strategy-call vendor</strong> — pretends to give
              you advice, actually runs a sales script.
            </li>
          </ol>

          <p>
            Both of them treat pricing as a marketing variable. Move it up,
            down, bundle it, unbundle it.
          </p>

          <p>
            We treat pricing as a <em>constraint on what we can promise</em>.
            If we can&apos;t ship the install in 90 days, we won&apos;t take
            the engagement at the price. If you can&apos;t get to $75K, we have
            something else that fits your reality without lying about what it
            can do.
          </p>

          <p>That&apos;s the operating principle. Everything else is downstream.</p>

          <h2>What you can do this week</h2>

          <p>If you&apos;ve been thinking about AI for your org and not sure where to start:</p>

          <p>
            →{" "}
            <Link href="https://lorenzodc.com/enterprise-diagnostic" className="text-foreground underline hover:no-underline">
              Take the free assessment
            </Link>
            . 5 minutes. You&apos;ll get a score and a generic roadmap.
            It&apos;s enough to know if you&apos;re at the &ldquo;yes, do this
            now&rdquo; stage or &ldquo;wait six months&rdquo; stage.
          </p>

          <p>
            →{" "}
            <Link href="https://lorenzodc.com/catalyst/diagnostic" className="text-foreground underline hover:no-underline">
              Book a Diagnostic Call
            </Link>
            . 60 minutes with me, $497, credited to anything you do next. For
            when the generic roadmap isn&apos;t enough.
          </p>

          <p>
            → Or just reply to this email and tell me what you&apos;re stuck
            on. I read all of these.
          </p>

          <p>Talk Tuesday.</p>

          <p>— Lorenzo</p>
        </div>
      </article>

      {/* Newsletter capture */}
      <section className="border-t border-border py-16 sm:py-20 bg-card/40">
        <div className="container mx-auto px-6 sm:px-8 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            The Install · A weekly letter from Lorenzo
          </p>
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-4">
            Field notes from inside the work.
          </h3>
          <p className="text-base text-muted-foreground leading-[1.7] mb-6">
            One letter a week. Operator-to-operator. No tactical AI tips, no
            promotional flotsam. Reply anytime — Lorenzo reads them.
          </p>
          <NewsletterCapture variant="inline" />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8 max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            If you&apos;re at the floor
          </p>
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-6">
            See how an engagement actually goes.
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/studio/engagements">
                Studio engagements <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
              <Link href="/blog">All notes</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
