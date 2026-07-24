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

export default function MarketplacePage() {
  return (
    <div className="pc-v3 public-light min-h-screen bg-[#f7f6f2] text-[#17171b]">
      <SkipLink />
      <Navbar />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-black/8">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(115,96,255,0.17),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(255,107,74,0.13),transparent_28%),linear-gradient(180deg,#fbfaf7_0%,#f2eff8_100%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1280px] px-6 py-16 sm:px-8 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#5548d9]/16 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#4f46c8]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Perpetual Core marketplace
                </span>
                <h1 className="mt-6 max-w-[780px] text-[44px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#17171b] sm:text-[58px] lg:text-[66px]">
                  Find the system for the job in front of you.
                </h1>
              </div>
              <div>
                <p className="text-[17px] leading-8 text-[#5d5d67]">
                  Browse products for opportunities, operations, intelligence,
                  people, knowledge, and media. Every listing shows what is
                  available now and how it is delivered.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#66666f]">
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#168a72]" aria-hidden="true" />
                    {MARKETPLACE_ITEMS.length} current systems
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#5548d9]" aria-hidden="true" />
                    Availability shown honestly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
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

      <Footer />
    </div>
  );
}
