import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsletterCapture } from "./NewsletterCapture";
import { CoreMark } from "./CoreMark";
import { cn } from "@/lib/utils";

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "Products", href: "/marketplace" },
      { label: "How it works", href: "/#intelligence-layer" },
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

export function Footer({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";

  return (
    <footer
      className={cn(
        "border-t",
        dark
          ? "border-white/10 bg-[#050507] text-white"
          : "border-black/8 bg-[#f7f6f2]"
      )}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16">
        <div
          className={cn(
            "grid gap-10 border-b pb-12 lg:grid-cols-[1.1fr_1fr] lg:items-end",
            dark ? "border-white/10" : "border-black/8"
          )}
        >
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
              <CoreMark tone={tone} />
              <span
                className={cn(
                  "text-[15px] font-semibold tracking-[-0.02em]",
                  dark ? "text-white" : "text-[#202024]"
                )}
              >
                Perpetual Core
              </span>
            </Link>
            <p className={cn("mt-4 max-w-lg text-base leading-7", dark ? "text-white/66" : "text-[#62626c]")}>
              Specialized AI systems for real operating work—connected through
              Sage without surrendering human authority.
            </p>
          </div>
          <div>
            <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-[#2b2b31]")}>
              Notes from the operating layer
            </p>
            <p className={cn("mb-4 mt-1 text-sm", dark ? "text-white/60" : "text-[#66666f]")}>
              Product builds, governed AI, and what the field is teaching us.
            </p>
            <NewsletterCapture variant="footer" source="footer" tone={tone} />
          </div>
        </div>

        <div className="grid gap-10 py-10 sm:grid-cols-3 lg:max-w-[760px]">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h2
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.12em]",
                  dark ? "text-white/86" : "text-[#2f2f35]"
                )}
              >
                {group.title}
              </h2>
              <ul className={cn("mt-4 space-y-2 text-sm", dark ? "text-white/64" : "text-[#62626c]")}>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "inline-flex min-h-8 items-center transition-colors focus-visible:outline-none focus-visible:ring-2",
                        dark
                          ? "hover:text-[#54e6b1] focus-visible:ring-[#8b7cff]"
                          : "hover:text-[#5548d9] focus-visible:rounded-sm focus-visible:ring-[#5548d9]"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "flex flex-col gap-5 border-t pt-7 text-xs lg:flex-row lg:items-center lg:justify-between",
            dark
              ? "border-white/10 text-white/64"
              : "border-black/8 text-[#5f5f68]"
          )}
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>© 2026 Perpetual Core.</span>
            <Link
              href="/terms"
              className={cn("inline-flex min-h-6 items-center", dark ? "hover:text-white" : "hover:text-[#25252b]")}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className={cn("inline-flex min-h-6 items-center", dark ? "hover:text-white" : "hover:text-[#25252b]")}
            >
              Privacy
            </Link>
            <Link
              href="/cookies"
              className={cn("inline-flex min-h-6 items-center", dark ? "hover:text-white" : "hover:text-[#25252b]")}
            >
              Cookies
            </Link>
          </div>
          <a
            href="https://theiha.org"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 transition-colors",
              dark ? "hover:text-white" : "hover:text-[#25252b]"
            )}
          >
            A share of revenue supports the Institute for Human Advancement
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
