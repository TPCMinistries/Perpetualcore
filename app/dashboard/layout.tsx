import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth/actions";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { Toaster } from "sonner";
import { OnboardingFlowV2 } from "@/components/onboarding/OnboardingFlowV2";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";

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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Command Palette */}
      <CommandPalette />

      {/* Onboarding Flow */}
      {profile && <OnboardingFlowV2 userProfile={profile} />}

      {/* Client-side layout with sidebar state */}
      <DashboardLayoutClient profile={profile}>
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
