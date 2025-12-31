import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/research
 * Fetch all research requests for the authenticated user
 *
 * Query params:
 * - type: filter by request_type
 * - status: filter by status
 * - priority: filter by priority
 * - contact_id: filter by linked contact
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const contactId = searchParams.get("contact_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("research_requests")
      .select(`
        *,
        contacts(id, name, email, company),
        opportunities(id, title, status),
        projects(id, name, status)
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("request_type", type);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (contactId) {
      query = query.eq("contact_id", contactId);
    }

    const { data: requests, count, error } = await query;

    if (error) {
      console.error("Failed to fetch research requests:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get stats
    const { data: allRequests } = await supabase
      .from("research_requests")
      .select("status, priority")
      .eq("user_id", user.id);

    const stats = {
      total: allRequests?.length || 0,
      pending: allRequests?.filter(r => r.status === "pending").length || 0,
      researching: allRequests?.filter(r => r.status === "researching").length || 0,
      completed: allRequests?.filter(r => r.status === "completed").length || 0,
      urgent: allRequests?.filter(r => r.priority === "urgent").length || 0,
    };

    return Response.json({
      success: true,
      requests,
      total: count,
      stats,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error("GET /api/research error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/research
 * Create a new research request and optionally send to n8n
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.request_type) {
      return Response.json({ error: "request_type is required" }, { status: 400 });
    }
    if (!body.subject) {
      return Response.json({ error: "subject is required" }, { status: 400 });
    }

    // Create research request
    const { data: request, error } = await supabase
      .from("research_requests")
      .insert({
        user_id: user.id,
        request_type: body.request_type,
        subject: body.subject,
        context: body.context || null,
        specific_questions: body.specific_questions || [],
        priority: body.priority || "medium",
        status: "pending",
        contact_id: body.contact_id || null,
        opportunity_id: body.opportunity_id || null,
        project_id: body.project_id || null,
        decision_id: body.decision_id || null,
        assigned_to: body.assigned_to || null,
        estimated_hours: body.estimated_hours || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create research request:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Send to n8n for processing if webhook is configured
    const n8nWebhookUrl = process.env.N8N_RESEARCH_WEBHOOK;

    if (n8nWebhookUrl && body.auto_start !== false) {
      try {
        // Update status to queued
        await supabase
          .from("research_requests")
          .update({ status: "queued" })
          .eq("id", request.id);

        const n8nPayload = {
          research_id: request.id,
          user_id: user.id,
          request_type: body.request_type,
          subject: body.subject,
          context: body.context,
          specific_questions: body.specific_questions || [],
          priority: body.priority || "medium",
          contact_id: body.contact_id,
          // Tell n8n where to send results
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/research-completed`,
        };

        // Fire and forget
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET || "",
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("Failed to send to n8n:", err);
        });

        return Response.json({
          success: true,
          request: { ...request, status: "queued" },
          message: "Research request created and queued for processing",
        });

      } catch (n8nError) {
        console.error("n8n webhook error:", n8nError);
        return Response.json({
          success: true,
          request,
          message: "Research request saved but processing unavailable",
        });
      }
    }

    return Response.json({
      success: true,
      request,
      message: body.auto_start === false
        ? "Research request saved as draft"
        : "Research request saved (n8n webhook not configured)",
    });

  } catch (error: any) {
    console.error("POST /api/research error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
