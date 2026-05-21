/**
 * Group-scoped 404 for the (rfp-marketing) route group.
 *
 * Falls in for any path under app/(rfp-marketing)/rfp/* that doesn't
 * exist. Outside this group the legacy app/not-found.tsx takes over
 * (light theme + purple "Go to Dashboard" button) — that's intentional
 * for the parent Perpetual Core SaaS but wrong-looking on rfp.*.
 *
 * Wave 6: the broader RFP host 404 (e.g. /random on rfp.*) still falls
 * through to the legacy page because middleware rewrites unmatched
 * paths under /rfp/*, so this catches them here. Verified by routing.
 */

import Link from "next/link";

export default function RfpMarketingNotFound() {
  return (
    <main className="container mx-auto px-4 py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300">
          404 · not found
        </div>
        <h1
          className="mt-4 text-3xl text-white italic"
          style={{ fontFamily: "Georgia, serif" }}
        >
          We couldn't find that page.
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">
          It may have moved, or the link might have a typo. Try one of these
          instead — they're the most-asked-for surfaces.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/rfp"
            className="rounded-md bg-emerald-400 px-4 py-2 text-[13px] font-medium text-zinc-950 hover:bg-emerald-300"
          >
            RFP Engine home
          </Link>
          <Link
            href="/rfp/pricing"
            className="rounded-md border border-white/10 px-4 py-2 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.04]"
          >
            Pricing
          </Link>
          <Link
            href="/rfp/roadmap"
            className="rounded-md border border-white/10 px-4 py-2 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.04]"
          >
            Roadmap
          </Link>
          <Link
            href="/contact-sales/rfp-engine"
            className="rounded-md border border-white/10 px-4 py-2 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.04]"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </main>
  );
}
