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
          className="min-h-10 min-w-10 rounded-sm border border-border/70 text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(88vw,340px)] bg-background p-0">
        <SheetTitle className="sr-only">Perpetual Core navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate the platform, marketplace, studio, and company.
        </SheetDescription>

        <div className="flex h-full flex-col">
          <div className="border-b border-border/70 px-6 py-6">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2.5"
              onClick={close}
            >
              <span aria-hidden="true" className="h-3.5 w-3.5 bg-primary" />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Perpetual Core
              </span>
            </Link>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Governed intelligence, specialized systems, and an implementation studio.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
            <div className="space-y-1">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="block min-h-11 rounded-md px-3 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>

            <div className="my-5 border-t border-border/70" />
            <p className="px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              More from the company
            </p>
            <div className="mt-2 space-y-0.5">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={close}
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Sign in
              </Link>
            </div>
          </nav>

          <div className="border-t border-border/70 p-4">
            <Button asChild className="min-h-11 w-full">
              <Link href="/contact-sales" onClick={close}>
                Map my company
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
