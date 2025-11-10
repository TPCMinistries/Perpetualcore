"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Scale, Heart, TrendingUp, Home, Palette, Calculator,
  Church, Briefcase, DollarSign, Server, User, BookOpen, Users,
  Sparkles, ArrowRight, ArrowLeft, Check
} from "lucide-react";
import { IndustryType } from "@/lib/dashboard/industry-config";
import { useRouter } from "next/navigation";

interface WelcomeWizardProps {
  open: boolean;
  onComplete: (data: { industry: IndustryType; goal: string }) => void;
}

const INDUSTRIES = [
  { value: "personal", label: "Personal Use", icon: User, description: "Individual knowledge management" },
  { value: "law-firm", label: "Law Firm", icon: Scale, description: "Legal research & precedents" },
  { value: "healthcare", label: "Healthcare", icon: Heart, description: "Clinical documentation" },
  { value: "sales", label: "Sales Team", icon: TrendingUp, description: "Sales playbooks & strategies" },
  { value: "consulting", label: "Consulting", icon: Briefcase, description: "Frameworks & methodologies" },
  { value: "accounting", label: "Accounting", icon: Calculator, description: "Tax & accounting expertise" },
  { value: "real-estate", label: "Real Estate", icon: Home, description: "Market intelligence" },
  { value: "agency", label: "Creative Agency", icon: Palette, description: "Campaign strategies" },
  { value: "it-services", label: "IT Services", icon: Server, description: "Technical knowledge" },
  { value: "education", label: "Education", icon: BookOpen, description: "Teaching resources" },
  { value: "non-profit", label: "Non-Profit", icon: Users, description: "Grants & programs" },
  { value: "church", label: "Church/Ministry", icon: Church, description: "Pastoral wisdom" },
  { value: "financial-advisor", label: "Financial Advisor", icon: DollarSign, description: "Client relationships" },
] as const;

const GOALS = [
  { value: "knowledge-management", label: "Build Knowledge Base", description: "Organize and preserve institutional knowledge" },
  { value: "productivity", label: "Boost Productivity", description: "Save time with AI assistance" },
  { value: "team-collaboration", label: "Team Collaboration", description: "Share knowledge across your team" },
  { value: "client-service", label: "Improve Client Service", description: "Better serve clients with instant access to information" },
  { value: "onboarding", label: "Faster Onboarding", description: "Get new team members up to speed quickly" },
  { value: "decision-making", label: "Better Decisions", description: "Make informed decisions with complete context" },
];

export function WelcomeWizard({ open, onComplete }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState<IndustryType>("personal");
  const [goal, setGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({ industry, goal });
      router.refresh();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        {step === 1 && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white dark:text-slate-900" />
                </div>
                <DialogTitle className="text-2xl">Welcome to Perpetual Core</DialogTitle>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-base">
                Let's personalize your experience. This will only take a minute.
              </p>
            </DialogHeader>

            <div className="py-6 space-y-6">
              <div className="grid gap-3">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">What best describes your use case?</h3>
                <RadioGroup value={industry} onValueChange={(val) => setIndustry(val as IndustryType)}>
                  <div className="grid gap-3">
                    {INDUSTRIES.map((ind) => {
                      const Icon = ind.icon;
                      const isSelected = industry === ind.value;
                      return (
                        <label
                          key={ind.value}
                          className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <RadioGroupItem value={ind.value} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                              <span className="font-medium text-slate-900 dark:text-slate-100">{ind.label}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{ind.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setStep(2)} size="lg" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white dark:text-slate-900" />
                </div>
                <DialogTitle className="text-2xl">What's your primary goal?</DialogTitle>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-base">
                Help us tailor recommendations to your needs
              </p>
            </DialogHeader>

            <div className="py-6 space-y-6">
              <RadioGroup value={goal} onValueChange={setGoal}>
                <div className="grid gap-3">
                  {GOALS.map((g) => {
                    const isSelected = goal === g.value;
                    return (
                      <label
                        key={g.value}
                        className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <RadioGroupItem value={g.value} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-slate-900 dark:text-slate-100 block mb-1">{g.label}</span>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{g.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button onClick={() => setStep(1)} variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!goal}
                size="lg"
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-2xl">You're all set!</DialogTitle>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-base">
                Your dashboard is ready. Let's get started.
              </p>
            </DialogHeader>

            <div className="py-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Quick Start Guide</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white dark:text-slate-900">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Start a conversation</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ask me anything - I'm here to help</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white dark:text-slate-900">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Upload your first document</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Build your knowledge base</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white dark:text-slate-900">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Explore AI features</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Try document search, task automation, and more</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Tip:</strong> Upload documents, have conversations, and watch your Perpetual Core become more valuable over time as it learns from your knowledge.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button onClick={() => setStep(2)} variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? "Setting up..." : "Go to Dashboard"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
