/**
 * /products/vellum — Vellum by Perpetual Core, institutional memory
 * for organizations.
 *
 * Per COPY_PRODUCTS.md Card 4 + BRAND_ARCHITECTURE §8 pricing lock +
 * Session 3 brief Step 4.
 *
 * Hard rules enforced here:
 *   - "Vellum by Perpetual Core" — always qualified in body copy.
 *   - Pricing tiers (locked exactly):
 *       Free $0           — 1 user, 100 sources, basic synthesis
 *       Operator $49/mo   — 1 user, unlimited sources, voice + channels, 30-day retention
 *       Team $249/mo      — 5 users, all channels + integrations, 1-year retention
 *       Institution       — Contact us. 25+ users, SSO, custom retention, on-prem option.
 *   - 30% mission-driven discount call-out for verified 501(c)(3)s on
 *     Operator + Team. Negotiated on Institution.
 *   - 10% to IHA call-out in pricing footer (per §9 — base studio
 *     giving rate; Sage's 15% is the elevated personal-product rate).
 *   - 4–6 paragraph value prop section before pricing — institutional
 *     memory framing, not consumer note-taking. References the eight
 *     registries (Vellum operates on Knowledge per /engine §2).
 *   - Primary CTA "Start free" → /signup?product=vellum
 *   - Secondary CTA "Talk to us" → /contact?product=vellum
 *
 * Note on signup/contact routing: /signup and /contact may not exist
 * yet at the canonical paths — the studio's existing surfaces are
 * /auth/signup and /contact-sales. The brief specifies
 * /signup?product=vellum and /contact?product=vellum, so we honor the
 * brief and let those redirects/routes get added later. If they 404
 * on first ship, that's a known gap — flagged in SESSION_3_REPORT.
 */

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Layers,
  Mic,
  Search,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Vellum by Perpetual Core — institutional memory",
  description:
    "Institutional memory for organizations. Calls, docs, voice notes, and channels — one queryable mind. Free / $49 Operator / $249 Team / Institution Contact us. 30% mission-driven discount for verified 501(c)(3)s.",
};

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: null,
    body: "1 user, 100 sources, basic synthesis. The on-ramp — bring a small corpus, see if it thinks the way your team thinks before you pay anything.",
    cta: { label: "Start free", href: "/signup?product=vellum" },
    featured: false,
    discountEligible: false,
  },
  {
    name: "Operator",
    price: "$49",
    cadence: "/month",
    body: "1 user, unlimited sources, voice + channels (Telegram, web), 30-day retention. The single-operator tier — built for the founder, ED, or program lead who carries the org's memory in their head.",
    cta: { label: "Start free, upgrade later", href: "/signup?product=vellum" },
    featured: true,
    discountEligible: true,
  },
  {
    name: "Team",
    price: "$249",
    cadence: "/month",
    body: "5 users, all channels + integrations, 1-year retention. The small-team tier — for organizations that need shared memory across an executive team or program staff, not just one operator.",
    cta: { label: "Start free, upgrade later", href: "/signup?product=vellum" },
    featured: false,
    discountEligible: true,
  },
  {
    name: "Institution",
    price: "Contact us",
    cadence: null,
    body: "25+ users, SSO, custom retention, on-prem option. For institutions whose data can't leave their own infrastructure or whose compliance team needs every retention parameter on the table.",
    cta: { label: "Talk to us", href: "/contact?product=vellum" },
    featured: false,
    discountEligible: false,
  },
];

const FEATURE_PILLARS = [
  {
    icon: Layers,
    title: "Every source, one mind.",
    body: "Calls, board docs, Slack channels, voice memos, Google Drive, transcripts. Vellum reads them, indexes them, and answers across them — not from one of them.",
  },
  {
    icon: Search,
    title: "Synthesis, not search.",
    body: "Most knowledge tools surface a list of links. Vellum reads the full corpus and writes the answer with citations to the source documents. The answer is the deliverable.",
  },
  {
    icon: Mic,
    title: "Voice in. Voice out.",
    body: "Walk-and-talk briefings. Phone-call transcripts that flow back in as queryable memory. The voice channel isn't an afterthought — it's a first-class input and output.",
  },
  {
    icon: Lock,
    title: "Retention you control.",
    body: "30-day, 1-year, or custom retention windows depending on tier. Operator-grade memory without the audit risk of forever-storage. Per-source retention overrides on Institution.",
  },
];

export default function VellumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            Vellum by Perpetual Core.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            Institutional memory for{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              organizations
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            For executive directors, founders, and program directors whose calls, docs, voice notes, and Slack channels need to be one queryable mind — not seventeen disconnected sources.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            30% mission-driven discount on Operator and Team for verified 501(c)(3)s.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/signup?product=vellum">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/contact?product=vellum">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value-prop, 4-6 paragraphs, institutional memory framing */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Why Vellum exists.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-10">
            Most organizations lose more knowledge to attrition than to any other failure mode.
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              When an ED leaves, a program director rolls off, or a founder steps back from operations, the institution loses something it never wrote down. Vellum by Perpetual Core is the system that captures that working memory in real time — calls, voice notes, decisions, drafts, and channels — and renders it queryable as one mind, not seventeen disconnected sources.
            </p>
            <p>
              Vellum is not consumer note-taking dressed up in a pricing page. It is institutional memory: the layer that sits underneath an organization&apos;s operating cadence and answers questions that would otherwise require pulling someone off their work. &quot;What did we decide about the audit timeline in February?&quot; &quot;Who&apos;s the program officer at the Hilton Foundation we last spoke to in Q3?&quot; &quot;What did the board flag about pipeline risk that we said we&apos;d address by year-end?&quot;
            </p>
            <p>
              Inside the Perpetual Engine, Vellum operates on the Knowledge registry — one of the eight registries the studio installs in every engagement. The Engine&apos;s registries (identity, knowledge, decisions, work, communications, money, signal, and trust) are how an organization&apos;s state is structured. Vellum is the surface most teams encounter first because Knowledge is the registry where the ROI shows up fastest.
            </p>
            <p>
              The synthesis is the deliverable. Most knowledge tools — Glean, Notion AI, the long tail of internal-search products — return a list of links and let the user do the synthesis themselves. Vellum reads the corpus and writes the answer, with citations the team can verify. That is the difference between a search box and a system that thinks the way the institution thinks.
            </p>
            <p>
              Voice is a first-class input. Operators don&apos;t live in front of keyboards; they live in cars, hallways, and the four minutes between meetings. Vellum captures voice memos and call transcripts as queryable memory on the same indexing path as documents. The voice channel is not a feature; it is one of the three primary surfaces Vellum runs on.
            </p>
            <p>
              Pricing is anchored to the buyer, not to per-seat enterprise math. The single-operator tier exists because most organizational memory is carried by one or two people. The team tier exists because some organizations need shared memory across an executive team without paying for a hundred Glean seats they&apos;ll never use. The institution tier exists because some organizations need on-prem deployment, custom retention, and SSO before legal will let the system touch their data — and that conversation belongs in a contract, not on a pricing page.
            </p>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            What Vellum does.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Four surfaces — every one of them in production.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {FEATURE_PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="border-border/60">
                <CardContent className="p-7">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{p.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{p.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Pricing.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Free / $49 / $249 / Contact us.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            30% mission-driven discount on Operator and Team for verified 501(c)(3)s. Discount applied at checkout after verification. Negotiated on Institution.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`flex flex-col ${tier.featured ? "border-primary/60" : "border-border/60"}`}
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight">{tier.price}</span>
                    {tier.cadence && (
                      <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                    )}
                  </div>
                  {tier.discountEligible && (
                    <p className="text-xs text-primary mt-2 font-medium">
                      30% off for verified 501(c)(3)s
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {tier.body}
                </p>
                <Button
                  variant={tier.featured ? "default" : "outline"}
                  size="sm"
                  asChild
                  className="w-full"
                >
                  <Link href={tier.cta.href}>
                    {tier.cta.label} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing footer — IHA giving call-out */}
        <div className="max-w-3xl mt-12 p-6 rounded-lg border border-border/60 bg-muted/20">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">10% of every Vellum subscription funds the Institute for Human Advancement.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Per the studio commitment: 10–15% of every revenue dollar Perpetual Core earns funds workforce development through the Institute for Human Advancement. Vellum sits at the base 10% line — Sage, the personal product, sits at the elevated 15% rate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing — install vs subscribe */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Subscribe, or install.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Vellum is the surface most teams meet first.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            If your organization wants the full eight-registry Engine installed — not just the Knowledge surface — that is an engagement. Engagements start at $75,000. Vellum subscribers who outgrow the SaaS tier and want the rest of the Engine installed get an introduction to the studio engagement process; we don&apos;t double-charge for what you&apos;ve already paid for.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/signup?product=vellum">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/engagements">See engagements</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/engine">
                <BookOpenText className="mr-2 h-4 w-4" /> Read the Engine
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
