"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

type Answer = "map" | "sprint" | "lane";

const questions = [
  { id: "clarity", prompt: "How clear is the first workflow?", options: [["map", "We know the operation is strained, but not where to begin."], ["sprint", "One recurring workflow and its owner are already visible."], ["lane", "The workflow is live and needs ongoing operating capacity."]] },
  { id: "evidence", prompt: "What decision must this work support?", options: [["map", "Choose the safest, highest-value first investment."], ["sprint", "Prove one workflow in production before expanding."], ["lane", "Maintain and improve a strategically important lane."]] },
  { id: "ownership", prompt: "What does your team need from Perpetual Core?", options: [["map", "Diagnosis, economics, boundaries, and a 90-day sequence."], ["sprint", "A bounded implementation, training, and launch evidence."], ["lane", "A named operating rhythm, capacity, and monthly review."]] },
] as const;

const results = {
  map: { name: "Operating System Map", reason: "You need a decision before you need a build.", next: "Request the map", href: "/contact-sales?plan=guided-setup&intent=operating-system-map" },
  sprint: { name: "Workflow Proof Sprint", reason: "The workflow is clear enough to install and evaluate in production.", next: "Scope the sprint", href: "/contact-sales?plan=studio-sprint-30&intent=workflow-proof-sprint" },
  lane: { name: "Managed Operating Lane", reason: "The operating need is ongoing, not a one-time implementation.", next: "Design the lane", href: "/contact-sales?plan=operating-lane-deposit&intent=managed-operating-lane" },
} as const;

export function OfferPathfinder() {
  const [answers, setAnswers] = useState<Partial<Record<(typeof questions)[number]["id"], Answer>>>({});
  const complete = questions.every((question) => answers[question.id]);
  const recommendation = useMemo(() => {
    if (!complete) return null;
    const score: Record<Answer, number> = { map: 0, sprint: 0, lane: 0 };
    Object.values(answers).forEach((answer) => { if (answer) score[answer] += 1; });
    return (Object.entries(score) as Array<[Answer, number]>).sort((a, b) => b[1] - a[1])[0][0];
  }, [answers, complete]);

  return <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
    <div className="space-y-4">{questions.map((question, questionIndex) => <fieldset key={question.id} className="rounded-[22px] border border-white/12 bg-white/[.035] p-5 sm:p-6">
      <legend className="px-1 text-sm font-black text-white"><span className="mr-3 text-[#d7ff3f]">0{questionIndex + 1}</span>{question.prompt}</legend>
      <div className="mt-4 grid gap-2">{question.options.map(([value, label]) => { const selected = answers[question.id] === value; return <button key={value} type="button" aria-pressed={selected} onClick={() => setAnswers((current) => ({ ...current, [question.id]: value }))} className={`flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d7ff3f]/35 ${selected ? "border-[#d7ff3f] bg-[#d7ff3f] text-[#12151c]" : "border-white/12 text-white/68 hover:border-white/30 hover:text-white"}`}><span>{label}</span>{selected ? <Check className="ml-3 h-4 w-4 shrink-0" aria-hidden="true" /> : null}</button>; })}</div>
    </fieldset>)}</div>
    <div className="lg:sticky lg:top-28 lg:self-start"><div className="rounded-[26px] bg-[#2457ff] p-7 text-white sm:p-8" aria-live="polite"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/60">Recommended starting point</p>{recommendation ? <><h3 className="mt-8 text-4xl font-black leading-[.94] tracking-[-.05em]">{results[recommendation].name}</h3><p className="mt-5 text-base font-semibold leading-7 text-white/76">{results[recommendation].reason}</p><Link href={results[recommendation].href} className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-[#12151c] transition-colors hover:bg-[#d7ff3f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">{results[recommendation].next}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link><button type="button" onClick={() => setAnswers({})} className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center text-xs font-bold text-white/68 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"><RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />Start over</button></> : <><h3 className="mt-8 text-4xl font-black leading-[.94] tracking-[-.05em]">Answer three operating questions.</h3><p className="mt-5 text-base font-semibold leading-7 text-white/70">This guide narrows the starting point. A human still reviews fit, scope, risk, and procurement before anything is promised.</p><div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-[#d7ff3f] transition-[width] duration-200" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} /></div><p className="mt-3 text-xs font-bold text-white/55">{Object.keys(answers).length} of {questions.length} answered</p></>}</div><p className="mt-4 text-xs leading-5 text-white/45">This is directional guidance, not an automated eligibility decision or contractual quote.</p></div>
  </div>;
}
