"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dark = tone === "dark";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls="public-mobile-navigation"
        onClick={() => setOpen(true)}
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

      {open ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default bg-black/72"
            onClick={() => setOpen(false)}
          />
          <aside
            id="public-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-mobile-navigation-title"
            className={cn(
              "relative flex h-full w-[min(88vw,360px)] flex-col border-r shadow-2xl",
              dark
                ? "border-white/12 bg-[#08080b] text-white"
                : "border-black/10 bg-[#fbfaf7] text-[#202024]"
            )}
          >
            <h2 id="public-mobile-navigation-title" className="sr-only">
              Perpetual Core navigation
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                "absolute right-4 top-4 flex h-10 w-10 items-center justify-center border focus-visible:outline-none focus-visible:ring-2",
                dark
                  ? "border-white/16 text-white/72 hover:bg-white/8 focus-visible:ring-[#8b7cff]"
                  : "rounded-full border-black/10 text-[#5f5f68] hover:bg-black/5 focus-visible:ring-[#5548d9]"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close navigation menu</span>
            </button>

            <div className={cn("border-b px-6 py-6 pr-16", dark ? "border-white/10" : "border-black/8")}>
              <Link href="/" className="flex min-h-11 items-center gap-2.5" onClick={() => setOpen(false)}>
                <CoreMark tone={tone} />
                <span className={cn("text-[15px] font-semibold tracking-[-0.02em]", dark ? "text-white" : "text-[#202024]")}>
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
                    onClick={() => setOpen(false)}
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
                    onClick={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
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
                <Link href="/contact-sales" onClick={() => setOpen(false)}>
                  Design your AI system
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
