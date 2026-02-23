import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth/actions";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { Toaster } from "sonner";
import { OnboardingFlowV3 } from "@/components/onboarding/OnboardingFlowV3";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";
import { VoiceButton } from "@/components/voice/VoiceButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Command Palette */}
      <CommandPalette />

      {/* Onboarding Flow — only shows for users who have NOT completed onboarding */}
      {profile && <OnboardingFlowV3 userProfile={profile} />}

      {/* Client-side layout with sidebar state */}
      <DashboardLayoutClient profile={profile}>
        {/* Activation Checklist — shows for post-onboarding users who haven't dismissed or completed all milestones */}
        {profile?.onboarding_completed && !profile?.onboarding_checklist_dismissed && (
          <div className="px-4 pt-4 pb-0 max-w-4xl mx-auto w-full">
            <OnboardingChecklist />
          </div>
        )}
        {children}
      </DashboardLayoutClient>

      {/* Floating Voice Button */}
      <VoiceButton />
    </div>
  );
}
