import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/documents/[id]/summary
 * Generate AI summary for a document
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const documentId = params.id;

    // Fetch the document
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return new Response("Document not found", { status: 404 });
    }

    // Check if user owns this document (via organization)
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== document.organization_id) {
      return new Response("Unauthorized", { status: 403 });
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

    console.log(`🤖 Generating summary for document: ${document.title}`);

    // Generate summary using Claude
    const prompt = `Analyze this document and provide:

1. A concise 3-4 sentence summary
2. 4-6 key points (bullet list)
3. Document type classification (e.g., "Legal Contract", "Research Paper", "Business Email", "Technical Documentation", etc.)

Document Title: ${document.title}
Document Content:
${document.content.substring(0, 50000)} ${document.content.length > 50000 ? "..." : ""}

Respond in JSON format:
{
  "summary": "3-4 sentence summary here...",
  "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "document_type": "Legal Contract"
}`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the response
    const responseText = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    // Parse JSON response
    let summaryData;
    try {
      // Extract JSON from the response (in case Claude adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", responseText);
      return new Response("Failed to parse AI response", { status: 500 });
    }

    // Calculate tokens and cost
    // Input tokens + output tokens
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;

    // Claude 3.5 Sonnet pricing (as of Jan 2025):
    // Input: $3 per million tokens
    // Output: $15 per million tokens
    const inputCost = (inputTokens / 1_000_000) * 3.0;
    const outputCost = (outputTokens / 1_000_000) * 15.0;
    const totalCost = inputCost + outputCost;

    console.log(`📊 Summary generated:
    - Input tokens: ${inputTokens}
    - Output tokens: ${outputTokens}
    - Total cost: $${totalCost.toFixed(4)}
    `);

    // Update document with summary
    const { data: updated, error: updateError } = await supabase
      .from("documents")
      .update({
        summary: summaryData.summary,
        key_points: summaryData.key_points,
        document_type: summaryData.document_type,
        summary_generated_at: new Date().toISOString(),
        summary_tokens_used: totalTokens,
        summary_cost_usd: totalCost.toFixed(4),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating document:", updateError);
      return new Response("Failed to save summary", { status: 500 });
    }

    return Response.json({
      message: "Summary generated successfully",
      summary: {
        summary: summaryData.summary,
        key_points: summaryData.key_points,
        document_type: summaryData.document_type,
        tokens_used: totalTokens,
        cost_usd: totalCost.toFixed(4),
        generated_at: updated.summary_generated_at,
      },
      cached: false,
    });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    return new Response(`Failed to generate summary: ${error.message}`, {
      status: 500,
    });
  }
}

/**
 * DELETE /api/documents/[id]/summary
 * Delete the summary for a document (allows regeneration)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const documentId = params.id;

    // Verify ownership
    const { data: document } = await supabase
      .from("documents")
      .select("organization_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return new Response("Document not found", { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== document.organization_id) {
      return new Response("Unauthorized", { status: 403 });
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

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error("Delete summary error:", error);
    return new Response(`Failed to delete summary: ${error.message}`, {
      status: 500,
    });
  }
}
