import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

/**
 * Export all user data as JSON
 */
export async function exportAsJSON(
  userId: string,
  organizationId: string
): Promise<any> {
  const supabase = await createClient();

  // Fetch all user data in parallel
  const [conversations, documents, tasks, calendarEvents, emails] =
    await Promise.all([
      // Conversations and messages
      supabase
        .from("conversations")
        .select(
          `
          *,
          messages (*)
        `
        )
        .eq("user_id", userId),

      // Documents
      supabase
        .from("documents")
        .select("*")
        .eq("organization_id", organizationId),

      // Tasks
      supabase.from("tasks").select("*").eq("organization_id", organizationId),

      // Calendar events
      supabase
        .from("calendar_events")
        .select("*")
        .eq("organization_id", organizationId),

      // Emails
      supabase
        .from("emails")
        .select("*")
        .eq("organization_id", organizationId),
    ]);

  return {
    exportDate: new Date().toISOString(),
    version: "1.0",
    userId,
    organizationId,
    data: {
      conversations: conversations.data || [],
      documents: documents.data || [],
      tasks: tasks.data || [],
      calendarEvents: calendarEvents.data || [],
      emails: emails.data || [],
    },
    stats: {
      conversationsCount: conversations.data?.length || 0,
      documentsCount: documents.data?.length || 0,
      tasksCount: tasks.data?.length || 0,
      calendarEventsCount: calendarEvents.data?.length || 0,
      emailsCount: emails.data?.length || 0,
    },
  };
}

/**
 * Export conversations as Markdown files
 */
export async function exportConversationsAsMarkdown(
  userId: string
): Promise<{ filename: string; content: string }[]> {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `
      *,
      messages (*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!conversations) return [];

  return conversations.map((conv: any) => {
    const date = new Date(conv.created_at).toLocaleDateString();
    const filename = `${date}_${conv.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.md`;

    let content = `# ${conv.title}\n\n`;
    content += `**Created:** ${new Date(conv.created_at).toLocaleString()}\n`;
    content += `**Model:** ${conv.model}\n\n`;
    content += `---\n\n`;

    // Sort messages by creation time
    const messages = (conv.messages || []).sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    messages.forEach((msg: any) => {
      if (msg.role === "user") {
        content += `## 👤 User\n\n${msg.content}\n\n`;
      } else if (msg.role === "assistant") {
        content += `## 🤖 Assistant\n\n${msg.content}\n\n`;
      } else if (msg.role === "system") {
        content += `## ⚙️ System\n\n${msg.content}\n\n`;
      }
      content += `*${new Date(msg.created_at).toLocaleString()}*\n\n---\n\n`;
    });

    return { filename, content };
  });
}

/**
 * Export tasks as Markdown checklist
 */
export async function exportTasksAsMarkdown(
  organizationId: string
): Promise<string> {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!tasks || tasks.length === 0) {
    return "# Tasks\n\nNo tasks to export.";
  }

  let markdown = `# Tasks Export\n\n`;
  markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
  markdown += `**Total Tasks:** ${tasks.length}\n\n`;

  const groupedByStatus = tasks.reduce((acc: any, task: any) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {});

  Object.entries(groupedByStatus).forEach(([status, statusTasks]: [string, any]) => {
    markdown += `## ${status.toUpperCase()}\n\n`;

    statusTasks.forEach((task: any) => {
      const checkbox = task.status === "completed" ? "[x]" : "[ ]";
      markdown += `${checkbox} **${task.title}**\n`;

      if (task.description) {
        markdown += `   ${task.description}\n`;
      }

      const metadata = [];
      if (task.priority) metadata.push(`Priority: ${task.priority}`);
      if (task.due_date) metadata.push(`Due: ${new Date(task.due_date).toLocaleDateString()}`);
      if (task.ai_extracted) metadata.push(`AI Extracted`);

      if (metadata.length > 0) {
        markdown += `   *${metadata.join(" • ")}*\n`;
      }

      markdown += `\n`;
    });

    markdown += `\n`;
  });

  return markdown;
}

/**
 * Export all data as a ZIP file (Notion-style export)
 */
export async function exportAsNotionZip(
  userId: string,
  organizationId: string
): Promise<Blob> {
  const zip = new JSZip();

  // Export conversations
  const conversations = await exportConversationsAsMarkdown(userId);
  const conversationsFolder = zip.folder("Conversations");
  conversations.forEach(({ filename, content }) => {
    conversationsFolder?.file(filename, content);
  });

  // Export tasks
  const tasksMarkdown = await exportTasksAsMarkdown(organizationId);
  zip.file("Tasks.md", tasksMarkdown);

  // Export JSON backup
  const jsonData = await exportAsJSON(userId, organizationId);
  zip.file("backup.json", JSON.stringify(jsonData, null, 2));

  // Add README
  const readme = `# AI Brain Export

Exported on: ${new Date().toLocaleString()}

## Contents

- **Conversations/**: All your AI chat conversations in Markdown format
- **Tasks.md**: Your tasks and action items
- **backup.json**: Complete data backup in JSON format

## Import Instructions

To import this data back into AI Brain:
1. Go to Settings > Import/Export
2. Click "Import from ZIP"
3. Select this ZIP file
4. Review and confirm the import

For questions, visit: https://your-domain.com/help
`;

  zip.file("README.md", readme);

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Export documents list as CSV
 */
export async function exportDocumentsAsCSV(
  organizationId: string
): Promise<string> {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!documents || documents.length === 0) {
    return "title,file_name,file_type,file_size,status,chunk_count,created_at\n";
  }

  let csv = "title,file_name,file_type,file_size,status,chunk_count,created_at\n";

  documents.forEach((doc: any) => {
    const row = [
      `"${doc.title || ""}"`,
      `"${doc.file_name || ""}"`,
      `"${doc.file_type || ""}"`,
      doc.file_size || 0,
      `"${doc.status || ""}"`,
      doc.chunk_count || 0,
      `"${doc.created_at || ""}"`,
    ].join(",");

    csv += row + "\n";
  });

  return csv;
}

/**
 * Export calendar events as iCalendar format (.ics)
 */
export async function exportCalendarAsICS(
  organizationId: string
): Promise<string> {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_time", { ascending: true });

  if (!events || events.length === 0) {
    return "";
  }

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Brain//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  events.forEach((event: any) => {
    const startDate = new Date(event.start_time)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";
    const endDate = new Date(event.end_time)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";

    ics += `BEGIN:VEVENT
UID:${event.id}
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title || "Untitled Event"}
`;

    if (event.description) {
      ics += `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}
`;
    }

    if (event.location) {
      ics += `LOCATION:${event.location}
`;
    }

    if (event.meeting_url) {
      ics += `URL:${event.meeting_url}
`;
    }

    ics += `STATUS:${event.status?.toUpperCase() || "CONFIRMED"}
END:VEVENT
`;
  });

  ics += `END:VCALENDAR
`;

  return ics;
}
