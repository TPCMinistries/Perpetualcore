/**
 * Document Clustering System
 * Automatically groups related documents using embeddings and topic detection
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface DocumentCluster {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  documentIds: string[];
  confidence: number;
  color: string;
  icon: string;
}

export interface ClusteringResult {
  clusters: DocumentCluster[];
  unclustered: string[];
  stats: {
    totalDocuments: number;
    clusteredDocuments: number;
    clusterCount: number;
  };
}

const CLUSTER_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#14B8A6", // teal
  "#EC4899", // pink
  "#6366F1", // indigo
];

const CLUSTER_ICONS = [
  "folder", "book", "file-text", "briefcase",
  "lightbulb", "star", "tag", "bookmark"
];

/**
 * Cluster documents based on their embeddings
 */
export async function clusterDocuments(
  organizationId: string,
  options: {
    minClusterSize?: number;
    maxClusters?: number;
    similarityThreshold?: number;
  } = {}
): Promise<ClusteringResult> {
  const {
    minClusterSize = 2,
    maxClusters = 10,
    similarityThreshold = 0.7
  } = options;

  const supabase = await createClient();

  // Get all document chunks with embeddings
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select(`
      id,
      document_id,
      content,
      embedding,
      documents!inner(
        id,
        title,
        document_type,
        summary,
        organization_id,
        status
      )
    `)
    .eq("documents.organization_id", organizationId)
    .eq("documents.status", "completed");

  if (!chunks || chunks.length === 0) {
    return {
      clusters: [],
      unclustered: [],
      stats: { totalDocuments: 0, clusteredDocuments: 0, clusterCount: 0 }
    };
  }

  // Group chunks by document and compute average embedding
  const documentEmbeddings = new Map<string, {
    embedding: number[];
    title: string;
    type: string | null;
    summary: string | null;
  }>();

  for (const chunk of chunks) {
    const docId = chunk.document_id;
    const doc = chunk.documents as any;

    if (!documentEmbeddings.has(docId) && chunk.embedding) {
      documentEmbeddings.set(docId, {
        embedding: chunk.embedding,
        title: doc.title,
        type: doc.document_type,
        summary: doc.summary
      });
    }
  }

  const docIds = Array.from(documentEmbeddings.keys());

  if (docIds.length < minClusterSize) {
    return {
      clusters: [],
      unclustered: docIds,
      stats: {
        totalDocuments: docIds.length,
        clusteredDocuments: 0,
        clusterCount: 0
      }
    };
  }

  // Compute similarity matrix
  const similarities: { doc1: string; doc2: string; similarity: number }[] = [];

  for (let i = 0; i < docIds.length; i++) {
    for (let j = i + 1; j < docIds.length; j++) {
      const emb1 = documentEmbeddings.get(docIds[i])!.embedding;
      const emb2 = documentEmbeddings.get(docIds[j])!.embedding;
      const similarity = cosineSimilarity(emb1, emb2);

      if (similarity >= similarityThreshold) {
        similarities.push({
          doc1: docIds[i],
          doc2: docIds[j],
          similarity
        });
      }
    }
  }

  // Build clusters using connected components
  const clusters = buildClusters(
    docIds,
    similarities,
    minClusterSize,
    maxClusters
  );

  // Get cluster names and descriptions using AI
  const namedClusters: DocumentCluster[] = [];

  for (let i = 0; i < clusters.length; i++) {
    const clusterDocs = clusters[i].map(id => documentEmbeddings.get(id)!);
    const clusterInfo = await generateClusterMetadata(clusterDocs, i);

    namedClusters.push({
      id: `cluster-${Date.now()}-${i}`,
      name: clusterInfo.name,
      description: clusterInfo.description,
      keywords: clusterInfo.keywords,
      documentIds: clusters[i],
      confidence: clusterInfo.confidence,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      icon: CLUSTER_ICONS[i % CLUSTER_ICONS.length]
    });
  }

  // Find unclustered documents
  const clusteredDocIds = new Set(namedClusters.flatMap(c => c.documentIds));
  const unclustered = docIds.filter(id => !clusteredDocIds.has(id));

  return {
    clusters: namedClusters,
    unclustered,
    stats: {
      totalDocuments: docIds.length,
      clusteredDocuments: clusteredDocIds.size,
      clusterCount: namedClusters.length
    }
  };
}

/**
 * Build clusters from similarity pairs using union-find
 */
function buildClusters(
  docIds: string[],
  similarities: { doc1: string; doc2: string; similarity: number }[],
  minSize: number,
  maxClusters: number
): string[][] {
  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Union-Find data structure
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  for (const id of docIds) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }

  function union(x: string, y: string): void {
    const rootX = find(x);
    const rootY = find(y);

    if (rootX === rootY) return;

    const rankX = rank.get(rootX)!;
    const rankY = rank.get(rootY)!;

    if (rankX < rankY) {
      parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      parent.set(rootY, rootX);
    } else {
      parent.set(rootY, rootX);
      rank.set(rootX, rankX + 1);
    }
  }

  // Union similar documents
  for (const { doc1, doc2 } of similarities) {
    union(doc1, doc2);
  }

  // Group by root
  const clusterMap = new Map<string, string[]>();
  for (const id of docIds) {
    const root = find(id);
    if (!clusterMap.has(root)) {
      clusterMap.set(root, []);
    }
    clusterMap.get(root)!.push(id);
  }

  // Filter by size and limit count
  const clusters = Array.from(clusterMap.values())
    .filter(c => c.length >= minSize)
    .sort((a, b) => b.length - a.length)
    .slice(0, maxClusters);

  return clusters;
}

/**
 * Generate cluster name and description using AI
 */
async function generateClusterMetadata(
  docs: { title: string; type: string | null; summary: string | null }[],
  index: number
): Promise<{ name: string; description: string; keywords: string[]; confidence: number }> {
  try {
    const docInfo = docs.map(d => ({
      title: d.title,
      type: d.type || "Unknown",
      summary: d.summary?.substring(0, 200) || "No summary"
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive name and description for a document cluster. Return valid JSON only."
        },
        {
          role: "user",
          content: `These documents have been grouped together based on similarity:

${JSON.stringify(docInfo, null, 2)}

Generate a JSON response with:
- name: A short, descriptive name for this cluster (2-4 words)
- description: A one-sentence description of what these documents have in common
- keywords: An array of 3-5 topic keywords
- confidence: A number 0.0-1.0 representing how cohesive this cluster is`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        name: `Collection ${index + 1}`,
        description: "A group of related documents",
        keywords: [],
        confidence: 0.5
      };
    }

    const parsed = JSON.parse(content);
    return {
      name: parsed.name || `Collection ${index + 1}`,
      description: parsed.description || "A group of related documents",
      keywords: parsed.keywords || [],
      confidence: parsed.confidence || 0.5
    };
  } catch (error) {
    console.error("Error generating cluster metadata:", error);
    return {
      name: `Collection ${index + 1}`,
      description: "A group of related documents",
      keywords: [],
      confidence: 0.5
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Find documents similar to a given document
 */
export async function findSimilarDocuments(
  documentId: string,
  organizationId: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<{ documentId: string; title: string; similarity: number }[]> {
  const supabase = await createClient();

  // Get the source document's embedding
  const { data: sourceChunks } = await supabase
    .from("document_chunks")
    .select("embedding")
    .eq("document_id", documentId)
    .limit(1);

  if (!sourceChunks || sourceChunks.length === 0 || !sourceChunks[0].embedding) {
    return [];
  }

  const sourceEmbedding = sourceChunks[0].embedding;

  // Get all other documents
  const { data: otherChunks } = await supabase
    .from("document_chunks")
    .select(`
      document_id,
      embedding,
      documents!inner(
        id,
        title,
        organization_id,
        status
      )
    `)
    .eq("documents.organization_id", organizationId)
    .eq("documents.status", "completed")
    .neq("document_id", documentId);

  if (!otherChunks || otherChunks.length === 0) {
    return [];
  }

  // Compute similarities
  const docSimilarities = new Map<string, { title: string; similarity: number }>();

  for (const chunk of otherChunks) {
    if (!chunk.embedding) continue;

    const doc = chunk.documents as any;
    const similarity = cosineSimilarity(sourceEmbedding, chunk.embedding);

    const existing = docSimilarities.get(chunk.document_id);
    if (!existing || similarity > existing.similarity) {
      docSimilarities.set(chunk.document_id, {
        title: doc.title,
        similarity
      });
    }
  }

  // Filter by threshold and sort
  return Array.from(docSimilarities.entries())
    .map(([documentId, data]) => ({ documentId, ...data }))
    .filter(d => d.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Detect topics across all documents
 */
export async function detectTopics(
  organizationId: string,
  maxTopics: number = 10
): Promise<{ topic: string; documentCount: number; keywords: string[] }[]> {
  const supabase = await createClient();

  // Get document types and summaries
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, document_type, summary, key_points")
    .eq("organization_id", organizationId)
    .eq("status", "completed");

  if (!documents || documents.length === 0) {
    return [];
  }

  // Aggregate by document type first
  const typeGroups = new Map<string, { count: number; docs: any[] }>();

  for (const doc of documents) {
    const type = doc.document_type || "General";
    if (!typeGroups.has(type)) {
      typeGroups.set(type, { count: 0, docs: [] });
    }
    const group = typeGroups.get(type)!;
    group.count++;
    group.docs.push(doc);
  }

  // Generate topic details
  const topics: { topic: string; documentCount: number; keywords: string[] }[] = [];

  for (const [type, group] of typeGroups.entries()) {
    // Extract keywords from summaries and key points
    const keywords = new Set<string>();

    for (const doc of group.docs) {
      if (doc.key_points) {
        for (const point of doc.key_points) {
          const words = point.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
          words.slice(0, 3).forEach((w: string) => keywords.add(w));
        }
      }
    }

    topics.push({
      topic: type,
      documentCount: group.count,
      keywords: Array.from(keywords).slice(0, 5)
    });
  }

  return topics
    .sort((a, b) => b.documentCount - a.documentCount)
    .slice(0, maxTopics);
}
