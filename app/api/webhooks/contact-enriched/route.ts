import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Service role client for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/webhooks/contact-enriched
 * Called by n8n after AI enriches contact data
 *
 * Expected payload:
 * {
 *   contact_id: string (required)
 *   status: "success" | "failed"
 *   ai_summary?: string
 *   ai_insights?: object
 *   personality_traits?: string[]
 *   interests?: string[]
 *   mutual_connections?: object[]
 *   background?: object
 *   enrichment_source?: string
 *   company_info?: {
 *     website?: string
 *     size?: string
 *     industry?: string
 *   }
 *   social_profiles?: {
 *     linkedin_url?: string
 *     twitter_url?: string
 *     github_url?: string
 *   }
 *   location?: {
 *     city?: string
 *     state?: string
 *     country?: string
 *     timezone?: string
 *   }
 *   error_message?: string (if failed)
 *   workflow_execution_id?: string
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    if (!payload.contact_id) {
      return Response.json({ error: "contact_id is required" }, { status: 400 });
    }

    // Get existing contact
    const { data: existingContact, error: fetchError } = await supabase
      .from("contacts")
      .select("id, user_id, first_name, last_name, email, company")
      .eq("id", payload.contact_id)
      .single();

    if (fetchError || !existingContact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      enriched_at: new Date().toISOString(),
    };

    if (payload.status === "failed") {
      updateData.ai_enriched = false;
    } else {
      updateData.ai_enriched = true;
      updateData.enrichment_source = payload.enrichment_source || "perplexity";

      // AI-generated data
      if (payload.ai_summary) {
        updateData.ai_summary = payload.ai_summary;
      }
      if (payload.ai_insights) {
        updateData.ai_insights = payload.ai_insights;
      }
      if (payload.personality_traits) {
        updateData.personality_traits = payload.personality_traits;
      }
      if (payload.interests) {
        updateData.interests = payload.interests;
      }
      if (payload.mutual_connections) {
        updateData.mutual_connections = payload.mutual_connections;
      }
      if (payload.background) {
        updateData.background = payload.background;
      }

      // Company info
      if (payload.company_info) {
        if (payload.company_info.website) {
          updateData.company_website = payload.company_info.website;
        }
        if (payload.company_info.size) {
          updateData.company_size = payload.company_info.size;
        }
        if (payload.company_info.industry) {
          updateData.industry = payload.company_info.industry;
        }
      }

      // Social profiles
      if (payload.social_profiles) {
        if (payload.social_profiles.linkedin_url) {
          updateData.linkedin_url = payload.social_profiles.linkedin_url;
        }
        if (payload.social_profiles.twitter_url) {
          updateData.twitter_url = payload.social_profiles.twitter_url;
        }
        if (payload.social_profiles.github_url) {
          updateData.github_url = payload.social_profiles.github_url;
        }
      }

      // Location
      if (payload.location) {
        if (payload.location.city) {
          updateData.city = payload.location.city;
        }
        if (payload.location.state) {
          updateData.state = payload.location.state;
        }
        if (payload.location.country) {
          updateData.country = payload.location.country;
        }
        if (payload.location.timezone) {
          updateData.timezone = payload.location.timezone;
        }
      }
    }

    // Update contact
    const { data: contact, error: updateError } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", payload.contact_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update contact:", updateError);
      return Response.json({
        error: "Failed to update contact",
        details: updateError.message
      }, { status: 500 });
    }

    // Build contact name for logs
    const contactName = [existingContact.first_name, existingContact.last_name]
      .filter(Boolean)
      .join(" ");

    // Log automation
    const executionTime = Date.now() - startTime;
    await supabase.from("automation_logs").insert({
      user_id: existingContact.user_id,
      workflow_name: "contact-enrichment",
      workflow_type: "contact_enrichment",
      workflow_id: payload.workflow_execution_id,
      status: payload.status === "failed" ? "error" : "success",
      input_summary: `Enrich: ${contactName} @ ${existingContact.company || "Unknown"}`,
      output_summary: payload.status === "failed"
        ? payload.error_message
        : `Enriched with ${payload.enrichment_source || "AI"}`,
      execution_time_ms: executionTime,
      error_message: payload.status === "failed" ? payload.error_message : null,
      source_type: "contact",
      source_id: payload.contact_id,
      metadata: {
        enrichment_source: payload.enrichment_source,
        has_summary: !!payload.ai_summary,
        has_insights: !!payload.ai_insights,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    // Create notification
    await supabase.from("notifications").insert({
      user_id: existingContact.user_id,
      type: "contact_enriched",
      title: "Contact Enriched",
      message: payload.status === "failed"
        ? `Failed to enrich ${contactName}`
        : `${contactName} has been enriched with AI insights`,
      data: {
        contact_id: payload.contact_id,
        status: payload.status,
      },
      link: `/dashboard/contacts/${payload.contact_id}`,
    });

    return Response.json({
      success: true,
      contact_id: payload.contact_id,
      status: payload.status || "success",
      execution_time_ms: executionTime,
    });

  } catch (error: any) {
    console.error("contact-enriched webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/contact-enriched
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "contact-enriched",
    description: "POST to update contact with AI-enriched data",
  });
}
