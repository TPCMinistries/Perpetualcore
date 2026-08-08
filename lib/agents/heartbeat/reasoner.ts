/**
 * Heartbeat Reasoner
 *
 * Uses AI (Claude Haiku for cost efficiency) to analyze all check results,
 * identify patterns across data sources, and generate prioritized,
 * actionable insights. Cross-references emails with calendar events,
 * tasks with contacts, etc.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CheckResult, HeartbeatInsight } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Analyze all check results and generate actionable insights.
 *
 * Uses Claude Haiku (cheap, fast) to:
 * - Combine and cross-reference all check results
 * - Identify patterns and priorities
 * - Generate 3-5 actionable insights
 * - Rank by urgency
 *
 * @param userId - The user ID (for context)
 * @param results - Array of CheckResult from all checkers
 * @returns Array of HeartbeatInsight, ranked by urgency
 */
export async function analyzeCheckResults(
  userId: string,
  results: CheckResult[]
): Promise<HeartbeatInsight[]> {
  // If no results have items, return a simple summary
  const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);
  if (totalItems === 0) {
    return [
      {
        category: "summary",
        message: "All clear! No urgent items need your attention right now.",
        urgency: "low",
        suggestedAction: "Enjoy your free time or work on deep focus tasks.",
        relatedItems: [],
      },
    ];
  }

  // Build a structured summary for the AI
  const checkSummaries = results.map((r) => ({
    type: r.type,
    summary: r.summary,
    urgency: r.urgency,
    itemCount: r.items.length,
    items: r.items.map((item) => ({
      title: item.title,
      urgency: item.urgency,
      category: item.category,
      metadata: item.metadata,
    })),
  }));

  try {
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-20250514",
      max_tokens: 1024,
      system: `You are an executive assistant analyzing a user's daily status report.
Your job is to synthesize information from multiple sources (email, calendar, tasks, contacts) and generate 3-5 actionable insights.

RULES:
- Be specific and actionable, not vague
- Cross-reference data (e.g., "You have a meeting with X in 2hrs but haven't replied to their email")
- Prioritize by urgency (critical > high > medium > low)
- Keep each insight under 100 words
- Suggest concrete next steps
- Group related items when possible

Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "category": "email|calendar|tasks|contacts|scheduling|relationship|general",
      "message": "The insight message",
      "urgency": "low|medium|high|critical",
      "suggestedAction": "What the user should do",
      "relatedItems": ["item references or IDs"]
    }
  ]
}`,
      messages: [
        {
          role: "user",
          content: `Here's the current status report for analysis:\n\n${JSON.stringify(checkSummaries, null, 2)}`,
        },
      ],
    });

    const responseText =
      completion.content[0].type === "text" ? completion.content[0].text : "";

    // Parse the JSON response
    const parsed = JSON.parse(responseText);
    const insights: HeartbeatInsight[] = (parsed.insights || []).map(
      (insight: any) => ({
        category: insight.category || "general",
        message: insight.message || "",
        urgency: validateUrgency(insight.urgency),
        suggestedAction: insight.suggestedAction || "",
        relatedItems: insight.relatedItems || [],
      })
    );

    // Sort by urgency
    const urgencyOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    insights.sort(
      (a, b) =>
        (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3)
    );

    // Limit to 5 insights
    return insights.slice(0, 5);
  } catch (error: any) {
    console.error("[HeartbeatReasoner] AI analysis error:", error);

    // Fallback: generate basic insights from the raw data
    return generateFallbackInsights(results);
  }
}

/**
 * Validate urgency value to ensure it's a valid level.
 */
function validateUrgency(
  urgency: string
): "low" | "medium" | "high" | "critical" {
  const valid = ["low", "medium", "high", "critical"];
  return valid.includes(urgency)
    ? (urgency as "low" | "medium" | "high" | "critical")
    : "medium";
}

/**
 * Generate fallback insights without AI when the API call fails.
 * Uses simple heuristics to summarize the check results.
 */
function generateFallbackInsights(results: CheckResult[]): HeartbeatInsight[] {
  const insights: HeartbeatInsight[] = [];

  for (const result of results) {
    if (result.items.length === 0) continue;

    const urgentItems = result.items.filter(
      (i) => i.urgency === "high" || i.urgency === "critical"
    );

    if (urgentItems.length > 0) {
      insights.push({
        category: result.type,
        message: `You have ${urgentItems.length} urgent ${result.type} item(s): ${urgentItems.map((i) => i.title).slice(0, 3).join("; ")}`,
        urgency: urgentItems.some((i) => i.urgency === "critical")
          ? "critical"
          : "high",
        suggestedAction: `Review your ${result.type} and address the urgent items first.`,
        relatedItems: urgentItems.map((i) => i.metadata?.taskId || i.metadata?.emailId || i.title).slice(0, 5),
      });
    } else {
      insights.push({
        category: result.type,
        message: result.summary,
        urgency: result.urgency,
        suggestedAction: `Review your ${result.type} when you have a moment.`,
        relatedItems: [],
      });
    }
  }

  return insights.slice(0, 5);
}
