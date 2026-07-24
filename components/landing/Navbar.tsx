"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { CoreMark } from "@/components/landing/CoreMark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Systems", href: "/marketplace" },
  { label: "How it works", href: "/#intelligence-layer" },
  { label: "Solutions", href: "/solutions" },
  { label: "Studio", href: "/studio" },
  { label: "Company", href: "/about" },
] as const;

export function Navbar({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        dark
          ? "border-white/10 bg-[#050507]/88"
          : "border-black/8 bg-[#fbfaf7]/88"
      )}
    >
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className={cn(
            "group flex min-h-11 items-center gap-3 focus-visible:outline-none focus-visible:ring-2",
            dark
              ? "focus-visible:ring-[#8b7cff]"
              : "rounded-full focus-visible:ring-[#5548d9] focus-visible:ring-offset-2"
          )}
          aria-label="Perpetual Core home"
        >
          <CoreMark tone={tone} />
          <span
            className={cn(
              "text-[15px] font-semibold tracking-[-0.02em]",
              dark ? "text-white" : "text-[#202024]"
            )}
          >
            Perpetual Core
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-11 items-center text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2",
                dark
                  ? "text-white/64 hover:text-white focus-visible:ring-[#8b7cff]"
                  : "rounded-full text-[#66666f] hover:text-[#202024] focus-visible:ring-[#5548d9]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className={cn(
              "inline-flex min-h-11 items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
              dark
                ? "text-white/64 hover:text-white focus-visible:ring-[#8b7cff]"
                : "rounded-full text-[#66666f] hover:text-[#202024] focus-visible:ring-[#5548d9]"
            )}
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className={cn(
              "min-h-10 px-5 text-sm font-semibold shadow-none",
              dark
                ? "rounded-none border border-white/16 bg-white text-black hover:bg-[#54e6b1]"
                : "rounded-full bg-[#17171b] text-white hover:bg-[#34343c]"
            )}
          >
            <Link href="/contact-sales">
              Design your AI system <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <PublicMobileNav tone={tone} />
          <Button
            asChild
            size="sm"
            className={cn(
              "min-h-10 px-4 text-sm font-semibold shadow-none",
              dark
                ? "rounded-none bg-white text-black hover:bg-[#54e6b1]"
                : "rounded-full bg-[#5548d9] text-white hover:bg-[#4338b6]"
            )}
          >
            <Link href="/contact-sales">Design yours</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
