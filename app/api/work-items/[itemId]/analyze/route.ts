import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion, ChatMessage } from "@/lib/ai/router";
import { getTeamTemplateById, WorkItemAIInsights } from "@/types/work";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  next_action: string;
  risk_factors?: string[];
  fit_assessment?: string;
  stage_recommendation?: {
    suggested_stage: string;
    suggested_stage_id: string;
    confidence: number;
    reason: string;
    ready_to_advance: boolean;
  };
}

/**
 * POST /api/work-items/[itemId]/analyze
 * Analyzes a work item using AI and returns insights
 * Optionally saves the analysis to the work item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get work item with team context
    const { data: item, error: itemError } = await supabase
      .from("work_items")
      .select(`
        *,
        team:teams(
          id,
          name,
          template_id,
          ai_context,
          workflow_stages
        )
      `)
      .eq("id", itemId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const saveAnalysis = body.save !== false; // Default to saving

    // Get team template for context
    const template = getTeamTemplateById(item.team?.template_id);
    const aiContext = item.team?.ai_context || template?.ai_context;

    // Get current stage name
    const stages = item.team?.workflow_stages || [];
    const currentStage = stages.find((s: any) => s.id === item.current_stage_id);

    // Build analysis prompt based on team type
    const itemType = template ? getItemTypeLabel(item.item_type) : "item";
    const teamName = item.team?.name || "Unknown Team";

    const systemPrompt = buildAnalysisSystemPrompt(
      itemType,
      teamName,
      aiContext,
      template?.workflow_stages || []
    );

    const userPrompt = buildAnalysisUserPrompt(item, currentStage, itemType);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Get AI analysis
    const { response, usage } = await getChatCompletion(
      "claude-sonnet-4",
      messages,
      "free"
    );

    // Parse the AI response
    const analysis = parseAnalysisResponse(response);

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to parse AI analysis" },
        { status: 500 }
      );
    }

    // Resolve suggested stage name to ID
    if (analysis.stage_recommendation && stages.length > 0) {
      const suggestedStageName = analysis.stage_recommendation.suggested_stage?.toLowerCase();
      const matchedStage = stages.find((s: any) =>
        s.name.toLowerCase() === suggestedStageName ||
        s.name.toLowerCase().includes(suggestedStageName) ||
        suggestedStageName?.includes(s.name.toLowerCase())
      );

      if (matchedStage) {
        analysis.stage_recommendation.suggested_stage_id = matchedStage.id;
        analysis.stage_recommendation.suggested_stage = matchedStage.name;
      } else if (suggestedStageName === 'current' || !suggestedStageName) {
        // Item should stay in current stage
        analysis.stage_recommendation.suggested_stage_id = item.current_stage_id;
        analysis.stage_recommendation.suggested_stage = currentStage?.name || 'Current';
        analysis.stage_recommendation.ready_to_advance = false;
      }
    }

    // Save analysis to work item if requested
    if (saveAnalysis) {
      const aiInsights: WorkItemAIInsights = {
        summary: analysis.summary,
        strengths: analysis.strengths,
        concerns: analysis.concerns,
        recommended_actions: analysis.recommendations,
        risk_factors: analysis.risk_factors,
        fit_assessment: analysis.fit_assessment,
        confidence_score: analysis.score,
      };

      const { error: updateError } = await supabase
        .from("work_items")
        .update({
          ai_score: analysis.score,
          ai_insights: aiInsights,
          ai_recommendations: analysis.recommendations,
          ai_analyzed_at: new Date().toISOString(),
          ai_model_used: "claude-sonnet-4",
        })
        .eq("id", itemId);

      if (updateError) {
        console.error("Error saving analysis:", updateError);
        // Don't fail the request, just log it
      }

      // Record in history
      await supabase.from("work_item_history").insert({
        work_item_id: itemId,
        event_type: "ai_analyzed",
        actor_id: user.id,
        actor_type: "user",
        metadata: {
          score: analysis.score,
          model: "claude-sonnet-4",
          tokens: usage.inputTokens + usage.outputTokens,
        },
      });
    }

    return NextResponse.json({
      analysis: {
        ...analysis,
        analyzed_at: new Date().toISOString(),
        model_used: "claude-sonnet-4",
        saved: saveAnalysis,
      },
      usage: {
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
      },
    });
  } catch (error) {
    console.error("Work item analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getItemTypeLabel(itemType: string): string {
  const labels: Record<string, string> = {
    candidate: "Candidate",
    trainee: "Trainee",
    research_item: "Research Item",
    partner: "Partner",
    tool: "Tool",
    content: "Content Piece",
    lead: "Lead",
    rfp: "RFP/Opportunity",
    budget_item: "Budget Item",
    agreement: "Agreement",
    item: "Item",
  };
  return labels[itemType] || itemType.charAt(0).toUpperCase() + itemType.slice(1);
}

function buildAnalysisSystemPrompt(
  itemType: string,
  teamName: string,
  aiContext: any,
  stages: any[]
): string {
  const personality = aiContext?.personality || "analytical and thorough";
  const tone = aiContext?.prompts?.tone || "professional and objective";
  const focus = aiContext?.prompts?.focus || "evaluate quality, identify risks, recommend actions";

  const stageList = stages.map((s: any) => s.name).join(" → ");

  return `You are an AI analyst for the "${teamName}" team. Your personality is ${personality}.

Your communication style is ${tone}.

Your analysis focus: ${focus}

You are analyzing ${itemType}s that flow through these lifecycle stages: ${stageList || "various workflow stages"}.

When analyzing, you must respond with a JSON object containing:
{
  "score": <number 0-100 representing overall quality/fit score>,
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "recommendations": ["<action 1>", "<action 2>", ...],
  "next_action": "<single most important next step>",
  "risk_factors": ["<risk 1>", "<risk 2>", ...],
  "fit_assessment": "<overall fit assessment for this ${itemType.toLowerCase()}>",
  "stage_recommendation": {
    "suggested_stage": "<name of the stage this item should move to, or 'current' if it should stay>",
    "confidence": <number 0-100 how confident you are in this recommendation>,
    "reason": "<brief explanation for why this stage is recommended>",
    "ready_to_advance": <true if item is ready to move forward, false if not>
  }
}

Be specific and actionable in your analysis. Base your scoring on:
- Data completeness (are required fields filled?)
- Quality signals in the description/custom fields
- Stage appropriateness (is this ${itemType.toLowerCase()} ready for its current stage?)
- Priority alignment
- Risk indicators

Always provide at least 2 strengths, 2 concerns, and 3 recommendations.
Respond ONLY with the JSON object, no other text.`;
}

function buildAnalysisUserPrompt(
  item: any,
  currentStage: any,
  itemType: string
): string {
  const customFieldsStr = item.custom_fields
    ? Object.entries(item.custom_fields)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")
    : "None specified";

  const tagsStr = item.tags?.length ? item.tags.join(", ") : "None";

  return `Please analyze this ${itemType}:

**Title:** ${item.title}

**Description:** ${item.description || "No description provided"}

**Current Stage:** ${currentStage?.name || item.current_stage_id || "Unknown"}

**Priority:** ${item.priority || "medium"}

**Due Date:** ${item.due_date || "Not set"}

**Tags:** ${tagsStr}

**Custom Fields:**
${customFieldsStr}

**Is Exception:** ${item.is_exception ? `Yes - ${item.exception_reason || "No reason given"}` : "No"}

**Created:** ${new Date(item.created_at).toLocaleDateString()}

**Available Stages (in order):**
${item.team?.workflow_stages?.map((s: any, i: number) => `${i + 1}. ${s.name}`).join("\n") || "Not defined"}

Please provide your analysis including whether this ${itemType.toLowerCase()} is ready to advance to the next stage.`;
}

function parseAnalysisResponse(response: string): AnalysisResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", response);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (typeof parsed.score !== "number") {
      parsed.score = 50; // Default score
    }

    // Ensure arrays
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    parsed.concerns = Array.isArray(parsed.concerns) ? parsed.concerns : [];
    parsed.recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    parsed.risk_factors = Array.isArray(parsed.risk_factors) ? parsed.risk_factors : [];

    // Ensure strings
    parsed.summary = parsed.summary || "Analysis complete.";
    parsed.next_action = parsed.next_action || "Review the analysis findings.";
    parsed.fit_assessment = parsed.fit_assessment || "";

    // Clamp score
    parsed.score = Math.max(0, Math.min(100, parsed.score));

    // Parse stage recommendation
    if (parsed.stage_recommendation) {
      parsed.stage_recommendation.confidence = Math.max(0, Math.min(100, parsed.stage_recommendation.confidence || 50));
      parsed.stage_recommendation.ready_to_advance = !!parsed.stage_recommendation.ready_to_advance;
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing analysis response:", error);
    console.error("Raw response:", response);
    return null;
  }
}
