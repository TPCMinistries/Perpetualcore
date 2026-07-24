"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CoreMark } from "@/components/landing/CoreMark";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { label: "Systems", href: "/marketplace", description: "Live products for specific operating jobs" },
  { label: "How Sage works", href: "/#intelligence-layer", description: "The governed intelligence layer" },
  { label: "Solutions", href: "/solutions", description: "Systems shaped around your industry" },
  { label: "Studio", href: "/studio", description: "Map, install, train, and expand" },
  { label: "Company", href: "/about", description: "Story, structure, and principles" },
] as const;

const COMPANY_LINKS = [
  { label: "The Engine", href: "/engine" },
  { label: "DeepFutures", href: "/fund" },
  { label: "The Institute", href: "/institute" },
  { label: "Pricing and packages", href: "/pricing" },
  { label: "Notes", href: "/blog" },
] as const;

export function PublicMobileNav({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const dark = tone === "dark";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "min-h-10 min-w-10 shadow-none",
            dark
              ? "rounded-none border border-white/16 bg-white/[0.04] text-white/76 hover:bg-white/10 hover:text-white"
              : "rounded-full border border-black/10 bg-white text-[#5f5f68] hover:bg-[#f1f0ec] hover:text-[#202024]"
          )}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          "w-[min(88vw,360px)] p-0",
          dark
            ? "border-white/12 bg-[#08080b] text-white"
            : "bg-[#fbfaf7]"
        )}
      >
        <SheetTitle className="sr-only">Perpetual Core navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate the platform, marketplace, studio, and company.
        </SheetDescription>

        <div className="flex h-full flex-col">
          <div className={cn("border-b px-6 py-6", dark ? "border-white/10" : "border-black/8")}>
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2.5"
              onClick={close}
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
            <p className={cn("mt-3 text-sm leading-6", dark ? "text-white/62" : "text-[#6a6a73]")}>
              AI systems for real operating work, connected through Sage.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
            <div className="space-y-1">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "block min-h-11 px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2",
                    dark
                      ? "hover:bg-white/[0.06] focus-visible:ring-[#8b7cff]"
                      : "rounded-xl hover:bg-[#f0eee8] focus-visible:ring-[#5548d9]"
                  )}
                >
                  <span className={cn("block text-sm font-semibold", dark ? "text-white" : "text-[#26262b]")}>
                    {link.label}
                  </span>
                  <span className={cn("mt-1 block text-xs", dark ? "text-white/58" : "text-[#707079]")}>
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>

            <div className={cn("my-5 border-t", dark ? "border-white/10" : "border-black/8")} />
            <p className={cn("px-3 text-xs font-semibold uppercase tracking-[0.12em]", dark ? "text-white/58" : "text-[#777780]")}>
              More from the company
            </p>
            <div className="mt-2 space-y-0.5">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "flex min-h-11 items-center px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
                    dark
                      ? "text-white/68 hover:bg-white/[0.06] hover:text-white focus-visible:ring-[#8b7cff]"
                      : "rounded-xl text-[#66666f] hover:bg-[#f0eee8] hover:text-[#26262b] focus-visible:ring-[#5548d9]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={close}
                className={cn(
                  "flex min-h-11 items-center px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                  dark
                    ? "text-white hover:bg-white/[0.06] focus-visible:ring-[#8b7cff]"
                    : "rounded-xl text-[#26262b] hover:bg-[#f0eee8] focus-visible:ring-[#5548d9]"
                )}
              >
                Sign in
              </Link>
            </div>
          </nav>

          <div className={cn("border-t p-4", dark ? "border-white/10" : "border-black/8")}>
            <Button
              asChild
              className={cn(
                "min-h-11 w-full",
                dark
                  ? "rounded-none bg-white text-black hover:bg-[#54e6b1]"
                  : "rounded-full bg-[#5548d9] text-white hover:bg-[#4338b6]"
              )}
            >
              <Link href="/contact-sales" onClick={close}>
                Design your AI system
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
