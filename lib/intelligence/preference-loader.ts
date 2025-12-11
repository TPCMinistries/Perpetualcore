/**
 * Load and apply user preferences to AI interactions
 */

import { createClient } from "@/lib/supabase/server";
import { AIModel } from "@/types";

export interface UserPreferences {
  defaultModel?: AIModel;
  preferredTone?: string;
  verbosityLevel?: 'concise' | 'balanced' | 'detailed';
  responseFormat?: 'list' | 'paragraph' | 'structured';
  [key: string]: any;
}

/**
 * Load user preferences from database
 */
export async function loadUserPreferences(
  userId: string
): Promise<UserPreferences> {
  try {
    const supabase = await createClient();

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("preference_type, preference_key, preference_value, confidence")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("confidence", { ascending: false });

    if (!preferences || preferences.length === 0) {
      return {};
    }

    // Convert to object
    const prefs: UserPreferences = {};

    for (const pref of preferences) {
      // Only use high-confidence preferences
      if (pref.confidence >= 0.6) {
        if (pref.preference_type === "model" && pref.preference_key === "default_model") {
          prefs.defaultModel = pref.preference_value as AIModel;
        } else if (pref.preference_type === "tone" && pref.preference_key === "preferred_tone") {
          prefs.preferredTone = pref.preference_value as string;
        } else if (pref.preference_type === "verbosity" && pref.preference_key === "level") {
          prefs.verbosityLevel = pref.preference_value as 'concise' | 'balanced' | 'detailed';
        } else if (pref.preference_type === "format" && pref.preference_key === "response_format") {
          prefs.responseFormat = pref.preference_value as 'list' | 'paragraph' | 'structured';
        } else {
          // Store other preferences
          prefs[`${pref.preference_type}_${pref.preference_key}`] = pref.preference_value;
        }
      }
    }

    return prefs;
  } catch (error) {
    console.error("Error loading user preferences:", error);
    return {};
  }
}

/**
 * Apply preferences to system prompt
 */
export function applyPreferencesToPrompt(
  basePrompt: string,
  preferences: UserPreferences
): string {
  let enhancedPrompt = basePrompt;

  if (preferences.preferredTone) {
    enhancedPrompt += `\n\nCOMMUNICATION STYLE: The user prefers a ${preferences.preferredTone} tone. Adjust your communication style accordingly.`;
  }

  if (preferences.verbosityLevel) {
    const verbosityMap = {
      concise: "Be brief and to the point. Avoid unnecessary elaboration.",
      balanced: "Provide a balanced level of detail - thorough but not excessive.",
      detailed: "Provide comprehensive, detailed responses with full context and explanations.",
    };
    enhancedPrompt += `\n\nVERBOSITY: ${verbosityMap[preferences.verbosityLevel]}`;
  }

  if (preferences.responseFormat) {
    const formatMap = {
      list: "Prefer structured lists and bullet points when presenting information.",
      paragraph: "Prefer flowing paragraph format for responses.",
      structured: "Use clear headings, sections, and structured formatting.",
    };
    enhancedPrompt += `\n\nFORMAT: ${formatMap[preferences.responseFormat]}`;
  }

  return enhancedPrompt;
}



