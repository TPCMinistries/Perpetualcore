import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsletterCapture } from "./NewsletterCapture";

const MARKETPLACE_LINKS = [
  { label: "Browse all", href: "/marketplace" },
  { label: "Run and coordinate", href: "/marketplace#run-coordinate" },
  { label: "Find and win", href: "/marketplace#find-win" },
  { label: "Know and decide", href: "/marketplace#know-decide" },
  { label: "Hire and develop", href: "/marketplace#hire-develop" },
  { label: "Create and distribute", href: "/marketplace#create-distribute" },
] as const;

const PLATFORM_LINKS = [
  { label: "Operating layer", href: "/#operating-layer" },
  { label: "The Perpetual Engine", href: "/engine" },
  { label: "Studio", href: "/studio" },
  { label: "Methodology", href: "/studio/methodology" },
  { label: "Engagements", href: "/studio/engagements" },
  { label: "Pricing", href: "/pricing" },
] as const;

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "DeepFutures", href: "/fund" },
  { label: "The Institute", href: "/institute" },
  { label: "Industries", href: "/solutions" },
  { label: "Notes", href: "/blog" },
  { label: "Contact", href: "/contact-sales" },
] as const;

const RESOURCE_LINKS = [
  { label: "AI OS Map", href: "/lead-magnet" },
  { label: "Buyer’s guide", href: "/guide/ai-implementation-buyers-guide" },
  { label: "Compare", href: "/compare" },
  { label: "Help", href: "/help" },
  { label: "Docs", href: "/docs" },
  { label: "Status", href: "/status" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background py-16">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="grid gap-6 border-b border-border/70 pb-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Notes from the operating layer.
            </p>
            <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
              Dispatches on company systems, governed AI, product builds, and what
              the field is teaching us.
            </p>
          </div>
          <NewsletterCapture variant="footer" source="footer" />
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
              <span aria-hidden="true" className="h-3.5 w-3.5 bg-primary" />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Perpetual Core
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              An operator-built AI systems company: governed intelligence,
              specialized products, and a studio that installs them into real
              organizations.
            </p>
          </div>

          {[
            { title: "Marketplace", links: MARKETPLACE_LINKS },
            { title: "Platform", links: PLATFORM_LINKS },
            { title: "Company", links: COMPANY_LINKS },
            { title: "Resources", links: RESOURCE_LINKS },
          ].map((group) => (
            <div key={group.title}>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 border-t border-border/70 pt-7 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>© 2026 Perpetual Core.</span>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
          </div>
          <a
            href="https://theiha.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            A share of revenue supports the Institute for Human Advancement
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
