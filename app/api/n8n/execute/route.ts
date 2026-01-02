import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerWebhooks } from "@/lib/webhooks/trigger";

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

/**
 * n8n Execution API
 * POST /api/n8n/execute
 *
 * This endpoint allows n8n workflows to execute actions on behalf of users.
 * Authentication: X-N8N-Secret header must match N8N_WEBHOOK_SECRET
 *
 * Body:
 * {
 *   "action": "create_task" | "update_contact" | "send_notification" | etc.,
 *   "user_id": "uuid of user to act as",
 *   "organization_id": "uuid of organization",
 *   "data": { ... action-specific data ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify n8n secret
    const secret = request.headers.get("x-n8n-secret");
    if (!N8N_WEBHOOK_SECRET || secret !== N8N_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid or missing X-N8N-Secret header" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, user_id, organization_id, data } = body;

    if (!action || !user_id || !organization_id) {
      return NextResponse.json(
        { error: "Missing required fields: action, user_id, organization_id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user and organization exist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user_id)
      .eq("organization_id", organization_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Invalid user_id or organization_id" },
        { status: 404 }
      );
    }

    let result: any;

    switch (action) {
      // ============ TASKS ============
      case "create_task": {
        const { data: task, error } = await supabase
          .from("tasks")
          .insert({
            ...data,
            user_id,
            organization_id,
            created_by: "n8n_automation",
          })
          .select()
          .single();

        if (error) throw error;
        result = { task };

        // Trigger webhook
        await triggerWebhooks("task.created", user_id, organization_id, { task });
        break;
      }

      case "update_task": {
        const { task_id, ...updateData } = data;
        const { data: task, error } = await supabase
          .from("tasks")
          .update(updateData)
          .eq("id", task_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { task };

        await triggerWebhooks("task.updated", user_id, organization_id, { task });
        break;
      }

      case "complete_task": {
        const { task_id } = data;
        const { data: task, error } = await supabase
          .from("tasks")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", task_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { task };

        await triggerWebhooks("task.completed", user_id, organization_id, { task });
        break;
      }

      // ============ CONTACTS ============
      case "create_contact": {
        const { data: contact, error } = await supabase
          .from("contacts")
          .insert({
            ...data,
            user_id,
            organization_id,
            created_by: "n8n_automation",
          })
          .select()
          .single();

        if (error) throw error;
        result = { contact };

        await triggerWebhooks("contact.created", user_id, organization_id, { contact });
        break;
      }

      case "update_contact": {
        const { contact_id, ...updateData } = data;
        const { data: contact, error } = await supabase
          .from("contacts")
          .update(updateData)
          .eq("id", contact_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { contact };

        await triggerWebhooks("contact.updated", user_id, organization_id, { contact });
        break;
      }

      // ============ LEADS ============
      case "create_lead": {
        const { data: lead, error } = await supabase
          .from("leads")
          .insert({
            ...data,
            user_id,
            organization_id,
            source: data.source || "n8n_automation",
          })
          .select()
          .single();

        if (error) throw error;
        result = { lead };

        await triggerWebhooks("lead.created", user_id, organization_id, { lead });
        break;
      }

      case "update_lead": {
        const { lead_id, ...updateData } = data;
        const { data: lead, error } = await supabase
          .from("leads")
          .update(updateData)
          .eq("id", lead_id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        result = { lead };
        break;
      }

      // ============ NOTIFICATIONS ============
      case "send_notification": {
        const { data: notification, error } = await supabase
          .from("notifications")
          .insert({
            user_id,
            organization_id,
            title: data.title,
            message: data.message,
            type: data.type || "info",
            action_url: data.action_url,
            read: false,
          })
          .select()
          .single();

        if (error) throw error;
        result = { notification };
        break;
      }

      // ============ PROJECTS ============
      case "create_project": {
        const { data: project, error } = await supabase
          .from("projects")
          .insert({
            ...data,
            organization_id,
            created_by: user_id,
          })
          .select()
          .single();

        if (error) throw error;
        result = { project };

        await triggerWebhooks("project.created", user_id, organization_id, { project });
        break;
      }

      // ============ ACTIVITY LOG ============
      case "log_activity": {
        const { data: activity, error } = await supabase
          .from("activity_feed")
          .insert({
            user_id,
            organization_id,
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            action: data.action,
            metadata: data.metadata,
          })
          .select()
          .single();

        if (error) throw error;
        result = { activity };
        break;
      }

      // ============ AI INSIGHTS ============
      case "create_insight": {
        const { data: insight, error } = await supabase
          .from("ai_insights")
          .insert({
            user_id,
            organization_id,
            type: data.type,
            title: data.title,
            description: data.description,
            action_url: data.action_url,
            dismissed: false,
          })
          .select()
          .single();

        if (error) throw error;
        result = { insight };

        await triggerWebhooks("ai.insight", user_id, organization_id, { insight });
        break;
      }

      // ============ TRIGGER WEBHOOK ============
      case "trigger_webhook": {
        const { event, event_data } = data;
        const webhookResult = await triggerWebhooks(
          event,
          user_id,
          organization_id,
          event_data
        );
        result = { webhooks: webhookResult };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      user_id,
      organization_id,
      result,
    });
  } catch (error: any) {
    console.error("n8n execute error:", error);
    return NextResponse.json(
      { error: "Execution failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list available actions
 */
export async function GET() {
  return NextResponse.json({
    description: "n8n Execution API - Execute actions on behalf of users",
    authentication: "X-N8N-Secret header required",
    actions: {
      // Tasks
      create_task: {
        description: "Create a new task",
        data: { title: "string", description: "string?", priority: "low|medium|high", due_date: "ISO date?" },
      },
      update_task: {
        description: "Update an existing task",
        data: { task_id: "uuid", title: "string?", status: "string?", priority: "string?" },
      },
      complete_task: {
        description: "Mark a task as complete",
        data: { task_id: "uuid" },
      },

      // Contacts
      create_contact: {
        description: "Create a new contact",
        data: { first_name: "string", last_name: "string?", email: "string?", phone: "string?", company: "string?" },
      },
      update_contact: {
        description: "Update an existing contact",
        data: { contact_id: "uuid", ...contactFields },
      },

      // Leads
      create_lead: {
        description: "Create a new lead",
        data: { name: "string", email: "string?", company: "string?", source: "string?", score: "number?" },
      },
      update_lead: {
        description: "Update an existing lead",
        data: { lead_id: "uuid", ...leadFields },
      },

      // Notifications
      send_notification: {
        description: "Send a notification to a user",
        data: { title: "string", message: "string", type: "info|success|warning|error", action_url: "string?" },
      },

      // Projects
      create_project: {
        description: "Create a new project",
        data: { name: "string", description: "string?", status: "string?" },
      },

      // Activity
      log_activity: {
        description: "Log an activity event",
        data: { entity_type: "string", entity_id: "uuid", action: "string", metadata: "object?" },
      },

      // AI
      create_insight: {
        description: "Create an AI insight for a user",
        data: { type: "string", title: "string", description: "string", action_url: "string?" },
      },

      // Webhooks
      trigger_webhook: {
        description: "Trigger a custom webhook event",
        data: { event: "string", event_data: "object" },
      },
    },
  });
}

const contactFields = "first_name, last_name, email, phone, company, title, notes";
const leadFields = "name, email, company, source, status, score";
