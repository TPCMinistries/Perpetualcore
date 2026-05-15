import Link from "next/link";

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
  { label: "Vellum", href: "/products/vellum", external: false },
  { label: "RFP Engine", href: "https://rfp.perpetualcore.com", external: true },
  { label: "RFP Sentry", href: "/products/rfp-sentry", external: false },
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
  { label: "Pricing", href: "/pricing" },
  { label: "Industries", href: "/solutions" },
  { label: "Contact", href: "/contact-sales" },
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
        <div className="grid md:grid-cols-6 gap-8 mb-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <span aria-hidden className="block h-3 w-3 bg-foreground" />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Perpetual Core
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The AI-first studio that installs operating systems for mission-driven organizations.
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

        <div className="border-t border-border/60 pt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-sm text-muted-foreground">
          <p>© 2026 Perpetual Core. All rights reserved.</p>
          <p className="text-xs">
            10% of every engagement funds the{" "}
            <a
              href="https://theiha.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Institute for Human Advancement
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
