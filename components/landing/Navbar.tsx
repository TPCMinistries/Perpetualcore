"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

const NAV_LINKS = [
  { label: "Platform", href: "/#operating-layer" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Solutions", href: "/solutions" },
  { label: "Studio", href: "/studio" },
  { label: "Company", href: "/about" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 shadow-[0_1px_0_rgba(10,12,24,0.04)] backdrop-blur-md">
      <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="group flex min-h-11 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Perpetual Core home"
        >
          <span
            aria-hidden="true"
            className="h-[14px] w-[14px] bg-primary shadow-[0_0_18px_rgba(75,53,255,0.35)] transition-colors duration-200 group-hover:bg-[#00a8ff]"
          />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Perpetual Core
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="min-h-10 rounded-md px-5 text-sm shadow-none"
          >
            <Link href="/contact-sales">
              Map my company <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <PublicMobileNav />
          <Button asChild size="sm" className="min-h-10 rounded-md px-4 text-sm shadow-none">
            <Link href="/contact-sales">Start</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
