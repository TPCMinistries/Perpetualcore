/**
 * Entity Extractor
 * Extracts people, organizations, dates, amounts, and other entities from documents
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ExtractedEntity {
  entityType: "person" | "organization" | "date" | "amount" | "location" | "email" | "phone" | "url" | "product" | "event";
  entityValue: string;
  normalizedValue?: string;
  confidence: number;
  context?: string;
  positionStart?: number;
  positionEnd?: number;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  summary: {
    personCount: number;
    organizationCount: number;
    dateCount: number;
    amountCount: number;
    locationCount: number;
    otherCount: number;
  };
}

/**
 * Extract entities from document content
 */
export async function extractEntities(
  content: string,
  options: {
    maxEntities?: number;
    entityTypes?: string[];
    includeContext?: boolean;
  } = {}
): Promise<EntityExtractionResult> {
  const {
    maxEntities = 50,
    entityTypes = ["person", "organization", "date", "amount", "location", "email", "phone", "url"],
    includeContext = true,
  } = options;

  try {
    // Truncate content if too long
    const truncatedContent = content.substring(0, 12000);

    const prompt = `Extract entities from the following document text. Focus on these entity types: ${entityTypes.join(", ")}.

Document:
${truncatedContent}

Return a JSON object with an "entities" array. Each entity should have:
- entityType: one of [${entityTypes.map(t => `"${t}"`).join(", ")}]
- entityValue: the extracted value (original text)
- normalizedValue: standardized form (e.g., dates in YYYY-MM-DD, phone in +1-XXX-XXX-XXXX)
- confidence: 0.0 to 1.0
${includeContext ? '- context: surrounding sentence or phrase (max 100 chars)' : ''}

Guidelines:
- For dates, use ISO format (YYYY-MM-DD) for normalizedValue
- For amounts, extract currency and number (e.g., "$1,000" -> "1000 USD")
- For phone numbers, use international format
- Include only clearly identified entities
- Maximum ${maxEntities} entities`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting named entities from documents. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      return { entities: [], summary: getEmptySummary() };
    }

    const parsed = JSON.parse(responseContent);
    const entities: ExtractedEntity[] = (parsed.entities || []).slice(0, maxEntities);

    // Calculate summary
    const summary = {
      personCount: entities.filter(e => e.entityType === "person").length,
      organizationCount: entities.filter(e => e.entityType === "organization").length,
      dateCount: entities.filter(e => e.entityType === "date").length,
      amountCount: entities.filter(e => e.entityType === "amount").length,
      locationCount: entities.filter(e => e.entityType === "location").length,
      otherCount: entities.filter(e => !["person", "organization", "date", "amount", "location"].includes(e.entityType)).length,
    };

    return { entities, summary };
  } catch (error) {
    console.error("Entity extraction error:", error);
    return { entities: [], summary: getEmptySummary() };
  }
}

/**
 * Extract entities from a document and store them
 */
export async function extractAndStoreEntities(
  documentId: string,
  organizationId: string,
  content: string
): Promise<{ success: boolean; count: number }> {
  try {
    const supabase = await createClient();

    // Extract entities
    const result = await extractEntities(content);

    if (result.entities.length === 0) {
      return { success: true, count: 0 };
    }

    // Delete existing entities for this document
    await supabase
      .from("document_entities")
      .delete()
      .eq("document_id", documentId);

    // Insert new entities
    const entitiesToInsert = result.entities.map(entity => ({
      document_id: documentId,
      organization_id: organizationId,
      entity_type: entity.entityType,
      entity_value: entity.entityValue,
      normalized_value: entity.normalizedValue,
      confidence: entity.confidence,
      context: entity.context,
      position_start: entity.positionStart,
      position_end: entity.positionEnd,
    }));

    const { error } = await supabase
      .from("document_entities")
      .insert(entitiesToInsert);

    if (error) {
      throw error;
    }

    return { success: true, count: result.entities.length };
  } catch (error) {
    console.error("Error storing entities:", error);
    return { success: false, count: 0 };
  }
}

/**
 * Get entities for a document
 */
export async function getDocumentEntities(
  documentId: string
): Promise<ExtractedEntity[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_entities")
      .select("*")
      .eq("document_id", documentId)
      .order("confidence", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(e => ({
      entityType: e.entity_type,
      entityValue: e.entity_value,
      normalizedValue: e.normalized_value,
      confidence: e.confidence,
      context: e.context,
      positionStart: e.position_start,
      positionEnd: e.position_end,
    }));
  } catch (error) {
    console.error("Error fetching entities:", error);
    return [];
  }
}

/**
 * Get entity statistics across all documents in an organization
 */
export async function getEntityStats(organizationId: string): Promise<{
  totalEntities: number;
  byType: Record<string, number>;
  topPeople: { value: string; count: number }[];
  topOrganizations: { value: string; count: number }[];
}> {
  try {
    const supabase = await createClient();

    const { data: entities, error } = await supabase
      .from("document_entities")
      .select("entity_type, entity_value")
      .eq("organization_id", organizationId);

    if (error || !entities) {
      throw error;
    }

    const byType: Record<string, number> = {};
    const peopleCounts = new Map<string, number>();
    const orgCounts = new Map<string, number>();

    for (const entity of entities) {
      byType[entity.entity_type] = (byType[entity.entity_type] || 0) + 1;

      if (entity.entity_type === "person") {
        peopleCounts.set(entity.entity_value, (peopleCounts.get(entity.entity_value) || 0) + 1);
      } else if (entity.entity_type === "organization") {
        orgCounts.set(entity.entity_value, (orgCounts.get(entity.entity_value) || 0) + 1);
      }
    }

    const topPeople = Array.from(peopleCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topOrganizations = Array.from(orgCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEntities: entities.length,
      byType,
      topPeople,
      topOrganizations,
    };
  } catch (error) {
    console.error("Error getting entity stats:", error);
    return {
      totalEntities: 0,
      byType: {},
      topPeople: [],
      topOrganizations: [],
    };
  }
}

function getEmptySummary() {
  return {
    personCount: 0,
    organizationCount: 0,
    dateCount: 0,
    amountCount: 0,
    locationCount: 0,
    otherCount: 0,
  };
}
