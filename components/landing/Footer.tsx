import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsletterCapture } from "./NewsletterCapture";

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "Products", href: "/marketplace" },
      { label: "Platform", href: "/#operating-layer" },
      { label: "Solutions", href: "/solutions" },
      { label: "Studio", href: "/studio" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "DeepFutures", href: "/fund" },
      { label: "The Institute", href: "/institute" },
      { label: "Notes", href: "/blog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Buyer’s guide", href: "/guide/ai-implementation-buyers-guide" },
      { label: "Pricing", href: "/pricing" },
      { label: "Help", href: "/help" },
      { label: "Contact", href: "/contact-sales" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-black/8 bg-[#f7f6f2]">
      <div className="mx-auto max-w-[1280px] px-6 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 border-b border-black/8 pb-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-[5px] bg-[linear-gradient(135deg,#5548d9,#806dff_55%,#64d6b0)]"
              />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#202024]">
                Perpetual Core
              </span>
            </Link>
            <p className="mt-4 max-w-lg text-base leading-7 text-[#62626c]">
              Specialized AI products that solve real operating jobs—and connect
              through Sage as the company grows.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2b2b31]">
              Notes from the operating layer
            </p>
            <p className="mb-4 mt-1 text-sm text-[#707079]">
              Product builds, governed AI, and what the field is teaching us.
            </p>
            <NewsletterCapture variant="footer" source="footer" />
          </div>
        </div>

        <div className="grid gap-10 py-10 sm:grid-cols-3 lg:max-w-[760px]">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f2f35]">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-[#686871]">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-[#5548d9] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 border-t border-black/8 pt-7 text-xs text-[#73737b] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>© 2026 Perpetual Core.</span>
            <Link href="/terms" className="hover:text-[#25252b]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#25252b]">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-[#25252b]">
              Cookies
            </Link>
          </div>
          <a
            href="https://theiha.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#25252b]"
          >
            A share of revenue supports the Institute for Human Advancement
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
