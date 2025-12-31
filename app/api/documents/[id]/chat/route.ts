import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/documents/[id]/chat
 * Chat with a specific document using AI
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
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { question, conversationHistory = [] } = body;

    if (!question || typeof question !== "string") {
      return new Response("Question is required", { status: 400 });
    }

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

    // Check if document has content
    if (!document.content && !document.summary) {
      return Response.json({
        error: "Document has no content. Please reprocess the document first."
      }, { status: 400 });
    }

    // Build conversation messages for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      });
    }

    // Build the context from document content and summary
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

    // Include document content
    if (document.content) {
      const maxContentLength = 40000;
      const contentPreview = document.content.length > maxContentLength
        ? document.content.substring(0, maxContentLength) + "\n\n[Content truncated...]"
        : document.content;
      context += `Full Document Content:\n${contentPreview}`;
    }

    // Add the current question
    messages.push({
      role: "user",
      content: question,
    });

    // System prompt
    const systemPrompt = `You are a helpful AI assistant that answers questions about documents. You have been provided with the full content of a document.

Your role is to:
1. Answer questions accurately based on the document content
2. Format your responses using proper Markdown for better readability:
   - Use **bold** for emphasis on key terms
   - Use bullet points (- ) for lists
   - Use numbered lists (1. 2. 3.) for sequential steps
   - Use > blockquotes for direct document quotes
   - Use headings (##) to organize longer responses into sections
3. Structure responses clearly:
   - Start with a direct answer to the question
   - Follow with supporting details from the document
4. If the answer isn't in the document, say so clearly
5. Be concise but thorough

Here is the document you should reference:

${context}

Please answer the user's questions based solely on this document's content.`;

    // Call Claude with streaming disabled for now (can enable later)
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    });

    // Extract the response
    const responseText = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    // Calculate tokens and cost (Claude 3 Haiku pricing)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const inputCost = (inputTokens / 1_000_000) * 0.25;
    const outputCost = (outputTokens / 1_000_000) * 1.25;
    const totalCost = inputCost + outputCost;

    return Response.json({
      answer: responseText,
      tokens_used: totalTokens,
      cost_usd: totalCost.toFixed(4),
      document: {
        id: document.id,
        title: document.title,
        document_type: document.document_type,
      },
    });
  } catch (error: any) {
    console.error("Document chat error:", error);
    return new Response(`Failed to process chat: ${error.message}`, {
      status: 500,
    });
  }
}
