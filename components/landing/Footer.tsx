import Link from "next/link";
import { NewsletterCapture } from "./NewsletterCapture";

/**
 * Studio-frame footer — single source of truth for all public marketing
 * pages. Adds a "Studio" column linking to /studio, /studio/engagements,
 * /studio/methodology, /studio/process, /studio/case-studies, and /engine
 * per BRIEF_RECONCILED A4. Other columns preserve existing IA.
 *
 * © 2026 (per repositioning spec).
 */

const STUDIO_LINKS = [
  { label: "Studio overview", href: "/studio" },
  { label: "Retainers", href: "/studio/retainers" },
  { label: "Engagements", href: "/studio/engagements" },
  { label: "Methodology", href: "/studio/methodology" },
  { label: "Process", href: "/studio/process" },
  { label: "Case studies", href: "/studio/case-studies" },
  { label: "The Perpetual Engine", href: "/engine" },
];

const PRODUCT_LINKS = [
  { label: "Atlas", href: "/products/atlas", external: false },
  { label: "Atlas Discovery", href: "/products/atlas-discovery", external: false },
  { label: "Sentinel", href: "/products/sentinel", external: false },
  { label: "Sage", href: "/products/sage", external: false },
  { label: "Atelier", href: "https://atelier.perpetualcore.com", external: true },
  { label: "Vellum", href: "/products/vellum", external: false },
  { label: "RFP Engine", href: "https://rfp.perpetualcore.com", external: true },
  { label: "RFP Sentry", href: "/products/rfp-sentry", external: false },
  { label: "Press", href: "/products/press", external: false },
  { label: "Janice", href: "https://janice.perpetualcore.com", external: true },
];

const FUND_LINKS = [
  { label: "DeepFutures overview", href: "/fund" },
  { label: "Thesis", href: "/fund#thesis" },
  { label: "For founders", href: "mailto:lorenzo@perpetualcore.com?subject=DeepFutures%20%E2%80%94%20founder%20intro" },
  { label: "For LPs", href: "mailto:lorenzo@perpetualcore.com?subject=DeepFutures%20%E2%80%94%20LP%20inquiry" },
];

const INSTITUTE_LINKS = [
  { label: "The Institute (IHA)", href: "/institute" },
  { label: "Uplift Communities", href: "https://upliftcommunities.com", external: true },
  { label: "Founders 1,000", href: "https://theiha.org/founders", external: true },
  { label: "Academy", href: "https://academy.theiha.org", external: true },
  { label: "Visit theiha.org", href: "https://theiha.org", external: true },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Industries", href: "/solutions" },
  { label: "Furniture / FF&E", href: "/solutions/furniture-ff-e" },
  { label: "Local business", href: "/solutions/local-business" },
  { label: "Professional services", href: "/solutions/professional-services" },
  { label: "Contact", href: "/contact-sales" },
];

const RESOURCE_LINKS = [
  { label: "How to start", href: "/start" },
  { label: "Starter packages", href: "/packages" },
  { label: "AI OS Map", href: "/lead-magnet" },
  { label: "Buyer's guide", href: "/guide/ai-implementation-buyers-guide" },
  { label: "Compare", href: "/compare" },
  { label: "Notes", href: "/blog" },
  { label: "Help", href: "/help" },
  { label: "Docs", href: "/docs" },
  { label: "Status", href: "/status" },
  { label: "Developers", href: "/developers" },
];

const LEGAL_LINKS = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
  { label: "Accessibility", href: "/accessibility" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background py-16">
      <div className="container mx-auto px-6 sm:px-8">
        {/* Newsletter strip */}
        <div className="grid md:grid-cols-[1fr_auto] gap-6 md:items-center pb-10 mb-10 border-b border-border/60">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Notes from the operating layer.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              Occasional dispatches on AI installs, the engine commitment, and what we're shipping. No spam, no funnel tricks. Unsubscribe any time.
            </p>
          </div>
          <NewsletterCapture variant="footer" source="footer" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-8 mb-10">
          {/* Brand column */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span aria-hidden className="block h-3 w-3 bg-foreground" />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Perpetual Core
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The first-of-its-kind venture studio attached to the Perpetual Engine.
            </p>
          </div>

          {/* Studio column — new per BRIEF_RECONCILED A4 */}
          <div>
            <h4 className="eyebrow mb-4">Studio</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {STUDIO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products column */}
          <div>
            <h4 className="eyebrow mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="hover:text-primary transition">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Fund column — new arm 03 */}
          <div>
            <h4 className="eyebrow mb-4">Fund</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {FUND_LINKS.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a href={link.href} className="hover:text-primary transition">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="hover:text-primary transition">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Institute column — new arm 04 */}
          <div>
            <h4 className="eyebrow mb-4">Institute</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {INSTITUTE_LINKS.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="hover:text-primary transition">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company column — about/pricing/industries/contact */}
          <div>
            <h4 className="eyebrow mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column — notes, help, docs, status */}
          <div>
            <h4 className="eyebrow mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="eyebrow mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-8 flex flex-col md:flex-row md:justify-between md:items-start gap-3 text-sm text-muted-foreground">
          <p>© 2026 Perpetual Core. All rights reserved.</p>
          <p className="text-xs md:text-right max-w-md leading-[1.6]">
            10–15% of every revenue dollar funds the{" "}
            <a
              href="https://theiha.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Institute for Human Advancement
            </a>
            <span className="text-muted-foreground/80">
              {" "}· 501(c)(3) · EIN 41-5182519 · Audited annually.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
