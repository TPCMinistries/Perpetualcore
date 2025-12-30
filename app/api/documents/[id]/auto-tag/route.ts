import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/documents/[id]/auto-tag
 * Generate AI-powered tag suggestions for a document
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: documentId } = await params;

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

    console.log(`🏷️  Generating auto-tags for document: ${document.title}`);

    // Get existing tags in the organization for context
    const { data: existingTags } = await supabase
      .from("tags")
      .select("name")
      .eq("organization_id", profile.organization_id)
      .limit(50);

    const existingTagNames = existingTags?.map((t) => t.name) || [];

    // Build context for Claude
    let context = `Document Title: ${document.title}\n\n`;

    if (document.document_type) {
      context += `Document Type: ${document.document_type}\n\n`;
    }

    if (document.summary) {
      context += `Summary: ${document.summary}\n\n`;
    }

    if (document.key_points && document.key_points.length > 0) {
      context += `Key Points:\n${document.key_points.map((p: string) => `- ${p}`).join('\n')}\n\n`;
    }

    // Include a preview of the content
    const contentPreview = document.content.length > 3000
      ? document.content.substring(0, 3000) + "\n\n[Content preview truncated...]"
      : document.content;

    context += `Content Preview:\n${contentPreview}`;

    // Generate tag suggestions using Claude
    const prompt = `Analyze this document and suggest 3-5 relevant tags that would help categorize and organize it.

${context}

${existingTagNames.length > 0 ? `\nExisting tags in the organization that you can reuse:\n${existingTagNames.slice(0, 20).join(', ')}\n` : ''}

Provide tags that are:
1. Relevant to the document's content and purpose
2. Concise (1-3 words each)
3. Useful for organization and search
4. When possible, reuse existing tags from the organization
5. Cover different aspects: topic, type, department, project, priority, etc.

Respond ONLY with a JSON array of 3-5 tag names, nothing else.
Example: ["Legal", "Contract", "Q1 2024", "High Priority", "Client Facing"]`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 256,
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
    let suggestedTags: string[];
    try {
      // Extract JSON array from the response
      const jsonMatch = responseText.match(/\[[^\]]*\]/);
      if (jsonMatch) {
        suggestedTags = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", responseText);
      return new Response("Failed to parse AI response", { status: 500 });
    }

    // Validate that we got an array of strings
    if (!Array.isArray(suggestedTags) || suggestedTags.some(tag => typeof tag !== 'string')) {
      console.error("Invalid tag format from Claude:", suggestedTags);
      return new Response("Invalid tag format from AI", { status: 500 });
    }

    // Clean and limit tags to 5
    suggestedTags = suggestedTags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 5);

    // Calculate tokens and cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;

    // Claude 3 Haiku pricing
    const inputCost = (inputTokens / 1_000_000) * 0.25;
    const outputCost = (outputTokens / 1_000_000) * 1.25;
    const totalCost = inputCost + outputCost;

    console.log(`📊 Auto-tag suggestions generated:
    - Tags: ${suggestedTags.join(', ')}
    - Input tokens: ${inputTokens}
    - Output tokens: ${outputTokens}
    - Total cost: $${totalCost.toFixed(6)}
    `);

    return Response.json({
      suggested_tags: suggestedTags,
      tokens_used: totalTokens,
      cost_usd: totalCost.toFixed(6),
    });
  } catch (error: any) {
    console.error("Auto-tag generation error:", error);
    return new Response(`Failed to generate tag suggestions: ${error.message}`, {
      status: 500,
    });
  }
}
