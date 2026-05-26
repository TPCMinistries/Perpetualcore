/**
 * EngagementBanner — top-of-page banner shown above /solutions/* pages
 * to redirect engagement-grade buyers to /studio/engagements.
 *
 * Per Session 3 brief Step 7. The /solutions/* pages remain in place
 * (legacy SEO surfaces, A/B-tested vertical content) but a banner
 * surfaces the studio engagement frame so the buyer with the budget
 * lands in the right funnel — not on a SaaS-tier comparison page.
 *
 * Visual register matches the studio frame (mono-violet, no orbs,
 * font-semibold) per UI audit §5. The banner sits between the page's
 * own <header> and the first <section> on each solutions page.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function EngagementBanner() {
  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-sm text-foreground">
            <span className="font-medium">Looking for an engagement?</span>{" "}
            <span className="text-muted-foreground">
              Map the company first, then choose the strongest workflow to install.
            </span>
          </p>
          <Link
            href="/contact-sales"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
          >
            Map the system <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
