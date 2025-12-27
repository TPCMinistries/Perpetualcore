import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { searchDocuments, buildRAGContext } from "@/lib/documents/rag";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const LIBRARY_SYSTEM_PROMPT = `You are a helpful AI library assistant for Perpetual Core. Your role is to help users discover and understand their documents.

CAPABILITIES:
- Search and analyze documents in the user's library
- Provide summaries and key insights from documents
- Help users find specific information across their knowledge base
- Suggest related documents and connections
- Answer questions based on document content

GUIDELINES:
- Always cite which document(s) you're referencing
- If you can't find relevant information, say so clearly
- Suggest follow-up questions or related topics the user might explore
- Be conversational and helpful
- When multiple documents are relevant, synthesize the information

FORMAT:
- Use markdown for formatting
- Use bullet points for lists
- Bold important terms or document titles
- Keep responses focused and actionable`;

interface LibraryChatRequest {
  message: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  scope?: "personal" | "team" | "organization" | "all";
  documentIds?: string[]; // Optional: specific documents to search
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body: LibraryChatRequest = await req.json();
    const { message, conversationHistory = [], scope = "all", documentIds } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Search for relevant documents using RAG
    const relevantDocs = await searchDocuments(
      message,
      profile.organization_id,
      user.id,
      8, // Get more results for library chat
      0.6, // Lower threshold for broader results
      { scope }
    );

    // If specific documents are requested, filter to those
    let filteredDocs = relevantDocs;
    if (documentIds && documentIds.length > 0) {
      filteredDocs = relevantDocs.filter(doc => documentIds.includes(doc.documentId));
    }

    // Build context from relevant documents
    const ragContext = buildRAGContext(filteredDocs);

    // Build messages for the AI
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: "user" as const,
        content: ragContext
          ? `${ragContext}\n\nUser Question: ${message}`
          : message,
      },
    ];

    // Use Claude for library chat (better at synthesis)
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: LIBRARY_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    // Extract referenced documents for the response
    const referencedDocuments = filteredDocs.slice(0, 5).map(doc => ({
      id: doc.documentId,
      title: doc.documentTitle,
      similarity: doc.similarity,
      preview: doc.chunkContent.substring(0, 150) + "...",
    }));

    return NextResponse.json({
      message: assistantMessage,
      documents: referencedDocuments,
      totalDocsSearched: relevantDocs.length,
    });
  } catch (error) {
    console.error("Library chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
