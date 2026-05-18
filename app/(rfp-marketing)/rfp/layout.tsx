import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export const metadata = {
  title: "RFP Engine — The Grant + Contract + Proposal Engine | Perpetual Core",
  description:
    "Find the right RFPs, draft them in your voice, and ship them clean. The first commercial product from Perpetual Core.",
};

export default function RfpMarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-300/30 selection:text-emerald-100">
      {/* Ambient field */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)] blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.10),transparent)] blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(244,114,182,0.06),transparent)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/rfp" className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-white">
                RFP Engine
              </span>
              <span className="hidden text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 sm:inline">
                by Perpetual Core
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-7">
            <Link
              href="/rfp/how-it-works"
              className="hidden text-[13px] font-medium text-zinc-400 transition-colors hover:text-white md:inline"
            >
              How It Works
            </Link>
            <Link
              href="/rfp/pricing"
              className="hidden text-[13px] font-medium text-zinc-400 transition-colors hover:text-white sm:inline"
            >
              Pricing
            </Link>
            <Link
              href="/rfp/trust"
              className="hidden text-[13px] font-medium text-zinc-400 transition-colors hover:text-white md:inline"
            >
              Trust
            </Link>
            <Link
              href="/contact-sales/rfp-engine"
              className="hidden text-[13px] font-medium text-zinc-400 transition-colors hover:text-white lg:inline"
            >
              Talk to Sales
            </Link>
            <Link
              href="/login?next=/orgs/new"
              className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Button
              asChild
              className="h-9 rounded-md bg-white px-4 text-[13px] font-medium text-zinc-950 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset] hover:bg-zinc-100"
            >
              <Link href="/signup?next=/orgs/new&product=rfp-engine">
                Start Free Trial
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {children}

      <footer className="relative border-t border-white/5 bg-zinc-950/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">
            <div>
              <h4 className="mb-4 text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                Product
              </h4>
              <ul className="space-y-2.5 text-[13px] text-zinc-400">
                <li>
                  <Link href="/rfp" className="transition-colors hover:text-white">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link href="/rfp/how-it-works" className="transition-colors hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/rfp/pricing" className="transition-colors hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/rfp/trust" className="transition-colors hover:text-white">
                    Trust &amp; Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup?next=/orgs/new&product=rfp-engine"
                    className="transition-colors hover:text-white"
                  >
                    Free Trial
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                Use For
              </h4>
              <ul className="space-y-2.5 text-[13px] text-zinc-400">
                <li>Federal Grants</li>
                <li>Foundation Funding</li>
                <li>State & City Contracts</li>
                <li>SBIR / STTR</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                Company
              </h4>
              <ul className="space-y-2.5 text-[13px] text-zinc-400">
                <li>
                  <Link href="/" className="transition-colors hover:text-white">
                    Perpetual Core
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact-sales/rfp-engine"
                    className="transition-colors hover:text-white"
                  >
                    Contact Sales
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                Legal
              </h4>
              <ul className="space-y-2.5 text-[13px] text-zinc-400">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-white">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-2 border-t border-white/5 pt-8 text-[12px] text-zinc-500 sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} Perpetual Core. RFP Engine is a Perpetual Core product.
            </p>
            <p className="font-mono uppercase tracking-[0.18em]">
              Built by The Institute for Human Advancement
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
