import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/next-site/SiteNav";
import { SiteFooter } from "@/components/next-site/SiteFooter";

const companies = [
  { n: "01", name: "KEPT COUNT", state: "PUBLIC FLAGSHIP", color: "#ff6338", href: "https://keptcount.com", copy: "Care operations and evidence across clinical and community boundaries.", detail: "A focused company built for the handoffs generic software misses." },
  { n: "02", name: "WORKFORCE", state: "DESIGN-PARTNER SYSTEM", color: "#d7ff3f", href: "/contact-sales", copy: "Governed enrollment, learning, case management, and placement operations.", detail: "An operating system being proven in real workforce delivery—not a loose feature bundle." },
  { n: "03", name: "NEXT COMPANY", state: "EARNED, NOT ANNOUNCED", color: "#2457ff", href: "/studio", copy: "We spin out a company only when repeated operating evidence proves the market needs one.", detail: "The studio is the discovery mechanism. The network is the compounding advantage." },
];

export const metadata = { title: "Companies — Perpetual Core", description: "Focused companies built on the Perpetual Core operating layer." };

export default function CompaniesPage() {
  return <div className="min-h-screen bg-[#12151c] text-white"><SiteNav /><main className="pt-28">
    <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-[1500px]"><p className="text-[10px] font-black tracking-[.16em] text-[#d7ff3f]">THE COMPANY NETWORK / LIVE FIELD</p><h1 className="mt-7 max-w-6xl text-[clamp(4rem,10vw,9rem)] font-black leading-[.78] tracking-[-.08em]">DEPTH<br/><span className="text-white/25">BEATS</span><br/>BREADTH.</h1><div className="mt-12 grid gap-5 border-t border-white/10 pt-8 md:grid-cols-2"><p className="text-xl font-bold leading-8">Perpetual Core is not a holding page for unrelated ideas.</p><p className="max-w-2xl text-lg leading-8 text-white/50">It is one operating layer that earns the right to produce focused companies where institutional work demands dedicated depth.</p></div></div></section>
    <section className="px-5 pb-24 sm:px-8"><div className="mx-auto max-w-[1500px] divide-y divide-white/10 border-y border-white/10">{companies.map(c => <Link key={c.n} href={c.href} className="group grid gap-8 py-10 md:grid-cols-[90px_1.1fr_.9fr_56px] md:items-center"><span className="text-sm font-black text-white/25">{c.n}</span><div><span className="inline-block rounded-full px-3 py-2 text-[9px] font-black tracking-[.14em] text-black" style={{backgroundColor:c.color}}>{c.state}</span><h2 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">{c.name}</h2></div><div><p className="text-lg font-bold leading-7">{c.copy}</p><p className="mt-3 text-sm leading-6 text-white/45">{c.detail}</p></div><span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 group-hover:bg-white group-hover:text-black"><ArrowUpRight /></span></Link>)}</div></section>
    <section className="bg-[#ff6338] px-5 py-20 text-[#12151c] sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><h2 className="max-w-5xl text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">WE DO NOT LAUNCH COMPANIES TO FILL A GRID.</h2><Link href="/studio" className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-[#12151c] px-6 font-black text-white">See how a build earns scale</Link></div></section>
  </main><SiteFooter /></div>;
}
