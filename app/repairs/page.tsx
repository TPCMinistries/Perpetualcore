import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { RepairBrief } from "./RepairBrief";

export const metadata = {
  title: "Application & Workflow Repairs",
  description: "A focused repair for one failing Next.js application path or automation. $300 for accepted scope, with verification and a short runbook. Request an inspection.",
};

const INCLUDED = ["One reproducible failing path", "At most two connected systems", "A scoped fix and verification of the affected flow", "Failure visibility where relevant", "A short runbook explaining the change and checks"];
const STEPS = [
  ["Describe the break", "Send a sanitized brief: the tools involved, what should happen, and what happens instead."],
  ["Agree on the scope", "We inspect the issue and confirm whether the $300 repair fits. Access, acceptance checks, payment terms and turnaround are agreed in writing before work begins."],
  ["Review the result", "We implement the accepted repair and provide verification evidence and a short runbook. Production changes follow the agreed release process."],
];

export default function RepairsPage() {
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <section className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <p className="eyebrow mb-9">Perpetual Core Studio · Focused repairs</p>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-20">
          <div>
            <h1 className="display-hero text-[42px] leading-[1.05] sm:text-6xl lg:text-7xl max-w-3xl">One broken workflow.<br /><span className="italic text-foreground/80">A clear path to repair.</span></h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">For small businesses and agencies with a Next.js application or automation that fails at a specific step. Bring the issue; we inspect it, agree on the fix, and verify the result.</p>
            <Button asChild size="lg" className="mt-9 h-12 px-6"><Link href="#repair-brief">Prepare a repair brief <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <p className="mt-4 text-sm text-muted-foreground">Start with a scope review. We confirm price and turnaround after inspection.</p>
          </div>
          <aside aria-label="Repair scope and price" className="self-start border border-border p-7 sm:p-9">
            <p className="eyebrow">Accepted repair scope</p>
            <p className="my-5 text-5xl font-semibold tracking-tight">$300 <span className="text-base font-normal text-muted-foreground">USD · fixed</span></p>
            <ul className="space-y-4">{INCLUDED.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}</ul>
            <p className="mt-7 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">Full rebuilds, additional workflows and third-party fees fall outside this scope. If the issue is larger, we explain that before any commitment.</p>
          </aside>
        </div>
      </section>
      <section className="border-y border-border bg-surface-hover/40 py-16">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">A good fit looks like this</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div><h3 className="text-lg font-medium">An application flow that breaks</h3><p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">A form fails, an API response is handled incorrectly, or one page stops working after a change. You can show the failing path and provide authorized access for inspection.</p></div>
            <div><h3 className="text-lg font-medium">An automation that needs attention</h3><p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">Records duplicate, fields arrive blank, or a workflow stops without an alert. We first establish the failure and what a correct run should produce.</p></div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <h2 className="text-3xl font-semibold tracking-tight">From the first brief to a verified change.</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">{STEPS.map(([title, body], index) => <li key={title} className="border-t border-border pt-6"><p className="eyebrow mb-5">0{index + 1}</p><h3 className="text-xl font-medium">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p></li>)}</ol>
      </section>
      <section id="repair-brief" className="scroll-mt-24 border-t border-border py-16 sm:py-20">
        <div className="container mx-auto grid gap-10 px-6 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div><p className="eyebrow mb-5">Start here</p><h2 id="brief-title" className="text-3xl sm:text-4xl font-semibold tracking-tight">Tell us where it breaks.</h2><p className="mt-5 text-muted-foreground leading-relaxed">Prepare a short email to Lorenzo at Perpetual Core. An accurate description helps us decide whether this focused repair is the right fit.</p><p className="mt-6 text-sm leading-relaxed text-muted-foreground">We use AI-assisted engineering for diagnosis, implementation and testing. Each engagement still needs access, defined acceptance checks and evidence that the affected flow works.</p></div>
          <RepairBrief />
        </div>
      </section>
      <section className="border-t border-border py-16">
        <div className="container mx-auto max-w-4xl px-6 sm:px-8">
          <h2 className="text-2xl font-semibold mb-8">Before you send</h2>
          {[
            ["When can work begin?", "After inspection, access and written scope agreement. We confirm a realistic turnaround for the specific issue; submitting a brief does not reserve a deadline."],
            ["What if the problem is outside the scope?", "We explain the limitation and any proposed alternative. There is no automatic upgrade, subscription or charge from this page."],
            ["Should I send credentials or customer data?", "No. Begin with a sanitized description. If access is needed, we agree on a suitable access method and permissions separately."],
          ].map(([question, answer]) => <details key={question} className="border-t border-border py-5"><summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{question}</summary><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
