/**
 * /pricing — commercial architecture for the Perpetual Engine.
 *
 * Pricing is intentionally split by buyer intent:
 *   1. Product surfaces — paid products and pilots.
 *   2. Managed lanes — recurring operating functions.
 *   3. Studio installs — scoped custom builds and Engine installs.
 */

import Link from "next/link";
import { ArrowRight, Check, Layers, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/seo/structured-data";

const PRICING_FAQ = [
  {
    question: "Why did the old $49 and $99 plans move off the main page?",
    answer:
      "Those prices make sense for a narrow personal tool or beta subscription. They do not describe the value of Sentinel, Sage, Atlas, RFP, Vellum, Atelier, Janice, or a custom AI operating system install. The main pricing page now reflects the full commercial architecture.",
  },
  {
    question: "Can a smaller company still work with Perpetual Core?",
    answer:
      "Yes. Smaller companies usually begin with a paid diagnostic, a product pilot, or a managed lane around one revenue-critical workflow. The first engagement should be narrow enough to approve, but serious enough to create operating leverage.",
  },
  {
    question: "What should a larger company or portfolio operator buy first?",
    answer:
      "Start with an AI OS Map or Atlas Discovery if the operating problem is unclear. Start with a managed lane when the workflow is already obvious: diligence, capture, knowledge, people operations, or executive operations. Move to an Engine Install when multiple departments need shared memory, workflows, agents, and governance.",
  },
  {
    question: "How is this different from buying ChatGPT, Claude, HubSpot, or Zapier?",
    answer:
      "Those are tools. Perpetual Core installs and operates systems: persistent memory, workflow registries, agent skills, governance, and the human operating rhythm around them. Many clients will still keep the tools they already use; the Engine makes them coherent.",
  },
  {
    question: "Do you publish exact enterprise pricing?",
    answer:
      "We publish ranges so buyers know the order of magnitude before a call. Exact pricing depends on the number of workflows, systems, data sources, people, compliance requirements, and whether we are advising, operating, or building.",
  },
  {
    question: "Do you offer mission-driven discounts?",
    answer:
      "Yes. Verified mission-driven organizations can receive discounted product access or phased implementation scopes. The discount should protect access without underpricing the operating work.",
  },
];

const ENTRY_PATHS = [
  {
    name: "Product surfaces",
    price: "$149-$2.5K/mo",
    icon: Layers,
    body: "For individuals, teams, and departments adopting one product surface: Sage, Vellum, Atelier, Janice, Sentinel, or RFP.",
    points: ["Fastest start", "Product-led pilot", "Can expand into a lane"],
    href: "#products",
  },
  {
    name: "Managed lanes",
    price: "$5K-$35K/mo",
    icon: Workflow,
    body: "For buyers who want us to operate a named function with them: diligence, capture, knowledge, people, or executive operations.",
    points: ["Monthly operating rhythm", "Defined output", "Credits toward install"],
    href: "#lanes",
    featured: true,
  },
  {
    name: "Studio installs",
    price: "$30K-$500K+",
    icon: ShieldCheck,
    body: "For companies, funds, and institutions installing the Perpetual Engine across departments, workflows, and governance layers.",
    points: ["Scoped build", "Production workflows", "Training and handoff"],
    href: "#installs",
  },
];

const PRODUCT_PRICES = [
  {
    name: "Sage",
    price: "From $149/mo",
    buyer: "Founder, operator, thought leader",
    body: "Personal AI OS with voice, memory, calendar, writing, coaching, and operating support.",
  },
  {
    name: "Vellum",
    price: "From $299/mo",
    buyer: "Teams with institutional knowledge",
    body: "Queryable organizational memory across documents, calls, voice notes, transcripts, and channels.",
  },
  {
    name: "Atelier",
    price: "From $1.5K/mo",
    buyer: "Teams running flows and agents",
    body: "Shared workspace for projects, flows, approvals, client work, and agent-augmented execution.",
  },
  {
    name: "Sentinel",
    price: "From $750/vet",
    buyer: "Diligence-heavy teams",
    body: "Subject, company, and deal intelligence with clear deliverables and escalation paths.",
  },
  {
    name: "RFP Engine + Sentry",
    price: "From $499/mo",
    buyer: "Capture and grant teams",
    body: "Opportunity monitoring, fit scoring, compliance flags, and first-draft support.",
  },
  {
    name: "Janice",
    price: "From $499/mo",
    buyer: "People-heavy organizations",
    body: "Hiring, onboarding, document collection, lifecycle tracking, and staff/intern operations.",
  },
  {
    name: "Atlas Discovery",
    price: "From $25K",
    buyer: "Funds and portcos",
    body: "A 2-3 week operating audit that maps where an AI-native COO layer should be installed first.",
  },
  {
    name: "Custom product build",
    price: "From $30K",
    buyer: "A business with a repeatable pain",
    body: "A narrow productized workflow or internal tool built from the Engine pattern.",
  },
];

const MANAGED_LANES = [
  {
    name: "Diligence Lane",
    product: "Sentinel",
    price: "$5K-$20K/mo",
    body: "Recurring vets, company scans, deal screens, and investigation support. No unlimited-vets promise; scope defines volume and SLA.",
  },
  {
    name: "Capture Lane",
    product: "RFP Engine + Sentry",
    price: "$7.5K-$35K/mo",
    body: "RFP discovery, fit scoring, bid/no-bid judgment, drafting support, compliance review, and submission rhythm.",
    featured: true,
  },
  {
    name: "Knowledge Lane",
    product: "Vellum",
    price: "$10K-$30K/mo",
    body: "Institutional memory ingestion, source governance, answer quality reviews, and recurring team enablement.",
  },
  {
    name: "People Lane",
    product: "Janice",
    price: "$7.5K-$25K/mo",
    body: "Candidate, staff, intern, partner, or client lifecycle operations with intake, documents, follow-up, and reporting.",
  },
  {
    name: "Operator Lane",
    product: "Atelier + Sage",
    price: "$10K-$35K/mo",
    body: "Monthly executive operating support, workflow tuning, skills builds, dashboard review, and AI adoption governance.",
  },
];

const INSTALLS = [
  {
    name: "AI OS Map",
    price: "$7.5K-$15K",
    duration: "1-2 weeks",
    body: "A paid diagnostic for smaller teams or relationship-led prospects. Identifies the first workflow, economics, and implementation path.",
  },
  {
    name: "Studio Sprint",
    price: "$30K-$75K",
    duration: "4-8 weeks",
    body: "One high-value workflow shipped into production: intake, reporting, capture, diligence, onboarding, or knowledge operations.",
    featured: true,
  },
  {
    name: "Department OS",
    price: "$75K-$150K",
    duration: "8-14 weeks",
    body: "A department-level AI operating system with memory, workflows, skills, dashboards, training, and handoff.",
  },
  {
    name: "Engine Install",
    price: "$150K-$500K+",
    duration: "90-180 days",
    body: "Multi-department or portfolio implementation of the Perpetual Engine, including governance, training, and post-launch support.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema(PRICING_FAQ)} />
      <PageViewTracker />
      <Navbar />

      <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="block h-1.5 w-1.5 bg-primary" />
            <p className="eyebrow !text-foreground/70">Commercial architecture · Products · Lanes · Installs</p>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] leading-[0.98] text-foreground mb-8 max-w-5xl">
            Price the Engine by operating responsibility.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.6] mb-10 max-w-3xl">
            Perpetual Core is not a cheap AI seat. It is a product ecosystem and venture studio
            attached to the Perpetual Engine. Start with a product, hire a managed lane, or install
            the operating system.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-primary text-primary-foreground hover:bg-primary/90 rounded-[6px]">
              <Link href="/contact-sales?intent=ai-os-map">Map the first workflow <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="#products" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Compare entry points <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
            <Link href="/packages" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See starter packages <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {ENTRY_PATHS.map((path) => {
              const Icon = path.icon;
              return (
                <Link
                  key={path.name}
                  href={path.href}
                  className={`group border border-border bg-card p-6 sm:p-7 transition-colors hover:border-primary/50 hover:bg-surface-hover ${
                    path.featured ? "border-primary/40 bg-primary/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-6 mb-8">
                    <Icon className="h-5 w-5 text-primary" />
                    {path.featured && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                        Most common
                      </span>
                    )}
                  </div>
                  <h2 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                    {path.name}
                  </h2>
                  <p className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-foreground mb-5">
                    {path.price}
                  </p>
                  <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
                    {path.body}
                  </p>
                  <ul className="space-y-2">
                    {path.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-foreground/45 mt-1 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="products" className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Products" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Products are the on-ramp, not the ceiling.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                These prices are for focused product access or product-led pilots. When the product
                becomes operationally important, move it into a managed lane or studio install.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_PRICES.map((product, index) => (
              <div
                key={product.name}
                className="border border-border bg-card p-6 sm:p-7 flex flex-col"
              >
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-8">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {product.name}
                </h4>
                <p className="text-2xl font-semibold tracking-[-0.025em] text-foreground mb-2">
                  {product.price}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                  {product.buyer}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] flex-1">
                  {product.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lanes" className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Managed lanes" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Retainers should buy an operating lane, not a bundle of hours.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                This is the best fit for companies like regional furniture, healthcare, nonprofit,
                education, construction, services, and professional firms that need one function to
                get smarter every month.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="space-y-4">
              {MANAGED_LANES.map((lane, index) => (
                <Link
                  key={lane.name}
                  href={`/contact-sales?lane=${encodeURIComponent(lane.name.toLowerCase())}`}
                  className={`group grid gap-5 border border-border bg-card p-6 sm:p-7 md:grid-cols-[56px_1fr_180px] hover:border-primary/50 hover:bg-background transition-colors ${
                    lane.featured ? "border-primary/40 bg-primary/[0.04]" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold tracking-[-0.015em] text-foreground group-hover:text-primary transition-colors">
                        {lane.name}
                      </h4>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {lane.product}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-[1.65] max-w-2xl">
                      {lane.body}
                    </p>
                  </div>
                  <p className="font-mono text-sm sm:text-base font-semibold text-foreground md:text-right">
                    {lane.price}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="installs" className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Studio installs" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Custom builds should be priced like operating leverage.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                The first scope can be small, but the buyer should understand the path: diagnostic,
                sprint, department OS, then full Engine install when the value is proven.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INSTALLS.map((install, index) => (
              <div
                key={install.name}
                className={`border border-border bg-card p-6 sm:p-7 flex flex-col ${
                  install.featured ? "border-primary/40 bg-primary/[0.04]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-8">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {install.featured && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Best first paid build
                    </span>
                  )}
                </div>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {install.name}
                </h4>
                <p className="text-3xl font-semibold tracking-[-0.025em] text-foreground mb-2">
                  {install.price}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                  {install.duration}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] flex-1 mb-6">
                  {install.body}
                </p>
                <Link
                  href="/contact-sales?intent=studio-install"
                  className="inline-flex items-center text-xs font-medium text-foreground hover:text-primary transition-colors"
                >
                  Scope this <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Recommendation" />
            <div className="max-w-3xl border-l-2 border-primary/50 pl-6">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                For Empire-sized prospects, sell the AI operating partner. For smaller companies,
                sell the first operating lane.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-8">
                Do not lead with a $49 subscription. Lead with the business problem: missed leads,
                slow quoting, scattered product data, customer follow-up, delivery coordination,
                hiring, reporting, and executive visibility. The first scope can be modest, but the
                frame should be whole-system improvement.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales?intent=operating-partner">
                    Start an operating partner conversation <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                  <Link href="/packages">
                    See starter packages
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Common questions" />
            <div className="max-w-3xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-12">
                Pricing, in plain English.
              </h3>
              <dl className="divide-y divide-border border-y border-border">
                {PRICING_FAQ.map((item) => (
                  <details key={item.question} className="group py-6">
                    <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                      <dt className="text-base sm:text-lg font-medium text-foreground leading-snug">
                        {item.question}
                      </dt>
                      <span
                        className="font-mono text-xs text-muted-foreground mt-1 transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <dd className="mt-4 text-sm sm:text-base text-muted-foreground leading-[1.7]">
                      {item.answer}
                    </dd>
                  </details>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
