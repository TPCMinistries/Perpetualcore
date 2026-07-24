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
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[#fbfaf7]/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1280px] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="group flex min-h-11 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9] focus-visible:ring-offset-2"
          aria-label="Perpetual Core home"
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-[5px] bg-[linear-gradient(135deg,#5548d9,#806dff_55%,#64d6b0)] shadow-[0_6px_16px_rgba(85,72,217,0.28)]"
          />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#202024]">
            Perpetual Core
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-[#66666f] transition-colors duration-200 hover:text-[#202024] focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-sm font-medium text-[#66666f] transition-colors hover:text-[#202024] focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="min-h-10 rounded-full bg-[#17171b] px-5 text-sm text-white shadow-none hover:bg-[#34343c]"
          >
            <Link href="/contact-sales">
              Map a workflow <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <PublicMobileNav />
          <Button
            asChild
            size="sm"
            className="min-h-10 rounded-full bg-[#5548d9] px-4 text-sm text-white shadow-none hover:bg-[#4338b6]"
          >
            <Link href="/contact-sales">Start</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
