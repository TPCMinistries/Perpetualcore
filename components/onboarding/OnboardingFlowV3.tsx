"use client";

import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  Brain,
  Upload,
  Users,
  Sparkles,
  Check,
  Rocket,
  Zap,
  BookOpen,
  Code,
  Briefcase,
  GraduationCap,
  Palette,
  TrendingUp,
  MessageSquare,
  Loader2,
  Wand2,
  LayoutGrid,
  Bot,
  FileText,
  Database,
  BarChart3,
  Presentation,
  Image,
  Video,
  ShieldCheck,
} from "lucide-react";
import { DashboardMode } from "@/types/user-experience";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OnboardingFlowV3Props {
  userProfile: {
    full_name: string;
    email: string;
    onboarding_completed?: boolean;
    onboarding_step?: number;
  };
}

interface UserContext {
  preferredName: string;
  userRole: string;
  industry: string;
  primaryGoal: string;
  primaryGoals: string[]; // New: Support multiple goals
  teamContext: string;
  contentTypes: string[];
  aiExperience: string;
  dashboardMode: DashboardMode; // Simple (AI Employees) or Full
}

const STEPS = [
  { id: 0, title: "Welcome" },
  { id: 1, title: "Tell Us About You" },
  { id: 2, title: "Your Goals" },
  { id: 3, title: "Customize Experience" },
  { id: 4, title: "First Action" },
  { id: 5, title: "Ready!" },
];

export function OnboardingFlowV3({ userProfile }: OnboardingFlowV3Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [userContext, setUserContext] = useState<UserContext>({
    preferredName: userProfile.full_name?.split(" ")[0] || "",
    userRole: "",
    industry: "",
    primaryGoal: "",
    primaryGoals: [], // New: Support multiple goals
    teamContext: "",
    contentTypes: [],
    aiExperience: "beginner",
    dashboardMode: "full", // Default to full mode
  });

  useEffect(() => {
    const localOnboardingCompleted = localStorage.getItem("onboarding-completed-v3") === "true";
    const dbOnboardingCompleted = userProfile.onboarding_completed;

    if (!localOnboardingCompleted && !dbOnboardingCompleted) {
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
    }
  }, [userProfile]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateOnboardingProgress(nextStep, false);
    } else {
      await completeOnboarding();
    }
  };

  const handleActionClick = async (action: string) => {
    await completeOnboarding();
    // Append guided=true when navigating to chat so the aha moment fires
    const destination = action === "/dashboard/chat" ? "/dashboard/chat?guided=true" : action;
    router.push(destination);
  };

  const updateOnboardingProgress = async (step: number, completed: boolean) => {
    localStorage.setItem("onboarding-step-v3", step.toString());
    if (completed) {
      localStorage.setItem("onboarding-completed-v3", "true");
    }

    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, completed }),
      });
    } catch (error) {
      console.error("Failed to update onboarding progress:", error);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save all user context to profile
      await fetch("/api/profile/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userContext),
      });

      // Save dashboard mode preference
      localStorage.setItem("perpetual-dashboard-mode", userContext.dashboardMode);
      window.dispatchEvent(
        new CustomEvent("dashboardModeChanged", { detail: { mode: userContext.dashboardMode } })
      );

      // If simple mode selected, seed AI employees
      if (userContext.dashboardMode === "simple") {
        try {
          await fetch("/api/assistants/seed-employees", { method: "POST" });
        } catch (seedError) {
          console.error("Failed to seed AI employees:", seedError);
        }
      }

      localStorage.setItem("onboarding-completed-v3", "true");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, step: STEPS.length - 1 }),
      });

      setIsOpen(false);
      toast.success(`Workspace ready, ${userContext.preferredName}.`);
      // Redirect to guided first chat — the persistent memory aha moment
      router.push("/dashboard/chat?guided=true");
    } catch (error) {
      setIsOpen(false);
      toast.success("Workspace ready.");
      console.error("Failed to complete onboarding:", error);
      // Still redirect even on error — onboarding data was likely saved
      router.push("/dashboard/chat?guided=true");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem("onboarding-completed-v3", "true");
      localStorage.setItem("onboarding-skipped", "true");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false, skipped: true, step: currentStep }),
      });
      setIsOpen(false);
      toast.info("You can customize your profile anytime from Settings");
    } catch (error) {
      setIsOpen(false);
      console.error("Failed to skip onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl bg-card p-8 relative shadow-2xl border-border my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 md:mb-8">
          <Progress value={progress} className="h-2 bg-muted" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        <div className="min-h-[300px] md:min-h-[400px] flex flex-col justify-center">
          {currentStep === 0 && (
            <WelcomeStep
              onNext={handleNext}
              isLoading={isLoading}
              userContext={userContext}
              setUserContext={setUserContext}
            />
          )}
          {currentStep === 1 && (
            <PersonalInfoStep
              userContext={userContext}
              setUserContext={setUserContext}
              onNext={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 2 && (
            <GoalsStep
              userContext={userContext}
              setUserContext={setUserContext}
              onNext={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <CustomizeStep
              userContext={userContext}
              setUserContext={setUserContext}
              onNext={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 4 && (
            <FirstActionStep
              userContext={userContext}
              onActionClick={handleActionClick}
              onSkipToEnd={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 5 && (
            <CompleteStep
              userContext={userContext}
              onGetStarted={completeOnboarding}
              isLoading={isLoading}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function WelcomeStep({
  onNext,
  isLoading,
  userContext,
  setUserContext,
}: {
  onNext: () => void;
  isLoading: boolean;
  userContext: UserContext;
  setUserContext: (ctx: UserContext) => void;
}) {
  const [selectedMode, setSelectedMode] = useState<DashboardMode | null>(null);

  const handleModeSelect = (mode: DashboardMode) => {
    setSelectedMode(mode);
    setUserContext({ ...userContext, dashboardMode: mode });
  };

  return (
    <div className="text-center space-y-6 py-4">
      <div className="inline-flex h-20 w-20 rounded-2xl bg-slate-950 items-center justify-center mb-2 shadow-lg">
        <ShieldCheck className="h-10 w-10 text-white" />
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Set up your operating workspace
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose the interface your team should see first.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-6">
        {/* Guided Workspace */}
        <button
          onClick={() => handleModeSelect("simple")}
          className={`relative p-6 rounded-xl border-2 text-left transition-all ${
            selectedMode === "simple"
              ? "border-sky-700 bg-sky-50 dark:bg-sky-950/30 ring-2 ring-sky-700/20"
              : "border-border hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
          }`}
        >
          {selectedMode === "simple" && (
            <div className="absolute top-3 right-3">
              <Check className="h-5 w-5 text-sky-700" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-sky-700 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Guided workspace</h3>
              <p className="text-sm text-sky-700 dark:text-sky-400">Best for first-time operators</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            A focused command surface for chat, documents, tasks, and the first repeatable workflows.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300">Daily briefing</span>
            <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300">Knowledge base</span>
            <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300">Tasks</span>
          </div>
        </button>

        {/* Command Center */}
        <button
          onClick={() => handleModeSelect("full")}
          className={`relative p-6 rounded-xl border-2 text-left transition-all ${
            selectedMode === "full"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
              : "border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
          }`}
        >
          {selectedMode === "full" && (
            <div className="absolute top-3 right-3">
              <Check className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Command center</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">For teams and power users</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Full access to CRM, teams, projects, workflows, agents, documents, and executive reporting.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Projects</span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Workflows</span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">AI Chat</span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">+more</span>
          </div>
        </button>
      </div>

      <Button
        onClick={onNext}
        disabled={isLoading || !selectedMode}
        size="lg"
        className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
      >
        Continue <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <p className="text-xs text-muted-foreground">You can change this anytime in Settings</p>
    </div>
  );
}

function PersonalInfoStep({
  userContext,
  setUserContext,
  onNext,
  isLoading,
}: {
  userContext: UserContext;
  setUserContext: (ctx: UserContext) => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDescription, setCustomDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Broader, more universal categories
  const roles = [
    { id: "professional", icon: Briefcase, label: "Operator / Executive", description: "Running decisions, meetings, and execution", color: "bg-slate-900" },
    { id: "entrepreneur", icon: Zap, label: "Founder / Owner", description: "Building or running a business", color: "bg-sky-700" },
    { id: "creative", icon: Palette, label: "Growth / Content Lead", description: "Publishing, campaigns, and brand systems", color: "bg-emerald-700" },
    { id: "technical", icon: Code, label: "Technical / Automation Lead", description: "Systems, integrations, data, and workflows", color: "bg-indigo-700" },
    { id: "student_educator", icon: GraduationCap, label: "Training / Enablement", description: "Teaching teams and documenting processes", color: "bg-amber-700" },
    { id: "researcher", icon: BookOpen, label: "Research / Strategy", description: "Synthesis, analysis, and institutional memory", color: "bg-cyan-700" },
  ];

  const handleRoleSelect = (roleId: string) => {
    setShowCustomInput(false);
    setUserContext({ ...userContext, userRole: roleId });
  };

  const handleCustomSelect = () => {
    setShowCustomInput(true);
    setUserContext({ ...userContext, userRole: "custom" });
  };

  const handleAnalyzeNeeds = async () => {
    if (customDescription.trim().length < 10) {
      toast.error("Please describe your needs in more detail");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/onboarding/analyze-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userDescription: customDescription }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        // Apply the AI-suggested configuration
        setUserContext({
          ...userContext,
          userRole: data.analysis.userRole || "custom",
          primaryGoals: data.analysis.primaryGoals || [],
          industry: data.analysis.suggestedCategory || "personal",
        });
        toast.success("Perfect! We've personalized your experience");
        onNext();
      } else {
        toast.error(data.error || "Failed to analyze your needs");
      }
    } catch (error) {
      console.error("Error analyzing needs:", error);
      toast.error("Something went wrong. Please try selecting a category instead.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canProceed = (userContext.userRole && userContext.userRole !== "custom" && userContext.preferredName) ||
                     (userContext.userRole === "custom" && customDescription.trim().length >= 10);

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          Define the operator
        </h2>
        <p className="text-muted-foreground">
          This tunes the workspace around the person or team running the system.
        </p>
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        <div>
          <Label htmlFor="preferredName" className="text-sm font-medium mb-2 block">
            What should we call you?
          </Label>
          <Input
            id="preferredName"
            placeholder="Your preferred name..."
            value={userContext.preferredName}
            onChange={(e) => setUserContext({ ...userContext, preferredName: e.target.value })}
            className="text-lg"
          />
        </div>

        {!showCustomInput ? (
          <div>
            <Label className="text-sm font-medium mb-3 block">What best describes the primary operator?</Label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    userContext.userRole === role.id
                      ? "border-sky-700 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/30 shadow-md"
                      : "border-border hover:border-border/80 bg-card"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg ${role.color} flex items-center justify-center mb-2`}>
                    <role.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{role.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                </button>
              ))}
            </div>

            {/* Custom/Other option */}
            <button
              onClick={handleCustomSelect}
              className={`w-full mt-3 p-4 rounded-xl border-2 border-dashed transition-all text-left flex items-center gap-4 ${
                userContext.userRole === "custom"
                  ? "border-sky-700 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                  : "border-border hover:border-sky-400 dark:hover:border-sky-500 bg-card"
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-slate-950 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Something else?</h3>
                <p className="text-xs text-muted-foreground">Describe the operating context</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Tell us about your needs</Label>
              <Textarea
                placeholder="Describe the organization, team, and work Perpetual Core should coordinate. Example: 'We are a furniture retailer with sales, warehouse, service, and finance teams. We need one view of follow-ups, inventory exceptions, customer notes, and AI workflows.'"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="min-h-[120px] text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                The more detail you provide, the better we can personalize your experience
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomInput(false);
                  setUserContext({ ...userContext, userRole: "" });
                }}
                disabled={isAnalyzing}
              >
                Back to Categories
              </Button>
              <Button
                onClick={handleAnalyzeNeeds}
                disabled={isAnalyzing || customDescription.trim().length < 10}
                className="flex-1 bg-slate-950 text-white hover:bg-slate-800"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Personalize My Experience
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!showCustomInput && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onNext}
            disabled={isLoading || !canProceed}
            size="lg"
            className="bg-slate-950 text-white hover:bg-slate-800"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function GoalsStep({
  userContext,
  setUserContext,
  onNext,
  isLoading,
}: {
  userContext: UserContext;
  setUserContext: (ctx: UserContext) => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  // Goals mapped to new broader categories
  const goals = {
    professional: [
      { id: "command_center", label: "Create one daily command center" },
      { id: "meeting_prep", label: "Prepare for meetings and preserve decisions" },
      { id: "follow_up", label: "Track follow-ups before they slip" },
      { id: "project_tracking", label: "See tasks, owners, and blockers clearly" },
      { id: "knowledge_retention", label: "Build institutional memory" },
      { id: "executive_reporting", label: "Generate executive summaries" },
    ],
    entrepreneur: [
      { id: "sales_pipeline", label: "Track leads, contacts, and opportunities" },
      { id: "operations_map", label: "Map the business operating system" },
      { id: "customer_insights", label: "Centralize customer and account context" },
      { id: "decision_support", label: "Make better decisions from live context" },
      { id: "automate_tasks", label: "Automate repetitive business tasks" },
      { id: "team_visibility", label: "Give the team one operating view" },
    ],
    creative: [
      { id: "ideas", label: "Generate and organize ideas" },
      { id: "research_topics", label: "Research topics deeply" },
      { id: "draft_content", label: "Draft content faster" },
      { id: "repurpose", label: "Repurpose content across platforms" },
      { id: "organize_projects", label: "Organize creative projects" },
      { id: "feedback_iteration", label: "Get feedback and iterate" },
    ],
    technical: [
      { id: "document_code", label: "Document and organize technical knowledge" },
      { id: "debug_help", label: "Get help debugging and problem solving" },
      { id: "learn_tech", label: "Learn new technologies faster" },
      { id: "architecture", label: "Design and document system architecture" },
      { id: "code_review", label: "Improve code and review process" },
      { id: "api_docs", label: "Create and maintain documentation" },
    ],
    student_educator: [
      { id: "study_help", label: "Understand difficult concepts" },
      { id: "organize_notes", label: "Organize notes and materials" },
      { id: "research_projects", label: "Research for projects and papers" },
      { id: "create_content", label: "Create educational content" },
      { id: "writing_help", label: "Improve writing skills" },
      { id: "exam_prep", label: "Prepare for exams or lessons" },
    ],
    researcher: [
      { id: "literature_review", label: "Organize and review research" },
      { id: "analyze_data", label: "Analyze data and find insights" },
      { id: "write_papers", label: "Write and edit papers/reports" },
      { id: "collaborate", label: "Collaborate with others" },
      { id: "grant_writing", label: "Write proposals and grants" },
      { id: "knowledge_base", label: "Build a personal knowledge base" },
    ],
    // Fallback for custom roles
    custom: [
      { id: "organize", label: "Organize information and documents" },
      { id: "research", label: "Research and learn new things" },
      { id: "create", label: "Create content and drafts" },
      { id: "communicate", label: "Communicate more effectively" },
      { id: "track", label: "Track tasks and projects" },
      { id: "remember", label: "Remember important information" },
    ],
  };

  const roleGoals = goals[userContext.userRole as keyof typeof goals] || goals.custom;

  const handleGoalToggle = (goalId: string) => {
    const currentGoals = userContext.primaryGoals || [];
    let newGoals: string[];

    if (currentGoals.includes(goalId)) {
      // Remove if already selected
      newGoals = currentGoals.filter((g) => g !== goalId);
    } else {
      // Add if not selected
      newGoals = [...currentGoals, goalId];
    }

    // Also update primaryGoal to be the first selected goal
    const primaryGoal = newGoals.length > 0 ? newGoals[0] : "";

    setUserContext({
      ...userContext,
      primaryGoal,
      primaryGoals: newGoals
    });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          What are your goals?
        </h2>
        <p className="text-muted-foreground">
          Select all that apply - we'll prioritize features for you
        </p>
        {userContext.primaryGoals && userContext.primaryGoals.length > 0 && (
          <p className="text-sm text-sky-700 dark:text-sky-400 mt-2">
            {userContext.primaryGoals.length} goal{userContext.primaryGoals.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="max-w-xl mx-auto space-y-3">
        {roleGoals.map((goal) => {
          const isSelected = userContext.primaryGoals?.includes(goal.id) || false;
          return (
            <button
              key={goal.id}
              onClick={() => handleGoalToggle(goal.id)}
              className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                isSelected
                  ? "border-sky-700 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/30 shadow-md"
                  : "border-border hover:border-border/80 bg-card"
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? "bg-sky-700"
                  : "bg-muted"
              }`}>
                {isSelected ? (
                  <Check className="h-5 w-5 text-white" />
                ) : (
                  <Zap className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <span className="font-medium text-foreground">{goal.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onNext}
          disabled={isLoading || !userContext.primaryGoals || userContext.primaryGoals.length === 0}
          size="lg"
          className="bg-slate-950 text-white hover:bg-slate-800"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CustomizeStep({
  userContext,
  setUserContext,
  onNext,
  isLoading,
}: {
  userContext: UserContext;
  setUserContext: (ctx: UserContext) => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const contentTypes = [
    { id: "documents", label: "Documents & PDFs", icon: FileText, available: true },
    { id: "research_papers", label: "Research Papers", icon: BookOpen, available: true },
    { id: "code", label: "Code & Tech Docs", icon: Code, available: true },
    { id: "spreadsheets", label: "Spreadsheets & Data", icon: BarChart3, available: true },
    { id: "presentations", label: "Presentations", icon: Presentation, available: true },
    { id: "records", label: "CRM & Operating Data", icon: Database, available: true },
    { id: "images", label: "Images & Diagrams", icon: Image, available: false, comingSoon: true },
    { id: "videos", label: "Videos & Recordings", icon: Video, available: false, comingSoon: true },
  ];

  const teamContexts = [
    { id: "solo", label: "Just me (solo)", description: "Individual use" },
    { id: "team_member", label: "Part of a team", description: "Collaborating with others" },
    { id: "team_lead", label: "Leading a team", description: "Managing team knowledge" },
    { id: "educator", label: "Teaching/mentoring", description: "Working with students" },
  ];

  const toggleContentType = (typeId: string) => {
    const current = userContext.contentTypes || [];
    if (current.includes(typeId)) {
      setUserContext({
        ...userContext,
        contentTypes: current.filter((t) => t !== typeId),
      });
    } else {
      setUserContext({
        ...userContext,
        contentTypes: [...current, typeId],
      });
    }
  };

  const canProceed = userContext.contentTypes.length > 0 && userContext.teamContext;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          Customize your experience
        </h2>
        <p className="text-muted-foreground">
          Tell us what the workspace should organize first.
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            What should the system ingest first? Select all that apply.
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => type.available !== false && toggleContentType(type.id)}
                  disabled={type.available === false}
                  className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 relative ${
                    type.available === false
                      ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                      : userContext.contentTypes.includes(type.id)
                      ? "border-sky-700 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                      : "border-border hover:border-border/80 bg-card"
                  }`}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{type.label}</span>
                    {type.comingSoon && (
                      <span className="block text-xs text-muted-foreground mt-0.5">Coming soon</span>
                    )}
                  </div>
                  {userContext.contentTypes.includes(type.id) && (
                    <Check className="h-4 w-4 text-sky-700 dark:text-sky-400 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Who will use this workspace?</Label>
          <div className="space-y-2">
            {teamContexts.map((context) => (
              <button
                key={context.id}
                onClick={() => setUserContext({ ...userContext, teamContext: context.id })}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  userContext.teamContext === context.id
                    ? "border-sky-700 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                    : "border-border hover:border-border/80 bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{context.label}</h3>
                    <p className="text-xs text-muted-foreground">{context.description}</p>
                  </div>
                  {userContext.teamContext === context.id && (
                    <Check className="h-5 w-5 text-sky-700 dark:text-sky-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onNext}
          disabled={isLoading || !canProceed}
          size="lg"
          className="bg-slate-950 text-white hover:bg-slate-800"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FirstActionStep({
  userContext,
  onActionClick,
  onSkipToEnd,
  isLoading,
}: {
  userContext: UserContext;
  onActionClick: (action: string) => void;
  onSkipToEnd: () => void;
  isLoading: boolean;
}) {
  const getRecommendedAction = () => {
    // Personalized based on their role and goals
    if (userContext.primaryGoal?.includes("organize") || userContext.primaryGoal?.includes("materials")) {
      return {
        primary: {
          icon: Upload,
          title: "Upload your first operating document",
          description: "Add a file so the workspace has real context to organize and search.",
          action: "/dashboard/library",
          color: "from-blue-600 to-indigo-600",
        },
        secondary: {
          icon: Brain,
          title: "Start a guided workspace conversation",
          description: "Ask what to configure first based on your role and goals.",
          action: "/dashboard/chat",
        },
      };
    } else {
      return {
        primary: {
          icon: Brain,
          title: "Start with the command assistant",
          description: `Turn ${userContext.primaryGoal?.replace(/_/g, " ") || "your first goal"} into an operating plan.`,
          action: "/dashboard/chat",
          color: "from-slate-950 to-sky-800",
        },
        secondary: {
          icon: Upload,
          title: "Upload a Document",
          description: "Give the workspace source material to index and summarize.",
          action: "/dashboard/library",
        },
      };
    }
  };

  const actions = getRecommendedAction();

  return (
    <div className="text-center space-y-6 py-4">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-foreground">
          Ready, {userContext.preferredName}.
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Your first action should create useful context, not just open another blank tool.
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        <Card className={`p-6 bg-gradient-to-br ${actions.primary.color} border-0 text-white shadow-xl`}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <actions.primary.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{actions.primary.title}</h3>
                <span className="text-xs bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Recommended for you
                </span>
              </div>
              <p className="text-white/90 text-sm mb-4">{actions.primary.description}</p>
              <Button
                size="lg"
                onClick={() => onActionClick(actions.primary.action)}
                disabled={isLoading}
                className="bg-white text-slate-900 hover:bg-white/90 shadow-lg"
              >
                <actions.primary.icon className="mr-2 h-5 w-5" />
                Start here
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border bg-card">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <actions.secondary.icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg mb-1 text-foreground">
                {actions.secondary.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-3">{actions.secondary.description}</p>
              <Button variant="outline" onClick={() => onActionClick(actions.secondary.action)} disabled={isLoading}>
                <actions.secondary.icon className="mr-2 h-4 w-4" />
                Start Here Instead
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Button variant="ghost" onClick={onSkipToEnd} disabled={isLoading} className="text-muted-foreground">
        I'll explore on my own
      </Button>
    </div>
  );
}

function CompleteStep({
  userContext,
  onGetStarted,
  isLoading,
}: {
  userContext: UserContext;
  onGetStarted: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 items-center justify-center mb-4 shadow-xl animate-bounce">
        <Rocket className="h-12 w-12 text-white" />
      </div>

      <div>
        <h2 className="text-4xl font-bold mb-3 text-foreground">
          Workspace configured, {userContext.preferredName}.
        </h2>
        <p className="text-xl text-muted-foreground mb-2">
          Your operating workspace is personalized and ready.
        </p>
      </div>

      <Card className="p-6 max-w-xl mx-auto bg-sky-50/60 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900">
        <h3 className="font-semibold text-lg mb-4 text-foreground">
          Your personalized experience includes:
        </h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-foreground">
              AI responses tailored for <strong>{userContext.userRole?.replace(/_/g, " ")}</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-foreground">
              Features optimized for <strong>{userContext.primaryGoal?.replace(/_/g, " ")}</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-cyan-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-foreground">
              Ready to work with <strong>{userContext.contentTypes.join(", ")}</strong>
            </p>
          </div>
        </div>
      </Card>

      <Button
        onClick={onGetStarted}
        disabled={isLoading}
        size="lg"
        className="mt-6 bg-slate-950 text-white hover:bg-slate-800 text-lg px-8"
      >
        <Sparkles className="mr-2 h-5 w-5" />
        Start first operating session
      </Button>

      <p className="text-xs text-muted-foreground">
        You can update your preferences anytime in Settings
      </p>
    </div>
  );
}
