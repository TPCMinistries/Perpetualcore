import Link from "next/link";
import { ArrowUpRight, Newspaper } from "lucide-react";

export function PressConsoleHeader({ eyebrow = "Press console", title, description }: { eyebrow?: string; title: string; description: string }) {
  return (
    <header className="border-b border-zinc-300 pb-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            <Newspaper className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">{description}</p>
        </div>
        <Link
          href="/products/press"
          className="inline-flex min-h-11 items-center self-start border-b border-zinc-400 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-4 sm:self-auto"
        >
          About Press <ArrowUpRight className="ml-1.5 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
