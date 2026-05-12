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
  { label: "Engagements", href: "/studio/engagements" },
  { label: "Methodology", href: "/studio/methodology" },
  { label: "Process", href: "/studio/process" },
  { label: "Case studies", href: "/studio/case-studies" },
  { label: "The Perpetual Engine", href: "/engine" },
];

const PRODUCT_LINKS = [
  { label: "Platform", href: "/products/platform" },
  { label: "Atlas", href: "/products/atlas" },
  { label: "Atlas Discovery", href: "/products/atlas-discovery" },
  { label: "Sentinel", href: "/products/sentinel" },
  { label: "Sage", href: "/products/sage" },
  { label: "Vellum", href: "/products/vellum" },
  { label: "RFP Engine", href: "/products/rfp-engine" },
  { label: "RFP Sentry", href: "/products/rfp-sentry" },
];

const RESOURCES_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
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
        <div className="grid md:grid-cols-5 gap-8 mb-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="mb-4">
              {/* Wordmark — Newsreader regular */}
              <span className="font-serif text-base font-normal tracking-tight text-foreground">
                Perpetual Core
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The AI-first studio that installs operating systems for mission-driven organizations.
            </p>
          </div>

          {/* Studio column — new per BRIEF_RECONCILED A4 */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Studio</h4>
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
            <h4 className="font-semibold mb-4 text-sm">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {RESOURCES_LINKS.map((link) => (
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
            <h4 className="font-semibold mb-4 text-sm">Legal</h4>
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
