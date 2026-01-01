import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { logActivity } from "@/lib/activity-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/contacts
 * Fetch all contacts for the authenticated user
 *
 * Query params:
 * - search: search by name, email, company
 * - type: filter by contact_type
 * - status: filter by relationship_status
 * - lead_status: filter by lead_status
 * - company: filter by company
 * - tags: filter by tags (comma separated)
 * - favorite: filter favorites only
 * - archived: include archived (default false)
 * - sort: field to sort by (default: last_contacted_at)
 * - order: asc or desc (default: desc)
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
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const leadStatus = searchParams.get("lead_status");
    const company = searchParams.get("company");
    const tags = searchParams.get("tags");
    const favorite = searchParams.get("favorite");
    const archived = searchParams.get("archived") === "true";
    const sort = searchParams.get("sort") || "updated_at";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_archived", archived)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    // Search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,job_title.ilike.%${search}%`
      );
    }

    // Type filter
    if (type) {
      query = query.eq("contact_type", type);
    }

    // Status filter
    if (status) {
      query = query.eq("relationship_status", status);
    }

    // Lead status filter
    if (leadStatus) {
      query = query.eq("lead_status", leadStatus);
    }

    // Company filter
    if (company) {
      query = query.ilike("company", `%${company}%`);
    }

    // Tags filter
    if (tags) {
      const tagList = tags.split(",").map(t => t.trim());
      query = query.overlaps("tags", tagList);
    }

    // Favorite filter
    if (favorite === "true") {
      query = query.eq("is_favorite", true);
    }

    const { data: contacts, count, error } = await query;

    if (error) {
      console.error("Failed to fetch contacts:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get stats
    const { data: allContacts } = await supabase
      .from("contacts")
      .select("contact_type, relationship_status, lead_status, relationship_strength, is_favorite")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    const stats = {
      total: allContacts?.length || 0,
      favorites: allContacts?.filter(c => c.is_favorite).length || 0,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byLeadStatus: {} as Record<string, number>,
      avgRelationshipStrength: 0,
      needsFollowup: 0,
    };

    if (allContacts && allContacts.length > 0) {
      let totalStrength = 0;
      allContacts.forEach(c => {
        // By type
        if (c.contact_type) {
          stats.byType[c.contact_type] = (stats.byType[c.contact_type] || 0) + 1;
        }
        // By status
        if (c.relationship_status) {
          stats.byStatus[c.relationship_status] = (stats.byStatus[c.relationship_status] || 0) + 1;
        }
        // By lead status
        if (c.lead_status) {
          stats.byLeadStatus[c.lead_status] = (stats.byLeadStatus[c.lead_status] || 0) + 1;
        }
        // Relationship strength
        totalStrength += c.relationship_strength || 0;
      });
      stats.avgRelationshipStrength = Math.round(totalStrength / allContacts.length);
    }

    // Get contacts needing followup
    const { count: followupCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .lte("next_followup_date", new Date().toISOString().split("T")[0]);

    stats.needsFollowup = followupCount || 0;

    return Response.json({
      success: true,
      contacts,
      total: count,
      stats,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error("GET /api/contacts error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/contacts
 * Create a new contact, optionally trigger AI enrichment
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

    if (!body.first_name) {
      return Response.json({ error: "first_name is required" }, { status: 400 });
    }

    // Create contact
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        first_name: body.first_name,
        last_name: body.last_name || null,
        email: body.email || null,
        phone: body.phone || null,
        avatar_url: body.avatar_url || null,
        company: body.company || null,
        job_title: body.job_title || null,
        department: body.department || null,
        company_website: body.company_website || null,
        company_size: body.company_size || null,
        industry: body.industry || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        timezone: body.timezone || null,
        contact_type: body.contact_type || "contact",
        relationship_strength: body.relationship_strength || 50,
        relationship_status: body.relationship_status || "active",
        lead_status: body.lead_status || null,
        lead_score: body.lead_score || 0,
        linkedin_url: body.linkedin_url || null,
        twitter_url: body.twitter_url || null,
        instagram_url: body.instagram_url || null,
        facebook_url: body.facebook_url || null,
        github_url: body.github_url || null,
        personal_website: body.personal_website || null,
        preferred_contact_method: body.preferred_contact_method || "email",
        communication_frequency: body.communication_frequency || null,
        best_time_to_contact: body.best_time_to_contact || null,
        bio: body.bio || null,
        notes: body.notes || null,
        tags: body.tags || [],
        custom_fields: body.custom_fields || {},
        source: body.source || "manual",
        source_details: body.source_details || null,
        referred_by: body.referred_by || null,
        first_contact_date: body.first_contact_date || new Date().toISOString().split("T")[0],
        is_favorite: body.is_favorite || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create contact:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Log activity for contact creation
    const contactName = `${contact.first_name}${contact.last_name ? " " + contact.last_name : ""}`;
    await logActivity({
      supabase,
      userId: user.id,
      action: "created",
      entityType: "contact",
      entityId: contact.id,
      entityName: contactName,
      metadata: {
        contactType: contact.contact_type,
        company: contact.company,
        source: contact.source,
      },
    });

    // If enrich_now is true, send to n8n for AI enrichment
    if (body.enrich_now && (body.email || body.linkedin_url || (body.first_name && body.company))) {
      const n8nWebhookUrl = process.env.N8N_CONTACT_ENRICHMENT_WEBHOOK;

      if (n8nWebhookUrl) {
        const n8nPayload = {
          contact_id: contact.id,
          user_id: user.id,
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          company: body.company,
          job_title: body.job_title,
          linkedin_url: body.linkedin_url,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/contact-enriched`,
        };

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
          contact,
          message: "Contact created and sent for AI enrichment",
        });
      }
    }

    return Response.json({
      success: true,
      contact,
    });

  } catch (error: any) {
    console.error("POST /api/contacts error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
