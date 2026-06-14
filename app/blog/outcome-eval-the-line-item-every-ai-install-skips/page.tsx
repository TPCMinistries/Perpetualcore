/**
 * Second post — extends "What an AI install actually costs" by going
 * deeper on bucket #4 (outcome eval). Studio register.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

const POST_TITLE = "Outcome-eval, the line item every AI install skips";
const POST_SUBTITLE =
  "Without it, you don't have an install — you have a demo that ran once.";
const POST_DATE = "2026-05-20";
const POST_AUTHOR = "Lorenzo Daughtry-Chambers";
const READ_MINUTES = 5;

export const metadata = {
  title: `${POST_TITLE} — Notes from Perpetual Core`,
  description:
    "Why outcome evaluation — measurement infrastructure, holdout windows, and quarterly review — is the most-skipped and most-load-bearing line item in any production AI engagement.",
  openGraph: {
    type: "article",
    title: POST_TITLE,
    description:
      "The most-skipped line item in AI implementation, and the one that determines whether the install actually survives.",
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
      "Why outcome evaluation is the line item every AI install skips, and what to ship instead.",
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
      "@id": `${baseUrl}/blog/outcome-eval-the-line-item-every-ai-install-skips`,
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
            {
              name: POST_TITLE,
              path: "/blog/outcome-eval-the-line-item-every-ai-install-skips",
            },
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
              · {POST_DATE} · {READ_MINUTES} min read
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
          <p>
            Most AI installs we get called in to rescue have the same problem.
            Not bad models. Not bad prompts. Not a broken integration. The
            problem is nobody can answer the question{" "}
            <em>did this work</em>.
          </p>

          <p>
            The vendor demo showed it working. The internal champion swears
            it's saving time. The CFO doesn't know whether to keep paying for
            it. Six months in, an exec rotation happens and the new person
            quietly turns it off because they can't tell what would break.
          </p>

          <p>
            That's not an AI failure. That's an outcome-eval failure. And
            outcome-eval is the single most-skipped line item in every
            production AI engagement.
          </p>

          <h2>What outcome-eval actually is</h2>

          <p>
            Outcome-eval is the scaffolding that lets a future operator answer
            three questions:
          </p>

          <ul>
            <li>
              <strong>What metric was this install supposed to move?</strong>{" "}
              Named, specific, measurable. "Improve productivity" doesn't
              count. "Reduce intake-form processing time from 12 minutes to
              under 3 minutes per case" counts.
            </li>
            <li>
              <strong>What's the before number, and how was it measured?</strong>{" "}
              A baseline reading, taken before the install, in the same
              measurement frame you'll use after. Not "we think it was about
              an hour." A logged sample.
            </li>
            <li>
              <strong>What's the after number, and when do we recheck?</strong>{" "}
              A measurement window (typically 6, 12, and 24 weeks
              post-install), with a holdout if the workflow allows it. A
              decision rule for when the install gets renewed, modified, or
              killed.
            </li>
          </ul>

          <p>
            That's it. Three things. None of them require ML, dashboards, or a
            BI consultant. They require somebody to write them down before any
            code ships.
          </p>

          <h2>Why everyone skips it</h2>

          <p>
            Three reasons. They're all rational.
          </p>

          <h3>The vendor doesn't want to be measured</h3>

          <p>
            If you're a vendor selling a $200K AI install, defining outcome-eval
            up front is a self-imposed test you might fail. Vendors who do this
            well are rare; vendors who hand-wave through it are common.
            Operators have learned to take vendor demos at face value because
            the alternative is a 9-month measurement plan and a contract clawback
            clause nobody wants to negotiate.
          </p>

          <h3>The buyer doesn't want the answer</h3>

          <p>
            Half-honest reason. If the AI install moved the metric, great. If
            it didn't, the buyer signed off on a $200K decision that didn't
            work — and now has to explain it. Easier to leave the install
            running, claim qualitative wins, and move on.
          </p>

          <h3>The metric is hard to define</h3>

          <p>
            Sometimes legitimately. "How much better is our customer support
            now" is a real measurement challenge. But often it's a
            convenient hard. The team that can't define the metric usually
            can define{" "}
            <em>which workflows the AI touches</em>{" "}
            and{" "}
            <em>what the operator would have done without it</em>{" "}
            — and those two things are enough to construct a measurement frame.
          </p>

          <h2>What we ship in every engagement</h2>

          <p>
            On every engagement we sell, before any code ships, we write
            something we call the <strong>outcome-eval scope</strong>. It's a
            two-page document. It covers:
          </p>

          <ul>
            <li>
              The metric (or metrics — usually 1 primary, 2 secondary), with
              the operational definition spelled out.
            </li>
            <li>
              The baseline reading methodology and a target sample size.
            </li>
            <li>
              The measurement windows (we default to 6 / 12 / 24 weeks).
            </li>
            <li>
              The decision rule. Specifically: at what number do we
              renew / modify / kill the install? Written down. Co-signed.
            </li>
            <li>
              The handoff package. Who owns this measurement after we leave?
              What do they read at the start of week one to be effective at
              week two?
            </li>
          </ul>

          <p>
            We charge for this work — it's bucket #4 from the{" "}
            <Link
              href="/blog/what-an-ai-install-actually-costs"
              className="text-foreground underline hover:no-underline"
            >
              cost breakdown post
            </Link>{" "}
            — and it's the most-questioned line in our proposals. ("Why are
            we paying $15K to define what success means?") The answer is
            always the same: because skipping this line item is what kills
            the install three quarters from now, and the only way to make
            it un-skippable is to bill for it.
          </p>

          <h2>How to demand this from any vendor</h2>

          <p>
            If you're evaluating an AI vendor — us included — make
            outcome-eval part of the bid. Three asks:
          </p>

          <ul>
            <li>
              "Show me an outcome-eval scope you wrote for a comparable
              client." If they don't have one, they don't do it.
            </li>
            <li>
              "Define the metric you'd move for us, before we sign." The
              vendor that names a specific number — and risks being wrong —
              is the vendor that does this seriously.
            </li>
            <li>
              "What's your decision rule if the metric doesn't move?" Trust
              the vendor that says "we recommend killing it and refund the
              maintenance retainer." Walk away from the one that pivots into
              "but you'll see qualitative benefits."
            </li>
          </ul>

          <h2>The honest pitch</h2>

          <p>
            If you're sitting on an AI install that's been running for six
            months and you can't answer whether it's working, you don't have
            a bad install. You have a missing outcome-eval. That's fixable
            without ripping anything out — we sell a two-week retrofit for
            existing installs that builds the measurement scaffolding around
            what you already have.
          </p>

          <p>
            And if you're evaluating a new install,{" "}
            <Link
              href="/products/atlas-discovery"
              className="text-foreground underline hover:no-underline"
            >
              start with discovery
            </Link>{" "}
            before you sign anything. The deliverable is the outcome-eval
            scope your CFO can co-sign. $5K–$15K, two weeks, written.
          </p>

          <p>
            Build the measurement. Then build the install. Not the other way
            around.
          </p>
        </div>
      </article>

      {/* Newsletter inline */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Notes from the operating layer
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] mb-4">
              Get the next dispatch.
            </h3>
            <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
              Occasional. Honest. Unsubscribe any time.
            </p>
            <div className="max-w-xl mx-auto">
              <NewsletterCapture variant="inline" source="blog_post_outcome_eval" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
              Want this written for your install?
            </h3>
            <p className="text-base text-muted-foreground leading-[1.7] mb-10">
              Atlas Discovery is two weeks, $5K–$15K, and the deliverable is
              an outcome-eval scope your CFO can co-sign.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <Link href="/products/atlas-discovery">
                  Read about Discovery <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                <Link href="/contact-sales?plan=exploring">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
