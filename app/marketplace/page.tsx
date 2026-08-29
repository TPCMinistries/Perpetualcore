import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpenCheck, BriefcaseBusiness, FileSearch, ShieldCheck, UsersRound } from "lucide-react";
import { ProductPreview } from "@/components/landing/v3/ProductPreview";
import { SiteNav } from "@/components/next-site/SiteNav";
import { SiteFooter } from "@/components/next-site/SiteFooter";

const problems = [
  { label: "I keep rebuilding context", detail: "Company memory, decisions, and follow-through", href: "#sage", icon: BookOpenCheck },
  { label: "We miss the right opportunities", detail: "Discovery, qualification, and proposal work", href: "#rfp-engine", icon: BriefcaseBusiness },
  { label: "A decision needs real diligence", detail: "People, partners, and consequential risk", href: "#sentinel", icon: FileSearch },
  { label: "People operations keep dropping", detail: "Hiring, onboarding, and lifecycle follow-through", href: "#janice", icon: UsersRound },
] as const;

const systems = [
  {
    id: "sage", number: "01", name: "Sage", role: "Shared intelligence",
    headline: "Stop re-explaining the company every morning.",
    copy: "Sage keeps approved company context, active work, and decisions connected so operators can move without reconstructing the story across tools.",
    bestFor: "Founders, executives, and teams carrying too much context in their heads",
    jobs: ["Prepare an operator brief", "Find approved company knowledge", "Coordinate work that needs review"],
    href: "https://sage-saas.perpetualcore.com", cta: "Open Sage", accent: "#d7ff3f", dark: true,
  },
  {
    id: "rfp-engine", number: "02", name: "RFP Engine", role: "Opportunity capture",
    headline: "Find the right opportunity before your team wastes a week writing.",
    copy: "RFP Engine monitors opportunities, helps teams qualify fit, organizes evidence, and supports proposal work without pretending an AI draft is submission-ready.",
    bestFor: "Capture teams, grant writers, nonprofits, and firms pursuing public work",
    jobs: ["Monitor relevant opportunities", "Make a supported bid decision", "Build a reviewable proposal workspace"],
    href: "https://rfp.perpetualcore.com", cta: "Explore RFP Engine", accent: "#2457ff", dark: false,
  },
  {
    id: "sentinel", number: "03", name: "Sentinel", role: "Diligence",
    headline: "Turn scattered research into a decision-ready evidence file.",
    copy: "Sentinel structures research, sources, and risk escalation for consequential people, partners, and opportunities. It informs the decision; it does not make it for you.",
    bestFor: "Attorneys, investigators, journalists, investors, and executive operators",
    jobs: ["Scope a diligence question", "Preserve source provenance", "Escalate findings for human judgment"],
    href: "https://sentinel.perpetualcore.com", cta: "Explore Sentinel", accent: "#ff6338", dark: true,
  },
  {
    id: "janice", number: "04", name: "Janice", role: "People operations",
    headline: "Keep hiring and onboarding from becoming invisible work.",
    copy: "Janice coordinates governed people workflows—from role definition and candidate review to onboarding and lifecycle follow-through—with clear human authority.",
    bestFor: "Growing organizations with recurring hiring, onboarding, and team operations",
    jobs: ["Build a reviewable hiring path", "Coordinate onboarding steps", "Keep consequential decisions human"],
    href: "https://janice.perpetualcore.com", cta: "Explore Janice", accent: "#f3f1ea", dark: false,
  },
] as const;

export const metadata = {
  title: "AI Systems for Real Company Work — Perpetual Core",
  description: "Explore Sage, RFP Engine, Sentinel, and Janice by the operating problem you need to solve. See the workflow, understand the fit, and choose a practical starting point.",
};

export default function SystemsPage() {
  return <div className="min-h-screen overflow-x-clip bg-[#f3f1ea] text-[#12151c]">
    <SiteNav />
    <main id="main-content" className="pt-24 sm:pt-28">
      <section className="px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#2457ff]">Four systems. Start with the problem.</p>
          <div className="mt-6 grid gap-9 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,.58fr)] lg:items-end">
            <div className="min-w-0">
              <h1 className="max-w-[1050px] text-[clamp(3.25rem,6.8vw,7rem)] font-black leading-[.86] tracking-[-.072em]">AI systems for work that cannot afford to lose context.</h1>
            </div>
            <div className="max-w-xl border-l-2 border-[#2457ff] pl-6 sm:pl-8">
              <p className="text-xl font-bold leading-8 sm:text-2xl sm:leading-9">Choose the workflow that is breaking. See the system built to strengthen it.</p>
              <p className="mt-4 text-base font-medium leading-7 text-[#555b67]">Each product has a defined job, clear boundaries, and a direct path to explore or buy.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#find-your-system" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#2457ff] px-5 text-sm font-black text-white transition-colors hover:bg-[#173ed4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2457ff]/30">Find your system <ArrowDown aria-hidden="true" className="ml-2 h-4 w-4" /></a>
                <Link href="/packages" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-black/15 bg-white/50 px-5 text-sm font-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2457ff]/30">See prices and starting points</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="find-your-system" aria-labelledby="problem-heading" className="scroll-mt-28 border-y border-black/10 bg-white/45 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#626875]">Start here</p><h2 id="problem-heading" className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">What is costing you momentum?</h2></div>
            <p className="max-w-md text-sm font-medium leading-6 text-[#626875]">Pick the closest problem. You will jump directly to the relevant system—not a generic contact form.</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {problems.map(({ label, detail, href, icon: Icon }, index) => <a key={label} href={href} className="group flex min-h-[168px] cursor-pointer flex-col justify-between rounded-[22px] border border-black/10 bg-[#f3f1ea] p-5 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-1 hover:border-[#2457ff]/50 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2457ff]/30">
              <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#12151c] text-white"><Icon aria-hidden="true" className="h-5 w-5" /></span><span className="text-xs font-black text-[#7b8089]">0{index + 1}</span></div>
              <div className="mt-7"><p className="text-lg font-black leading-6 tracking-[-.025em]">{label}</p><p className="mt-2 text-sm font-medium leading-5 text-[#626875]">{detail}</p><span className="mt-4 inline-flex items-center text-xs font-black text-[#2457ff]">See the system <ArrowDown aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" /></span></div>
            </a>)}
          </div>
        </div>
      </section>

      <section aria-label="Perpetual Core systems" className="bg-[#12151c] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1500px] space-y-5">
          {systems.map((system) => <article id={system.id} key={system.id} className={`scroll-mt-28 overflow-hidden rounded-[28px] border ${system.dark ? "border-white/10 bg-[#171b25] text-white" : "border-black/10 bg-[#f3f1ea] text-[#12151c]"}`}>
            <div className="grid lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
              <div className={`p-6 sm:p-9 lg:border-r lg:p-12 ${system.dark ? "border-white/10" : "border-black/10"}`}>
                <div className="flex items-center justify-between gap-4"><span className="rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#12151c]" style={{ backgroundColor: system.accent }}>{system.role}</span><span className={`text-xs font-black ${system.dark ? "text-white/40" : "text-black/40"}`}>{system.number}</span></div>
                <h2 className="mt-10 text-5xl font-black tracking-[-.065em] sm:text-6xl">{system.name}</h2>
                <p className="mt-5 max-w-xl text-2xl font-black leading-[1.08] tracking-[-.035em] sm:text-3xl">{system.headline}</p>
                <p className={`mt-5 max-w-xl text-base font-medium leading-7 ${system.dark ? "text-white/70" : "text-[#555b67]"}`}>{system.copy}</p>
                <div className={`mt-8 border-t pt-6 ${system.dark ? "border-white/10" : "border-black/10"}`}><p className={`text-[10px] font-black uppercase tracking-[.15em] ${system.dark ? "text-white/50" : "text-black/50"}`}>Best for</p><p className="mt-2 max-w-lg text-sm font-bold leading-6">{system.bestFor}</p></div>
              </div>
              <div className="flex flex-col justify-between p-6 sm:p-9 lg:p-12">
                <ProductPreview slug={system.id} label={system.name} className="min-h-[228px] w-full" />
                <div className="mt-8 grid gap-7 xl:grid-cols-[1fr_auto] xl:items-end">
                  <div><p className={`text-[10px] font-black uppercase tracking-[.15em] ${system.dark ? "text-white/50" : "text-black/50"}`}>Use it to</p><ul className="mt-4 grid gap-3 sm:grid-cols-3" aria-label={`${system.name} use cases`}>{system.jobs.map((job) => <li key={job} className="flex items-start gap-2 text-sm font-bold leading-5"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#2457ff]" />{job}</li>)}</ul></div>
                  <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                    <a href={system.href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition-[background-color,transform] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2457ff]/40 ${system.dark ? "bg-white text-[#12151c] hover:bg-[#d7ff3f]" : "bg-[#12151c] text-white hover:bg-[#2457ff]"}`}>{system.cta} <ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" /><span className="sr-only"> (opens in a new tab)</span></a>
                    <Link href="/packages" className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-5 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2457ff]/40 ${system.dark ? "border-white/15 hover:bg-white/10" : "border-black/15 hover:bg-white"}`}>See buying options <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>
                  </div>
                </div>
              </div>
            </div>
          </article>)}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[.75fr_1.25fr]">
        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#2457ff]">How to choose</p><h2 className="mt-4 max-w-lg text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">Buy the smallest system that can prove the next decision.</h2></div>
        <ol className="divide-y divide-black/10 border-y border-black/10">{[
          ["01", "Name the failure", "Choose one recurring handoff, decision, or information gap—not “AI transformation.”"],
          ["02", "Open the relevant system", "See the actual product surface and decide whether the defined job matches your work."],
          ["03", "Choose software or implementation", "Buy direct access when the workflow is clear. Choose setup or a working lane when context and integration matter."],
        ].map(([number, title, copy]) => <li key={number} className="grid gap-3 py-6 sm:grid-cols-[52px_180px_1fr] sm:items-start sm:gap-5 sm:py-8"><span className="text-xs font-black text-[#2457ff]">{number}</span><strong className="text-lg tracking-[-.02em]">{title}</strong><p className="max-w-xl text-base font-medium leading-7 text-[#626875]">{copy}</p></li>)}</ol>
      </div></section>

      <section className="bg-[#2457ff] px-5 py-16 text-white sm:px-8 sm:py-20"><div className="mx-auto flex max-w-[1500px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#d7ff3f]">Need help choosing?</p><h2 className="mt-5 max-w-5xl text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl">Start with the work. We will help you choose the right level of system and support.</h2></div>
        <Link href="/packages" className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-white px-6 font-black text-[#12151c] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#d7ff3f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">Compare ways to start <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" /></Link>
      </div></section>
    </main>
    <SiteFooter />
  </div>;
}
