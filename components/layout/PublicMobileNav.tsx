"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);

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
          {/* Logo/Brand */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-5 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-950/20">
            <Link
              href="/"
              className="flex items-center space-x-3 group"
              onClick={() => setOpen(false)}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center font-bold text-white dark:text-slate-900 shadow-md">
                AI
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Perpetual Core
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                Home
              </Link>
              <Link
                href="/solutions"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                Solutions
              </Link>
              <Link
                href="/#features"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                Pricing
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

              <div className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Enterprise
              </div>
              <Link
                href="/consultation"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                <div>Guided Implementation</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-normal">For teams of 10-100</div>
              </Link>
              <Link
                href="/enterprise-demo"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                <div>Enterprise Solutions</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-normal">White-glove for 100+</div>
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all active:scale-[0.98]"
              >
                Sign In
              </Link>
            </div>
          </nav>

          {/* CTA Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <Button asChild className="w-full shadow-lg hover:shadow-xl transition-all h-12 text-base font-semibold">
              <Link href="/signup" onClick={() => setOpen(false)}>
                Get Started Free
              </Link>
            </Button>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-3">
              14-day free trial • No credit card required
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
