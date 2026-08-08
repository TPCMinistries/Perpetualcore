/**
 * Predictive Suggestion Engine
 * Generates intelligent suggestions based on insights, patterns, and preferences
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface Suggestion {
  type: 'action' | 'optimization' | 'reminder' | 'recommendation' | 'insight';
  title: string;
  description: string;
  suggestedAction: {
    type: string;
    details: any;
  };
  relevanceScore: number;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  basedOnInsights?: string[];
  basedOnPatterns?: string[];
  tags: string[];
}

/**
 * Generate suggestions for a user based on their data
 */
export async function generateSuggestions(
  organizationId: string,
  userId: string
): Promise<Suggestion[]> {
  try {
    const supabase = await createClient();

    // Gather intelligence data
    const [insights, patterns, preferences, recentActivity] = await Promise.all([
      getRelevantInsights(supabase, organizationId, userId),
      getRelevantPatterns(supabase, organizationId, userId),
      getUserPreferences(supabase, userId),
      getRecentActivity(supabase, organizationId, userId),
    ]);

    // Use AI to generate suggestions
    const suggestions = await generateSuggestionsWithAI(
      insights,
      patterns,
      preferences,
      recentActivity
    );

    // Store suggestions
    const storedSuggestions = [];
    for (const suggestion of suggestions) {
      const { data, error } = await supabase
        .from("predictive_suggestions")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          suggestion_type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          suggested_action: suggestion.suggestedAction,
          relevance_score: suggestion.relevanceScore,
          confidence: suggestion.confidence,
          priority: suggestion.priority,
          based_on_insights: suggestion.basedOnInsights || [],
          based_on_patterns: suggestion.basedOnPatterns || [],
          context_tags: suggestion.tags,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        storedSuggestions.push(data);
      }
    }

    return suggestions;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}

/**
 * Get relevant insights for suggestion generation
 */
async function getRelevantInsights(
  supabase: any,
  organizationId: string,
  userId: string
) {
  const { data } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("organization_id", organizationId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq("status", "active")
    .order("confidence_score", { ascending: false })
    .limit(10);

  return data || [];
}

/**
 * Get relevant patterns
 */
async function getRelevantPatterns(
  supabase: any,
  organizationId: string,
  userId: string
) {
  const { data } = await supabase
    .from("recognized_patterns")
    .select("*")
    .eq("organization_id", organizationId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq("is_active", true)
    .order("occurrence_count", { ascending: false })
    .limit(10);

  return data || [];
}

/**
 * Get user preferences
 */
async function getUserPreferences(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  return data || [];
}

/**
 * Get recent activity
 */
async function getRecentActivity(
  supabase: any,
  organizationId: string,
  userId: string
) {
  const { data } = await supabase
    .from("conversations")
    .select("id, title, created_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
}

/**
 * Use AI to generate intelligent suggestions
 */
async function generateSuggestionsWithAI(
  insights: any[],
  patterns: any[],
  preferences: any[],
  recentActivity: any[]
): Promise<Suggestion[]> {
  try {
    const prompt = `Based on the following intelligence data, generate 5-10 actionable suggestions for the user.

INSIGHTS:
${insights.map((i, idx) => `${idx + 1}. ${i.title}: ${i.description} (confidence: ${i.confidence_score})`).join('\n')}

PATTERNS:
${patterns.map((p, idx) => `${idx + 1}. ${p.pattern_name}: ${p.pattern_description} (occurrences: ${p.occurrence_count})`).join('\n')}

PREFERENCES:
${preferences.map((p, idx) => `${idx + 1}. ${p.preference_key}: ${JSON.stringify(p.preference_value)}`).join('\n')}

RECENT ACTIVITY:
${recentActivity.map((a, idx) => `${idx + 1}. ${a.title} (${new Date(a.created_at).toLocaleDateString()})`).join('\n')}

Generate suggestions that are:
- Actionable and specific
- Based on the insights and patterns
- Respectful of user preferences
- Relevant to recent activity
- Prioritized appropriately

Return JSON with suggestions array, each with:
- type: "action" | "optimization" | "reminder" | "recommendation" | "insight"
- title: string (brief, actionable title)
- description: string (detailed explanation)
- suggestedAction: { type: string, details: object }
- relevanceScore: number (0.0 to 1.0)
- confidence: number (0.0 to 1.0)
- priority: "low" | "medium" | "high" | "urgent"
- basedOnInsights: string[] (insight IDs if applicable)
- basedOnPatterns: string[] (pattern IDs if applicable)
- tags: string[]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at generating actionable, intelligent suggestions based on user data. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Error generating suggestions with AI:", error);
    return [];
  }
}

/**
 * Get pending suggestions for a user
 */
export async function getPendingSuggestions(
  organizationId: string,
  userId: string,
  limit: number = 10
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("predictive_suggestions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("relevance_score", { ascending: false })
    .order("priority", { ascending: false })
    .limit(limit);

  return data || [];
}



