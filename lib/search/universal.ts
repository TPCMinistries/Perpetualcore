import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  type: "conversation" | "document" | "task" | "calendar" | "email";
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
  types?: Array<"conversation" | "document" | "task" | "calendar" | "email">;
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
 * Search documents
 */
async function searchDocuments(
  query: string,
  userId: string,
  organizationId: string
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();

    // Search in document titles and metadata
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("organization_id", organizationId)
      .or(`title.ilike.%${query}%,file_name.ilike.%${query}%`)
      .eq("status", "completed")
      .limit(20);

    if (!documents) return [];

    return documents.map((doc: any) => ({
      id: doc.id,
      type: "document" as const,
      title: doc.title,
      content: doc.file_name,
      snippet: `${doc.file_type} • ${doc.chunk_count || 0} chunks • ${(doc.file_size / 1024).toFixed(1)}KB`,
      score: 1.0,
      metadata: {
        date: doc.created_at,
        author: doc.uploaded_by,
        fileType: doc.file_type,
        size: doc.file_size,
      },
      url: `/dashboard/documents?doc=${doc.id}`,
    }));
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
  ];

  // Run searches in parallel
  const [conversations, documents, tasks, calendar, emails] = await Promise.all([
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
  ]);

  // Combine and sort results by score/date
  const allResults = [
    ...conversations,
    ...documents,
    ...tasks,
    ...calendar,
    ...emails,
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
      total: filteredResults.length,
    },
  };
}
