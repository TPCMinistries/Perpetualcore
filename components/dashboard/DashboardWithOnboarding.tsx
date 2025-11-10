"use client";

import { useState, useEffect } from "react";
import { WelcomeWizard } from "@/components/onboarding/WelcomeWizard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { completeOnboarding, needsOnboarding } from "@/lib/onboarding/actions";

interface DashboardWithOnboardingProps {
  children: React.ReactNode;
}

export function DashboardWithOnboarding({ children }: DashboardWithOnboardingProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const { needsOnboarding: needs } = await needsOnboarding();
    setShowWizard(needs);
    setCheckingOnboarding(false);
  };

  const handleOnboardingComplete = async (data: { industry: any; goal: string }) => {
    const result = await completeOnboarding(data);

    if (!result.error) {
      setShowWizard(false);
    }
  };

  if (checkingOnboarding) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <WelcomeWizard open={showWizard} onComplete={handleOnboardingComplete} />
      {!showWizard && (
        <div className="space-y-8">
          <OnboardingChecklist />
          {children}
        </div>
      )}
      {showWizard && children}
    </>
  );
}
