"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [["Network", "/#network"], ["Companies", "/companies"], ["Build with us", "/studio"], ["Field notes", "/blog"], ["About", "/about"]] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
    <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between rounded-[18px] border border-black/10 bg-[#f3f1ea]/90 px-4 shadow-[0_12px_60px_rgba(20,24,35,.10)] backdrop-blur-xl sm:px-5">
      <Link href="/" className="group flex min-h-11 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2457ff]">
        <span className="relative grid h-8 w-8 place-items-center rounded-[9px] bg-[#12151c] text-white"><span className="h-2.5 w-2.5 rounded-full bg-[#d7ff3f] shadow-[0_0_0_5px_rgba(215,255,63,.15)]" /></span>
        <span className="text-[15px] font-extrabold tracking-[-.03em]">PERPETUAL CORE</span>
      </Link>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">{links.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-[#444955] transition-colors hover:bg-black/[.05] hover:text-black">{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><Link href="/contact-sales" className="hidden min-h-11 items-center rounded-xl bg-[#2457ff] px-5 text-sm font-bold text-white transition-colors hover:bg-[#173ed4] sm:inline-flex">Start a build <ArrowUpRight className="ml-2 h-4 w-4" /></Link><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-black/10 lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </div>
    {open ? <nav className="mx-auto mt-2 max-w-[1500px] rounded-[18px] border border-black/10 bg-[#f3f1ea] p-3 shadow-xl lg:hidden">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-base font-bold hover:bg-black/[.05]">{label}</Link>)}<Link href="/contact-sales" className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-[#2457ff] font-bold text-white">Start a build</Link></nav> : null}
  </header>;
}
