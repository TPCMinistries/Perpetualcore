import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export function PressConsoleHeader({ eyebrow = "Press console", title, description }: { eyebrow?: string; title: string; description: string }) {
  return (
    <header className="relative overflow-hidden border border-black/10 bg-[#f6f1e8] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#c7f34b]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 right-24 hidden h-36 w-36 bg-[#ffcc30] lg:block" aria-hidden />
      <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b5c]" aria-hidden />
            {eyebrow}
          </div>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.6rem,7vw,5.8rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#121214]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <Link
            href="#new-recording"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff3b5c] px-6 text-sm font-black text-[#121214] transition-colors duration-200 hover:bg-[#ff7288] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-offset-2"
          >
            Add a recording <ArrowDown className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="https://press.perpetualcore.com/product"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-6 text-sm font-semibold text-black/70 transition-colors duration-200 hover:border-black/30 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]"
          >
            See how it works <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/press/studio/stories"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-6 text-sm font-semibold text-black/70 transition-colors duration-200 hover:border-black/30 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]"
          >
            Stories <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
