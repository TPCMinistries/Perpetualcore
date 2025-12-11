/**
 * Insight Extraction System
 * Analyzes conversations, documents, and actions to extract insights
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ExtractedInsight {
  type: 'preference' | 'pattern' | 'trend' | 'relationship' | 'recommendation';
  category: string;
  title: string;
  description: string;
  keyFindings: Record<string, any>;
  confidence: number;
  evidence: {
    conversationIds?: string[];
    documentIds?: string[];
    actionIds?: string[];
  };
  tags: string[];
}

/**
 * Extract insights from a conversation
 */
export async function extractInsightsFromConversation(
  conversationId: string,
  organizationId: string,
  userId: string
): Promise<ExtractedInsight[]> {
  try {
    const supabase = await createClient();

    // Get conversation messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("content, role, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !messages || messages.length === 0) {
      return [];
    }

    // Build context for AI analysis
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");

    // Use AI to extract insights
    const insights = await analyzeConversationForInsights(conversationText);

    // Store insights in database
    const storedInsights = [];
    for (const insight of insights) {
      const { data, error: insertError } = await supabase
        .from("ai_insights")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          insight_type: insight.type,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          key_findings: insight.keyFindings,
          confidence_score: insight.confidence,
          evidence: {
            conversation_ids: [conversationId],
          },
          context_tags: insight.tags,
          related_conversations: [conversationId],
        })
        .select()
        .single();

      if (!insertError && data) {
        storedInsights.push(data);
      }
    }

    // Record learning event
    await supabase.from("learning_events").insert({
      organization_id: organizationId,
      user_id: userId,
      event_type: "conversation",
      event_source: "chat",
      source_id: conversationId,
      event_data: {
        message_count: messages.length,
        insights_generated: storedInsights.length,
      },
      insights_generated: storedInsights.map((i) => i.id),
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return insights;
  } catch (error) {
    console.error("Error extracting insights:", error);
    return [];
  }
}

/**
 * Use AI to analyze conversation and extract insights
 */
async function analyzeConversationForInsights(
  conversationText: string
): Promise<ExtractedInsight[]> {
  try {
    const prompt = `Analyze the following conversation and extract key insights. Look for:
1. User preferences (communication style, preferred formats, etc.)
2. Patterns (recurring topics, workflows, behaviors)
3. Trends (changing needs, evolving priorities)
4. Relationships (connections between topics, dependencies)
5. Recommendations (optimization opportunities, improvements)

Conversation:
${conversationText.substring(0, 8000)} ${conversationText.length > 8000 ? '...' : ''}

Return a JSON array of insights, each with:
- type: "preference" | "pattern" | "trend" | "relationship" | "recommendation"
- category: string (e.g., "workflow", "communication", "productivity")
- title: string (brief title)
- description: string (detailed description)
- keyFindings: object (structured findings)
- confidence: number (0.0 to 1.0)
- tags: string[] (relevant tags)

Be thorough but concise. Extract 3-7 insights.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing conversations and extracting actionable insights. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.insights || parsed || [];
  } catch (error) {
    console.error("Error in AI insight extraction:", error);
    return [];
  }
}

/**
 * Extract user preferences from conversation
 */
export async function extractUserPreferences(
  conversationId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get conversation
    const { data: messages } = await supabase
      .from("messages")
      .select("content, role")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!messages || messages.length === 0) return;

    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");

    // Analyze for preferences
    const preferences = await analyzeForPreferences(conversationText);

    // Store or update preferences
    for (const pref of preferences) {
      await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            organization_id: organizationId,
            preference_type: pref.type,
            preference_key: pref.key,
            preference_value: pref.value,
            confidence: pref.confidence,
            evidence_count: 1,
            sources: {
              conversation_ids: [conversationId],
            },
            is_explicit: false,
          },
          {
            onConflict: "user_id,preference_type,preference_key",
          }
        );
    }
  } catch (error) {
    console.error("Error extracting preferences:", error);
  }
}

/**
 * Analyze conversation for user preferences
 */
async function analyzeForPreferences(
  conversationText: string
): Promise<
  Array<{
    type: string;
    key: string;
    value: any;
    confidence: number;
  }>
> {
  try {
    const prompt = `Analyze this conversation and identify user preferences. Look for:
- Preferred AI model mentions
- Communication tone preferences
- Response verbosity preferences
- Format preferences (lists, tables, etc.)
- Workflow preferences
- Notification preferences

Conversation:
${conversationText.substring(0, 4000)}

Return JSON with preferences array, each with:
- type: string (e.g., "model", "tone", "verbosity")
- key: string (e.g., "default_model", "email_tone")
- value: any (the preference value)
- confidence: number (0.0 to 1.0)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Extract user preferences from conversation. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.preferences || [];
  } catch (error) {
    console.error("Error analyzing preferences:", error);
    return [];
  }
}

/**
 * Recognize patterns across multiple conversations
 */
export async function recognizePatterns(
  organizationId: string,
  userId?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get recent conversations
    const query = supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (userId) {
      query.eq("user_id", userId);
    }

    const { data: conversations } = await query;

    if (!conversations || conversations.length < 3) return;

    // Get messages from these conversations
    const conversationIds = conversations.map((c) => c.id);
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, content, role, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (!messages || messages.length === 0) return;

    // Analyze for patterns
    const patterns = await analyzeForPatterns(messages, conversations);

    // Store patterns
    for (const pattern of patterns) {
      await supabase.from("recognized_patterns").insert({
        organization_id: organizationId,
        user_id: userId || null,
        pattern_type: pattern.type,
        pattern_name: pattern.name,
        pattern_description: pattern.description,
        pattern_data: pattern.data,
        occurrence_count: pattern.occurrenceCount,
        confidence: pattern.confidence,
        evidence_sources: {
          conversation_ids: pattern.conversationIds,
        },
      });
    }
  } catch (error) {
    console.error("Error recognizing patterns:", error);
  }
}

/**
 * Analyze messages for patterns
 */
async function analyzeForPatterns(
  messages: any[],
  conversations: any[]
): Promise<
  Array<{
    type: string;
    name: string;
    description: string;
    data: any;
    occurrenceCount: number;
    confidence: number;
    conversationIds: string[];
  }>
> {
  try {
    // Group messages by conversation
    const conversationMap = new Map<string, any[]>();
    for (const msg of messages) {
      if (!conversationMap.has(msg.conversation_id)) {
        conversationMap.set(msg.conversation_id, []);
      }
      conversationMap.get(msg.conversation_id)!.push(msg);
    }

    const conversationTexts = Array.from(conversationMap.entries())
      .map(([id, msgs]) => ({
        id,
        text: msgs.map((m) => `${m.role}: ${m.content}`).join("\n\n"),
      }))
      .slice(0, 10); // Limit to 10 conversations for analysis

    const prompt = `Analyze these conversations and identify patterns. Look for:
- Temporal patterns (time-based behaviors)
- Behavioral patterns (recurring actions)
- Content patterns (recurring topics)
- Workflow patterns (recurring processes)
- Communication patterns (recurring styles)

Conversations:
${conversationTexts.map((c, i) => `Conversation ${i + 1}:\n${c.text.substring(0, 1000)}`).join("\n\n---\n\n")}

Return JSON with patterns array, each with:
- type: string (e.g., "temporal", "behavioral", "content")
- name: string (pattern name)
- description: string
- data: object (pattern details)
- occurrenceCount: number
- confidence: number (0.0 to 1.0)
- conversationIds: string[] (which conversations show this pattern)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Identify patterns across conversations. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.patterns || [];
  } catch (error) {
    console.error("Error analyzing patterns:", error);
    return [];
  }
}



