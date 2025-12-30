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

    console.log(`💬 Chat query for document: ${document.title}`);
    console.log(`❓ Question: ${question}`);
    console.log(`📄 File type: ${document.file_type}`);

    // Check if this is a PDF file - use native PDF understanding if so
    const isPDF = document.file_type === "application/pdf";

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

    let systemPrompt: string;

    // For PDFs, use Claude's native document understanding
    if (isPDF && document.file_url) {
      console.log(`📑 Using native PDF understanding for: ${document.title}`);

      // Download the PDF file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_url);

      if (downloadError || !fileData) {
        console.error("Failed to download PDF:", downloadError);
        return new Response("Failed to load PDF file", { status: 500 });
      }

      // Convert file to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Pdf = buffer.toString("base64");

      console.log(`✅ PDF loaded, size: ${(base64Pdf.length / 1024 / 1024).toFixed(2)}MB (base64)`);

      // Add the PDF document and question to the current message
      messages.push({
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            type: "text",
            text: question,
          },
        ],
      });

      // System prompt for PDF interaction
      systemPrompt = `You are a helpful AI assistant that answers questions about PDF documents. You can see and analyze the PDF document directly.

Your role is to:
1. Answer questions accurately based on what you see in the PDF
2. Reference specific pages, sections, or visual elements when relevant
3. Format your responses using proper Markdown for better readability:
   - Use **bold** for emphasis on key terms
   - Use bullet points (- ) for lists
   - Use numbered lists (1. 2. 3.) for sequential steps
   - Use > blockquotes for direct quotes from the document
   - Use headings (##) to organize longer responses into sections
   - Add line breaks between paragraphs for better readability
4. Structure responses clearly:
   - Start with a direct answer to the question
   - Follow with supporting details from the document
   - Quote relevant sections when applicable
5. If the answer isn't in the document, say so clearly
6. Be concise but thorough
7. For legal or technical documents, maintain professional terminology
8. If you can see images, charts, or tables, describe them when relevant to the question`;

    } else {
      // For non-PDF documents or if PDF file is not available, use extracted text
      console.log(`📝 Using extracted text for: ${document.title}`);

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

      // Include relevant portions of the document content
      const maxContentLength = 40000; // Leave room for conversation history
      const contentPreview = document.content.length > maxContentLength
        ? document.content.substring(0, maxContentLength) + "\n\n[Content truncated...]"
        : document.content;

      context += `Full Document Content:\n${contentPreview}`;

      // Add the current question
      messages.push({
        role: "user",
        content: question,
      });

      // System prompt for text-based documents
      systemPrompt = `You are a helpful AI assistant that answers questions about documents. You have been provided with the full content of a document.

Your role is to:
1. Answer questions accurately based on the document content
2. Format your responses using proper Markdown for better readability:
   - Use **bold** for emphasis on key terms
   - Use bullet points (- ) for lists
   - Use numbered lists (1. 2. 3.) for sequential steps
   - Use > blockquotes for direct document quotes
   - Use headings (##) to organize longer responses into sections
   - Add line breaks between paragraphs for better readability
3. Structure responses clearly:
   - Start with a direct answer to the question
   - Follow with supporting details from the document
   - Use quotes from the document when relevant
4. If the answer isn't in the document, say so clearly
5. Be concise but thorough
6. For legal or technical documents, maintain professional terminology
7. If asked about something not covered in the document, politely explain that the information isn't available in this document

Here is the document you should reference:

${context}

Please answer the user's questions based solely on this document's content. Remember to use proper Markdown formatting for all responses.`;
    }

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

    // Calculate tokens and cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;

    // Claude 3.5 Sonnet pricing
    const inputCost = (inputTokens / 1_000_000) * 3.0;
    const outputCost = (outputTokens / 1_000_000) * 15.0;
    const totalCost = inputCost + outputCost;

    console.log(`📊 Chat response generated:
    - Input tokens: ${inputTokens}
    - Output tokens: ${outputTokens}
    - Total cost: $${totalCost.toFixed(4)}
    `);

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
