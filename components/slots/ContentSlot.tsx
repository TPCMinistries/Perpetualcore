import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSlotContent } from "@/lib/slots/read";

/**
 * Renders a DB-backed content slot. Server component — reads at request
 * time (through the slot's own 60s cache). Returns null on empty/unknown
 * content so the host page has zero wrapper, zero gap, until an agent writes.
 */
export async function ContentSlot({ slotKey }: { slotKey: string }) {
  const content = await getSlotContent(slotKey);
  if (!content) return null;

  if (content.type === "banner") {
    return (
      <div className="border-b border-border bg-foreground text-background">
        <div className="container mx-auto px-6 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-center">
          <p className="text-sm font-medium">{content.headline}</p>
          {content.body && (
            <p className="hidden sm:block text-sm text-background/70">{content.body}</p>
          )}
          {content.cta && (
            <Link
              href={content.cta.href}
              className="inline-flex items-center text-sm font-medium underline underline-offset-2 hover:no-underline shrink-0"
            >
              {content.cta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (content.items.length === 0) return null;

  return (
    <div className="border-y border-border">
      {content.items.map((item, i) => (
        <div key={`${item.ts}-${i}`} className="py-6 border-b border-border last:border-b-0">
          <div className="flex items-baseline gap-4 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              {item.project}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {new Date(item.ts).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2">
            {item.what}
          </h3>
          {item.whyItMatters && (
            <p className="text-sm text-muted-foreground leading-[1.6]">{item.whyItMatters}</p>
          )}
        </div>
      ))}
    </div>
  );
}
