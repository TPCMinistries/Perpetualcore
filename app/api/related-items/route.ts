import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SourceType = "task" | "contact" | "project" | "document" | "email";

interface RelatedItem {
  id: string;
  type: SourceType;
  title: string;
  subtitle?: string;
  status?: string;
  priority?: string;
  avatar_url?: string;
  emoji?: string;
  url: string;
  date?: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType") as SourceType;
    const sourceId = searchParams.get("sourceId");
    const excludeTypes = searchParams.get("exclude")?.split(",") || [];
    const includeTypes = searchParams.get("types")?.split(",") || [];

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "sourceType and sourceId are required" },
        { status: 400 }
      );
    }

    const items: RelatedItem[] = [];

    // Define which types to fetch based on source
    const shouldFetch = (type: SourceType) => {
      if (includeTypes.length > 0) {
        return includeTypes.includes(type);
      }
      return !excludeTypes.includes(type);
    };

    // Fetch related items based on source type
    switch (sourceType) {
      case "task": {
        // Get the task first to find its project_id
        const { data: task } = await supabase
          .from("tasks")
          .select("id, title, project_id, description")
          .eq("id", sourceId)
          .eq("user_id", user.id)
          .single();

        if (!task) break;

        // Related Projects (if task is linked to a project)
        if (shouldFetch("project") && task.project_id) {
          const { data: project } = await supabase
            .from("projects")
            .select("id, name, emoji, current_stage, priority")
            .eq("id", task.project_id)
            .single();

          if (project) {
            items.push({
              id: project.id,
              type: "project",
              title: project.name,
              subtitle: `Stage: ${project.current_stage?.replace("_", " ")}`,
              status: project.current_stage,
              priority: project.priority,
              emoji: project.emoji,
              url: `/dashboard/projects/${project.id}`,
            });
          }
        }

        // Related Contacts (mentioned in task title/description or linked via contact_tasks if exists)
        if (shouldFetch("contact")) {
          // Try to find contacts linked to this task
          const { data: contactLinks } = await supabase
            .from("contact_tasks")
            .select("contact_id, contacts(id, full_name, email, avatar_url, company)")
            .eq("task_id", sourceId);

          if (contactLinks && contactLinks.length > 0) {
            for (const link of contactLinks) {
              const contact = link.contacts as {
                id: string;
                full_name: string;
                email: string;
                avatar_url: string;
                company: string;
              };
              if (contact) {
                items.push({
                  id: contact.id,
                  type: "contact",
                  title: contact.full_name,
                  subtitle: contact.company || contact.email,
                  avatar_url: contact.avatar_url,
                  url: `/dashboard/contacts/${contact.id}`,
                });
              }
            }
          }
        }

        // Subtasks as related tasks
        if (shouldFetch("task")) {
          const { data: subtasks } = await supabase
            .from("tasks")
            .select("id, title, status, priority, due_date")
            .eq("parent_task_id", sourceId)
            .eq("user_id", user.id)
            .limit(5);

          if (subtasks) {
            for (const subtask of subtasks) {
              items.push({
                id: subtask.id,
                type: "task",
                title: subtask.title,
                subtitle: "Subtask",
                status: subtask.status,
                priority: subtask.priority,
                date: subtask.due_date,
                url: `/dashboard/tasks/${subtask.id}`,
              });
            }
          }
        }
        break;
      }

      case "contact": {
        // Get the contact
        const { data: contact } = await supabase
          .from("contacts")
          .select("id, full_name, email")
          .eq("id", sourceId)
          .eq("user_id", user.id)
          .single();

        if (!contact) break;

        // Related Projects (via contact_projects)
        if (shouldFetch("project")) {
          const { data: projectLinks } = await supabase
            .from("contact_projects")
            .select("project_id, role, projects(id, name, emoji, current_stage, priority)")
            .eq("contact_id", sourceId)
            .limit(5);

          if (projectLinks) {
            for (const link of projectLinks) {
              const project = link.projects as {
                id: string;
                name: string;
                emoji: string;
                current_stage: string;
                priority: string;
              };
              if (project) {
                items.push({
                  id: project.id,
                  type: "project",
                  title: project.name,
                  subtitle: link.role || `Stage: ${project.current_stage?.replace("_", " ")}`,
                  status: project.current_stage,
                  priority: project.priority,
                  emoji: project.emoji,
                  url: `/dashboard/projects/${project.id}`,
                });
              }
            }
          }
        }

        // Related Tasks (via contact_tasks or tasks that mention contact)
        if (shouldFetch("task")) {
          const { data: taskLinks } = await supabase
            .from("contact_tasks")
            .select("task_id, tasks(id, title, status, priority, due_date)")
            .eq("contact_id", sourceId)
            .limit(5);

          if (taskLinks) {
            for (const link of taskLinks) {
              const task = link.tasks as {
                id: string;
                title: string;
                status: string;
                priority: string;
                due_date: string;
              };
              if (task) {
                items.push({
                  id: task.id,
                  type: "task",
                  title: task.title,
                  status: task.status,
                  priority: task.priority,
                  date: task.due_date,
                  url: `/dashboard/tasks/${task.id}`,
                });
              }
            }
          }
        }

        // Related Emails (emails from/to this contact)
        if (shouldFetch("email") && contact.email) {
          const { data: emails } = await supabase
            .from("emails")
            .select("id, subject, from_email, date, is_read")
            .eq("user_id", user.id)
            .or(`from_email.ilike.%${contact.email}%,to_emails.cs.{${contact.email}}`)
            .order("date", { ascending: false })
            .limit(5);

          if (emails) {
            for (const email of emails) {
              items.push({
                id: email.id,
                type: "email",
                title: email.subject || "(No Subject)",
                subtitle: email.from_email,
                status: email.is_read ? "read" : "unread",
                date: email.date,
                url: `/dashboard/inbox?email=${email.id}`,
              });
            }
          }
        }

        // Related Documents
        if (shouldFetch("document")) {
          const { data: docLinks } = await supabase
            .from("contact_documents")
            .select("document_id, documents(id, name, type, status, created_at)")
            .eq("contact_id", sourceId)
            .limit(5);

          if (docLinks) {
            for (const link of docLinks) {
              const doc = link.documents as {
                id: string;
                name: string;
                type: string;
                status: string;
                created_at: string;
              };
              if (doc) {
                items.push({
                  id: doc.id,
                  type: "document",
                  title: doc.name,
                  subtitle: doc.type?.toUpperCase(),
                  status: doc.status,
                  date: doc.created_at,
                  url: `/dashboard/documents/${doc.id}`,
                });
              }
            }
          }
        }
        break;
      }

      case "project": {
        // Get the project
        const { data: project } = await supabase
          .from("projects")
          .select("id, name")
          .eq("id", sourceId)
          .eq("user_id", user.id)
          .single();

        if (!project) break;

        // Related Tasks
        if (shouldFetch("task")) {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("id, title, status, priority, due_date")
            .eq("project_id", sourceId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (tasks) {
            for (const task of tasks) {
              items.push({
                id: task.id,
                type: "task",
                title: task.title,
                status: task.status,
                priority: task.priority,
                date: task.due_date,
                url: `/dashboard/tasks/${task.id}`,
              });
            }
          }
        }

        // Related Contacts (via contact_projects)
        if (shouldFetch("contact")) {
          const { data: contactLinks } = await supabase
            .from("contact_projects")
            .select("contact_id, role, contacts(id, full_name, email, avatar_url, company)")
            .eq("project_id", sourceId)
            .limit(5);

          if (contactLinks) {
            for (const link of contactLinks) {
              const contact = link.contacts as {
                id: string;
                full_name: string;
                email: string;
                avatar_url: string;
                company: string;
              };
              if (contact) {
                items.push({
                  id: contact.id,
                  type: "contact",
                  title: contact.full_name,
                  subtitle: link.role || contact.company || contact.email,
                  avatar_url: contact.avatar_url,
                  url: `/dashboard/contacts/${contact.id}`,
                });
              }
            }
          }
        }

        // Related Documents (via project_documents)
        if (shouldFetch("document")) {
          const { data: docLinks } = await supabase
            .from("project_documents")
            .select("document_id, documents(id, name, type, status, created_at)")
            .eq("project_id", sourceId)
            .limit(5);

          if (docLinks) {
            for (const link of docLinks) {
              const doc = link.documents as {
                id: string;
                name: string;
                type: string;
                status: string;
                created_at: string;
              };
              if (doc) {
                items.push({
                  id: doc.id,
                  type: "document",
                  title: doc.name,
                  subtitle: doc.type?.toUpperCase(),
                  status: doc.status,
                  date: doc.created_at,
                  url: `/dashboard/documents/${doc.id}`,
                });
              }
            }
          }
        }
        break;
      }

      case "document": {
        // Get the document
        const { data: document } = await supabase
          .from("documents")
          .select("id, name")
          .eq("id", sourceId)
          .eq("user_id", user.id)
          .single();

        if (!document) break;

        // Related Projects
        if (shouldFetch("project")) {
          const { data: projectLinks } = await supabase
            .from("project_documents")
            .select("project_id, projects(id, name, emoji, current_stage, priority)")
            .eq("document_id", sourceId)
            .limit(5);

          if (projectLinks) {
            for (const link of projectLinks) {
              const project = link.projects as {
                id: string;
                name: string;
                emoji: string;
                current_stage: string;
                priority: string;
              };
              if (project) {
                items.push({
                  id: project.id,
                  type: "project",
                  title: project.name,
                  emoji: project.emoji,
                  status: project.current_stage,
                  priority: project.priority,
                  url: `/dashboard/projects/${project.id}`,
                });
              }
            }
          }
        }

        // Related Contacts
        if (shouldFetch("contact")) {
          const { data: contactLinks } = await supabase
            .from("contact_documents")
            .select("contact_id, contacts(id, full_name, email, avatar_url, company)")
            .eq("document_id", sourceId)
            .limit(5);

          if (contactLinks) {
            for (const link of contactLinks) {
              const contact = link.contacts as {
                id: string;
                full_name: string;
                email: string;
                avatar_url: string;
                company: string;
              };
              if (contact) {
                items.push({
                  id: contact.id,
                  type: "contact",
                  title: contact.full_name,
                  subtitle: contact.company || contact.email,
                  avatar_url: contact.avatar_url,
                  url: `/dashboard/contacts/${contact.id}`,
                });
              }
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching related items:", error);
    return NextResponse.json(
      { error: "Failed to fetch related items" },
      { status: 500 }
    );
  }
}
