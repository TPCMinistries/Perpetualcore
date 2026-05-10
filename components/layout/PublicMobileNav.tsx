"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

/**
 * Mobile nav for public marketing pages — mirrors the new studio-frame
 * top-level (Studio | Products | Industries | Pricing | About).
 */
export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary border border-primary/20 dark:border-primary/30 shadow-lg active:scale-95 transition-all"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-white dark:bg-slate-900">
        <div className="flex h-full flex-col bg-white dark:bg-slate-900">
          {/* Logo / Brand */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-5">
            <Link href="/" className="flex items-center space-x-3 group" onClick={close}>
              {/* TODO: replace placeholder logo block with real Perpetual Core mark */}
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                PC
              </div>
              <span className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                Perpetual Core
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Studio
              </div>
              <Link href="/studio" onClick={close} className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Overview
              </Link>
              <Link href="/studio/engagements" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Engagements
              </Link>
              <Link href="/studio/methodology" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Methodology
              </Link>
              <Link href="/studio/process" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Process
              </Link>
              <Link href="/studio/case-studies" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Case Studies
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Products
              </div>
              <Link href="/products" onClick={close} className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Portfolio
              </Link>
              <Link href="/products/platform" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Platform
              </Link>
              <Link href="/products/atlas" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Atlas
              </Link>
              <Link href="/products/sentinel" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Sentinel
              </Link>
              <Link href="/products/sage" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Sage
              </Link>
              <Link href="/products/vellum" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Vellum
              </Link>
              <Link href="/products/rfp-engine" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                RFP Engine
              </Link>
              <Link href="/products/rfp-sentry" onClick={close} className="block px-4 py-3 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                RFP Sentry
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />
              <Link href="/solutions" onClick={close} className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Industries
              </Link>
              <Link href="/pricing" onClick={close} className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Pricing
              </Link>
              <Link href="/about" onClick={close} className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                About
              </Link>
              <Link href="/engine" onClick={close} className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                The Perpetual Engine
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />
              <Link href="/login" onClick={close} className="block px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]">
                Sign In
              </Link>
            </div>
          </nav>

          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <Button asChild className="w-full shadow-lg hover:shadow-xl transition-all h-12 text-base font-semibold">
              <Link href="/studio/engagements" onClick={close}>
                Start Engagement
              </Link>
            </Button>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-3">
              Engagements start at $75,000
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
