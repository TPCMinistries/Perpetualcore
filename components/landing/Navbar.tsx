"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const solutionCategories = [
  {
    label: "Professional Services",
    items: [
      { name: "Law Firms", href: "/solutions/law-firms" },
      { name: "Accounting", href: "/solutions/accountants" },
      { name: "Consulting", href: "/solutions/consulting" },
      { name: "Financial Advisors", href: "/solutions/financial-advisors" },
    ],
  },
  {
    label: "Service Industries",
    items: [
      { name: "Healthcare", href: "/solutions/healthcare" },
      { name: "Real Estate", href: "/solutions/real-estate" },
      { name: "IT Services", href: "/solutions/it-services" },
      { name: "Sales Teams", href: "/solutions/sales" },
    ],
  },
  {
    label: "Organizations",
    items: [
      { name: "Agencies", href: "/solutions/agencies" },
      { name: "Churches", href: "/solutions/churches" },
      { name: "Non-Profits", href: "/solutions/non-profits" },
      { name: "Education", href: "/solutions/education" },
    ],
  },
];

const featuresItems = [
  { name: "Intelligence System", href: "/features/intelligence" },
  { name: "Agents Library", href: "/agents" },
  { name: "All Features", href: "#features" },
];

const enterpriseItems = [
  { name: "Transformation Stack", href: "/consulting" },
  { name: "Guided Implementation", href: "/consultation" },
  { name: "Enterprise Solutions", href: "/enterprise-demo" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300">
            <span className="text-xs font-black text-white tracking-tighter">
              AI
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Perpetual Core
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Solutions Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
              Solutions
              <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-y-0.5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="w-[560px] rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/10">
                <div className="grid grid-cols-3 gap-6">
                  {solutionCategories.map((category) => (
                    <div key={category.label}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {category.label}
                      </p>
                      <div className="space-y-1">
                        {category.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-3 py-2 text-sm rounded-lg hover:bg-accent/80 transition-colors text-foreground/80 hover:text-foreground"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Features Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
              Features
              <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-y-0.5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="w-[220px] rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/10">
                {featuresItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2.5 text-sm rounded-lg hover:bg-accent/80 transition-colors text-foreground/80 hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <Link
            href="/pricing"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
          >
            Pricing
          </Link>

          {/* Enterprise Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
              Enterprise
              <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-y-0.5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="w-[230px] rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/10">
                {enterpriseItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2.5 text-sm rounded-lg hover:bg-accent/80 transition-colors text-foreground/80 hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Button
            asChild
            className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-primary via-purple-600 to-purple-700 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 border-0"
          >
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent/50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[320px] backdrop-blur-xl bg-background/95 border-border/50"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-purple-600 to-purple-700 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white tracking-tighter">
                      AI
                    </span>
                  </div>
                  Perpetual Core
                </SheetTitle>
              </SheetHeader>

              <div className="mt-8 flex flex-col gap-1">
                {/* Solutions */}
                <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Solutions
                </p>
                {solutionCategories.map((category) => (
                  <div key={category.label} className="mb-2">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground/70">
                      {category.label}
                    </p>
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-accent/80 transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}

                {/* Features */}
                <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Features
                </p>
                {featuresItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-accent/80 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Pricing */}
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm rounded-lg hover:bg-accent/80 transition-colors mt-2"
                >
                  Pricing
                </Link>

                {/* Enterprise */}
                <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Enterprise
                </p>
                {enterpriseItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-accent/80 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}

                {/* CTA Buttons */}
                <div className="mt-6 flex flex-col gap-3 px-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl border border-border"
                  >
                    Sign In
                  </Link>
                  <Button
                    asChild
                    className="w-full rounded-xl bg-gradient-to-r from-primary via-purple-600 to-purple-700 border-0"
                  >
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Get Started Free
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
