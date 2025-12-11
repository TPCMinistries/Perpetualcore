/**
 * Intelligence System - Main Entry Point
 * Orchestrates all intelligence features
 */

export * from './insight-extractor';
export * from './suggestion-engine';
export * from './knowledge-graph';
export * from './feedback-learner';

import { extractInsightsFromConversation, extractUserPreferences } from './insight-extractor';
import { generateSuggestions, getPendingSuggestions } from './suggestion-engine';
import { buildKnowledgeGraphFromConversations } from './knowledge-graph';
import { recognizePatterns } from './insight-extractor';

/**
 * Process a conversation and extract intelligence
 */
export async function processConversationForIntelligence(
  conversationId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  try {
    // Extract insights and preferences in parallel
    await Promise.all([
      extractInsightsFromConversation(conversationId, organizationId, userId),
      extractUserPreferences(conversationId, organizationId, userId),
    ]);

    // Build knowledge graph (async, don't wait)
    buildKnowledgeGraphFromConversations(organizationId, [conversationId]).catch(
      console.error
    );
  } catch (error) {
    console.error("Error processing conversation for intelligence:", error);
  }
}

/**
 * Run periodic intelligence tasks
 */
export async function runIntelligenceTasks(
  organizationId: string,
  userId?: string
): Promise<void> {
  try {
    // Recognize patterns across conversations
    await recognizePatterns(organizationId, userId);

    // Generate suggestions
    if (userId) {
      await generateSuggestions(organizationId, userId);
    }
  } catch (error) {
    console.error("Error running intelligence tasks:", error);
  }
}

/**
 * Get intelligence summary for a user
 */
export async function getIntelligenceSummary(
  organizationId: string,
  userId: string
) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const [insights, patterns, preferences, suggestions] = await Promise.all([
    supabase
      .from("ai_insights")
      .select("id, title, insight_type, confidence_score")
      .eq("organization_id", organizationId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq("status", "active")
      .order("confidence_score", { ascending: false })
      .limit(5),
    supabase
      .from("recognized_patterns")
      .select("id, pattern_name, pattern_type, occurrence_count")
      .eq("organization_id", organizationId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq("is_active", true)
      .order("occurrence_count", { ascending: false })
      .limit(5),
    supabase
      .from("user_preferences")
      .select("preference_type, preference_key, confidence")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("confidence", { ascending: false })
      .limit(10),
    getPendingSuggestions(organizationId, userId, 5),
  ]);

  return {
    insights: insights.data || [],
    patterns: patterns.data || [],
    preferences: preferences.data || [],
    suggestions: suggestions || [],
  };
}



