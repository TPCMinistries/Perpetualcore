import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/dashboard/changelog" },
  ],
  Solutions: [
    { label: "Healthcare", href: "/solutions/healthcare" },
    { label: "Law Firms", href: "/solutions/law-firms" },
    { label: "Education", href: "/solutions/education" },
    { label: "All Solutions", href: "/solutions" },
  ],
  Company: [
    { label: "Contact Sales", href: "/contact-sales" },
  ],
  Legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 backdrop-blur-xl bg-card/60">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Top: Logo + Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Logo + Tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-xs font-black text-white tracking-tighter">AI</span>
              </div>
              <span className="text-lg font-bold tracking-tight">Perpetual Core</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              The AI operating system that remembers everything.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-4 tracking-wide">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: Copyright */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            &copy; 2025 Perpetual Core. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
