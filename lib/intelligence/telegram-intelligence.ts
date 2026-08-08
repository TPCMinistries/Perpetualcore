/**
 * Telegram Intelligence Processor
 * Analyzes telegram_interactions to extract patterns, preferences, and insights
 */

import { createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TelegramInsight {
  type: "usage_pattern" | "intent_distribution" | "peak_times" | "topic_cluster" | "automation_opportunity";
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
  period: string;
}

export interface TelegramStats {
  totalInteractions: number;
  byIntent: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byHour: Record<string, number>;
  topEntities: { type: string; count: number }[];
  averageProcessingTime: number;
  successRate: number;
}

/**
 * Fetch Telegram interaction statistics
 */
export async function getTelegramStats(
  userId: string,
  days: number = 30
): Promise<TelegramStats> {
  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: interactions, error } = await supabase
    .from("telegram_interactions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error || !interactions) {
    return {
      totalInteractions: 0,
      byIntent: {},
      byDayOfWeek: {},
      byHour: {},
      topEntities: [],
      averageProcessingTime: 0,
      successRate: 0,
    };
  }

  // Calculate statistics
  const byIntent: Record<string, number> = {};
  const byDayOfWeek: Record<string, number> = {};
  const byHour: Record<string, number> = {};
  const entityCounts: Record<string, number> = {};
  let totalProcessingTime = 0;
  let successCount = 0;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  interactions.forEach((interaction) => {
    // By intent
    const intent = interaction.detected_intent || "unknown";
    byIntent[intent] = (byIntent[intent] || 0) + 1;

    // By day of week
    const date = new Date(interaction.created_at);
    const dayName = dayNames[date.getDay()];
    byDayOfWeek[dayName] = (byDayOfWeek[dayName] || 0) + 1;

    // By hour
    const hour = date.getHours();
    const hourLabel = `${hour.toString().padStart(2, "0")}:00`;
    byHour[hourLabel] = (byHour[hourLabel] || 0) + 1;

    // Entity counts
    if (interaction.created_entity_type) {
      entityCounts[interaction.created_entity_type] = (entityCounts[interaction.created_entity_type] || 0) + 1;
    }

    // Processing time
    if (interaction.processing_time_ms) {
      totalProcessingTime += interaction.processing_time_ms;
    }

    // Success rate (has a response)
    if (interaction.ai_response) {
      successCount++;
    }
  });

  const topEntities = Object.entries(entityCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalInteractions: interactions.length,
    byIntent,
    byDayOfWeek,
    byHour,
    topEntities,
    averageProcessingTime:
      interactions.length > 0 ? Math.round(totalProcessingTime / interactions.length) : 0,
    successRate: interactions.length > 0 ? (successCount / interactions.length) * 100 : 0,
  };
}

/**
 * Extract insights from Telegram interactions
 */
export async function extractTelegramInsights(
  userId: string,
  organizationId: string,
  days: number = 30
): Promise<TelegramInsight[]> {
  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: interactions, error } = await supabase
    .from("telegram_interactions")
    .select("message_text, detected_intent, created_entity_type, created_at, processing_time_ms")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !interactions || interactions.length < 5) {
    return [];
  }

  const insights: TelegramInsight[] = [];
  const stats = await getTelegramStats(userId, days);

  // 1. Usage Pattern Insight
  const mostActiveDay = Object.entries(stats.byDayOfWeek).sort((a, b) => b[1] - a[1])[0];
  const mostActiveHour = Object.entries(stats.byHour).sort((a, b) => b[1] - a[1])[0];

  if (mostActiveDay && mostActiveHour) {
    insights.push({
      type: "usage_pattern",
      title: "Your Telegram Usage Pattern",
      description: `You're most active on ${mostActiveDay[0]}s around ${mostActiveHour[0]}. This could be a good time for scheduled briefings.`,
      data: {
        mostActiveDay: mostActiveDay[0],
        mostActiveHour: mostActiveHour[0],
        interactionsOnPeakDay: mostActiveDay[1],
      },
      confidence: 0.85,
      period: `Last ${days} days`,
    });
  }

  // 2. Intent Distribution Insight
  const topIntent = Object.entries(stats.byIntent).sort((a, b) => b[1] - a[1])[0];
  if (topIntent) {
    const percentage = Math.round((topIntent[1] / stats.totalInteractions) * 100);
    insights.push({
      type: "intent_distribution",
      title: "Primary Use Case",
      description: `${percentage}% of your Telegram interactions are for "${topIntent[0]}". Consider adding quick actions for this.`,
      data: {
        topIntent: topIntent[0],
        percentage,
        distribution: stats.byIntent,
      },
      confidence: 0.9,
      period: `Last ${days} days`,
    });
  }

  // 3. Automation Opportunity
  if (stats.topEntities.length > 0) {
    const topEntity = stats.topEntities[0];
    insights.push({
      type: "automation_opportunity",
      title: "Automation Suggestion",
      description: `You frequently create ${topEntity.type}s via Telegram (${topEntity.count} times). Consider setting up auto-categorization rules.`,
      data: {
        entityType: topEntity.type,
        count: topEntity.count,
        allEntities: stats.topEntities,
      },
      confidence: 0.75,
      period: `Last ${days} days`,
    });
  }

  // 4. Use AI to find topic clusters if we have enough data
  if (interactions.length >= 20) {
    try {
      const messages = interactions
        .filter((i) => i.message_text)
        .slice(0, 50)
        .map((i) => i.message_text)
        .join("\n---\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze these Telegram messages and identify 2-3 main topic clusters or themes.
For each theme, provide:
- A short name (2-3 words)
- A one-sentence description
- Estimated percentage of messages

Respond in JSON format:
{
  "themes": [
    {"name": "...", "description": "...", "percentage": 25}
  ]
}`,
          },
          {
            role: "user",
            content: messages,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const themeData = JSON.parse(completion.choices[0]?.message?.content || "{}");
      if (themeData.themes && themeData.themes.length > 0) {
        insights.push({
          type: "topic_cluster",
          title: "Your Top Topics",
          description: `Based on your messages, your main focus areas are: ${themeData.themes.map((t: any) => t.name).join(", ")}.`,
          data: {
            themes: themeData.themes,
          },
          confidence: 0.7,
          period: `Last ${days} days`,
        });
      }
    } catch (aiError) {
      console.error("AI topic clustering failed:", aiError);
    }
  }

  // Store insights in database
  for (const insight of insights) {
    await supabase.from("ai_insights").insert({
      organization_id: organizationId,
      user_id: userId,
      insight_type: insight.type,
      category: "telegram",
      title: insight.title,
      description: insight.description,
      key_findings: insight.data,
      confidence_score: insight.confidence,
      context_tags: ["telegram", "automation", insight.type],
    });
  }

  return insights;
}

/**
 * Get recent Telegram activity for dashboard display
 */
export async function getRecentTelegramActivity(
  userId: string,
  limit: number = 10
): Promise<{
  interactions: any[];
  summary: {
    todayCount: number;
    mostRecentIntent: string | null;
    entitiesCreated: number;
  };
}> {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: interactions, error } = await supabase
    .from("telegram_interactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !interactions) {
    return {
      interactions: [],
      summary: { todayCount: 0, mostRecentIntent: null, entitiesCreated: 0 },
    };
  }

  const todayCount = interactions.filter(
    (i) => new Date(i.created_at) >= today
  ).length;

  const entitiesCreated = interactions.filter(
    (i) => i.created_entity_id
  ).length;

  return {
    interactions,
    summary: {
      todayCount,
      mostRecentIntent: interactions[0]?.detected_intent || null,
      entitiesCreated,
    },
  };
}

/**
 * Feed Telegram interactions into the suggestion engine
 */
export async function feedTelegramToSuggestions(
  userId: string,
  organizationId: string
): Promise<void> {
  const supabase = createAdminClient();

  // Get unprocessed interactions from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: interactions } = await supabase
    .from("telegram_interactions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", yesterday.toISOString())
    .is("metadata->processed_for_suggestions", null);

  if (!interactions || interactions.length === 0) return;

  // Group by intent and create suggestions
  const intentGroups: Record<string, any[]> = {};
  interactions.forEach((i) => {
    const intent = i.detected_intent || "general";
    if (!intentGroups[intent]) intentGroups[intent] = [];
    intentGroups[intent].push(i);
  });

  // Create suggestions based on patterns
  for (const [intent, items] of Object.entries(intentGroups)) {
    if (items.length >= 3) {
      // If user frequently does something, suggest related actions
      await supabase.from("ai_suggestions").insert({
        organization_id: organizationId,
        user_id: userId,
        suggestion_type: "automation",
        title: `Automate your ${intent} workflow`,
        content: `You've logged ${items.length} ${intent} items via Telegram recently. Consider setting up an automated workflow to streamline this.`,
        priority_score: Math.min(items.length * 10, 90),
        context_data: {
          intent,
          count: items.length,
          source: "telegram",
        },
        source_type: "telegram_pattern",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
    }
  }

  // Mark as processed
  const ids = interactions.map((i) => i.id);
  await supabase
    .from("telegram_interactions")
    .update({
      metadata: { processed_for_suggestions: true },
    })
    .in("id", ids);
}
