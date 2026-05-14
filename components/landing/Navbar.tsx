"use client";

/**
 * Studio-frame navbar — single source of truth for all public marketing pages.
 *
 * Top-level: Studio | Products | Industries | Pricing | About    [Sign In] [Start Engagement]
 * Per BRIEF_RECONCILED A3 + BRAND_ARCHITECTURE §7.
 *
 * Replaces three legacy navbar implementations (homepage inline, /consulting,
 * /solutions/*) with a single component. Use everywhere public-facing.
 */

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

// Industries dropdown — links into existing /solutions/* pages
const SOLUTION_LINKS: { label: string; href: string; group: string }[] = [
  { label: "Healthcare", href: "/solutions/healthcare", group: "Service" },
  { label: "Non-Profits", href: "/solutions/non-profits", group: "Service" },
  { label: "Education", href: "/solutions/education", group: "Service" },
  { label: "Churches", href: "/solutions/churches", group: "Service" },
  { label: "Law Firms", href: "/solutions/law-firms", group: "Professional" },
  { label: "Accounting", href: "/solutions/accountants", group: "Professional" },
  { label: "Consulting", href: "/solutions/consulting", group: "Professional" },
  { label: "Financial Advisors", href: "/solutions/financial-advisors", group: "Professional" },
  { label: "Real Estate", href: "/solutions/real-estate", group: "Other" },
  { label: "IT Services", href: "/solutions/it-services", group: "Other" },
  { label: "Sales Teams", href: "/solutions/sales", group: "Other" },
  { label: "Creative Agencies", href: "/solutions/agencies", group: "Other" },
];

const STUDIO_LINKS = [
  { label: "Engagements", href: "/studio/engagements", description: "$75K floor — install the Engine" },
  { label: "Methodology", href: "/studio/methodology", description: "Learn → Wire → Automate → Scale" },
  { label: "Process", href: "/studio/process", description: "Day 1 to Month 6 timeline" },
  { label: "Case Studies", href: "/studio/case-studies", description: "Abstracted to sector and constraint" },
];

const PRODUCT_LINKS = [
  { label: "Platform", href: "/products/platform", description: "AI OS for individuals and small teams" },
  { label: "Atlas", href: "/products/atlas", description: "AI-native COO for fund-backed portcos" },
  { label: "Sentinel", href: "/products/sentinel", description: "Due diligence and intel — live" },
  { label: "Sage", href: "/products/sage", description: "Coach + chief of staff" },
  { label: "Vellum", href: "/products/vellum", description: "Institutional memory" },
  { label: "RFP Engine", href: "/products/rfp-engine", description: "Find, draft, ship RFPs" },
  { label: "RFP Sentry", href: "/products/rfp-sentry", description: "Bid intelligence + compliance gate" },
];

function DropdownPanel({
  children,
  align = "left",
  width = "w-72",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  return (
    <div
      className={`absolute top-full mt-2 ${width} backdrop-blur-2xl bg-card/95 border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <div className="p-2">{children}</div>
    </div>
  );
}

export function Navbar() {
  const groupedSolutions: Record<string, typeof SOLUTION_LINKS> = {};
  for (const s of SOLUTION_LINKS) {
    groupedSolutions[s.group] = groupedSolutions[s.group] || [];
    groupedSolutions[s.group].push(s);
  }

  return (
    <header className="border-b border-border/40 backdrop-blur-2xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          {/* TODO: replace placeholder logo block with real Perpetual Core wordmark/mark */}
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
            PC
          </div>
          <span className="text-lg sm:text-xl font-semibold tracking-tight">Perpetual Core</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {/* Studio dropdown */}
          <div className="relative group">
            <Link
              href="/studio"
              className="text-sm font-medium hover:text-primary transition flex items-center gap-1"
            >
              Studio <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
            </Link>
            <DropdownPanel width="w-72">
              {STUDIO_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm hover:bg-accent rounded-md transition"
                >
                  <div className="font-medium">{link.label}</div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </Link>
              ))}
            </DropdownPanel>
          </div>

          {/* Products dropdown */}
          <div className="relative group">
            <Link
              href="/products"
              className="text-sm font-medium hover:text-primary transition flex items-center gap-1"
            >
              Products <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
            </Link>
            <DropdownPanel width="w-80">
              {PRODUCT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm hover:bg-accent rounded-md transition"
                >
                  <div className="font-medium">{link.label}</div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </Link>
              ))}
            </DropdownPanel>
          </div>

          {/* Industries dropdown — links into existing /solutions/* pages */}
          <div className="relative group">
            <Link
              href="/solutions"
              className="text-sm font-medium hover:text-primary transition flex items-center gap-1"
            >
              Industries <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
            </Link>
            <DropdownPanel width="w-72">
              {Object.entries(groupedSolutions).map(([group, items]) => (
                <div key={group}>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group}
                  </div>
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-border my-2" />
                </div>
              ))}
              <Link
                href="/solutions"
                className="block px-3 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition"
              >
                View all industries →
              </Link>
            </DropdownPanel>
          </div>

          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition">
            Pricing
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition">
            About
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium hover:underline">
            Sign In
          </Link>
          <Button asChild className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/studio/engagements">Start Engagement</Link>
          </Button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <PublicMobileNav />
          <Button size="sm" asChild className="h-9 px-4 text-sm font-semibold shadow-md active:scale-95 transition-all">
            <Link href="/studio/engagements">Start</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
