import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

/**
 * Import data from JSON backup
 */
export async function importFromJSON(
  jsonData: any,
  userId: string,
  organizationId: string,
  options: {
    importConversations?: boolean;
    importDocuments?: boolean;
    importTasks?: boolean;
    importCalendar?: boolean;
    importEmail?: boolean;
  } = {
    importConversations: true,
    importDocuments: true,
    importTasks: true,
    importCalendar: true,
    importEmail: true,
  }
): Promise<{
  success: boolean;
  imported: {
    conversations: number;
    documents: number;
    tasks: number;
    calendarEvents: number;
    emails: number;
  };
  errors: string[];
}> {
  const supabase = createClient();
  const errors: string[] = [];
  const imported = {
    conversations: 0,
    documents: 0,
    tasks: 0,
    calendarEvents: 0,
    emails: 0,
  };

  try {
    // Import conversations
    if (options.importConversations && jsonData.data?.conversations) {
      for (const conv of jsonData.data.conversations) {
        try {
          // Create conversation
          const { data: newConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              user_id: userId,
              organization_id: organizationId,
              title: conv.title,
              model: conv.model,
            })
            .select()
            .single();

          if (convError) throw convError;

          // Import messages
          if (conv.messages && newConv) {
            const messages = conv.messages.map((msg: any) => ({
              conversation_id: newConv.id,
              role: msg.role,
              content: msg.content,
              created_at: msg.created_at,
            }));

            await supabase.from("messages").insert(messages);
          }

          imported.conversations++;
        } catch (error) {
          errors.push(`Failed to import conversation: ${conv.title}`);
        }
      }
    }

    // Import tasks
    if (options.importTasks && jsonData.data?.tasks) {
      for (const task of jsonData.data.tasks) {
        try {
          await supabase.from("tasks").insert({
            organization_id: organizationId,
            user_id: userId,
            title: task.title,
            description: task.description,
            status: task.status || "todo",
            priority: task.priority || "medium",
            due_date: task.due_date,
            ai_extracted: task.ai_extracted || false,
            ai_confidence: task.ai_confidence,
            tags: task.tags,
            project_name: task.project_name,
          });

          imported.tasks++;
        } catch (error) {
          errors.push(`Failed to import task: ${task.title}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported,
      errors: [...errors, `Import failed: ${error}`],
    };
  }
}

/**
 * Parse Markdown file and extract conversation
 */
export function parseMarkdownConversation(markdown: string): {
  title: string;
  messages: Array<{ role: string; content: string }>;
} {
  const lines = markdown.split("\n");
  const title = lines[0]?.replace(/^#\s*/, "") || "Imported Conversation";

  const messages: Array<{ role: string; content: string }> = [];
  let currentRole: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Detect role headers
    if (line.startsWith("## 👤 User")) {
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
      }
      currentRole = "user";
      currentContent = [];
    } else if (line.startsWith("## 🤖 Assistant")) {
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
      }
      currentRole = "assistant";
      currentContent = [];
    } else if (line.startsWith("## ⚙️ System")) {
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join("\n").trim(),
        });
      }
      currentRole = "system";
      currentContent = [];
    } else if (!line.startsWith("#") && !line.startsWith("**") && !line.startsWith("---")) {
      // Add to current content
      if (currentRole) {
        currentContent.push(line);
      }
    }
  }

  // Add last message
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join("\n").trim(),
    });
  }

  return { title, messages };
}

/**
 * Parse Markdown tasks file
 */
export function parseMarkdownTasks(markdown: string): Array<{
  title: string;
  description?: string;
  status: string;
  priority?: string;
}> {
  const tasks: Array<{
    title: string;
    description?: string;
    status: string;
    priority?: string;
  }> = [];

  const lines = markdown.split("\n");
  let currentStatus = "todo";

  for (const line of lines) {
    // Detect status sections
    if (line.startsWith("## ")) {
      const status = line.replace("## ", "").toLowerCase().trim();
      currentStatus = status;
      continue;
    }

    // Parse task lines
    const taskMatch = line.match(/^[\[\s\]x]\s*\*\*(.*?)\*\*/);
    if (taskMatch) {
      const isCompleted = line.includes("[x]");
      const title = taskMatch[1];

      // Extract metadata
      const metadataMatch = line.match(/Priority:\s*(\w+)/i);
      const priority = metadataMatch?.[1]?.toLowerCase();

      tasks.push({
        title,
        status: isCompleted ? "completed" : currentStatus,
        priority: priority || "medium",
      });
    }
  }

  return tasks;
}

/**
 * Import from Notion ZIP export
 */
export async function importFromNotionZip(
  zipFile: File,
  userId: string,
  organizationId: string
): Promise<{
  success: boolean;
  imported: {
    conversations: number;
    tasks: number;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const imported = {
    conversations: 0,
    tasks: 0,
  };

  try {
    const zip = await JSZip.loadAsync(zipFile);
    const supabase = createClient();

    // Check for JSON backup first
    const backupFile = zip.file("backup.json");
    if (backupFile) {
      const backupContent = await backupFile.async("string");
      const jsonData = JSON.parse(backupContent);

      const result = await importFromJSON(jsonData, userId, organizationId);
      return {
        success: result.success,
        imported: {
          conversations: result.imported.conversations,
          tasks: result.imported.tasks,
        },
        errors: result.errors,
      };
    }

    // Otherwise, parse Markdown files
    const conversationsFolder = zip.folder("Conversations");
    if (conversationsFolder) {
      const files = Object.keys(zip.files).filter(
        (name) => name.startsWith("Conversations/") && name.endsWith(".md")
      );

      for (const filename of files) {
        try {
          const file = zip.file(filename);
          if (!file) continue;

          const content = await file.async("string");
          const { title, messages } = parseMarkdownConversation(content);

          // Create conversation
          const { data: newConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              user_id: userId,
              organization_id: organizationId,
              title,
              model: "imported",
            })
            .select()
            .single();

          if (convError) throw convError;

          // Insert messages
          if (messages.length > 0 && newConv) {
            const messageData = messages.map((msg) => ({
              conversation_id: newConv.id,
              role: msg.role,
              content: msg.content,
            }));

            await supabase.from("messages").insert(messageData);
          }

          imported.conversations++;
        } catch (error) {
          errors.push(`Failed to import conversation from ${filename}`);
        }
      }
    }

    // Import tasks
    const tasksFile = zip.file("Tasks.md");
    if (tasksFile) {
      try {
        const content = await tasksFile.async("string");
        const tasks = parseMarkdownTasks(content);

        for (const task of tasks) {
          try {
            await supabase.from("tasks").insert({
              organization_id: organizationId,
              user_id: userId,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
            });

            imported.tasks++;
          } catch (error) {
            errors.push(`Failed to import task: ${task.title}`);
          }
        }
      } catch (error) {
        errors.push("Failed to parse Tasks.md");
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported,
      errors: [...errors, `Failed to process ZIP file: ${error}`],
    };
  }
}

/**
 * Parse Evernote ENEX format
 */
export function parseEvernoteENEX(enexContent: string): Array<{
  title: string;
  content: string;
  created: string;
  tags: string[];
}> {
  const notes: Array<{
    title: string;
    content: string;
    created: string;
    tags: string[];
  }> = [];

  // Very basic ENEX parsing (real implementation would use XML parser)
  const noteRegex = /<note>(.*?)<\/note>/gs;
  const matches = enexContent.matchAll(noteRegex);

  for (const match of matches) {
    const noteContent = match[1];

    const titleMatch = noteContent.match(/<title>(.*?)<\/title>/);
    const contentMatch = noteContent.match(/<content>(.*?)<\/content>/s);
    const createdMatch = noteContent.match(/<created>(.*?)<\/created>/);

    const title = titleMatch?.[1] || "Untitled Note";
    const content = contentMatch?.[1] || "";
    const created = createdMatch?.[1] || new Date().toISOString();

    // Extract tags
    const tags: string[] = [];
    const tagMatches = noteContent.matchAll(/<tag>(.*?)<\/tag>/g);
    for (const tagMatch of tagMatches) {
      tags.push(tagMatch[1]);
    }

    // Strip HTML from content
    const strippedContent = content
      .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();

    notes.push({
      title,
      content: strippedContent,
      created,
      tags,
    });
  }

  return notes;
}

/**
 * Import from Evernote ENEX file
 */
export async function importFromEvernote(
  enexContent: string,
  userId: string,
  organizationId: string
): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;

  try {
    const notes = parseEvernoteENEX(enexContent);
    const supabase = createClient();

    for (const note of notes) {
      try {
        // Create as a conversation/document
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            organization_id: organizationId,
            title: note.title,
            model: "evernote-import",
          })
          .select()
          .single();

        if (convError) throw convError;

        // Add note content as a message
        if (newConv) {
          await supabase.from("messages").insert({
            conversation_id: newConv.id,
            role: "user",
            content: note.content,
            created_at: note.created,
          });
        }

        imported++;
      } catch (error) {
        errors.push(`Failed to import note: ${note.title}`);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported,
      errors: [...errors, `Failed to parse ENEX file: ${error}`],
    };
  }
}
