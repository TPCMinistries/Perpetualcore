import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/next-site/SiteNav";
import { SiteFooter } from "@/components/next-site/SiteFooter";

export const metadata = {
  title: "About — Perpetual Core",
  description: "Understand how Perpetual Core systems, focused companies, the Studio, and IHA fit together without blurring their roles.",
};

const architecture = [
  { n: "01", title: "CORE SYSTEMS", body: "Sage, RFP Engine, Sentinel, and Janice solve recurring jobs across knowledge, opportunity, diligence, and people operations.", href: "/marketplace", action: "Explore the systems", bg: "#12151c", fg: "white" },
  { n: "02", title: "THE STUDIO", body: "The Studio maps and installs one governed workflow when software alone is not enough.", href: "/studio", action: "See how we build", bg: "#2457ff", fg: "white" },
  { n: "03", title: "FOCUSED COMPANIES", body: "Companies such as Kept Count go deep into a market only after the workflow, buyer, and operating need are proven.", href: "/companies", action: "See the companies", bg: "#ff6338", fg: "#12151c" },
  { n: "04", title: "PUBLIC BENEFIT", body: "IHA develops people and public benefit through a distinct nonprofit mission, authority structure, and data boundary.", href: "https://theiha.org", action: "Visit IHA", bg: "#d7ff3f", fg: "#12151c" },
] as const;

export default function AboutPage() {
  return <div className="min-h-screen bg-[#2457ff] text-white">
    <SiteNav />
    <main id="main-content" className="pt-28">
      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#d7ff3f]">One ecosystem. Distinct jobs and boundaries.</p>
          <div className="mt-7 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <h1 className="max-w-5xl text-[clamp(3.5rem,6.9vw,7rem)] font-black leading-[.84] tracking-[-.072em]">WE BUILD CONTINUITY BETWEEN PEOPLE, DECISIONS, AND ACTION.</h1>
            <div className="border-l-2 border-[#d7ff3f] pl-6 sm:pl-8">
              <p className="text-2xl font-black leading-9">Perpetual Core is the commercial systems company at the center of the ecosystem.</p>
              <p className="mt-5 text-lg leading-8 text-white/70">It builds shared AI products, installs company workflows through the Studio, and develops focused companies where a market requires deeper operating infrastructure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f1ea] px-5 py-16 text-[#12151c] sm:px-8 sm:py-24" aria-labelledby="architecture-heading">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-6 lg:grid-cols-[.65fr_1.35fr]">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#2457ff]">How the ecosystem fits</p><h2 id="architecture-heading" className="mt-4 max-w-lg text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">Clear relationships. No brand cloud.</h2></div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#5c626d] lg:justify-self-end">The pieces strengthen one another, but they are not interchangeable. Buyers, authority, data, revenue, and outcomes stay attached to the organization responsible for them.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {architecture.map(item => <Link key={item.n} href={item.href} className="group flex min-h-[320px] cursor-pointer flex-col rounded-[28px] p-7 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2457ff]/30 sm:p-9" style={{backgroundColor:item.bg,color:item.fg}}>
              <div className="flex items-center justify-between"><span className="text-xs font-black opacity-45">{item.n}</span><ArrowUpRight aria-hidden="true" className="h-5 w-5 opacity-45" /></div>
              <h3 className="mt-12 text-4xl font-black tracking-[-.055em] sm:text-5xl">{item.title}</h3>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 opacity-70">{item.body}</p>
              <span className="mt-auto pt-8 text-sm font-black">{item.action} <ArrowRight aria-hidden="true" className="ml-2 inline h-4 w-4" /></span>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="bg-[#12151c] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#d7ff3f]">The practical next step</p><h2 className="mt-5 max-w-5xl text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl">You do not need to buy the ecosystem. Start with one useful system or workflow.</h2></div>
          <Link href="/packages" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-6 font-black text-[#12151c] hover:bg-[#d7ff3f]">Compare ways to start <ArrowRight aria-hidden="true" className="ml-3 h-5 w-5" /></Link>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
