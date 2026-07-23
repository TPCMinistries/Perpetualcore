import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, productSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

export const metadata = {
  title: "Development Intelligence — Perpetual Core",
  description:
    "Give an agent a development question, let it build an inspectable evidence plan, and turn authorized conversations into governed coaching intelligence.",
};

const useCases = [
  { title: "Ask an open development question", body: "Describe what you need to understand. The planning agent builds a purpose-specific rubric, evidence rules, and specialist team before analysis begins.", icon: Sparkles },
  { title: "Improve meetings and interviews", body: "Examine decisions, ownership, question quality, participation, examples, and follow-through without reducing people to a fixed score.", icon: Users },
  { title: "Develop people and leaders", body: "Convert grounded moments into coaching priorities, practice actions, commitments, and self-baselined progress over time.", icon: TrendingUp },
  { title: "Learn across the enterprise", body: "Ask governed questions across approved, minimized findings and see the supporting coverage, evidence boundaries, and limitations.", icon: BarChart3 },
];

const steps = [
  { number: "01", title: "State the development goal", body: "Tell the planning agent what you are trying to understand, the intended use, and what must remain outside the analysis.", icon: Sparkles },
  { number: "02", title: "Inspect the agent plan", body: "Review the selected specialists, dynamic rubric, evidence requirements, exclusions, and limitations before source material is analyzed.", icon: FileCheck2 },
  { number: "03", title: "Run, challenge, and review", body: "Specialists examine the authorized source in parallel; a safety challenge tests the claims before a human reviews the synthesis.", icon: ShieldCheck },
];

export default function DevelopmentIntelligenceProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[productSchema(PC_PRODUCTS["development-intelligence"]), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: "Development Intelligence", path: "/products/development-intelligence" }])]} />
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-[#f5f3ff]">
          <div className="absolute -right-28 -top-32 h-[460px] w-[460px] rounded-full border-[76px] border-indigo-100/80" aria-hidden="true" />
          <div className="container relative mx-auto grid gap-14 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3"><span aria-hidden className="block h-1.5 w-1.5 bg-indigo-600" /><p className="eyebrow !text-indigo-800">Perpetual Core · Development Intelligence</p></div>
              <h1 className="mt-8 max-w-4xl text-[42px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#1e1b4b] sm:text-[58px] lg:text-[72px]">
                Ask a better question. Get development intelligence you can inspect.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                Give the agent your goal. It builds the rubric, assembles the right specialist perspectives, challenges unsupported claims, and turns authorized conversations into evidence-linked coaching—with human review before use.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-12 bg-indigo-600 px-7 text-base hover:bg-indigo-700">
                  <Link href="/dashboard/development/agent">Open the agent studio <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-h-12 border-indigo-200 bg-white px-7 text-base text-indigo-950 hover:bg-indigo-50">
                  <Link href="/contact-sales">Discuss an enterprise pilot</Link>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Goal-directed agent plans</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Exact evidence excerpts</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Consent-controlled profiles</span>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Evidence report</p><p className="mt-1 font-semibold text-slate-950">Weekly leadership meeting</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Review required</span></div>
              <p className="mt-5 text-sm leading-6 text-slate-700">The team reached a clear decision and assigned ownership. The next coaching priority is converting verbal ownership into a dated commitment.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Demonstrated</p><p className="mt-2 font-semibold text-emerald-950">Clear ownership</p><p className="mt-1 text-xs leading-5 text-emerald-800">A decision had a named owner.</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coach next</p><p className="mt-2 font-semibold text-amber-950">Confirm the deadline</p><p className="mt-1 text-xs leading-5 text-amber-800">The due date was not stated.</p></div></div>
              <blockquote className="mt-3 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3 text-sm italic leading-6 text-indigo-950">“I’ll own the revised plan and bring it back to the team.”</blockquote>
              <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />Finding linked to exact evidence · pending human approval</div>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-20">
              <div><p className="eyebrow mb-3">§ 01</p><h2 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">What changes</h2></div>
              <div><h3 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">Most conversation tools summarize. This one plans, investigates, challenges, and helps you develop what happens next.</h3><div className="mt-10 grid gap-4 md:grid-cols-3">{[{ title: "A visible plan", body: "See the rubric, specialist roles, exclusions, and evidence rules before the run.", icon: FileCheck2 }, { title: "Evidence, not impressions", body: "Material claims must remain inspectable against short source excerpts.", icon: ShieldCheck }, { title: "Progress with permission", body: "Approved evidence enters a self-baselined profile only with separate, withdrawable consent.", icon: TrendingUp }].map((item) => <div key={item.title} className="border border-border bg-card p-6"><item.icon className="h-6 w-6 text-indigo-600" /><h4 className="mt-5 font-semibold text-foreground">{item.title}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></div>)}</div></div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface-hover/40 py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-20"><div><p className="eyebrow mb-3">§ 02</p><h2 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">Use cases</h2></div><div><h3 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">One governed agent system. As many development questions as the evidence can responsibly support.</h3><div className="mt-10 grid border border-border bg-card sm:grid-cols-2">{useCases.map((item) => <div key={item.title} className="border-b border-border p-6 last:border-b-0 sm:border-r sm:[&:nth-child(even)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"><item.icon className="h-6 w-6 text-indigo-600" /><h4 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></div>)}</div></div></div>
          </div>
        </section>

        <section className="border-b border-border py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8"><div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-20"><div><p className="eyebrow mb-3">§ 03</p><h2 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">How it works</h2></div><div><h3 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">From source to accountable development in three steps.</h3><div className="mt-10 grid gap-4 lg:grid-cols-3">{steps.map((step) => <div key={step.number} className="border border-border bg-card p-6"><div className="flex items-center justify-between"><span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">{step.number}</span><step.icon className="h-5 w-5 text-indigo-600" /></div><h4 className="mt-10 font-semibold text-foreground">{step.title}</h4><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p></div>)}</div></div></div></div>
        </section>

        <section className="border-b border-border bg-slate-950 py-20 text-white sm:py-28">
          <div className="container mx-auto grid gap-10 px-6 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div><div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><ShieldCheck className="h-5 w-5" />Responsible by design</div><h3 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">Development evidence without surveillance theater.</h3></div><div className="space-y-3 text-sm leading-6 text-slate-300">{["No deception, honesty, or integrity scoring", "No diagnosis, emotion-as-fact, accent grading, or protected-trait inference", "No automatic hire, reject, discipline, or promotion decisions", "Raw media is removed after short-lived private processing", "Human review before consequential use"].map((item) => <p key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{item}</p>)}</div></div>
        </section>

        <section className="py-20 sm:py-28"><div className="container mx-auto px-6 text-center sm:px-8"><Sparkles className="mx-auto h-7 w-7 text-indigo-600" /><h3 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Bring the question. Let the agent build the development plan.</h3><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Start with one authorized meeting or interview. Inspect the plan and evidence yourself before anything is approved or acted on.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><Button asChild size="lg" className="min-h-12 bg-indigo-600 px-7 hover:bg-indigo-700"><Link href="/dashboard/development/agent">Open the agent studio <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" size="lg" className="min-h-12 px-7"><Link href="/contact-sales">Plan an enterprise pilot</Link></Button></div></div></section>
      </main>

      <Footer />
    </div>
  );
}
