import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/next-site/SiteNav";
import { SiteFooter } from "@/components/next-site/SiteFooter";

const systems=[
  ["SAGE","SHARED INTELLIGENCE","Memory, opportunity, knowledge, writing, and decision support across the network.","#d7ff3f"],
  ["RFP ENGINE","CAPTURE","Opportunity monitoring, qualification, evidence, and proposal workflow.","#2457ff"],
  ["SENTINEL","DILIGENCE","Structured research and escalation for consequential people, partners, and opportunities.","#ff6338"],
  ["JANICE","PEOPLE OPS","Governed hiring, onboarding, lifecycle, and operational follow-through.","#f3f1ea"],
];
export const metadata={title:"Systems — Perpetual Core",description:"The shared operating systems inside the Perpetual Core network."};
export default function SystemsPage(){return <div className="min-h-screen bg-[#f3f1ea] text-[#12151c]"><SiteNav/><main className="pt-28">
  <section className="px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-[1500px]"><p className="text-[10px] font-black tracking-[.16em] text-[#2457ff]">CORE SYSTEMS / CONTROL SURFACE</p><div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><h1 className="text-[clamp(3.75rem,7.4vw,7.4rem)] font-black leading-[.8] tracking-[-.075em]">ONE<br/>BRAIN.<br/><span className="text-[#2457ff]">CLEAR LANES.</span></h1><p className="max-w-xl border-l border-black/15 pl-8 text-xl font-semibold leading-9">These are not random AI tools in a marketplace. They are named operating systems with defined authority, evidence, and expansion paths.</p></div></div></section>
  <section className="bg-[#12151c] px-5 py-20 text-white sm:px-8"><div className="mx-auto grid max-w-[1500px] gap-4 md:grid-cols-2">{systems.map(([name,role,copy,color],i)=><Link href="/packages" key={name} className="group min-h-[370px] rounded-[28px] border border-white/10 p-8" style={{backgroundColor:i===3?"#f3f1ea":"#171b25",color:i===3?"#12151c":"white"}}><div className="flex items-start justify-between"><span className="rounded-full px-3 py-2 text-[9px] font-black tracking-[.14em] text-black" style={{backgroundColor:color}}>{role}</span><ArrowUpRight className="h-6 w-6 opacity-35"/></div><h2 className="mt-24 text-5xl font-black tracking-[-.06em]">{name}</h2><p className="mt-5 max-w-lg text-lg font-medium leading-8 opacity-55">{copy}</p><p className="mt-7 text-[10px] font-black tracking-[.14em] opacity-45">SEE WAYS TO START</p></Link>)}</div></section>
  <section className="bg-[#2457ff] px-5 py-20 text-white sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black tracking-[.16em] text-[#d7ff3f]">START WITH THE WORK</p><h2 className="mt-5 max-w-5xl text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">DO NOT PICK A PRODUCT BEFORE YOU MAP THE FAILURE.</h2></div><Link href="/packages" className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-white px-6 font-black text-[#12151c]">Choose a starting point</Link></div></section>
  </main><SiteFooter/></div>}
