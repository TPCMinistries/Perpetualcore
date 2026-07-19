import {
  Baby,
  BriefcaseBusiness,
  Building2,
  MessagesSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisComposer } from "@/components/development-intelligence/AnalysisComposer";
import { AnalysisList } from "@/components/development-intelligence/AnalysisList";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { listAnalyses } from "@/lib/development-intelligence/store";
import type { DevelopmentAnalysisRecord } from "@/lib/development-intelligence/store";

export const dynamic = "force-dynamic";

const lenses = [
  {
    title: "Enterprise meetings",
    description: "Decisions, participation, commitments, and recurring issues.",
    icon: Building2,
    status: "Active",
  },
  {
    title: "Workforce interviews",
    description: "Candidate coaching and interviewer-quality evidence.",
    icon: BriefcaseBusiness,
    status: "Active",
  },
  {
    title: "Leadership development",
    description: "Direction, listening, alignment, and communication growth.",
    icon: TrendingUp,
    status: "Active",
  },
  {
    title: "Family speech growth",
    description: "Guardian-controlled longitudinal speech development.",
    icon: Baby,
    status: "Separate vault required",
  },
];

export default async function DevelopmentIntelligencePage() {
  const identity = await getDevelopmentIdentity();
  let analyses: DevelopmentAnalysisRecord[] = [];
  let databaseReady = true;

  if (identity) {
    try {
      analyses = await listAnalyses(identity, { limit: 12 });
    } catch {
      databaseReady = false;
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_0.6fr] md:px-10 md:py-10">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <MessagesSquare className="h-4 w-4" />
              Human Development Intelligence
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Turn authorized conversations into evidence, coaching, and accountable growth.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Perpetual Core analyzes what was actually said, links every observation
              to evidence, and keeps consequential decisions with qualified humans.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Evidence-first boundary
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>No deception or integrity scoring</li>
              <li>No diagnosis or protected-trait inference</li>
              <li>No automatic hiring decisions</li>
              <li>Human review before publication or action</li>
            </ul>
          </div>
        </div>
      </section>

      {!databaseReady && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The Development Intelligence interface is installed, but its reviewed
          Supabase migration still needs to be applied before reports can be saved.
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-950">Development lenses</h2>
          <p className="mt-1 text-sm text-slate-600">
            One governed engine, with separate privacy and decision boundaries.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lenses.map((lens) => (
            <Card key={lens.title}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                    <lens.icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      lens.status === "Active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }
                  >
                    {lens.status}
                  </Badge>
                </div>
                <CardTitle className="pt-2 text-base">{lens.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{lens.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <AnalysisComposer />

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Human review queue</h2>
            <p className="mt-1 text-sm text-slate-600">
              AI observations remain provisional until a reviewer approves them.
            </p>
          </div>
          <Badge variant="outline">{analyses.length} recent</Badge>
        </div>
        <AnalysisList analyses={analyses} />
      </section>
    </div>
  );
}
