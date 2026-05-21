/**
 * /guide/ai-implementation-buyers-guide — the actual long-form lead magnet.
 *
 * Visitors arriving from /lead-magnet land here directly. Substantial enough
 * to stand on its own as SEO content + shareable. Article schema. Studio
 * register.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

const GUIDE_TITLE = "The AI Implementation Buyer's Guide";
const GUIDE_SUBTITLE =
  "What production AI actually costs, how to evaluate vendors, and when not to install AI at all. From the team installing it under PEPFAR rules and IRB review.";
const PUBLISHED = "2026-05-20";
const AUTHOR = "Lorenzo Daughtry-Chambers";

export const metadata = {
  title: `${GUIDE_TITLE} — Perpetual Core`,
  description:
    "Honest, vendor-agnostic guide to buying production AI implementation. The 4 cost buckets, outcome-eval framework, vendor evaluation rubric, sample contract terms, when not to install AI.",
  openGraph: {
    type: "article",
    title: GUIDE_TITLE,
    description: GUIDE_SUBTITLE,
    publishedTime: `${PUBLISHED}T00:00:00Z`,
    authors: [AUTHOR],
  },
};

function guideArticleSchema() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com")
    .replace(/\s+/g, "")
    .replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: GUIDE_TITLE,
    description: GUIDE_SUBTITLE,
    image: `${baseUrl}/og-image.png`,
    datePublished: `${PUBLISHED}T00:00:00Z`,
    dateModified: `${PUBLISHED}T00:00:00Z`,
    author: {
      "@type": "Person",
      name: AUTHOR,
      url: "https://lorenzodc.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Perpetual Core",
      logo: { "@type": "ImageObject", url: `${baseUrl}/og-image.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/guide/ai-implementation-buyers-guide`,
    },
  };
}

const TOC = [
  { id: "summary", label: "Executive summary" },
  { id: "cost-buckets", label: "1. The four cost buckets" },
  { id: "outcome-eval", label: "2. The outcome-eval framework" },
  { id: "vendor-rubric", label: "3. Vendor evaluation rubric" },
  { id: "contract-terms", label: "4. Sample contract terms" },
  { id: "when-not-to", label: "5. When not to install AI" },
  { id: "references", label: "6. References & further reading" },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          guideArticleSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide/ai-implementation-buyers-guide" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            Buyer's guide · {PUBLISHED} · Free to read, share, and quote
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.025em] text-foreground mb-6">
            {GUIDE_TITLE}
          </h1>
          <p className="text-xl text-muted-foreground leading-[1.5]">
            {GUIDE_SUBTITLE}
          </p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            By {AUTHOR}
          </p>
        </div>
      </section>

      {/* Table of contents */}
      <section className="border-y border-border bg-card/40 py-10">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
              Contents
            </p>
            <ol className="space-y-2">
              {TOC.map((item, idx) => (
                <li key={item.id} className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={`#${item.id}`}
                    className="text-sm sm:text-base text-foreground hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="container mx-auto px-6 sm:px-8 pt-16 pb-20">
        <div className="max-w-2xl mx-auto prose-content">
          <h2 id="summary">Executive summary</h2>
          <p>
            Production AI implementation at an organizational layer costs
            $75K–$250K in year one, regardless of who you hire. The variable
            is who pockets the margin: an SI consultancy, a freelance prompt
            engineer, an in-house team, or a focused studio like ours. The
            install fails not because of bad models or bad prompts — it fails
            because outcome evaluation gets skipped, and nobody can answer
            whether it worked.
          </p>
          <p>
            This guide walks operators through what to budget, what to demand
            from vendors, what to put in the contract, and — most usefully —
            when to walk away from an AI install entirely. It's vendor-agnostic;
            we wrote it because the conversations we have on our own first
            sales calls keep repeating the same evaluation gaps, and most of
            the time the right answer for the buyer is not "hire us."
          </p>

          <h2 id="cost-buckets">1. The four cost buckets</h2>
          <p>
            Every AI install has four cost buckets. Most quotes name two and
            hope you forget about the other two.
          </p>
          <h3>Bucket 1 — Vendor subscriptions</h3>
          <p>
            The obvious one. Model providers (OpenAI, Anthropic, Google),
            embedding/vector store, orchestration layer, downstream system
            seats (CRM, calendar, email). For a 25-person organization
            running production AI on real workflows, plan for{" "}
            <strong>$1,500–$3,500 per month</strong>, or $18K–$42K annualized.
            The teams that get to $200K subscription bills usually have an
            uncapped model + a chatty integration loop and didn't notice for
            three quarters.
          </p>
          <h3>Bucket 2 — Engineering time</h3>
          <p>
            The biggest hidden cost. A two-week prototype doesn't ship to
            production. Real installs take{" "}
            <strong>6–10 weeks for the first workflow</strong>, plus 2–4 weeks
            for each additional workflow. Budget $30K–$80K of internal senior
            engineering time (opportunity cost from other work), or $50K–$150K
            for an external team that already knows the failure modes. If
            you're being quoted "two weeks, $5K" by a freelance prompt
            engineer, that's a Loom demo, not an install.
          </p>
          <h3>Bucket 3 — Integration debt</h3>
          <p>
            Nobody quotes this. Your AI has to read from somewhere and write
            to somewhere — Gmail, Calendar, Slack, CRM, DMS, billing system,
            whatever. A meaningful install touches{" "}
            <strong>5–10 systems</strong>. Each integration is 1–3 days of
            engineering done right (with audit logging, retries, idempotency,
            error escalation). That's another <strong>$20K–$60K</strong> nobody
            put in the proposal.
          </p>
          <h3>Bucket 4 — Outcome eval + handoff</h3>
          <p>
            The most-skipped, most-load-bearing bucket. Measurement
            infrastructure, before/after windows, holdout groups, quarterly
            review cadence, written handoff for whoever inherits this in six
            months. <strong>$10K–$25K</strong> done right. $0 done wrong — and
            $0 is what most installs spend on it, which is why they get
            quietly turned off when a champion leaves.
          </p>
          <h3>Honest year-one total</h3>
          <p>
            Add it up: <strong>$75K–$250K</strong> to ship one meaningful AI
            install at a real organization, regardless of who you hire. The
            second workflow is cheaper because integration debt and
            outcome-eval scaffolding carry over. But the first one is between
            $75K and $250K of total ownership cost.
          </p>

          <h2 id="outcome-eval">2. The outcome-eval framework</h2>
          <p>
            If you remember nothing else from this guide, remember this. Before
            any code ships, write down the answers to these three questions
            and get them co-signed by the operator who will inherit this:
          </p>
          <ol>
            <li>
              <strong>What metric is this install supposed to move?</strong>{" "}
              Named, specific, measurable. "Improve productivity" doesn't
              count. "Reduce intake-form processing from 12 min to under 3 min
              per case" counts.
            </li>
            <li>
              <strong>What's the baseline, and how was it measured?</strong>{" "}
              A reading taken before the install, in the same measurement
              frame you'll use after. Not "we think it was about an hour." A
              logged sample with a known n.
            </li>
            <li>
              <strong>What's the recheck schedule and the decision rule?</strong>{" "}
              Measurement windows at 6, 12, and 24 weeks. A decision rule
              specifying at what number the install gets renewed, modified, or
              killed. Written down before code ships. Co-signed.
            </li>
          </ol>
          <p>
            That's it. Three things. Most installs skip them because the
            vendor doesn't want to be measured and the buyer doesn't want the
            answer. Defining outcome-eval is a self-imposed test that some
            vendors will fail; rather sign their refund clause now than write
            a $200K post-mortem in eight months.
          </p>

          <h2 id="vendor-rubric">3. Vendor evaluation rubric</h2>
          <p>
            Three asks that separate vendors who do this seriously from
            vendors who do it for a living.
          </p>
          <h3>Ask 1 — "Show me an outcome-eval scope you wrote for a comparable client."</h3>
          <p>
            Two-page written document. Operator named (or anonymized by
            sector). Metric, baseline methodology, recheck windows, decision
            rule. If they can't produce one — even redacted — they don't do
            it. Move on.
          </p>
          <h3>Ask 2 — "Define the metric you'd commit to moving for us, before we sign."</h3>
          <p>
            The vendor who names a specific number and risks being wrong is
            the vendor who does this work seriously. The vendor who pivots
            into "we'll see qualitative benefits" or "AI is a journey, not a
            destination" is selling motion, not outcomes.
          </p>
          <h3>Ask 3 — "What's your decision rule if the metric doesn't move?"</h3>
          <p>
            Trust the vendor who says: "We recommend killing the install and
            refund the maintenance retainer." Walk away from the vendor who
            says: "We'll iterate." Iteration without a kill rule is rent.
          </p>
          <h3>Three smells worth flagging</h3>
          <ul>
            <li>
              <strong>The vendor only sells one model.</strong> Production
              workflows need different models for different tasks. A
              single-model vendor will hammer every nail with the same hammer
              for as long as you keep paying.
            </li>
            <li>
              <strong>The vendor's proposal has no audit-log line.</strong>{" "}
              You can't measure what you don't log. Audit log is a Day-One
              feature, not a Phase-Three roadmap item.
            </li>
            <li>
              <strong>The vendor won't name a real client.</strong>{" "}
              Acceptable if your sector is sensitive (we don't name ours
              either). Not acceptable if the vendor is selling consumer AI
              into mid-market and still won't put a logo on the slide.
            </li>
          </ul>

          <h2 id="contract-terms">4. Sample contract terms</h2>
          <p>
            Eight clauses we'd put in any AI implementation contract — as
            buyer or seller. None of these are legal advice; show them to
            your counsel before signing anything.
          </p>
          <ol>
            <li>
              <strong>Metric-bound milestones.</strong> Payment schedule
              tied to outcome-eval reading checkpoints, not just delivery.
            </li>
            <li>
              <strong>Data ownership and portability.</strong> All
              embeddings, training datasets, audit logs, and configurations
              are owned by the buyer and exportable on 30 days' notice.
            </li>
            <li>
              <strong>No-train clause.</strong> Vendor cannot train models
              on buyer's data, period. Includes downstream model providers
              the vendor uses.
            </li>
            <li>
              <strong>Audit-log retention.</strong> Buyer-side audit log
              with 12-month minimum retention. Vendor cannot purge before
              that window.
            </li>
            <li>
              <strong>Kill clause.</strong> Buyer can terminate the
              engagement and the running install with 30 days' notice; vendor
              refunds prorated retainer.
            </li>
            <li>
              <strong>Off-boarding deliverable.</strong> Written
              documentation, training session, and credential handover when
              the engagement ends. Spelled out as a separate deliverable, not
              "best efforts."
            </li>
            <li>
              <strong>SLA tied to engagement risk profile.</strong>{" "}
              Healthcare/finance gets a stricter SLA than internal
              productivity. Specify uptime, response time, and escalation
              path explicitly.
            </li>
            <li>
              <strong>The Engine commitment line (if applicable).</strong>{" "}
              We line-item the 10–15% of revenue that flows to the Institute
              for Human Advancement on every invoice. If you're buying from a
              vendor that claims mission alignment, ask them to show it on
              the invoice.
            </li>
          </ol>

          <h2 id="when-not-to">5. When not to install AI</h2>
          <p>
            Four signals that the right answer is "not yet" or "not at all."
          </p>
          <ul>
            <li>
              <strong>The metric isn't broken.</strong> If the workflow
              already moves the number you care about, installing AI is a
              cost-add, not a value-add. Optimize what's broken first.
            </li>
            <li>
              <strong>The data is genuinely confidential.</strong> Not "we'd
              rather not share." Genuinely classified, regulated, or
              under-NDA. Some workflows shouldn't touch an external model
              regardless of the vendor's privacy claims. Use those workflows
              as the LAST AI target, not the first.
            </li>
            <li>
              <strong>The team is in a transition.</strong> A merger, an exec
              rotation, a layoff cycle. Installing operating-layer AI during
              org turbulence is how you get an abandoned install in nine
              months. Wait until the team is stable enough to inherit and
              own it.
            </li>
            <li>
              <strong>You can't name an operator who will own the result.</strong>{" "}
              "We'll figure it out post-install" is the most reliable
              predictor of an install that gets quietly turned off. Name the
              owner before signing the SOW.
            </li>
          </ul>
          <p>
            On any of these four, the honest move from your vendor is{" "}
            <em>defer or refer</em>. We do this constantly. We'd rather refer
            you to a vendor whose timing fits than sell you something
            you'll regret.
          </p>

          <h2 id="references">6. References &amp; further reading</h2>
          <p>From our own writing:</p>
          <ul>
            <li>
              <Link
                href="/blog/what-an-ai-install-actually-costs"
                className="text-foreground underline hover:no-underline"
              >
                What an AI install actually costs
              </Link>{" "}
              — expanded version of section 1, with comparison against
              freelancer and SI routes.
            </li>
            <li>
              <Link
                href="/blog/outcome-eval-the-line-item-every-ai-install-skips"
                className="text-foreground underline hover:no-underline"
              >
                Outcome-eval, the line item every AI install skips
              </Link>{" "}
              — expanded version of section 2 with the three vendor-asks
              checklist.
            </li>
            <li>
              <Link
                href="/products/atlas-discovery"
                className="text-foreground underline hover:no-underline"
              >
                Atlas Discovery
              </Link>{" "}
              — our productized two-week audit ($5K–$15K) that produces the
              outcome-eval scope as a deliverable.
            </li>
            <li>
              <Link
                href="/compare"
                className="text-foreground underline hover:no-underline"
              >
                How we compare to ChatGPT Teams and Claude for Teams
              </Link>{" "}
              — honest feature matrix.
            </li>
            <li>
              <Link
                href="/engine"
                className="text-foreground underline hover:no-underline"
              >
                The Perpetual Engine
              </Link>{" "}
              — the structural commitment that 10–15% of every revenue
              dollar funds the Institute for Human Advancement.
            </li>
          </ul>

          <p className="mt-12 border-t border-border pt-8 text-sm text-muted-foreground">
            This guide is free to read, share, and quote. If it saved you
            money or kept you from a bad install, the right return is to send
            it to the operator on your team who hasn't seen it yet.
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
              The next dispatch.
            </h3>
            <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
              Updates to this guide, new posts, what we're shipping. No spam.
            </p>
            <div className="max-w-xl mx-auto">
              <NewsletterCapture variant="inline" source="guide_buyers" />
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
              Use the guide to evaluate any vendor — us included.
            </h3>
            <p className="text-base text-muted-foreground leading-[1.7] mb-10">
              If you'd like a written outcome-eval scope for your install,
              start with Atlas Discovery. Two weeks, $5K–$15K, deliverable is
              a co-signed scope your CFO can sign off on.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <Link href="/products/atlas-discovery">
                  Atlas Discovery <ArrowRight className="ml-2 h-3.5 w-3.5" />
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
