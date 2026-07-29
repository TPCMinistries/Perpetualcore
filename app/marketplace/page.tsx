import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkipLink } from "@/components/ui/accessibility";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MarketplaceExplorer } from "@/components/marketplace/MarketplaceExplorer";
import { MARKETPLACE_ITEMS } from "@/lib/marketplace/catalog";

export const metadata = {
  title: "Products and systems — Perpetual Core",
  description:
    "Browse Perpetual Core products for opportunity, operations, intelligence, people, knowledge, and media—with current availability clearly labeled.",
};

const AVAILABLE_NOW = MARKETPLACE_ITEMS.filter((item) =>
  ["sage", "rfp-engine", "sentinel", "janice"].includes(item.slug)
);

export default function MarketplacePage() {
  return (
    <div className="pc-v4 min-h-screen bg-[#050507] text-white">
      <SkipLink />
      <Navbar tone="dark" />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pc-v4-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(84,230,177,0.11),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(109,91,255,0.24),transparent_34%),linear-gradient(180deg,transparent_50%,#050507_100%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#54e6b1]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Perpetual Core / capability network
                </span>
                <h1 className="mt-7 max-w-[880px] text-[50px] font-semibold leading-[0.94] tracking-[-0.06em] text-white sm:text-[70px] lg:text-[84px]">
                  Start with one job.
                  <span className="block text-white/42">Expand into a system.</span>
                </h1>
              </div>
              <div>
                <p className="text-[17px] leading-8 text-white/66">
                  Deploy a specialized capability now, then connect approved
                  context, workflows, and outcome evidence through Sage. Every
                  listing states its real availability and delivery model.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#54e6b1]" aria-hidden="true" />
                    {MARKETPLACE_ITEMS.length} current systems
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#a79cff]" aria-hidden="true" />
                    Availability shown honestly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#08080b] py-16 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#54e6b1]">
                  Available now
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  The operating core.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-white/54">
                Four entry points spanning company context, opportunity,
                diligence, and people operations.
              </p>
            </div>
            <div className="mt-10 grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
              {AVAILABLE_NOW.map((item, index) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group flex min-h-[260px] flex-col bg-[#0b0b0f] p-7 transition hover:bg-[#111119] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]"
                  data-pc-event="marketplace_product_open"
                  data-product={item.name}
                  data-placement="available-now"
                  data-status={item.status}
                  data-delivery={item.delivery}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/34">
                      0{index + 1}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#54e6b1]">
                      {item.delivery}
                    </span>
                  </div>
                  <h3 className="mt-auto pt-16 text-2xl font-semibold tracking-[-0.04em]">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">{item.headline}</p>
                  <span className="mt-6 inline-flex items-center text-sm font-semibold">
                    Inspect system
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="public-light bg-[#f7f6f2] pb-16 text-[#17171b] sm:pb-24">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
            <MarketplaceExplorer />
          </div>
        </section>

        <section className="border-t border-black/8 bg-[#e9e5db] py-16 sm:py-20">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
            <div className="grid overflow-hidden rounded-[30px] bg-[#17171b] text-white shadow-[0_28px_80px_rgba(23,23,27,0.18)] lg:grid-cols-[1fr_0.66fr]">
              <div className="p-7 sm:p-10 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-[#c9c4ff]">
                  <Workflow className="h-3.5 w-3.5" aria-hidden="true" />
                  When one product is not enough
                </span>
                <h2 className="mt-6 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Bring us the workflow between the products.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/76">
                  The studio maps the handoffs, authority boundaries, source
                  systems, and outcomes—then installs the smallest connected
                  system that can prove value.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-12 rounded-full bg-white px-6 text-[#30296f] hover:bg-[#f2f0ff]"
                  >
                    <Link href="/contact-sales">
                      Map my workflow <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-h-12 rounded-full border-white/24 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/studio">See the studio</Link>
                  </Button>
                </div>
              </div>
              <div className="border-t border-white/10 bg-[radial-gradient(circle_at_80%_10%,rgba(124,111,240,0.38),transparent_48%)] p-7 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-sm font-semibold text-white">A connected system can include</p>
                <ul className="mt-6 space-y-4 text-sm leading-6 text-white/72">
                  {[
                    "One product for the daily job",
                    "Connections to existing systems",
                    "Authorized agents and workflows",
                    "Human review for consequential actions",
                    "Outcome receipts and operating cadence",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#79e1bd]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer tone="dark" />
    </div>
  );
}
