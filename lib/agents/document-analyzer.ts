/**
 * Document Analyzer Agent
 *
 * Analyzes documents to generate summaries, extract key insights,
 * suggest tags, and identify action items.
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logging";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface DocumentAnalysis {
  summary: string;
  keyInsights: string[];
  suggestedTags: string[];
  actionItems: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  documentType: string;
  complexity: "simple" | "moderate" | "complex";
  estimatedReadTime: number; // in minutes
}

interface AnalyzableDocument {
  id: string;
  title: string;
  content: string;
  file_type: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Analyze document content using Claude
 */
export async function analyzeDocumentContent(
  document: AnalyzableDocument
): Promise<DocumentAnalysis> {
  const contentPreview = document.content.substring(0, 8000);

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this document and provide a structured analysis in JSON format.

Document Title: ${document.title}
File Type: ${document.file_type}

Content:
${contentPreview}

Respond with ONLY valid JSON in this exact format:
{
  "summary": "A concise 2-3 sentence summary of the document",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "actionItems": ["action1", "action2"],
  "sentiment": "positive|neutral|negative|mixed",
  "documentType": "report|article|notes|email|contract|technical|other",
  "complexity": "simple|moderate|complex",
  "estimatedReadTime": 5
}

Important:
- Keep insights concise (max 100 characters each)
- Suggest 3-5 relevant tags that could help categorize this document
- Extract any clear action items or to-dos mentioned
- Estimate read time in minutes based on content length and complexity`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as DocumentAnalysis;
    return analysis;
  } catch (error) {
    logger.error("Error analyzing document", { documentId: document.id, error });

    // Return default analysis on error
    return {
      summary: `Document "${document.title}" requires manual review.`,
      keyInsights: [],
      suggestedTags: [],
      actionItems: [],
      sentiment: "neutral",
      documentType: "other",
      complexity: "moderate",
      estimatedReadTime: Math.ceil(document.content.split(/\s+/).length / 200),
    };
  }
}

/**
 * Process documents for a specific agent
 */
export async function processDocumentsForAgent(agentId: string) {
  const supabase = await createClient();

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*, profiles!inner(organization_id, id)")
    .eq("id", agentId)
    .eq("enabled", true)
    .single();

  if (agentError || !agent) {
    logger.warn(`Agent ${agentId} not found or disabled`);
    return { processed: 0, analyzed: 0, error: "Agent not found or disabled" };
  }

  const organizationId = agent.profiles.organization_id;
  const agentConfig = (agent.config as Record<string, unknown>) || {};

  // Get last analysis time
  const lastAnalysisTime = agentConfig.last_analysis_time
    ? new Date(agentConfig.last_analysis_time as string)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago

  // Fetch documents that need analysis
  // Look for completed documents that haven't been analyzed by this agent
  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select("id, title, content, file_type, created_at, metadata")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("created_at", lastAnalysisTime.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (docsError) {
    logger.error("Error fetching documents for analysis", { agentId, error: docsError });
    return { processed: 0, analyzed: 0, error: "Failed to fetch documents" };
  }

  if (!documents || documents.length === 0) {
    logger.debug(`No new documents to analyze for agent ${agentId}`);

    // Update last analysis time
    await supabase
      .from("ai_agents")
      .update({
        config: { ...agentConfig, last_analysis_time: new Date().toISOString() },
      })
      .eq("id", agentId);

    return { processed: 0, analyzed: 0 };
  }

  logger.info(`Analyzing ${documents.length} documents for agent ${agentId}`);

  let processed = 0;
  let analyzed = 0;

  for (const doc of documents) {
    processed++;

    // Skip documents without content
    if (!doc.content || doc.content.length < 50) {
      await supabase.from("agent_actions").insert({
        agent_id: agentId,
        action_type: "analyze_document",
        action_data: {
          document_id: doc.id,
          document_title: doc.title,
          result: "skipped_no_content",
        },
        status: "skipped",
      });
      continue;
    }

    try {
      // Analyze the document
      const analysis = await analyzeDocumentContent(doc as AnalyzableDocument);

      // Store analysis in document metadata
      const existingMetadata = (doc.metadata as Record<string, unknown>) || {};
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          metadata: {
            ...existingMetadata,
            ai_analysis: {
              ...analysis,
              analyzed_at: new Date().toISOString(),
              analyzed_by_agent: agentId,
            },
          },
        })
        .eq("id", doc.id);

      if (updateError) {
        throw updateError;
      }

      // Auto-apply suggested tags if configured
      if (agentConfig.auto_tag && analysis.suggestedTags.length > 0) {
        await applyTagsToDocument(supabase, doc.id, analysis.suggestedTags, organizationId);
      }

      // Create tasks for action items if configured
      if (agentConfig.create_tasks_for_actions && analysis.actionItems.length > 0) {
        for (const actionItem of analysis.actionItems) {
          await supabase.from("tasks").insert({
            organization_id: organizationId,
            title: `Action from "${doc.title}": ${actionItem.substring(0, 100)}`,
            description: `Action item extracted from document:\n\n${actionItem}\n\nSource document: ${doc.title}`,
            priority: "medium",
            execution_type: "manual",
            execution_status: "pending",
            source_type: "agent",
            agent_id: agentId,
            ai_context: JSON.stringify({
              document_id: doc.id,
              document_title: doc.title,
              action_item: actionItem,
            }),
          });
        }
      }

      analyzed++;

      // Log successful analysis
      await supabase.from("agent_actions").insert({
        agent_id: agentId,
        action_type: "analyze_document",
        action_data: {
          document_id: doc.id,
          document_title: doc.title,
          summary_length: analysis.summary.length,
          insights_count: analysis.keyInsights.length,
          tags_suggested: analysis.suggestedTags.length,
          action_items_found: analysis.actionItems.length,
        },
        status: "success",
      });

      logger.info(`Analyzed document for agent ${agentId}`, {
        agentId,
        documentId: doc.id,
        documentTitle: doc.title,
      });
    } catch (error) {
      logger.error(`Error analyzing document ${doc.id}`, { error, agentId });

      await supabase.from("agent_actions").insert({
        agent_id: agentId,
        action_type: "analyze_document",
        action_data: {
          document_id: doc.id,
          document_title: doc.title,
        },
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update last analysis time
  await supabase
    .from("ai_agents")
    .update({
      config: { ...agentConfig, last_analysis_time: new Date().toISOString() },
    })
    .eq("id", agentId);

  logger.info(`Document analysis complete for agent ${agentId}`, {
    agentId,
    processed,
    analyzed,
  });

  return { processed, analyzed };
}

/**
 * Apply tags to a document
 */
async function applyTagsToDocument(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  tagNames: string[],
  organizationId: string
) {
  for (const tagName of tagNames.slice(0, 5)) {
    // Limit to 5 tags
    const normalizedName = tagName.toLowerCase().trim().replace(/\s+/g, "-");

    // Find or create tag
    let { data: existingTag } = await supabase
      .from("tags")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", normalizedName)
      .single();

    if (!existingTag) {
      // Create new tag
      const { data: newTag } = await supabase
        .from("tags")
        .insert({
          organization_id: organizationId,
          name: normalizedName,
          color: getRandomTagColor(),
        })
        .select("id")
        .single();
      existingTag = newTag;
    }

    if (existingTag) {
      // Link tag to document (ignore if already exists)
      await supabase.from("document_tags").upsert(
        {
          document_id: documentId,
          tag_id: existingTag.id,
        },
        { onConflict: "document_id,tag_id" }
      );
    }
  }
}

/**
 * Get a random color for tags
 */
function getRandomTagColor(): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Process all enabled document analyzer agents
 */
export async function processAllDocumentAnalyzerAgents() {
  const supabase = await createClient();

  const { data: agents, error } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("agent_type", "document_analyzer")
    .eq("enabled", true);

  if (error) {
    logger.error("Failed to fetch document analyzer agents", { error });
    return { totalAgents: 0, totalProcessed: 0, totalAnalyzed: 0 };
  }

  let totalProcessed = 0;
  let totalAnalyzed = 0;

  for (const agent of agents || []) {
    try {
      const result = await processDocumentsForAgent(agent.id);
      totalProcessed += result.processed;
      totalAnalyzed += result.analyzed;
      logger.info(`Agent "${agent.name}" processed`, {
        agentId: agent.id,
        agentName: agent.name,
        processed: result.processed,
        analyzed: result.analyzed,
      });
    } catch (error) {
      logger.error(`Error processing agent ${agent.id}`, { error, agentId: agent.id });
    }
  }

  return {
    totalAgents: agents?.length || 0,
    totalProcessed,
    totalAnalyzed,
  };
}
