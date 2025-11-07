import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for bulk operations

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/knowledge/bulk-auto-tag
 * Generate AI-powered tag suggestions for all untagged documents
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response("No organization found", { status: 403 });
    }

    console.log("🏷️  Starting bulk auto-tagging for organization:", profile.organization_id);

    // Get existing tags for context
    const { data: existingTags } = await supabase
      .from("tags")
      .select("name")
      .eq("organization_id", profile.organization_id)
      .limit(50);

    const existingTagNames = existingTags?.map((t) => t.name) || [];

    // Fetch all completed documents with summaries but no tags
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("id, title, document_type, summary, key_points, content")
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed")
      .not("summary", "is", null);

    if (docsError || !documents || documents.length === 0) {
      return Response.json({
        message: "No documents found for tagging",
        tagged_count: 0,
      });
    }

    // Filter to only documents with no tags
    const { data: documentTags } = await supabase
      .from("document_tags")
      .select("document_id")
      .in("document_id", documents.map(d => d.id));

    const taggedDocIds = new Set(documentTags?.map(dt => dt.document_id) || []);
    const untaggedDocs = documents.filter(doc => !taggedDocIds.has(doc.id));

    if (untaggedDocs.length === 0) {
      return Response.json({
        message: "All documents are already tagged",
        tagged_count: 0,
      });
    }

    console.log(`📊 Found ${untaggedDocs.length} untagged documents`);

    let taggedCount = 0;
    let totalCost = 0;

    // Process documents in batches to avoid timeouts
    const batchSize = 5;
    for (let i = 0; i < untaggedDocs.length && i < batchSize; i++) {
      const doc = untaggedDocs[i];

      try {
        // Build context for Claude
        let context = `Document Title: ${doc.title}\n\n`;

        if (doc.document_type) {
          context += `Document Type: ${doc.document_type}\n\n`;
        }

        if (doc.summary) {
          context += `Summary: ${doc.summary}\n\n`;
        }

        if (doc.key_points && doc.key_points.length > 0) {
          context += `Key Points:\n${doc.key_points.map((p: string) => `- ${p}`).join('\n')}\n\n`;
        }

        // Include a preview of the content
        const contentPreview = doc.content.length > 2000
          ? doc.content.substring(0, 2000) + "\n\n[Content preview truncated...]"
          : doc.content;

        context += `Content Preview:\n${contentPreview}`;

        // Generate tag suggestions
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
          messages: [{ role: "user", content: prompt }],
        });

        const responseText = response.content[0].type === "text"
          ? response.content[0].text
          : "";

        // Parse JSON response
        let suggestedTags: string[];
        try {
          const jsonMatch = responseText.match(/\[[^\]]*\]/);
          if (jsonMatch) {
            suggestedTags = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON array found in response");
          }
        } catch (parseError) {
          console.error(`Failed to parse Claude response for ${doc.title}:`, responseText);
          continue;
        }

        // Validate and clean tags
        suggestedTags = suggestedTags
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length <= 50)
          .slice(0, 5);

        // Apply tags to document
        for (const tagName of suggestedTags) {
          // Create or find tag
          let tagId: string;

          const { data: createData, error: createError } = await supabase
            .from("tags")
            .insert({
              name: tagName.trim(),
              color: "blue",
              organization_id: profile.organization_id,
            })
            .select("id")
            .single();

          if (createError) {
            // Tag might already exist, try to find it
            const { data: existingTag } = await supabase
              .from("tags")
              .select("id")
              .eq("organization_id", profile.organization_id)
              .ilike("name", tagName.trim())
              .single();

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              continue;
            }
          } else {
            tagId = createData.id;
          }

          // Add tag to document
          await supabase
            .from("document_tags")
            .insert({
              document_id: doc.id,
              tag_id: tagId,
            });
        }

        // Calculate cost
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const inputCost = (inputTokens / 1_000_000) * 0.25;
        const outputCost = (outputTokens / 1_000_000) * 1.25;
        totalCost += inputCost + outputCost;

        taggedCount++;
        console.log(`✅ Tagged "${doc.title}" with: ${suggestedTags.join(', ')}`);
      } catch (error) {
        console.error(`Error tagging document ${doc.id}:`, error);
        continue;
      }
    }

    console.log(`📊 Bulk tagging complete:
    - Documents tagged: ${taggedCount}
    - Total cost: $${totalCost.toFixed(6)}
    `);

    return Response.json({
      message: "Bulk auto-tagging completed successfully",
      tagged_count: taggedCount,
      total_documents: untaggedDocs.length,
      cost_usd: totalCost.toFixed(6),
    });
  } catch (error: any) {
    console.error("Bulk auto-tag error:", error);
    return new Response(`Failed to perform bulk tagging: ${error.message}`, {
      status: 500,
    });
  }
}
