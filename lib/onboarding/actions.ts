"use server";

import { createClient } from "@/lib/supabase/server";
import { IndustryType } from "@/lib/dashboard/industry-config";
import { trackEvent, trackActivation } from "@/lib/analytics/server-events";

export interface OnboardingData {
  industry: IndustryType;
  goal: string;
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    // Update profile with industry and onboarding completion
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        industry: data.industry,
        primary_goal: data.goal,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { error: "Failed to complete onboarding" };
    }

    // Track onboarding completion event
    trackEvent({
      event_type: "onboarding_complete",
      user_id: user.id,
      metadata: { industry: data.industry, goal: data.goal },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in completeOnboarding:", error);
    return { error: error.message || "An error occurred" };
  }
}

export async function markStepComplete(stepKey: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc("mark_onboarding_step_complete", {
      p_step_key: stepKey,
    });

    if (error) {
      console.error("Error marking step complete:", error);
      return { error: "Failed to mark step complete" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in markStepComplete:", error);
    return { error: error.message || "An error occurred" };
  }
}

export async function getOnboardingProgress() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "Not authenticated", data: [] };
    }

    // Check three activation milestones in parallel
    const [conversationsResult, documentsResult, assistantsResult] = await Promise.all([
      // Milestone 1: first_chat — has any conversation
      supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .limit(1),
      // Milestone 2: first_document — has any document
      supabase
        .from("documents")
        .select("id")
        .eq("user_id", user.id)
        .limit(1),
      // Milestone 3: explore_agents — has created or interacted with an AI assistant
      supabase
        .from("ai_assistants")
        .select("id")
        .eq("user_id", user.id)
        .limit(1),
    ]);

    const hasChat = (conversationsResult.data?.length ?? 0) > 0;
    const hasDocument = (documentsResult.data?.length ?? 0) > 0;
    const hasExploredAgents = (assistantsResult.data?.length ?? 0) > 0;

    const progress = [
      { step_key: "first_chat", completed: hasChat },
      { step_key: "first_document", completed: hasDocument },
      { step_key: "explore_agents", completed: hasExploredAgents },
    ];

    return { data: progress };
  } catch (error: any) {
    console.error("Error in getOnboardingProgress:", error);
    return { error: error.message || "An error occurred", data: [] };
  }
}

// Dismiss the onboarding checklist
export async function dismissOnboardingChecklist() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_checklist_dismissed: true })
      .eq("id", user.id);

    if (error) {
      console.error("Error dismissing checklist:", error);
      return { error: "Failed to dismiss checklist" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in dismissOnboardingChecklist:", error);
    return { error: error.message || "An error occurred" };
  }
}

// Check if checklist is dismissed
export async function isChecklistDismissed() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { dismissed: false };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_checklist_dismissed")
      .eq("id", user.id)
      .single();

    return { dismissed: profile?.onboarding_checklist_dismissed || false };
  } catch (error: any) {
    console.error("Error checking checklist dismissed:", error);
    return { dismissed: false };
  }
}

// Check if user needs onboarding
export async function needsOnboarding() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { needsOnboarding: false };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error checking onboarding status:", profileError);
      return { needsOnboarding: false };
    }

    return { needsOnboarding: !profile?.onboarding_completed };
  } catch (error: any) {
    console.error("Error in needsOnboarding:", error);
    return { needsOnboarding: false };
  }
}
