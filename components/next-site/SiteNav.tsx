"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const links = [["Network", "/#network"], ["Companies", "/companies"], ["Build with us", "/studio"], ["Field notes", "/blog"], ["About", "/about"]] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
    <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between rounded-[18px] border border-black/10 bg-[#f3f1ea]/90 px-4 shadow-[0_12px_60px_rgba(20,24,35,.10)] backdrop-blur-xl sm:px-5">
      <Link href="/" className="group flex min-h-11 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2457ff]">
        <span className="relative grid h-8 w-8 place-items-center rounded-[9px] bg-[#12151c] text-white"><span className="h-2.5 w-2.5 rounded-full bg-[#d7ff3f] shadow-[0_0_0_5px_rgba(215,255,63,.15)]" /></span>
        <span className="text-[15px] font-extrabold tracking-[-.03em]">PERPETUAL CORE</span>
      </Link>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">{links.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-[#444955] transition-colors hover:bg-black/[.05] hover:text-black">{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><Link href="/contact-sales" className="hidden min-h-11 items-center rounded-xl bg-[#2457ff] px-5 pr-4 text-sm font-bold text-white transition-[background-color,transform] duration-200 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5 hover:bg-[#173ed4] active:scale-[.97] sm:inline-flex">Map my first system <ArrowUpRight className="ml-2 h-4 w-4" /></Link><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-black/10 transition-colors hover:bg-black/[.05] lg:hidden"><AnimatePresence initial={false} mode="wait">{open ? <motion.span key="x" initial={reduce?false:{opacity:0,scale:.9,filter:"blur(3px)"}} animate={{opacity:1,scale:1,filter:"blur(0px)"}} exit={{opacity:0,scale:.95,filter:"blur(2px)"}} transition={{duration:.16}}><X className="h-5 w-5" /></motion.span> : <motion.span key="menu" initial={reduce?false:{opacity:0,scale:.9,filter:"blur(3px)"}} animate={{opacity:1,scale:1,filter:"blur(0px)"}} exit={{opacity:0,scale:.95,filter:"blur(2px)"}} transition={{duration:.16}}><Menu className="h-5 w-5" /></motion.span>}</AnimatePresence></button></div>
    </div>
    <AnimatePresence>{open ? <motion.nav initial={reduce?false:{opacity:0,y:-8,scale:.985,filter:"blur(4px)"}} animate={{opacity:1,y:0,scale:1,filter:"blur(0px)"}} exit={{opacity:0,y:-5,scale:.99,filter:"blur(3px)"}} transition={{type:"spring",duration:.24,bounce:0}} className="mx-auto mt-2 max-w-[1500px] origin-top rounded-[18px] border border-black/10 bg-[#f3f1ea] p-3 shadow-xl lg:hidden">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-base font-bold hover:bg-black/[.05]">{label}</Link>)}<Link href="/contact-sales" className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-[#2457ff] font-bold text-white">Map my first system</Link></motion.nav> : null}</AnimatePresence>
  </header>;
}
