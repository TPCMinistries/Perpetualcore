import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SkipLink } from "@/components/ui/accessibility";
import type { LegalDocument } from "@/lib/legal/public-documents";

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return <div className="min-h-screen bg-[#f7f6f2] text-[#17171b]"><SkipLink /><Navbar /><main id="main-content" className="mx-auto max-w-[1120px] px-5 py-14 sm:px-8 sm:py-20">
    <Link href="/legal" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#5146c7] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5146c7]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Legal center</Link>
    <header className="mt-8 border-b border-black/15 pb-10"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5146c7]">Perpetual Core / Legal</p><h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-6xl">{document.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#55555e]">{document.description}</p><p className="mt-6 text-sm font-medium">Effective {document.effective}</p></header>
    {document.notice ? <aside className="mt-8 border-l-4 border-[#5146c7] bg-white p-5 text-sm leading-6" aria-label="Important notice">{document.notice}</aside> : null}
    <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]"><nav aria-label={`${document.title} sections`} className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs font-semibold uppercase tracking-[0.14em]">On this page</p><ol className="mt-4 space-y-2 text-sm text-[#5d5d66]">{document.sections.map((section, index) => <li key={section.heading}><a className="inline-flex min-h-8 items-center hover:text-[#5146c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5146c7]" href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ol></nav>
      <article className="max-w-3xl">{document.sections.map((section, index) => <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-28 border-b border-black/10 pb-9 pt-1 last:border-0"><h2 className="text-2xl font-semibold tracking-[-0.02em]">{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 text-[16px] leading-7 text-[#4e4e56]">{paragraph}</p>)}{section.items ? <ul className="mt-4 list-disc space-y-3 pl-6 text-[16px] leading-7 text-[#4e4e56]">{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}</article>
    </div>
  </main><Footer /></div>;
}
