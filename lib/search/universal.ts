import { createClient, createAdminClient } from "@/lib/supabase/server";
import { searchDocuments as ragSearch } from "@/lib/documents/rag";

export interface SearchResult {
  id: string;
  type: "conversation" | "document" | "task" | "calendar" | "email" | "idea" | "lead" | "sequence" | "coaching_client" | "ministry_event" | "prayer_request";
  title: string;
  content: string;
  snippet: string;
  score: number;
  metadata: {
    date?: string;
    author?: string;
    status?: string;
    priority?: string;
    category?: string;
    location?: string;
    from?: string;
    to?: string[];
    [key: string]: any;
  };
  url: string;
}

export interface SearchFilters {
  types?: Array<"conversation" | "document" | "task" | "calendar" | "email" | "idea" | "lead" | "sequence" | "coaching_client" | "ministry_event" | "prayer_request">;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  priority?: string;
}

/**
 * Search conversations/messages
 */
async function searchConversations(
  query: string,
  userId: string,
  organizationId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();

    // Search in messages content
    const { data: messages } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        role,
        created_at,
        conversation_id,
        conversations!inner(
          id,
          title,
          user_id,
          organization_id
        )
      `)
      .eq("conversations.organization_id", organizationId)
      .ilike("content", `%${query}%`)
      .limit(20);

    if (!messages) return [];

    return messages.map((msg: any) => ({
      id: msg.id,
      type: "conversation" as const,
      title: msg.conversations.title || "Untitled conversation",
      content: msg.content,
      snippet: msg.content.substring(0, 200),
      score: 1.0, // Can be enhanced with text search ranking
      metadata: {
        date: msg.created_at,
        author: msg.role,
        conversationId: msg.conversation_id,
      },
      url: `/dashboard/chat?conversation=${msg.conversation_id}`,
    }));
  } catch (error) {
    console.error("Error searching conversations:", error);
    return [];
  }
}

/**
 * Search documents using hybrid approach:
 * 1. Vector/semantic search via RAG for content relevance
 * 2. Title/filename text match as fallback
 * Results are merged and deduplicated by document ID.
 */
async function searchDocuments(
  query: string,
  userId: string,
  organizationId: string
): Promise<SearchResult[]> {
  try {
    // Run vector search and text search in parallel
    const [ragResults, textResults] = await Promise.all([
      // Vector search via RAG (uses createAdminClient internally)
      ragSearch(query, organizationId, userId, 10, 0.5).catch((err) => {
        console.error("RAG search failed, falling back to text:", err);
        return [];
      }),
      // Text search fallback for title/filename matches
      (async () => {
        const supabase = createAdminClient();
        const { data } = await supabase
          .from("documents")
          .select("id, title, file_name, file_type, file_size, chunk_count, created_at, uploaded_by")
          .eq("organization_id", organizationId)
          .or(`title.ilike.%${query}%,file_name.ilike.%${query}%`)
          .eq("status", "completed")
          .limit(10);
        return data || [];
      })(),
    ]);

    const seen = new Set<string>();
    const results: SearchResult[] = [];

    // Add RAG results first (higher relevance)
    for (const doc of ragResults) {
      if (seen.has(doc.documentId)) continue;
      seen.add(doc.documentId);
      results.push({
        id: doc.documentId,
        type: "document",
        title: doc.documentTitle,
        content: doc.chunkContent,
        snippet: doc.chunkContent.substring(0, 200),
        score: doc.similarity,
        metadata: {
          date: undefined,
          author: undefined,
        },
        url: `/dashboard/documents?doc=${doc.documentId}`,
      });
    }

    // Add text match results that weren't already in RAG results
    for (const doc of textResults) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      results.push({
        id: doc.id,
        type: "document",
        title: doc.title,
        content: doc.file_name,
        snippet: `${doc.file_type} • ${doc.chunk_count || 0} chunks • ${(doc.file_size / 1024).toFixed(1)}KB`,
        score: 0.5, // Lower score for text-only matches
        metadata: {
          date: doc.created_at,
          author: doc.uploaded_by,
          fileType: doc.file_type,
          size: doc.file_size,
        },
        url: `/dashboard/documents?doc=${doc.id}`,
      });
    }

    return results;
  } catch (error) {
    console.error("Error searching documents:", error);
    return [];
  }
}

/**
 * Search tasks
 */
async function searchTasks(
  query: string,
  userId: string,
  organizationId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();

    // Search in task titles and descriptions
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (!tasks) return [];

    return tasks.map((task: any) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      content: task.description || "",
      snippet: task.description ? task.description.substring(0, 200) : "No description",
      score: 1.0,
      metadata: {
        date: task.created_at,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        aiExtracted: task.ai_extracted,
      },
      url: `/dashboard/tasks?task=${task.id}`,
    }));
  } catch (error) {
    console.error("Error searching tasks:", error);
    return [];
  }
}

/**
 * Search calendar events
 */
async function searchCalendarEvents(
  query: string,
  userId: string,
  organizationId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();

    // Search in event titles and descriptions
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("organization_id", organizationId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(20);

    if (!events) return [];

    return events.map((event: any) => ({
      id: event.id,
      type: "calendar" as const,
      title: event.title,
      content: event.description || "",
      snippet: `${event.location || "No location"} • ${new Date(event.start_time).toLocaleString()}`,
      score: 1.0,
      metadata: {
        date: event.start_time,
        location: event.location,
        organizer: event.organizer_name || event.organizer_email,
        status: event.status,
        meetingUrl: event.meeting_url,
      },
      url: `/dashboard/calendar?event=${event.id}`,
    }));
  } catch (error) {
    console.error("Error searching calendar events:", error);
    return [];
  }
}

/**
 * Search emails
 */
async function searchEmails(
  query: string,
  userId: string,
  organizationId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();

    // Search in email subjects, content, and from/to
    const { data: emails } = await supabase
      .from("emails")
      .select("*")
      .eq("organization_id", organizationId)
      .or(`subject.ilike.%${query}%,body_text.ilike.%${query}%,from_email.ilike.%${query}%`)
      .limit(20);

    if (!emails) return [];

    return emails.map((email: any) => ({
      id: email.id,
      type: "email" as const,
      title: email.subject || "(No subject)",
      content: email.body_text || email.snippet || "",
      snippet: email.ai_summary || email.snippet || email.body_text?.substring(0, 200) || "",
      score: 1.0,
      metadata: {
        date: email.sent_at,
        from: email.from_email,
        to: email.to_emails,
        category: email.ai_category,
        priority: email.ai_priority_score,
        isRead: email.is_read,
      },
      url: `/dashboard/email?email=${email.id}`,
    }));
  } catch (error) {
    console.error("Error searching emails:", error);
    return [];
  }
}

/**
 * Search ideas
 */
async function searchIdeas(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const { data: ideas } = await supabase
      .from("ideas")
      .select("id, title, description, status, category, priority, created_at")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (!ideas) return [];

    return ideas.map((idea: any) => ({
      id: idea.id,
      type: "idea" as const,
      title: idea.title,
      content: idea.description || "",
      snippet: idea.description?.substring(0, 200) || "No description",
      score: 1.0,
      metadata: {
        date: idea.created_at,
        status: idea.status,
        priority: idea.priority,
        category: idea.category,
      },
      url: `/dashboard/ideas?id=${idea.id}`,
    }));
  } catch (error) {
    console.error("Error searching ideas:", error);
    return [];
  }
}

/**
 * Search leads
 */
async function searchLeads(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, email, company, status, estimated_value, created_at")
      .eq("user_id", userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
      .limit(20);

    if (!leads) return [];

    return leads.map((lead: any) => ({
      id: lead.id,
      type: "lead" as const,
      title: lead.name,
      content: lead.company || lead.email || "",
      snippet: `${lead.company || "No company"} • ${lead.status}${lead.estimated_value ? ` • $${lead.estimated_value}` : ""}`,
      score: 1.0,
      metadata: {
        date: lead.created_at,
        status: lead.status,
        company: lead.company,
        value: lead.estimated_value,
      },
      url: `/dashboard/leads?id=${lead.id}`,
    }));
  } catch (error) {
    console.error("Error searching leads:", error);
    return [];
  }
}

/**
 * Search outreach sequences
 */
async function searchSequences(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const { data: sequences } = await supabase
      .from("outreach_sequences")
      .select("id, name, description, status, sequence_type, total_enrolled, created_at")
      .eq("user_id", userId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (!sequences) return [];

    return sequences.map((seq: any) => ({
      id: seq.id,
      type: "sequence" as const,
      title: seq.name,
      content: seq.description || "",
      snippet: `${seq.sequence_type} • ${seq.total_enrolled || 0} enrolled • ${seq.status}`,
      score: 1.0,
      metadata: {
        date: seq.created_at,
        status: seq.status,
        sequenceType: seq.sequence_type,
        enrolled: seq.total_enrolled,
      },
      url: `/dashboard/outreach?id=${seq.id}`,
    }));
  } catch (error) {
    console.error("Error searching sequences:", error);
    return [];
  }
}

/**
 * Search coaching clients
 */
async function searchCoachingClients(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const { data: clients } = await supabase
      .from("coaching_clients")
      .select("id, name, email, company, coaching_type, status, created_at")
      .eq("user_id", userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
      .limit(20);

    if (!clients) return [];

    return clients.map((client: any) => ({
      id: client.id,
      type: "coaching_client" as const,
      title: client.name,
      content: client.company || client.email || "",
      snippet: `${client.coaching_type} coaching • ${client.company || "No company"} • ${client.status}`,
      score: 1.0,
      metadata: {
        date: client.created_at,
        status: client.status,
        coachingType: client.coaching_type,
        company: client.company,
      },
      url: `/dashboard/coaching?id=${client.id}`,
    }));
  } catch (error) {
    console.error("Error searching coaching clients:", error);
    return [];
  }
}

/**
 * Search ministry events
 */
async function searchMinistryEvents(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const { data: events } = await supabase
      .from("ministry_events")
      .select("id, title, description, event_type, status, start_time, location_name, created_at")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (!events) return [];

    return events.map((event: any) => ({
      id: event.id,
      type: "ministry_event" as const,
      title: event.title,
      content: event.description || "",
      snippet: `${event.event_type} • ${event.location_name || "No location"} • ${new Date(event.start_time).toLocaleDateString()}`,
      score: 1.0,
      metadata: {
        date: event.created_at,
        status: event.status,
        eventType: event.event_type,
        startTime: event.start_time,
        location: event.location_name,
      },
      url: `/dashboard/ministry?id=${event.id}`,
    }));
  } catch (error) {
    console.error("Error searching ministry events:", error);
    return [];
  }
}

/**
 * Search prayer requests
 */
async function searchPrayerRequests(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const { data: prayers } = await supabase
      .from("prayer_requests")
      .select("id, title, description, request_type, status, priority, created_at")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (!prayers) return [];

    return prayers.map((prayer: any) => ({
      id: prayer.id,
      type: "prayer_request" as const,
      title: prayer.title,
      content: prayer.description || "",
      snippet: prayer.description?.substring(0, 200) || `${prayer.request_type} prayer request`,
      score: 1.0,
      metadata: {
        date: prayer.created_at,
        status: prayer.status,
        priority: prayer.priority,
        requestType: prayer.request_type,
      },
      url: `/dashboard/ministry?tab=prayer&id=${prayer.id}`,
    }));
  } catch (error) {
    console.error("Error searching prayer requests:", error);
    return [];
  }
}

/**
 * Universal search across all content types
 */
export async function universalSearch(
  query: string,
  userId: string,
  organizationId: string,
  filters?: SearchFilters
): Promise<{
  results: SearchResult[];
  counts: {
    conversations: number;
    documents: number;
    tasks: number;
    calendar: number;
    email: number;
    ideas: number;
    leads: number;
    sequences: number;
    coaching: number;
    ministry: number;
    prayer: number;
    total: number;
  };
}> {
  if (!query || query.trim().length < 2) {
    return {
      results: [],
      counts: {
        conversations: 0,
        documents: 0,
        tasks: 0,
        calendar: 0,
        email: 0,
        ideas: 0,
        leads: 0,
        sequences: 0,
        coaching: 0,
        ministry: 0,
        prayer: 0,
        total: 0,
      },
    };
  }

  const searchQuery = query.trim();

  // Determine which content types to search
  const typesToSearch = filters?.types || [
    "conversation",
    "document",
    "task",
    "calendar",
    "email",
    "idea",
    "lead",
    "sequence",
    "coaching_client",
    "ministry_event",
    "prayer_request",
  ];

  // Run searches in parallel
  const [
    conversations,
    documents,
    tasks,
    calendar,
    emails,
    ideas,
    leads,
    sequences,
    coachingClients,
    ministryEvents,
    prayerRequests,
  ] = await Promise.all([
    typesToSearch.includes("conversation")
      ? searchConversations(searchQuery, userId, organizationId)
      : Promise.resolve([]),
    typesToSearch.includes("document")
      ? searchDocuments(searchQuery, userId, organizationId)
      : Promise.resolve([]),
    typesToSearch.includes("task")
      ? searchTasks(searchQuery, userId, organizationId)
      : Promise.resolve([]),
    typesToSearch.includes("calendar")
      ? searchCalendarEvents(searchQuery, userId, organizationId)
      : Promise.resolve([]),
    typesToSearch.includes("email")
      ? searchEmails(searchQuery, userId, organizationId)
      : Promise.resolve([]),
    typesToSearch.includes("idea")
      ? searchIdeas(searchQuery, userId)
      : Promise.resolve([]),
    typesToSearch.includes("lead")
      ? searchLeads(searchQuery, userId)
      : Promise.resolve([]),
    typesToSearch.includes("sequence")
      ? searchSequences(searchQuery, userId)
      : Promise.resolve([]),
    typesToSearch.includes("coaching_client")
      ? searchCoachingClients(searchQuery, userId)
      : Promise.resolve([]),
    typesToSearch.includes("ministry_event")
      ? searchMinistryEvents(searchQuery, userId)
      : Promise.resolve([]),
    typesToSearch.includes("prayer_request")
      ? searchPrayerRequests(searchQuery, userId)
      : Promise.resolve([]),
  ]);

  // Combine and sort results by score/date
  const allResults = [
    ...conversations,
    ...documents,
    ...tasks,
    ...calendar,
    ...emails,
    ...ideas,
    ...leads,
    ...sequences,
    ...coachingClients,
    ...ministryEvents,
    ...prayerRequests,
  ];

  // Apply date filters if provided
  let filteredResults = allResults;
  if (filters?.dateFrom) {
    filteredResults = filteredResults.filter(
      (r) => r.metadata.date && r.metadata.date >= filters.dateFrom!
    );
  }
  if (filters?.dateTo) {
    filteredResults = filteredResults.filter(
      (r) => r.metadata.date && r.metadata.date <= filters.dateTo!
    );
  }

  // Apply status filter
  if (filters?.status) {
    filteredResults = filteredResults.filter(
      (r) => r.metadata.status === filters.status
    );
  }

  // Apply priority filter
  if (filters?.priority) {
    filteredResults = filteredResults.filter(
      (r) => r.metadata.priority === filters.priority
    );
  }

  // Sort by date (most recent first)
  filteredResults.sort((a, b) => {
    const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
    const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
    return dateB - dateA;
  });

  return {
    results: filteredResults,
    counts: {
      conversations: conversations.length,
      documents: documents.length,
      tasks: tasks.length,
      calendar: calendar.length,
      email: emails.length,
      ideas: ideas.length,
      leads: leads.length,
      sequences: sequences.length,
      coaching: coachingClients.length,
      ministry: ministryEvents.length,
      prayer: prayerRequests.length,
      total: filteredResults.length,
    },
  };
}
