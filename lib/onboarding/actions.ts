"use server";

import { createClient } from "@/lib/supabase/server";
import { IndustryType } from "@/lib/dashboard/industry-config";

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

    // Check actual user activity instead of relying on manual progress tracking
    const [conversationsResult, documentsResult] = await Promise.all([
      // Check if user has any conversations
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .limit(1),
      // Check if user has any documents
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .limit(1),
    ]);

    const hasConversations = (conversationsResult.data?.length || 0) > 0;
    const hasDocuments = (documentsResult.data?.length || 0) > 0;
    // User has searched if they have conversations (as search is typically done in chat)
    const hasSearched = hasConversations && hasDocuments;

    const progress = [
      { step_key: "first_conversation", completed: hasConversations },
      { step_key: "first_document", completed: hasDocuments },
      { step_key: "first_search", completed: hasSearched },
    ];

    return { data: progress };
  } catch (error: any) {
    console.error("Error in getOnboardingProgress:", error);
    return { error: error.message || "An error occurred", data: [] };
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
