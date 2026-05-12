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
          className="md:hidden h-9 w-9 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent border border-border/60 shadow-none active:scale-95 transition-all"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-background">
        <div className="flex h-full flex-col bg-background">
          {/* Wordmark */}
          <div className="border-b border-border/60 px-6 py-5">
            <Link href="/" className="flex items-center" onClick={close}>
              <span className="font-serif text-base font-normal tracking-tight text-foreground">
                Perpetual Core
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-5 overflow-y-auto">
            <div className="space-y-0.5">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
                Studio
              </div>
              <Link href="/studio" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-sm transition-colors">
                Overview
              </Link>
              <Link href="/studio/engagements" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Engagements
              </Link>
              <Link href="/studio/methodology" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Methodology
              </Link>
              <Link href="/studio/process" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Process
              </Link>
              <Link href="/studio/case-studies" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Case Studies
              </Link>

              <div className="border-t border-border/60 my-3" />
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
                Products
              </div>
              <Link href="/products" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-sm transition-colors">
                Portfolio
              </Link>
              <Link href="/products/platform" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Platform
              </Link>
              <Link href="/products/atlas" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Atlas
              </Link>
              <Link href="/products/sentinel" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Sentinel
              </Link>
              <Link href="/products/sage" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Sage
              </Link>
              <Link href="/products/vellum" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Vellum
              </Link>
              <Link href="/products/rfp-engine" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                RFP Engine
              </Link>
              <Link href="/products/rfp-sentry" onClick={close} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                RFP Sentry
              </Link>

              <div className="border-t border-border/60 my-3" />
              <Link href="/solutions" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-sm transition-colors">
                Industries
              </Link>
              <Link href="/pricing" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-sm transition-colors">
                Pricing
              </Link>
              <Link href="/about" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-sm transition-colors">
                About
              </Link>
              <Link href="/engine" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-sm transition-colors">
                The Perpetual Engine
              </Link>

              <div className="border-t border-border/60 my-3" />
              <Link href="/login" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors">
                Sign In
              </Link>
            </div>
          </nav>

          <div className="border-t border-border/60 p-4">
            <Button asChild className="w-full text-sm font-medium shadow-none h-10">
              <Link href="/studio/engagements" onClick={close}>
                Start Engagement
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Engagements start at $75,000
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
