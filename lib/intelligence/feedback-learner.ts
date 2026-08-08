/**
 * Feedback Learning System
 * Learns from user interactions: accepting/dismissing suggestions, rating responses, etc.
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type FeedbackType =
  | "suggestion_accepted"
  | "suggestion_dismissed"
  | "response_helpful"
  | "response_not_helpful"
  | "task_completed"
  | "task_deleted"
  | "preference_set";

export interface FeedbackData {
  suggestionId?: string;
  messageId?: string;
  taskId?: string;
  rating?: number;
  reason?: string;
  context?: Record<string, any>;
}

/**
 * Record and learn from user feedback
 */
export async function processFeedback(
  organizationId: string,
  userId: string,
  feedbackType: FeedbackType,
  feedbackData: FeedbackData
): Promise<void> {
  try {
    const supabase = await createClient();

    // Record the learning event
    await supabase.from("learning_events").insert({
      organization_id: organizationId,
      user_id: userId,
      event_type: feedbackType,
      event_source: "user_feedback",
      source_id: feedbackData.suggestionId || feedbackData.messageId || feedbackData.taskId || "",
      event_data: feedbackData,
      processed: false,
    });

    // Process feedback based on type
    switch (feedbackType) {
      case "suggestion_accepted":
        await learnFromAcceptedSuggestion(supabase, organizationId, userId, feedbackData);
        break;
      case "suggestion_dismissed":
        await learnFromDismissedSuggestion(supabase, organizationId, userId, feedbackData);
        break;
      case "response_helpful":
      case "response_not_helpful":
        await learnFromResponseFeedback(supabase, organizationId, userId, feedbackType, feedbackData);
        break;
      case "task_completed":
        await learnFromTaskCompletion(supabase, organizationId, userId, feedbackData);
        break;
    }
  } catch (error) {
    console.error("Error processing feedback:", error);
  }
}

/**
 * Learn when a suggestion is accepted - reinforce similar suggestions
 */
async function learnFromAcceptedSuggestion(
  supabase: any,
  organizationId: string,
  userId: string,
  feedbackData: FeedbackData
): Promise<void> {
  if (!feedbackData.suggestionId) return;

  // Get the suggestion details
  const { data: suggestion } = await supabase
    .from("predictive_suggestions")
    .select("*")
    .eq("id", feedbackData.suggestionId)
    .single();

  if (!suggestion) return;

  // Boost confidence of patterns/insights this suggestion was based on
  if (suggestion.based_on_patterns?.length > 0) {
    // Fetch current patterns and update individually
    const { data: patterns } = await supabase
      .from("recognized_patterns")
      .select("id, confidence")
      .in("id", suggestion.based_on_patterns);

    if (patterns) {
      for (const pattern of patterns) {
        await supabase
          .from("recognized_patterns")
          .update({ confidence: Math.min((pattern.confidence || 0) + 0.05, 1.0) })
          .eq("id", pattern.id);
      }
    }
  }

  if (suggestion.based_on_insights?.length > 0) {
    // Fetch current insights and update individually
    const { data: insights } = await supabase
      .from("ai_insights")
      .select("id, confidence_score")
      .in("id", suggestion.based_on_insights);

    if (insights) {
      for (const insight of insights) {
        await supabase
          .from("ai_insights")
          .update({ confidence_score: Math.min((insight.confidence_score || 0) + 0.05, 1.0) })
          .eq("id", insight.id);
      }
    }
  }

  // Record user's preference for this type of suggestion
  await updatePreference(supabase, userId, organizationId, {
    type: "suggestion",
    key: `preferred_${suggestion.suggestion_type}`,
    value: true,
    boost: 0.1,
  });

  // If suggestion has tags, boost those preference areas
  if (suggestion.context_tags?.length > 0) {
    for (const tag of suggestion.context_tags) {
      await updatePreference(supabase, userId, organizationId, {
        type: "interest",
        key: `topic_${tag}`,
        value: true,
        boost: 0.05,
      });
    }
  }
}

/**
 * Learn when a suggestion is dismissed - reduce similar suggestions
 */
async function learnFromDismissedSuggestion(
  supabase: any,
  organizationId: string,
  userId: string,
  feedbackData: FeedbackData
): Promise<void> {
  if (!feedbackData.suggestionId) return;

  // Get the suggestion details
  const { data: suggestion } = await supabase
    .from("predictive_suggestions")
    .select("*")
    .eq("id", feedbackData.suggestionId)
    .single();

  if (!suggestion) return;

  // Slightly reduce confidence of patterns this suggestion was based on
  if (suggestion.based_on_patterns?.length > 0) {
    const { data: patterns } = await supabase
      .from("recognized_patterns")
      .select("id, confidence")
      .in("id", suggestion.based_on_patterns);

    if (patterns) {
      for (const pattern of patterns) {
        await supabase
          .from("recognized_patterns")
          .update({ confidence: Math.max((pattern.confidence || 0) - 0.02, 0.1) })
          .eq("id", pattern.id);
      }
    }
  }

  // Record that user doesn't want this type of suggestion (if repeatedly dismissed)
  const { data: dismissHistory } = await supabase
    .from("predictive_suggestions")
    .select("id")
    .eq("user_id", userId)
    .eq("suggestion_type", suggestion.suggestion_type)
    .eq("status", "dismissed")
    .limit(5);

  // If user has dismissed 3+ of this type, mark it as disliked
  if (dismissHistory && dismissHistory.length >= 3) {
    await updatePreference(supabase, userId, organizationId, {
      type: "suggestion",
      key: `dislike_${suggestion.suggestion_type}`,
      value: true,
      boost: 0.2,
    });
  }

  // If there's a reason provided, analyze it
  if (feedbackData.reason) {
    await analyzeAndLearnFromFeedbackReason(
      supabase,
      organizationId,
      userId,
      feedbackData.reason,
      "suggestion_dismissed"
    );
  }
}

/**
 * Learn from response feedback (thumbs up/down on AI responses)
 */
async function learnFromResponseFeedback(
  supabase: any,
  organizationId: string,
  userId: string,
  feedbackType: FeedbackType,
  feedbackData: FeedbackData
): Promise<void> {
  if (!feedbackData.messageId) return;

  // Get the message and its context
  const { data: message } = await supabase
    .from("messages")
    .select("content, conversation_id, metadata")
    .eq("id", feedbackData.messageId)
    .single();

  if (!message) return;

  const isPositive = feedbackType === "response_helpful";

  // Update preference for response style if we can detect patterns
  const responseLength = message.content?.length || 0;
  const hasCodeBlocks = message.content?.includes("```") || false;
  const hasBulletPoints = message.content?.includes("- ") || message.content?.includes("• ") || false;

  // Learn about preferred response format
  if (isPositive) {
    if (responseLength > 1000) {
      await updatePreference(supabase, userId, organizationId, {
        type: "response",
        key: "prefers_detailed_responses",
        value: true,
        boost: 0.05,
      });
    } else if (responseLength < 300) {
      await updatePreference(supabase, userId, organizationId, {
        type: "response",
        key: "prefers_concise_responses",
        value: true,
        boost: 0.05,
      });
    }

    if (hasCodeBlocks) {
      await updatePreference(supabase, userId, organizationId, {
        type: "response",
        key: "likes_code_examples",
        value: true,
        boost: 0.05,
      });
    }

    if (hasBulletPoints) {
      await updatePreference(supabase, userId, organizationId, {
        type: "response",
        key: "likes_structured_lists",
        value: true,
        boost: 0.05,
      });
    }
  } else {
    // Negative feedback - reduce these preferences
    if (responseLength > 1000) {
      await updatePreference(supabase, userId, organizationId, {
        type: "response",
        key: "dislikes_verbose_responses",
        value: true,
        boost: 0.05,
      });
    }
  }
}

/**
 * Learn from task completion patterns
 */
async function learnFromTaskCompletion(
  supabase: any,
  organizationId: string,
  userId: string,
  feedbackData: FeedbackData
): Promise<void> {
  if (!feedbackData.taskId) return;

  // Get task details
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", feedbackData.taskId)
    .single();

  if (!task) return;

  // Learn from completion time patterns
  const completionTime = task.completed_at
    ? new Date(task.completed_at)
    : new Date();
  const hour = completionTime.getHours();
  const dayOfWeek = completionTime.getDay();

  // Track productivity patterns
  const timeSlot =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  await updatePreference(supabase, userId, organizationId, {
    type: "productivity",
    key: `productive_${timeSlot}`,
    value: true,
    boost: 0.02,
  });

  // Track task category preferences
  if (task.category) {
    await updatePreference(supabase, userId, organizationId, {
      type: "task",
      key: `completes_${task.category}`,
      value: true,
      boost: 0.03,
    });
  }
}

/**
 * Update or create a user preference
 */
async function updatePreference(
  supabase: any,
  userId: string,
  organizationId: string,
  preference: {
    type: string;
    key: string;
    value: any;
    boost: number;
  }
): Promise<void> {
  // Check if preference exists
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .eq("preference_type", preference.type)
    .eq("preference_key", preference.key)
    .single();

  if (existing) {
    // Update existing preference with boosted confidence
    const newConfidence = Math.min(existing.confidence + preference.boost, 1.0);
    await supabase
      .from("user_preferences")
      .update({
        preference_value: preference.value,
        confidence: newConfidence,
        evidence_count: existing.evidence_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new preference
    await supabase.from("user_preferences").insert({
      user_id: userId,
      organization_id: organizationId,
      preference_type: preference.type,
      preference_key: preference.key,
      preference_value: preference.value,
      confidence: preference.boost + 0.5, // Start at 50% + boost
      evidence_count: 1,
      is_explicit: false,
      sources: { feedback: true },
    });
  }
}

/**
 * Use AI to analyze feedback reason and extract learnings
 */
async function analyzeAndLearnFromFeedbackReason(
  supabase: any,
  organizationId: string,
  userId: string,
  reason: string,
  context: string
): Promise<void> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract user preferences and learnings from feedback. Return JSON with: preferences (array of {type, key, value})",
        },
        {
          role: "user",
          content: `User provided this feedback (${context}): "${reason}"\n\nExtract any preferences or learnings we should remember about this user.`,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return;

    const parsed = JSON.parse(content);

    if (parsed.preferences?.length > 0) {
      for (const pref of parsed.preferences) {
        await updatePreference(supabase, userId, organizationId, {
          type: pref.type || "general",
          key: pref.key,
          value: pref.value,
          boost: 0.1,
        });
      }
    }
  } catch (error) {
    console.error("Error analyzing feedback reason:", error);
  }
}

/**
 * Get feedback stats for a user
 */
export async function getUserFeedbackStats(userId: string) {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("learning_events")
    .select("event_type")
    .eq("user_id", userId)
    .eq("event_source", "user_feedback");

  if (!events) return null;

  const stats = {
    totalFeedback: events.length,
    suggestionsAccepted: events.filter((e) => e.event_type === "suggestion_accepted").length,
    suggestionsDismissed: events.filter((e) => e.event_type === "suggestion_dismissed").length,
    helpfulResponses: events.filter((e) => e.event_type === "response_helpful").length,
    unhelpfulResponses: events.filter((e) => e.event_type === "response_not_helpful").length,
    tasksCompleted: events.filter((e) => e.event_type === "task_completed").length,
  };

  return stats;
}
