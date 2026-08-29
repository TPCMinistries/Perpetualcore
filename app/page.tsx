import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, CornerDownRight, MoveRight } from "lucide-react";
import { SiteNav } from "@/components/next-site/SiteNav";
import { SiteFooter } from "@/components/next-site/SiteFooter";
import { SystemField } from "@/components/next-site/SystemField";
import { Reveal } from "@/components/next-site/Reveal";

export const metadata = { title: "Perpetual Core — Institutional systems, built to operate", description: "Perpetual Core builds governed AI infrastructure and focused vertical companies for consequential institutional work." };

const lanes = [
  ["01", "ENTER THROUGH A COMPANY", "Kept Count", "Care operations and evidence across clinical and community boundaries.", "https://keptcount.com", "#ff6338"],
  ["02", "ENTER THROUGH A SYSTEM", "Sage + Core systems", "Intelligence for opportunity, diligence, people, knowledge, and execution.", "/marketplace", "#d7ff3f"],
  ["03", "ENTER THROUGH A BUILD", "Perpetual Studio", "Map one consequential workflow. Install it. Prove the next decision.", "/studio", "#2457ff"],
] as const;

export default function HomePage() {
  return <div className="min-h-screen bg-[#f3f1ea] text-[#12151c]">
    <SiteNav />
    <main>
      <section className="px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:gap-14">
          <Reveal className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/60 px-3 py-2 text-[10px] font-black tracking-[.14em]"><span className="h-2 w-2 rounded-full bg-[#2457ff]" /> INSTITUTIONAL AI / OPERATING INFRASTRUCTURE</div>
            <h1 className="mt-8 max-w-[760px] text-[clamp(3.3rem,7.5vw,7.4rem)] font-black leading-[.82] tracking-[-.075em]">BUILD WHAT THE WORK <span className="text-[#2457ff]">REQUIRES.</span></h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-[#565c68] sm:text-xl">Perpetual Core turns fragmented institutional work into governed systems—then builds focused companies where the market demands depth.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/contact-sales" className="inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[#2457ff] px-6 text-sm font-black text-white transition-colors hover:bg-[#173ed4]">Map a system <ArrowRight className="ml-2 h-4 w-4" /></Link><Link href="#network" className="inline-flex min-h-14 items-center justify-center rounded-[14px] border border-black/15 px-6 text-sm font-black hover:bg-white/60">Enter the network <CornerDownRight className="ml-2 h-4 w-4" /></Link></div>
            <div className="mt-12 flex items-center gap-4 border-t border-black/10 pt-5 text-xs font-bold text-[#747985]"><span>HEALTHCARE</span><span className="h-1 w-1 rounded-full bg-black/25"/><span>WORKFORCE</span><span className="h-1 w-1 rounded-full bg-black/25"/><span>EDUCATION</span></div>
          </Reveal>
          <SystemField />
        </div>
      </section>

      <section id="network" className="bg-[#12151c] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1500px]"><div className="grid gap-8 lg:grid-cols-[.45fr_1fr]"><p className="text-[10px] font-black tracking-[.15em] text-[#d7ff3f]">THE NETWORK / 01</p><div><h2 className="max-w-5xl text-4xl font-black leading-[.96] tracking-[-.055em] sm:text-6xl lg:text-7xl">ONE CORE. MULTIPLE WAYS IN.</h2><p className="mt-6 max-w-2xl text-lg leading-8 text-white/50">You should not have to understand our whole ecosystem before buying the first useful thing.</p></div></div>
          <div className="mt-16 divide-y divide-white/10 border-y border-white/10">{lanes.map(([n, eyebrow, title, body, href, color]) => <Link key={n} href={href} className="group grid min-h-[180px] cursor-pointer gap-6 py-8 transition-colors hover:bg-white/[.035] md:grid-cols-[80px_1fr_1fr_60px] md:items-center md:px-5"><span className="text-xs font-black text-white/30">{n}</span><div><p className="text-[9px] font-black tracking-[.14em]" style={{color}}>{eyebrow}</p><h3 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">{title}</h3></div><p className="max-w-xl text-base leading-7 text-white/50">{body}</p><span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 transition-colors group-hover:bg-white group-hover:text-black"><ArrowUpRight className="h-5 w-5" /></span></Link>)}</div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#2457ff] px-5 py-20 text-white sm:px-8 sm:py-28"><div className="mx-auto max-w-[1500px]"><div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]"><div><p className="text-[10px] font-black tracking-[.15em] text-white/60">THE DIFFERENCE / 02</p><h2 className="mt-7 max-w-5xl text-5xl font-black leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-8xl">THE SYSTEM INCLUDES THE RULES.</h2></div><div className="lg:pt-20"><p className="text-xl font-semibold leading-8 text-white/80">Software is only half the install. Authority, evidence, data boundaries, ownership, and operating cadence ship with it.</p><div className="mt-9 space-y-4">{["Human approval stays visible", "Protected data stays bounded", "Every claim has a maturity label", "Every pilot ends in a decision"].map(item => <div key={item} className="flex gap-3 border-b border-white/20 pb-4"><Check className="h-5 w-5 shrink-0 text-[#d7ff3f]" /><span className="font-bold">{item}</span></div>)}</div></div></div></div></section>

      <section className="bg-[#d7ff3f] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto flex max-w-[1500px] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black tracking-[.15em]">NEXT MOVE / 03</p><h2 className="mt-6 max-w-5xl text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">BRING US THE HANDOFF THAT KEEPS BREAKING.</h2></div><Link href="/contact-sales" className="inline-flex min-h-16 shrink-0 items-center justify-center rounded-[16px] bg-[#12151c] px-7 font-black text-white hover:bg-[#2b303b]">Start the diagnostic <MoveRight className="ml-3 h-5 w-5" /></Link></div></section>
    </main>
    <SiteFooter />
  </div>;
}
