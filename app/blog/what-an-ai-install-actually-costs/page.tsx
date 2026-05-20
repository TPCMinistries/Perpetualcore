/**
 * First real /blog post — sets the cadence and gives Google a real
 * long-form article to index. Replace with MDX backend later; for
 * now, static React component is enough.
 *
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

const POST_TITLE = "What an AI install actually costs";
const POST_SUBTITLE = "And why we price engagements at $75,000";
const POST_DATE = "2026-05-20";
const POST_AUTHOR = "Lorenzo Daughtry-Chambers";
const READ_MINUTES = 6;

export const metadata = {
  title: `${POST_TITLE} — Notes from Perpetual Core`,
  description:
    "An honest breakdown of what production AI implementation costs — vendor subscriptions, engineering time, integration debt, the part nobody quotes. Why our engagements start at $75,000.",
  openGraph: {
    type: "article",
    title: POST_TITLE,
    description:
      "What production AI implementation actually costs, including the parts nobody quotes.",
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
      "An honest breakdown of what production AI implementation costs.",
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
      "@id": `${baseUrl}/blog/what-an-ai-install-actually-costs`,
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
            { name: POST_TITLE, path: "/blog/what-an-ai-install-actually-costs" },
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
            The most common question I get on a first sales call isn't{" "}
            <em>what does it do</em>. It's <em>what does it actually cost</em>.
            Operators have been quoted $5,000 by a freelance prompt engineer,
            $50,000 by a Big Four consultancy, and $500,000 by a system
            integrator — for what looks like the same Statement of Work. They
            want to know what's real.
          </p>

          <p>
            Here's an honest breakdown. I'm going to ignore the prompt-engineer
            quote (that's a Loom video, not an install) and the system-integrator
            quote (that's procurement theater). The interesting band is the
            middle — what production AI implementation actually costs for a
            real operator at a real organization.
          </p>

          <h2>The four real cost buckets</h2>

          <p>
            Every AI install has four cost buckets. Most quotes name two and
            hope you forget about the other two.
          </p>

          <h3>1. Vendor subscriptions</h3>

          <p>
            The obvious one. OpenAI, Anthropic, a vector database, an
            orchestration layer, a CRM that the AI writes to. For a 25-person
            organization running production AI on real workflows, this is
            usually $1,500–$3,500 per month, depending on usage. Annualized:
            $18K–$42K a year. Most teams forget that they need a model{" "}
            <em>and</em> a model gateway <em>and</em> a vector store{" "}
            <em>and</em> a way to log what happened, and they're back at the
            Big Four's $200K number because nobody told them the stack has four
            line items.
          </p>

          <h3>2. Engineering time</h3>

          <p>
            The biggest hidden cost. A "two-week prototype" doesn't ship to
            production. It gets killed when the founder sees the error rate,
            or it limps along forever and nobody trusts it. Real production
            installs take 6–10 weeks for the first workflow, plus another 2–4
            weeks each for additional ones. If you have a senior engineer on
            staff who can do it, that's $30K–$80K of their time you redirected
            from something else. If you don't, that's $50K–$150K to bring in
            an external team that knows the failure modes.
          </p>

          <h3>3. Integration debt</h3>

          <p>
            Nobody quotes this one. Your AI has to read from somewhere and
            write to somewhere — that means Gmail, Calendar, Slack, your CRM,
            your DMS, your billing system, whatever. Each integration has its
            own auth, rate limit, edge cases, and "we changed our API in a
            quiet email last Tuesday" moments. A meaningful install touches
            5–10 systems. Each one is 1–3 days of work to do right (with audit
            logging, retries, idempotency, the works). Cumulatively: another
            $20K–$60K nobody put in the quote.
          </p>

          <h3>4. Outcome eval + handoff</h3>

          <p>
            This is the cost most installs skip — and it's why most installs
            fail. You need a way to know whether the AI is actually moving the
            metric you wanted moved. That's measurement infrastructure (event
            tracking, before/after windows, holdout groups), it's a quarterly
            review cadence, and it's a handoff package so the operator who
            inherits this in six months understands what was decided and why.
            Done right: $10K–$25K. Done wrong: $0 — and the install gets
            quietly replaced when someone new joins the team.
          </p>

          <h2>The honest total</h2>

          <p>
            Add it up: $75K–$250K to ship one meaningful AI install to
            production at a real organization, the first time. The next install
            is cheaper because the integration debt and outcome-eval scaffolding
            carries over. But the first one — the one that proves AI works in
            your operations — is between $75K and $250K of total ownership cost
            in year one.
          </p>

          <p>
            That's where our pricing comes from. Our engagement bands are{" "}
            <Link href="/studio/engagements" className="text-foreground underline hover:no-underline">
              $75K, $150K, and $250K
            </Link>
            . Not because the labor costs us $75K — it doesn't — but because
            that's the floor at which we can ship the four buckets above and
            have anything left to fund the Institute (
            <Link href="/engine" className="text-foreground underline hover:no-underline">
              10% of every engagement
            </Link>
            ).
          </p>

          <h2>What about the $99/month plan?</h2>

          <p>
            Real question, separate answer. Our{" "}
            <Link href="/pricing" className="text-foreground underline hover:no-underline">
              Pro tier at $99/month
            </Link>{" "}
            handles bucket #1 (vendor subscriptions) and gives you a
            ready-to-use interface for the workflows that don't need custom
            integration. It's the right product if you're a solo operator or
            small team and your workflows are mostly chat + RAG + scheduling.
            It is <em>not</em> a substitute for an engagement. Operators who
            try to scale Pro into an organizational layer run into the
            integration-debt wall by week four.
          </p>

          <h2>The freelancer-and-prompt-engineer route</h2>

          <p>
            Worth naming directly: a $5K freelancer can write good prompts and
            hand you a working notebook. That's real value if your workflow is
            simple and you only need it to work for one person. The freelancer
            doesn't handle bucket #3 (integration debt) or bucket #4 (outcome
            eval). Operators come to us when the freelancer's notebook can't
            scale past one user, or when it breaks the first time a system on
            the integration path changes.
          </p>

          <h2>The Big-Four-and-SI route</h2>

          <p>
            Worth naming too: a $200K–$500K SI engagement gets you a polished
            deck, a project manager, three offshore engineers, and a 9-month
            timeline. You might get to production — but you'll pay for the
            theater. Operators come to us when they've watched the SI
            engagement burn $300K and ship nothing they can demo at the next
            board meeting.
          </p>

          <h2>How to spend less than $75K</h2>

          <p>
            Honestly: don't hire anyone yet. Run a discovery first. We sell{" "}
            <Link href="/products/atlas-discovery" className="text-foreground underline hover:no-underline">
              Atlas Discovery
            </Link>{" "}
            at $5K–$15K — two weeks, no PowerPoint, written deliverable: which
            workflows would actually move your metric, ranked by leverage,
            with an outcome-eval scope and a contract framework your CFO can
            sign. If the discovery says "you don't need an engagement," we'll
            tell you that. We'd rather refer you out than sell you something
            you don't need.
          </p>

          <h2>The bottom line</h2>

          <p>
            Production AI at an organizational layer costs $75K–$250K in year
            one, regardless of who you hire. The variable is who pockets the
            margin: us, an SI, a freelancer, or your existing team's time.
            Pick the route that matches how you want to spend the next 90 days.
          </p>

          <p>
            <Link href="/contact-sales?plan=exploring" className="text-foreground underline hover:no-underline">
              Talk to us
            </Link>{" "}
            if you want a numbers-backed proposal. Or just{" "}
            <Link href="/blog" className="text-foreground underline hover:no-underline">
              subscribe
            </Link>{" "}
            and read the next dispatch when it lands.
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
              <NewsletterCapture variant="inline" source="blog_post_what_install_costs" />
            </div>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
              Want it priced for your operation?
            </h3>
            <p className="text-base text-muted-foreground leading-[1.7] mb-10">
              Two-week Atlas Discovery from $5K, or full engagement from $75K.
              Either way, we start with a real conversation — not a deck.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <Link href="/contact-sales?plan=exploring">
                  Talk to sales <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                <Link href="/products/atlas-discovery">Read about Discovery</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
