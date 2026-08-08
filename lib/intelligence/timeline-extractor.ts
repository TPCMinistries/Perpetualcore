/**
 * Timeline & Action Item Extractor
 * Extracts events, deadlines, and action items from documents
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TimelineEvent {
  title: string;
  description?: string;
  date?: string; // ISO format
  eventType: "milestone" | "deadline" | "meeting" | "decision" | "action" | "mention" | "other";
  sourceText?: string;
  confidence: number;
  isPast?: boolean;
}

export interface ActionItem {
  title: string;
  description?: string;
  assigneeName?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high" | "urgent";
  sourceText?: string;
  confidence: number;
}

export interface IntelligenceExtractionResult {
  timelineEvents: TimelineEvent[];
  actionItems: ActionItem[];
}

/**
 * Extract timeline events and action items from document content
 */
export async function extractIntelligence(
  content: string,
  options: {
    currentDate?: string;
    maxEvents?: number;
    maxActionItems?: number;
  } = {}
): Promise<IntelligenceExtractionResult> {
  const {
    currentDate = new Date().toISOString().split("T")[0],
    maxEvents = 20,
    maxActionItems = 15,
  } = options;

  try {
    // Truncate content if too long
    const truncatedContent = content.substring(0, 15000);

    const prompt = `Analyze this document and extract:
1. Timeline events (dates, milestones, deadlines, meetings, decisions)
2. Action items (tasks that need to be done, assignments, to-dos)

Document:
${truncatedContent}

Today's date is: ${currentDate}

Return a JSON object with:
{
  "timelineEvents": [
    {
      "title": "Brief event title",
      "description": "What happened or will happen",
      "date": "YYYY-MM-DD or null if unknown",
      "eventType": "milestone|deadline|meeting|decision|action|mention|other",
      "sourceText": "The relevant quote from document (max 150 chars)",
      "confidence": 0.0-1.0,
      "isPast": true/false based on if date is before today
    }
  ],
  "actionItems": [
    {
      "title": "Clear action statement",
      "description": "Additional context",
      "assigneeName": "Person name if mentioned, null otherwise",
      "dueDate": "YYYY-MM-DD or null if not specified",
      "priority": "low|medium|high|urgent",
      "sourceText": "The relevant quote (max 150 chars)",
      "confidence": 0.0-1.0
    }
  ]
}

Guidelines:
- Only include clearly stated events and action items
- Infer dates from context (e.g., "next Monday", "by end of Q1")
- Action items should start with a verb
- Priority: urgent=immediate, high=this week, medium=this month, low=no deadline
- Maximum ${maxEvents} timeline events and ${maxActionItems} action items`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting timeline events and action items from documents. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      return { timelineEvents: [], actionItems: [] };
    }

    const parsed = JSON.parse(responseContent);

    return {
      timelineEvents: (parsed.timelineEvents || []).slice(0, maxEvents),
      actionItems: (parsed.actionItems || []).slice(0, maxActionItems),
    };
  } catch (error) {
    console.error("Intelligence extraction error:", error);
    return { timelineEvents: [], actionItems: [] };
  }
}

/**
 * Extract and store timeline events and action items
 */
export async function extractAndStoreIntelligence(
  documentId: string,
  organizationId: string,
  content: string
): Promise<{ success: boolean; eventsCount: number; actionItemsCount: number }> {
  try {
    const supabase = await createClient();

    // Extract intelligence
    const result = await extractIntelligence(content);

    // Delete existing records for this document
    await Promise.all([
      supabase
        .from("document_timeline_events")
        .delete()
        .eq("document_id", documentId),
      supabase
        .from("document_action_items")
        .delete()
        .eq("document_id", documentId),
    ]);

    // Insert timeline events
    if (result.timelineEvents.length > 0) {
      const eventsToInsert = result.timelineEvents.map(event => ({
        document_id: documentId,
        organization_id: organizationId,
        event_title: event.title,
        event_description: event.description,
        event_date: event.date,
        event_type: event.eventType,
        source_text: event.sourceText,
        confidence: event.confidence,
        is_past: event.isPast ?? (event.date ? new Date(event.date) < new Date() : false),
      }));

      await supabase
        .from("document_timeline_events")
        .insert(eventsToInsert);
    }

    // Insert action items
    if (result.actionItems.length > 0) {
      const itemsToInsert = result.actionItems.map(item => ({
        document_id: documentId,
        organization_id: organizationId,
        title: item.title,
        description: item.description,
        assignee_name: item.assigneeName,
        due_date: item.dueDate,
        priority: item.priority,
        source_text: item.sourceText,
        confidence: item.confidence,
      }));

      await supabase
        .from("document_action_items")
        .insert(itemsToInsert);
    }

    return {
      success: true,
      eventsCount: result.timelineEvents.length,
      actionItemsCount: result.actionItems.length,
    };
  } catch (error) {
    console.error("Error storing intelligence:", error);
    return { success: false, eventsCount: 0, actionItemsCount: 0 };
  }
}

/**
 * Get timeline events for a document
 */
export async function getDocumentTimeline(
  documentId: string
): Promise<TimelineEvent[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_timeline_events")
      .select("*")
      .eq("document_id", documentId)
      .order("event_date", { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map(e => ({
      title: e.event_title,
      description: e.event_description,
      date: e.event_date,
      eventType: e.event_type,
      sourceText: e.source_text,
      confidence: e.confidence,
      isPast: e.is_past,
    }));
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return [];
  }
}

/**
 * Get action items for a document
 */
export async function getDocumentActionItems(
  documentId: string
): Promise<ActionItem[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_action_items")
      .select("*")
      .eq("document_id", documentId)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map(item => ({
      title: item.title,
      description: item.description,
      assigneeName: item.assignee_name,
      dueDate: item.due_date,
      priority: item.priority,
      sourceText: item.source_text,
      confidence: item.confidence,
    }));
  } catch (error) {
    console.error("Error fetching action items:", error);
    return [];
  }
}

/**
 * Get all pending action items across an organization
 */
export async function getOrganizationActionItems(
  organizationId: string,
  options: {
    status?: string;
    assigneeId?: string;
    limit?: number;
  } = {}
): Promise<Array<ActionItem & { documentId: string; documentTitle: string }>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("document_action_items")
      .select(`
        *,
        documents!inner(id, title)
      `)
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (options.status) {
      query = query.eq("status", options.status);
    }
    if (options.assigneeId) {
      query = query.eq("assignee_user_id", options.assigneeId);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      title: item.title,
      description: item.description,
      assigneeName: item.assignee_name,
      dueDate: item.due_date,
      priority: item.priority,
      sourceText: item.source_text,
      confidence: item.confidence,
      documentId: item.documents?.id,
      documentTitle: item.documents?.title,
    }));
  } catch (error) {
    console.error("Error fetching org action items:", error);
    return [];
  }
}

/**
 * Get upcoming events across an organization
 */
export async function getOrganizationUpcomingEvents(
  organizationId: string,
  daysAhead: number = 30
): Promise<Array<TimelineEvent & { documentId: string; documentTitle: string }>> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("document_timeline_events")
      .select(`
        *,
        documents!inner(id, title)
      `)
      .eq("organization_id", organizationId)
      .gte("event_date", today)
      .lte("event_date", futureDate)
      .order("event_date", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((e: any) => ({
      title: e.event_title,
      description: e.event_description,
      date: e.event_date,
      eventType: e.event_type,
      sourceText: e.source_text,
      confidence: e.confidence,
      isPast: e.is_past,
      documentId: e.documents?.id,
      documentTitle: e.documents?.title,
    }));
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}
