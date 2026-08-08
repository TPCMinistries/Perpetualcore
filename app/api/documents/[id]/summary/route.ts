import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate summary using Claude (primary)
 */
async function generateWithClaude(prompt: string): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
}> {
  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    provider: "claude",
  };
}

/**
 * Generate summary using OpenAI (fallback)
 */
async function generateWithOpenAI(prompt: string): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content || "";

  return {
    text,
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
    provider: "openai",
  };
}

/**
 * POST /api/documents/[id]/summary
 * Generate AI summary for a document
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the document
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user owns this document (via organization)
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== document.organization_id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if document has content
    if (!document.content || document.content.trim().length === 0) {
      return Response.json({
        error: "Document has no content. Please reprocess the document first."
      }, { status: 400 });
    }

    // Check if summary already exists
    if (document.summary) {
      return Response.json({
        message: "Summary already exists",
        summary: {
          summary: document.summary,
          key_points: document.key_points,
          document_type: document.document_type,
          tokens_used: document.summary_tokens_used,
          cost_usd: document.summary_cost_usd,
          generated_at: document.summary_generated_at,
        },
        cached: true,
      });
    }

    // Build the prompt
    const prompt = `Analyze this document and provide:

1. A concise 3-4 sentence summary
2. 4-6 key points (bullet list)
3. Document type classification (e.g., "Legal Contract", "Research Paper", "Business Email", "Technical Documentation", etc.)

Document Title: ${document.title}
Document Content:
${document.content.substring(0, 50000)} ${document.content.length > 50000 ? "..." : ""}

Respond in JSON format only, no other text:
{
  "summary": "3-4 sentence summary here...",
  "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "document_type": "Legal Contract"
}`;

    // Try Claude first, fallback to OpenAI if error
    let aiResponse;
    try {
      aiResponse = await generateWithClaude(prompt);
    } catch (claudeError: any) {
      // Fallback to OpenAI on any Claude error
      try {
        aiResponse = await generateWithOpenAI(prompt);
      } catch (openaiError: any) {
        console.error("Both AI providers failed:", { claude: claudeError.message, openai: openaiError.message });
        return Response.json({
          error: `AI generation failed: ${claudeError.message}`
        }, { status: 500 });
      }
    }

    // Parse JSON response
    let summaryData;
    try {
      const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse.text);
      return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Calculate cost based on provider
    const { inputTokens, outputTokens, provider } = aiResponse;
    const totalTokens = inputTokens + outputTokens;

    let totalCost: number;
    if (provider === "claude") {
      // Claude Haiku pricing
      const inputCost = (inputTokens / 1_000_000) * 0.25;
      const outputCost = (outputTokens / 1_000_000) * 1.25;
      totalCost = inputCost + outputCost;
    } else {
      // GPT-4o-mini pricing
      const inputCost = (inputTokens / 1_000_000) * 0.15;
      const outputCost = (outputTokens / 1_000_000) * 0.60;
      totalCost = inputCost + outputCost;
    }

    // Update document with summary
    const { data: updated, error: updateError } = await supabase
      .from("documents")
      .update({
        summary: summaryData.summary,
        key_points: summaryData.key_points,
        document_type: summaryData.document_type,
        summary_generated_at: new Date().toISOString(),
        summary_tokens_used: totalTokens,
        summary_cost_usd: totalCost.toFixed(6),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating document:", updateError);
      return Response.json({ error: "Failed to save summary" }, { status: 500 });
    }

    return Response.json({
      message: "Summary generated successfully",
      summary: {
        summary: summaryData.summary,
        key_points: summaryData.key_points,
        document_type: summaryData.document_type,
        tokens_used: totalTokens,
        cost_usd: totalCost.toFixed(6),
        generated_at: updated.summary_generated_at,
      },
      provider,
      cached: false,
    });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    return Response.json({
      error: `Failed to generate summary: ${error.message}`
    }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]/summary
 * Delete the summary for a document (allows regeneration)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: document } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== document.organization_id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Clear summary fields
    await supabase
      .from("documents")
      .update({
        summary: null,
        key_points: null,
        document_type: null,
        summary_generated_at: null,
        summary_tokens_used: null,
        summary_cost_usd: null,
      })
      .eq("id", documentId);

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Delete summary error:", error);
    return Response.json({
      error: `Failed to delete summary: ${error.message}`
    }, { status: 500 });
  }
}
