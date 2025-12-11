/**
 * Knowledge Graph System
 * Builds relationships between concepts, topics, and entities
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface KnowledgeRelationship {
  sourceConcept: string;
  targetConcept: string;
  relationshipType: 'related_to' | 'depends_on' | 'similar_to' | 'opposite_of' | 'part_of';
  strength: number;
  confidence: number;
  evidence: string[];
}

/**
 * Build knowledge graph from conversations
 */
export async function buildKnowledgeGraphFromConversations(
  organizationId: string,
  conversationIds: string[]
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get messages from conversations
    const { data: messages } = await supabase
      .from("messages")
      .select("content, conversation_id")
      .in("conversation_id", conversationIds);

    if (!messages || messages.length === 0) return;

    // Extract concepts and relationships
    const relationships = await extractRelationships(messages);

    // Store relationships
    for (const rel of relationships) {
      await supabase
        .from("knowledge_graph")
        .upsert(
          {
            organization_id: organizationId,
            source_concept: rel.sourceConcept,
            target_concept: rel.targetConcept,
            relationship_type: rel.relationshipType,
            strength: rel.strength,
            confidence: rel.confidence,
            evidence_count: rel.evidence.length,
            evidence_sources: {
              conversation_ids: conversationIds,
            },
          },
          {
            onConflict: "organization_id,source_concept,target_concept,relationship_type",
          }
        );
    }
  } catch (error) {
    console.error("Error building knowledge graph:", error);
  }
}

/**
 * Extract relationships from messages using AI
 */
async function extractRelationships(
  messages: any[]
): Promise<KnowledgeRelationship[]> {
  try {
    const conversationText = messages
      .map((m) => m.content)
      .join("\n\n")
      .substring(0, 8000);

    const prompt = `Analyze this conversation and identify relationships between concepts, topics, and entities.

Conversation:
${conversationText}

Extract relationships where concepts are:
- related_to: Generally connected or associated
- depends_on: One requires or relies on the other
- similar_to: Similar in nature or function
- opposite_of: Opposites or contrasts
- part_of: One is a component of the other

Return JSON with relationships array, each with:
- sourceConcept: string
- targetConcept: string
- relationshipType: string
- strength: number (0.0 to 1.0)
- confidence: number (0.0 to 1.0)
- evidence: string[] (quotes or references)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract knowledge relationships from conversations. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.relationships || [];
  } catch (error) {
    console.error("Error extracting relationships:", error);
    return [];
  }
}

/**
 * Get related concepts for a given concept
 */
export async function getRelatedConcepts(
  organizationId: string,
  concept: string,
  limit: number = 10
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("knowledge_graph")
    .select("*")
    .eq("organization_id", organizationId)
    .or(`source_concept.ilike.%${concept}%,target_concept.ilike.%${concept}%`)
    .eq("is_active", true)
    .order("strength", { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Find path between two concepts using BFS for shortest path
 */
export async function findConceptPath(
  organizationId: string,
  sourceConcept: string,
  targetConcept: string,
  maxDepth: number = 4
): Promise<any[]> {
  const supabase = await createClient();

  // Normalize concepts for case-insensitive matching
  const source = sourceConcept.toLowerCase().trim();
  const target = targetConcept.toLowerCase().trim();

  if (source === target) {
    return [];
  }

  // Fetch all active relationships for the organization
  const { data: allRelationships } = await supabase
    .from("knowledge_graph")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (!allRelationships || allRelationships.length === 0) {
    return [];
  }

  // Build adjacency list for bidirectional traversal
  const adjacencyMap = new Map<string, Array<{ neighbor: string; edge: any }>>();

  for (const rel of allRelationships) {
    const src = rel.source_concept.toLowerCase().trim();
    const tgt = rel.target_concept.toLowerCase().trim();

    // Add forward edge
    if (!adjacencyMap.has(src)) {
      adjacencyMap.set(src, []);
    }
    adjacencyMap.get(src)!.push({ neighbor: tgt, edge: rel });

    // Add reverse edge (for bidirectional traversal)
    if (!adjacencyMap.has(tgt)) {
      adjacencyMap.set(tgt, []);
    }
    adjacencyMap.get(tgt)!.push({ neighbor: src, edge: rel });
  }

  // BFS for shortest path
  const queue: Array<{ concept: string; path: any[] }> = [{ concept: source, path: [] }];
  const visited = new Set<string>([source]);

  while (queue.length > 0) {
    const { concept, path } = queue.shift()!;

    // Check depth limit
    if (path.length >= maxDepth) {
      continue;
    }

    const neighbors = adjacencyMap.get(concept) || [];

    for (const { neighbor, edge } of neighbors) {
      if (neighbor === target) {
        // Found the target - return the path
        return [...path, edge];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ concept: neighbor, path: [...path, edge] });
      }
    }
  }

  // No path found
  return [];
}

/**
 * Get all concepts in the knowledge graph for an organization
 */
export async function getAllConcepts(
  organizationId: string
): Promise<string[]> {
  const supabase = await createClient();

  const { data: relationships } = await supabase
    .from("knowledge_graph")
    .select("source_concept, target_concept")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (!relationships) return [];

  const concepts = new Set<string>();
  for (const rel of relationships) {
    concepts.add(rel.source_concept);
    concepts.add(rel.target_concept);
  }

  return Array.from(concepts).sort();
}

/**
 * Get knowledge graph statistics for an organization
 */
export async function getKnowledgeGraphStats(organizationId: string) {
  const supabase = await createClient();

  const { data: relationships } = await supabase
    .from("knowledge_graph")
    .select("source_concept, target_concept, relationship_type, strength")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (!relationships || relationships.length === 0) {
    return {
      totalConcepts: 0,
      totalRelationships: 0,
      relationshipTypes: {},
      averageStrength: 0,
      topConcepts: [],
    };
  }

  // Count unique concepts
  const concepts = new Set<string>();
  const conceptCounts = new Map<string, number>();

  for (const rel of relationships) {
    concepts.add(rel.source_concept);
    concepts.add(rel.target_concept);

    // Count occurrences
    conceptCounts.set(rel.source_concept, (conceptCounts.get(rel.source_concept) || 0) + 1);
    conceptCounts.set(rel.target_concept, (conceptCounts.get(rel.target_concept) || 0) + 1);
  }

  // Count relationship types
  const relationshipTypes: Record<string, number> = {};
  let totalStrength = 0;

  for (const rel of relationships) {
    relationshipTypes[rel.relationship_type] = (relationshipTypes[rel.relationship_type] || 0) + 1;
    totalStrength += rel.strength || 0;
  }

  // Get top concepts by connection count
  const sortedConcepts = Array.from(conceptCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([concept, count]) => ({ concept, connections: count }));

  return {
    totalConcepts: concepts.size,
    totalRelationships: relationships.length,
    relationshipTypes,
    averageStrength: relationships.length > 0 ? totalStrength / relationships.length : 0,
    topConcepts: sortedConcepts,
  };
}

/**
 * Find clusters of related concepts
 */
export async function findConceptClusters(
  organizationId: string,
  minClusterSize: number = 3
): Promise<string[][]> {
  const supabase = await createClient();

  const { data: relationships } = await supabase
    .from("knowledge_graph")
    .select("source_concept, target_concept")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (!relationships || relationships.length === 0) {
    return [];
  }

  // Build adjacency list
  const adjacencyMap = new Map<string, Set<string>>();

  for (const rel of relationships) {
    const src = rel.source_concept;
    const tgt = rel.target_concept;

    if (!adjacencyMap.has(src)) adjacencyMap.set(src, new Set());
    if (!adjacencyMap.has(tgt)) adjacencyMap.set(tgt, new Set());

    adjacencyMap.get(src)!.add(tgt);
    adjacencyMap.get(tgt)!.add(src);
  }

  // Find connected components using DFS
  const visited = new Set<string>();
  const clusters: string[][] = [];

  for (const concept of adjacencyMap.keys()) {
    if (!visited.has(concept)) {
      const cluster: string[] = [];
      const stack = [concept];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;

        visited.add(current);
        cluster.push(current);

        const neighbors = adjacencyMap.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }

      if (cluster.length >= minClusterSize) {
        clusters.push(cluster.sort());
      }
    }
  }

  // Sort clusters by size (largest first)
  return clusters.sort((a, b) => b.length - a.length);
}



