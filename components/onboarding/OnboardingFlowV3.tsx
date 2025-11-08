"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Brain, Upload, Users, Sparkles, Check, Rocket, Zap, BookOpen, Code, Briefcase, GraduationCap, Palette, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  teamContext: string;
  contentTypes: string[];
  aiExperience: string;
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
    teamContext: "",
    contentTypes: [],
    aiExperience: "beginner",
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
    router.push(action);
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

      localStorage.setItem("onboarding-completed-v3", "true");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, step: STEPS.length - 1 }),
      });

      setIsOpen(false);
      toast.success(`Welcome aboard, ${userContext.preferredName}! 🧠`);
    } catch (error) {
      setIsOpen(false);
      toast.success(`Welcome aboard! 🧠`);
      console.error("Failed to complete onboarding:", error);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-white dark:bg-slate-900 p-8 relative shadow-2xl border-slate-200 dark:border-slate-800">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-slate-100 dark:bg-slate-800" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        <div className="min-h-[500px] flex flex-col justify-center">
          {currentStep === 0 && (
            <WelcomeStep onNext={handleNext} isLoading={isLoading} />
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

function WelcomeStep({ onNext, isLoading }: { onNext: () => void; isLoading: boolean }) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 items-center justify-center mb-4 shadow-lg">
        <Brain className="h-12 w-12 text-white animate-pulse" />
      </div>
      <div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to Your AI Brain!
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
          You just got an <span className="font-semibold text-slate-900 dark:text-white">infinite memory</span>
        </p>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Before we start, let's personalize your experience so your AI brain understands you better
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-6 max-w-xl mx-auto border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 font-medium">
          ✨ We'll ask a few quick questions to:
        </p>
        <div className="text-left space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Tailor AI responses to your field and experience</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Show you the most relevant features first</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Personalize your entire experience</span>
          </div>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={isLoading}
        size="lg"
        className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        Let's Personalize Your Experience <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <p className="text-xs text-slate-500 dark:text-slate-400">Takes less than 60 seconds</p>
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
  const roles = [
    { id: "teacher", icon: GraduationCap, label: "Teacher/Educator", color: "from-green-500 to-teal-500" },
    { id: "researcher", icon: BookOpen, label: "Researcher", color: "from-purple-500 to-pink-500" },
    { id: "developer", icon: Code, label: "Developer/Engineer", color: "from-blue-500 to-indigo-500" },
    { id: "business_owner", icon: Briefcase, label: "Business Owner", color: "from-orange-500 to-red-500" },
    { id: "content_creator", icon: Palette, label: "Content Creator", color: "from-pink-500 to-rose-500" },
    { id: "student", icon: Sparkles, label: "Student", color: "from-indigo-500 to-purple-500" },
  ];

  const handleRoleSelect = (roleId: string) => {
    setUserContext({ ...userContext, userRole: roleId });
  };

  const canProceed = userContext.userRole && userContext.preferredName;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
          Tell us about yourself
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          This helps us personalize your AI brain
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            We'll use this throughout the platform
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">What best describes you?</Label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  userContext.userRole === role.id
                    ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-md"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-2`}>
                  <role.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{role.label}</h3>
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
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
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
  const goals = {
    teacher: [
      { id: "organize_materials", label: "Organize course materials and lesson plans" },
      { id: "student_help", label: "Help students with questions using AI" },
      { id: "create_content", label: "Create educational content faster" },
      { id: "track_progress", label: "Track student progress and engagement" },
    ],
    researcher: [
      { id: "literature_review", label: "Organize and review research papers" },
      { id: "analyze_data", label: "Analyze data and find insights" },
      { id: "write_papers", label: "Write and edit research papers" },
      { id: "collaborate", label: "Collaborate with other researchers" },
    ],
    developer: [
      { id: "document_code", label: "Document and organize code knowledge" },
      { id: "debug_help", label: "Get help debugging and solving problems" },
      { id: "learn_tech", label: "Learn new technologies faster" },
      { id: "team_docs", label: "Centralize team documentation" },
    ],
    business_owner: [
      { id: "organize_docs", label: "Organize business documents and contracts" },
      { id: "market_research", label: "Research markets and competitors" },
      { id: "content_marketing", label: "Create marketing content" },
      { id: "decision_support", label: "Get AI support for business decisions" },
    ],
    content_creator: [
      { id: "ideas", label: "Generate and organize content ideas" },
      { id: "research_topics", label: "Research topics deeply" },
      { id: "draft_content", label: "Draft content faster" },
      { id: "repurpose", label: "Repurpose content across platforms" },
    ],
    student: [
      { id: "study_help", label: "Get help understanding difficult concepts" },
      { id: "organize_notes", label: "Organize notes and study materials" },
      { id: "research_projects", label: "Research for essays and projects" },
      { id: "exam_prep", label: "Prepare for exams efficiently" },
    ],
  };

  const roleGoals = goals[userContext.userRole as keyof typeof goals] || goals.student;

  const handleGoalSelect = (goalId: string) => {
    setUserContext({ ...userContext, primaryGoal: goalId });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
          What's your main goal?
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          We'll prioritize features that help you achieve this
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-3">
        {roleGoals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => handleGoalSelect(goal.id)}
            className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
              userContext.primaryGoal === goal.id
                ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-md"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
            }`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              userContext.primaryGoal === goal.id
                ? "bg-gradient-to-br from-purple-500 to-blue-500"
                : "bg-slate-100 dark:bg-slate-700"
            }`}>
              {userContext.primaryGoal === goal.id ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Zap className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <span className="font-medium text-slate-900 dark:text-white">{goal.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onNext}
          disabled={isLoading || !userContext.primaryGoal}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
    { id: "documents", label: "Documents & PDFs", icon: "📄" },
    { id: "research_papers", label: "Research Papers", icon: "📚" },
    { id: "code", label: "Code & Tech Docs", icon: "💻" },
    { id: "videos", label: "Videos & Recordings", icon: "🎥" },
    { id: "images", label: "Images & Diagrams", icon: "🖼️" },
    { id: "spreadsheets", label: "Spreadsheets & Data", icon: "📊" },
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
        <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
          Customize your experience
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Tell us what you'll work with
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            What types of content will you upload? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleContentType(type.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                  userContext.contentTypes.includes(type.id)
                    ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{type.label}</span>
                {userContext.contentTypes.includes(type.id) && (
                  <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">How will you use this?</Label>
          <div className="space-y-2">
            {teamContexts.map((context) => (
              <button
                key={context.id}
                onClick={() => setUserContext({ ...userContext, teamContext: context.id })}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  userContext.teamContext === context.id
                    ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{context.label}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{context.description}</p>
                  </div>
                  {userContext.teamContext === context.id && (
                    <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
          title: `Upload Your First ${userContext.userRole === "teacher" ? "Course Material" : "Document"}`,
          description: "Add something and watch your AI brain understand it instantly",
          action: "/dashboard/library",
          color: "from-blue-600 to-indigo-600",
        },
        secondary: {
          icon: Brain,
          title: "Start a Conversation",
          description: `Ask me anything about ${userContext.userRole === "teacher" ? "teaching" : userContext.userRole === "researcher" ? "your research" : "your work"}`,
          action: "/dashboard/chat",
        },
      };
    } else {
      return {
        primary: {
          icon: Brain,
          title: `Chat With Your AI Brain`,
          description: `Get help with ${userContext.primaryGoal?.replace(/_/g, " ") || "your goals"}`,
          action: "/dashboard/chat",
          color: "from-purple-600 to-blue-600",
        },
        secondary: {
          icon: Upload,
          title: "Upload a Document",
          description: "Give your AI brain something to remember",
          action: "/dashboard/library",
        },
      };
    }
  };

  const actions = getRecommendedAction();

  return (
    <div className="text-center space-y-6 py-4">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">
          Ready, {userContext.preferredName}! 🎯
        </h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          Let's get you started with your first action
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
                Let's Go!
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <actions.secondary.icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-white">
                {actions.secondary.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{actions.secondary.description}</p>
              <Button variant="outline" onClick={() => onActionClick(actions.secondary.action)} disabled={isLoading}>
                <actions.secondary.icon className="mr-2 h-4 w-4" />
                Start Here Instead
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Button variant="ghost" onClick={onSkipToEnd} disabled={isLoading} className="text-slate-500">
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
        <h2 className="text-4xl font-bold mb-3 text-slate-900 dark:text-white">
          Perfect, {userContext.preferredName}! 🎉
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
          Your AI brain is personalized and ready
        </p>
      </div>

      <Card className="p-6 max-w-xl mx-auto bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">
          Your personalized experience includes:
        </h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              AI responses tailored for <strong>{userContext.userRole?.replace(/_/g, " ")}</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Features optimized for <strong>{userContext.primaryGoal?.replace(/_/g, " ")}</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Ready to work with <strong>{userContext.contentTypes.join(", ")}</strong>
            </p>
          </div>
        </div>
      </Card>

      <Button
        onClick={onGetStarted}
        disabled={isLoading}
        size="lg"
        className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8"
      >
        <Sparkles className="mr-2 h-5 w-5" />
        Start Using My AI Brain
      </Button>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        You can update your preferences anytime in Settings
      </p>
    </div>
  );
}
