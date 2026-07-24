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

const PRIMARY_LINKS = [
  { label: "Platform", href: "/#operating-layer", description: "The governed operating layer" },
  { label: "Marketplace", href: "/marketplace", description: "Products and capabilities by job" },
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

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-10 min-w-10 rounded-full border border-black/10 bg-white text-[#5f5f68] shadow-none hover:bg-[#f1f0ec] hover:text-[#202024]"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(88vw,340px)] bg-[#fbfaf7] p-0">
        <SheetTitle className="sr-only">Perpetual Core navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate the platform, marketplace, studio, and company.
        </SheetDescription>

        <div className="flex h-full flex-col">
          <div className="border-b border-black/8 px-6 py-6">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2.5"
              onClick={close}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-[5px] bg-[linear-gradient(135deg,#5548d9,#806dff_55%,#64d6b0)]"
              />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#202024]">
                Perpetual Core
              </span>
            </Link>
            <p className="mt-3 text-xs leading-5 text-[#6a6a73]">
              Specialized AI products that connect through Sage.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
            <div className="space-y-1">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="block min-h-11 rounded-xl px-3 py-3 transition-colors hover:bg-[#f0eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
                >
                  <span className="block text-sm font-semibold text-[#26262b]">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-xs text-[#707079]">
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>

            <div className="my-5 border-t border-black/8" />
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#777780]">
              More from the company
            </p>
            <div className="mt-2 space-y-0.5">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm text-[#66666f] transition-colors hover:bg-[#f0eee8] hover:text-[#26262b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={close}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#26262b] transition-colors hover:bg-[#f0eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
              >
                Sign in
              </Link>
            </div>
          </nav>

          <div className="border-t border-black/8 p-4">
            <Button
              asChild
              className="min-h-11 w-full rounded-full bg-[#5548d9] text-white hover:bg-[#4338b6]"
            >
              <Link href="/contact-sales" onClick={close}>
                Map a workflow
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
