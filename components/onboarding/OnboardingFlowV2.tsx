"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Brain, Upload, Users, Sparkles, FileText, MessageSquare, Zap, Check, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OnboardingFlowV2Props {
  userProfile: {
    full_name: string;
    email: string;
    onboarding_completed?: boolean;
    onboarding_step?: number;
  };
}

const STEPS = [
  { id: 0, title: "Welcome to Your AI Brain" },
  { id: 1, title: "What Will You Remember?" },
  { id: 2, title: "Your First Memory" },
  { id: 3, title: "Make It Better Together" },
  { id: 4, title: "You're All Set!" },
];

export function OnboardingFlowV2({ userProfile }: OnboardingFlowV2Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // User context
  const [userContext, setUserContext] = useState({
    useCase: "", // work, research, teaching, personal
    firstGoal: "", // What do they want to achieve first
    teamSize: "solo", // solo, small-team, teaching
  });

  useEffect(() => {
    const localOnboardingCompleted = localStorage.getItem("onboarding-completed-v2") === "true";
    const dbOnboardingCompleted = userProfile.onboarding_completed;

    if (!localOnboardingCompleted && !dbOnboardingCompleted) {
      setTimeout(() => {
        setIsOpen(true);
        const savedStep = localStorage.getItem("onboarding-step-v2");
        setCurrentStep(userProfile.onboarding_step || (savedStep ? parseInt(savedStep) : 0));
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
    localStorage.setItem("onboarding-step-v2", step.toString());
    if (completed) {
      localStorage.setItem("onboarding-completed-v2", "true");
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
      localStorage.setItem("onboarding-completed-v2", "true");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, step: STEPS.length - 1 }),
      });
      setIsOpen(false);
      toast.success("Welcome to your AI brain! 🧠");
    } catch (error) {
      setIsOpen(false);
      toast.success("Welcome to your AI brain! 🧠");
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem("onboarding-completed-v2", "true");
      localStorage.setItem("onboarding-skipped", "true");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false, skipped: true, step: currentStep }),
      });
      setIsOpen(false);
      toast.info("You can restart the tour from Settings anytime");
    } catch (error) {
      setIsOpen(false);
      console.error("Failed to skip onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const firstName = userProfile.full_name?.split(" ")[0] || "there";

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

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-slate-100 dark:bg-slate-800" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[450px] flex flex-col justify-center">
          {currentStep === 0 && (
            <WelcomeStep firstName={firstName} onNext={handleNext} isLoading={isLoading} />
          )}
          {currentStep === 1 && (
            <UseCaseStep
              userContext={userContext}
              setUserContext={setUserContext}
              onNext={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 2 && (
            <FirstActionStep
              userContext={userContext}
              onActionClick={handleActionClick}
              onSkipToEnd={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <TeamInviteStep
              userContext={userContext}
              onNext={handleNext}
              onSkip={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 4 && (
            <CompleteStep onGetStarted={completeOnboarding} isLoading={isLoading} />
          )}
        </div>
      </Card>
    </div>
  );
}

function WelcomeStep({
  firstName,
  onNext,
  isLoading,
}: {
  firstName: string;
  onNext: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 items-center justify-center mb-4 shadow-lg">
        <Brain className="h-12 w-12 text-white animate-pulse" />
      </div>
      <div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome, {firstName}!
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
          You just got an <span className="font-semibold text-slate-900 dark:text-white">infinite memory AI brain</span>
        </p>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Never forget a document, conversation, or idea again. Your AI remembers everything you share with it.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-4">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
          <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Infinite Documents</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Upload & search everything</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Infinite Memory</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">AI that remembers</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border-indigo-200 dark:border-indigo-800">
          <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Infinite Teams</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Collaborate & share</p>
        </Card>
      </div>

      <Button
        onClick={onNext}
        disabled={isLoading}
        size="lg"
        className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        Let's Build Your Brain <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

function UseCaseStep({
  userContext,
  setUserContext,
  onNext,
  isLoading,
}: {
  userContext: any;
  setUserContext: (ctx: any) => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const useCases = [
    {
      id: "work",
      icon: "💼",
      title: "Work & Projects",
      description: "Organize work docs, meeting notes, and projects",
      teamSize: "small-team",
    },
    {
      id: "research",
      icon: "🔬",
      title: "Research & Learning",
      description: "Papers, articles, and research materials",
      teamSize: "solo",
    },
    {
      id: "teaching",
      icon: "👨‍🏫",
      title: "Teaching & Courses",
      description: "Course materials, student work, and resources",
      teamSize: "teaching",
    },
    {
      id: "personal",
      icon: "✨",
      title: "Personal Knowledge",
      description: "Notes, ideas, and personal documents",
      teamSize: "solo",
    },
  ];

  const handleSelect = (useCase: any) => {
    setUserContext({
      ...userContext,
      useCase: useCase.id,
      teamSize: useCase.teamSize,
    });
    setTimeout(onNext, 300);
  };

  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">
          What will you remember?
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Choose what you'll use your AI brain for (you can change this later)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {useCases.map((useCase) => (
          <button
            key={useCase.id}
            onClick={() => handleSelect(useCase)}
            disabled={isLoading}
            className="group relative p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-slate-800 hover:shadow-lg transition-all text-left"
          >
            <div className="text-4xl mb-3">{useCase.icon}</div>
            <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {useCase.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{useCase.description}</p>
            <ArrowRight className="absolute top-6 right-6 h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        onClick={onNext}
        disabled={isLoading}
        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Skip for now
      </Button>
    </div>
  );
}

function FirstActionStep({
  userContext,
  onActionClick,
  onSkipToEnd,
  isLoading,
}: {
  userContext: any;
  onActionClick: (action: string) => void;
  onSkipToEnd: () => void;
  isLoading: boolean;
}) {
  const actions = {
    work: {
      primary: {
        icon: Upload,
        title: "Upload Your First Document",
        description: "Add a work document and watch AI instantly understand it",
        action: "/dashboard/library",
        color: "from-blue-600 to-indigo-600",
      },
      secondary: {
        icon: MessageSquare,
        title: "Start a Conversation",
        description: "Ask AI anything about your work",
        action: "/dashboard/chat",
      },
    },
    research: {
      primary: {
        icon: Upload,
        title: "Upload Research Papers",
        description: "Add papers and AI will help you connect the dots",
        action: "/dashboard/library",
        color: "from-purple-600 to-pink-600",
      },
      secondary: {
        icon: MessageSquare,
        title: "Ask About Your Research",
        description: "Query your entire research library instantly",
        action: "/dashboard/chat",
      },
    },
    teaching: {
      primary: {
        icon: Upload,
        title: "Upload Course Materials",
        description: "Add syllabi, slides, or assignments",
        action: "/dashboard/library",
        color: "from-green-600 to-teal-600",
      },
      secondary: {
        icon: Users,
        title: "Invite Your First Student",
        description: "Share your AI brain with your class",
        action: "/dashboard/settings/team",
      },
    },
    personal: {
      primary: {
        icon: MessageSquare,
        title: "Have Your First Conversation",
        description: "Start chatting with your AI brain",
        action: "/dashboard/chat",
        color: "from-purple-600 to-blue-600",
      },
      secondary: {
        icon: Upload,
        title: "Upload a Document",
        description: "Save something important to remember",
        action: "/dashboard/library",
      },
    },
  };

  const selectedActions = actions[userContext.useCase as keyof typeof actions] || actions.personal;

  return (
    <div className="text-center space-y-6 py-4">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">
          Get your first win 🎯
        </h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          The best way to understand the power of infinite memory is to experience it
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {/* Primary Action */}
        <Card className={`p-6 bg-gradient-to-br ${selectedActions.primary.color} border-0 text-white shadow-xl`}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <selectedActions.primary.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{selectedActions.primary.title}</h3>
                <span className="text-xs bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-white/90 text-sm mb-4">{selectedActions.primary.description}</p>
              <Button
                size="lg"
                onClick={() => onActionClick(selectedActions.primary.action)}
                disabled={isLoading}
                className="bg-white text-slate-900 hover:bg-white/90 shadow-lg"
              >
                <selectedActions.primary.icon className="mr-2 h-5 w-5" />
                Let's Do This
              </Button>
            </div>
          </div>
        </Card>

        {/* Secondary Action */}
        <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <selectedActions.secondary.icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-white">
                {selectedActions.secondary.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                {selectedActions.secondary.description}
              </p>
              <Button
                variant="outline"
                onClick={() => onActionClick(selectedActions.secondary.action)}
                disabled={isLoading}
              >
                <selectedActions.secondary.icon className="mr-2 h-4 w-4" />
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

function TeamInviteStep({
  userContext,
  onNext,
  onSkip,
  isLoading,
}: {
  userContext: any;
  onNext: () => void;
  onSkip: () => void;
  isLoading: boolean;
}) {
  const messages = {
    solo: {
      title: "Your AI brain gets smarter with others",
      subtitle: "When you collaborate, your shared knowledge becomes even more powerful",
    },
    "small-team": {
      title: "Bring your team into the conversation",
      subtitle: "Share documents and conversations with your team to unlock collaboration",
    },
    teaching: {
      title: "Invite your students or teaching assistants",
      subtitle: "Give your class access to shared course materials and AI assistance",
    },
  };

  const message = messages[userContext.teamSize as keyof typeof messages] || messages.solo;

  return (
    <div className="text-center space-y-6 py-6">
      <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 items-center justify-center mb-4 shadow-lg">
        <Users className="h-10 w-10 text-white" />
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">{message.title}</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto">{message.subtitle}</p>
      </div>

      <Card className="p-6 max-w-lg mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">∞</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Team Members</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">∞</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Shared Docs</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">∞</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Conversations</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => {
              window.location.href = "/dashboard/settings/team";
            }}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          >
            <Users className="mr-2 h-5 w-5" />
            Invite Team Members
          </Button>
          <Button variant="outline" onClick={onNext} disabled={isLoading} className="w-full">
            I'll do this later
          </Button>
        </div>
      </Card>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Pro tip: Your AI brain becomes exponentially more useful when you share knowledge
      </p>
    </div>
  );
}

function CompleteStep({
  onGetStarted,
  isLoading,
}: {
  onGetStarted: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 items-center justify-center mb-4 shadow-xl animate-bounce">
        <Rocket className="h-12 w-12 text-white" />
      </div>

      <div>
        <h2 className="text-4xl font-bold mb-3 text-slate-900 dark:text-white">You're all set! 🎉</h2>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
          Your infinite memory AI brain is ready
        </p>
      </div>

      <Card className="p-6 max-w-xl mx-auto bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">What happens next:</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Upload documents</strong> and AI instantly understands them
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Ask questions</strong> across all your knowledge
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Invite your team</strong> to make it even more powerful
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
        Need help? Check out our <a href="/dashboard/training" className="text-purple-600 dark:text-purple-400 hover:underline">Quick Start Guide</a>
      </p>
    </div>
  );
}
