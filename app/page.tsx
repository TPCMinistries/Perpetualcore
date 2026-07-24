import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  Clapperboard,
  Network,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkipLink } from "@/components/ui/accessibility";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ContentSlot } from "@/components/slots/ContentSlot";
import { LivingCompanyCanvas } from "@/components/landing/v3/LivingCompanyCanvas";
import { ProductPreview } from "@/components/landing/v3/ProductPreview";
import {
  MARKETPLACE_ITEMS,
  MARKETPLACE_STATUS_LABELS,
  type MarketplaceItem,
} from "@/lib/marketplace/catalog";

export const metadata = {
  title: "Perpetual Core — AI systems that work as one company",
  description:
    "Specialized AI products for opportunity, operations, people, knowledge, and media—connected through Sage as your company grows.",
};

const OUTCOMES = [
  {
    label: "Win work",
    body: "Find opportunities, make bid decisions, and manage proposals.",
    icon: Sparkles,
    href: "/marketplace#find-win",
    color: "#3276e8",
  },
  {
    label: "Run operations",
    body: "Coordinate priorities, handoffs, recurring work, and follow-through.",
    icon: BriefcaseBusiness,
    href: "/marketplace#run-coordinate",
    color: "#ff6b4a",
  },
  {
    label: "Know and decide",
    body: "Investigate, preserve knowledge, and make evidence-backed decisions.",
    icon: SearchCheck,
    href: "/marketplace#know-decide",
    color: "#6b52d9",
  },
  {
    label: "Develop people",
    body: "Run hiring, onboarding, coaching, and workforce journeys.",
    icon: UsersRound,
    href: "/marketplace#hire-develop",
    color: "#168a72",
  },
  {
    label: "Create media",
    body: "Turn long-form ideas into governed media workflows.",
    icon: Clapperboard,
    href: "/marketplace#create-distribute",
    color: "#e04d7f",
  },
] as const;

const FEATURED_SLUGS = [
  "sage",
  "rfp-engine",
  "sentinel",
  "janice",
  "atelier",
  "press",
] as const;

const FEATURED_PRODUCTS = FEATURED_SLUGS.map((slug) =>
  MARKETPLACE_ITEMS.find((item) => item.slug === slug)
).filter((item): item is MarketplaceItem => Boolean(item));

const CARD_LAYOUTS: Record<string, string> = {
  sage: "lg:col-span-7 lg:row-span-2",
  "rfp-engine": "lg:col-span-5",
  sentinel: "lg:col-span-5",
  janice: "lg:col-span-4",
  atelier: "lg:col-span-4",
  press: "lg:col-span-4",
};

const START_PATHS = [
  {
    label: "01",
    title: "Use a product",
    body: "The job is clear and a live product already fits.",
    cta: "Browse live products",
    href: "/marketplace",
  },
  {
    label: "02",
    title: "Request access",
    body: "The system is private, in pilot, or available by invitation.",
    cta: "See current availability",
    href: "/marketplace",
  },
  {
    label: "03",
    title: "Install a company system",
    body: "The workflow crosses tools, teams, or departments.",
    cta: "Map the workflow",
    href: "/contact-sales",
  },
] as const;

function ProductLink({
  product,
  children,
  className,
}: {
  product: MarketplaceItem;
  children: React.ReactNode;
  className: string;
}) {
  if (product.external) {
    return (
      <a
        href={product.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={product.href} className={className}>
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="pc-v3 public-light min-h-screen bg-[#f7f6f2] text-[#17171b]">
      <PageViewTracker />
      <SkipLink />
      <Navbar />
      <ContentSlot slotKey="pc-home-banner" />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-black/8">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(115,96,255,0.16),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(76,205,178,0.17),transparent_28%),linear-gradient(180deg,#fbfaf7_0%,#f4f1fb_100%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:min-h-[720px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14">
            <div className="max-w-[610px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5548d9]/16 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#4f46c8] shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#5548d9]" aria-hidden="true" />
                AI systems for real operating work
              </div>

              <h1 className="mt-7 text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#151519] sm:text-[62px] lg:text-[70px]">
                Start with one.
                <span className="block text-[#5548d9]">Connect the company.</span>
              </h1>

              <p className="mt-7 max-w-[590px] text-[18px] leading-8 text-[#565661] sm:text-[20px]">
                Perpetual Core builds specialized AI products for opportunity,
                operations, people, knowledge, and media. Use one now—or connect
                them through Sage as your company grows.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-h-12 rounded-full bg-[#17171b] px-6 text-base text-white shadow-[0_14px_32px_rgba(23,23,27,0.16)] hover:bg-[#34343c]"
                >
                  <Link href="/marketplace">
                    Browse products <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-full border-black/14 bg-white/70 px-6 text-base text-[#222228] hover:bg-white"
                >
                  <Link href="/contact-sales">Map a workflow</Link>
                </Button>
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-black/8 bg-white/55 p-4 text-sm leading-6 text-[#61616b] backdrop-blur">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#168a72]" aria-hidden="true" />
                <p>
                  Sage coordinates approved context. Protected records stay in
                  their source systems, and consequential actions remain
                  human-approved.
                </p>
              </div>
            </div>

            <LivingCompanyCanvas />
          </div>
        </section>

        <section className="border-b border-black/8 bg-[#f7f6f2] py-16 sm:py-20">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-[#5548d9]">Browse by outcome</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17171b] sm:text-4xl">
                  What needs to move?
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#62626d]">
                Choose the work—not the technology. Each product is built around
                a real operating job.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {OUTCOMES.map((outcome) => (
                <Link
                  key={outcome.label}
                  href={outcome.href}
                  className="group rounded-[22px] border border-black/8 bg-white p-5 shadow-[0_10px_34px_rgba(30,28,45,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(30,28,45,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: outcome.color }}
                  >
                    <outcome.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-7 text-base font-semibold text-[#222227]">
                    {outcome.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#696973]">{outcome.body}</p>
                  <ArrowRight className="mt-5 h-4 w-4 text-[#8a8a94] transition-transform group-hover:translate-x-1 group-hover:text-[#5548d9]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#eeece6] py-16 sm:py-24">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-[#5548d9]">Featured systems</p>
                <h2 className="mt-3 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#17171b] sm:text-5xl">
                  Products built around the job.
                </h2>
              </div>
              <div className="max-w-xl">
                <p className="text-base leading-7 text-[#5f5f69]">
                  Each system can stand alone. When work crosses tools or teams,
                  they connect through the wider Perpetual Core operating layer.
                </p>
                <Link
                  href="/marketplace"
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#312b78] hover:text-[#5548d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
                >
                  View all {MARKETPLACE_ITEMS.length} systems and offerings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-12">
              {FEATURED_PRODUCTS.map((product) => (
                <ProductLink
                  key={product.slug}
                  product={product}
                  className={`group flex flex-col rounded-[28px] border border-black/8 bg-[#fbfaf7] p-4 shadow-[0_18px_55px_rgba(29,27,40,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(29,27,40,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9] ${CARD_LAYOUTS[product.slug] ?? "lg:col-span-4"}`}
                >
                  <ProductPreview
                    slug={product.slug}
                    label={product.name}
                    className={product.slug === "sage" ? "lg:[&>div:last-child]:h-[260px]" : ""}
                  />
                  <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-semibold tracking-[-0.025em] text-[#202024]">
                        {product.name}
                      </h3>
                      <span className="text-xs font-medium text-[#73737c]">
                        {MARKETPLACE_STATUS_LABELS[product.status]} · {product.delivery}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#64646e]">
                      {product.headline}
                    </p>
                    <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#373145]">
                      Explore {product.name}
                      {product.external ? (
                        <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      ) : (
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </span>
                  </div>
                </ProductLink>
              ))}
            </div>
          </div>
        </section>

        <section id="operating-layer" className="scroll-mt-24 bg-[#17171b] py-16 text-white sm:py-24">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-20">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-[#c9c4ff]">
                  <Network className="h-3.5 w-3.5" aria-hidden="true" />
                  How Sage connects the work
                </span>
                <h2 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl">
                  One product solves a job. Sage connects the context.
                </h2>
                <p className="mt-6 text-[17px] leading-8 text-white/78">
                  Products can share approved priorities, evidence pointers,
                  source health, and outcome receipts without collapsing every
                  company or protected record into one database.
                </p>
                <Link
                  href="/engine"
                  className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-white hover:text-[#c9c4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9c4ff]"
                >
                  See the architecture
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/[0.055] p-5 sm:p-7">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1.15fr_auto_1fr] sm:items-center">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs font-semibold text-white">Existing systems</p>
                    <div className="mt-3 space-y-2 text-xs text-white/70">
                      <p>Documents and calls</p>
                      <p>CRM and operations</p>
                      <p>Protected systems</p>
                    </div>
                  </div>
                  <ArrowRight className="mx-auto hidden h-5 w-5 text-white/32 sm:block" aria-hidden="true" />
                  <div className="rounded-2xl bg-[#6658e8] p-5 text-center shadow-[0_20px_55px_rgba(102,88,232,0.28)]">
                    <BrainCircuit className="mx-auto h-6 w-6 text-white" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-white">Sage + Company Graph</p>
                    <p className="mt-2 text-xs leading-5 text-white/78">
                      Approved context and bounded receipts
                    </p>
                  </div>
                  <ArrowRight className="mx-auto hidden h-5 w-5 text-white/32 sm:block" aria-hidden="true" />
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs font-semibold text-white">Approved workflows</p>
                    <div className="mt-3 space-y-2 text-xs text-white/70">
                      <p>Products coordinate</p>
                      <p>People review</p>
                      <p>Outcomes get recorded</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#9a8fff]/24 bg-[#7465ed]/10 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#b9b2ff]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-white/78">
                    Publishing, money, protected records, migrations, and other
                    consequential actions stay behind explicit human approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-black/8 bg-[#f7f6f2] py-16 sm:py-24">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#5548d9]">Choose the right starting level</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[#17171b] sm:text-5xl">
                Start where the work is.
              </h2>
            </div>

            <div className="mt-10 grid overflow-hidden rounded-[28px] border border-black/8 bg-white lg:grid-cols-3">
              {START_PATHS.map((path, index) => (
                <div
                  key={path.title}
                  className={`flex flex-col p-7 sm:p-8 ${
                    index > 0 ? "border-t border-black/8 lg:border-l lg:border-t-0" : ""
                  }`}
                >
                  <span className="text-xs font-semibold text-[#5548d9]">{path.label}</span>
                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em] text-[#222227]">
                    {path.title}
                  </h3>
                  <p className="mt-3 flex-1 text-base leading-7 text-[#666670]">
                    {path.body}
                  </p>
                  <Link
                    href={path.href}
                    className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-[#322c70] hover:text-[#5548d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
                  >
                    {path.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-[24px] bg-[#e9e5db] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-[#168a72]" aria-hidden="true" />
                <p className="max-w-3xl text-sm leading-6 text-[#53535c]">
                  Built through real work in workforce development, education,
                  proposals, people operations, multi-entity leadership, and
                  media production.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-[#65656d]">
                Operator-built, not hypothetical
              </span>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#5548d9] py-16 text-white sm:py-24">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.20),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(88,227,188,0.25),transparent_30%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1000px] px-6 text-center sm:px-8">
            <Workflow className="mx-auto h-7 w-7 text-[#d7d2ff]" aria-hidden="true" />
            <h2 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Where is work losing time, context, or follow-through?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-8 text-white/82">
              Show us the workflow. We will identify the smallest useful starting point.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="min-h-12 rounded-full bg-white px-6 text-base text-[#30296f] hover:bg-[#f2f0ff]"
              >
                <Link href="/contact-sales">
                  Map my first workflow <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-12 rounded-full border-white/28 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/marketplace">Browse products</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
