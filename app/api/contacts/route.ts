import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { CreateContactInput, ContactFilters } from "@/types/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch user's contacts with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params for filtering
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const contactType = searchParams.get("contact_type") || undefined;
    const relationshipStrength = searchParams.get("relationship_strength") || undefined;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || undefined;
    const isFavorite = searchParams.get("is_favorite");
    const isArchived = searchParams.get("is_archived");
    const needsFollowup = searchParams.get("needs_followup");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    // Apply filters
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,job_title.ilike.%${search}%`
      );
    }

    if (contactType) {
      query = query.eq("contact_type", contactType);
    }

    if (relationshipStrength) {
      query = query.eq("relationship_strength", relationshipStrength);
    }

    if (tags && tags.length > 0) {
      query = query.overlaps("tags", tags);
    }

    if (isFavorite !== null && isFavorite !== undefined) {
      query = query.eq("is_favorite", isFavorite === "true");
    }

    if (isArchived !== null && isArchived !== undefined) {
      query = query.eq("is_archived", isArchived === "true");
    } else {
      // By default, hide archived contacts
      query = query.eq("is_archived", false);
    }

    if (needsFollowup === "true") {
      query = query.or(
        `next_followup_date.lte.${new Date().toISOString().split("T")[0]},next_followup_date.is.null`
      );
    }

    // Order by favorites first, then last interaction
    query = query
      .order("is_favorite", { ascending: false })
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error("Contacts fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    return NextResponse.json({
      contacts,
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Contacts GET error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

/**
 * POST - Create a new contact
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body: CreateContactInput = await req.json();

    // Validate required fields
    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    // Build contact data
    const contactData = {
      organization_id: profile.organization_id,
      user_id: user.id,
      full_name: body.full_name.trim(),
      nickname: body.nickname?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      job_title: body.job_title?.trim() || null,
      avatar_url: body.avatar_url || null,
      contact_type: body.contact_type || "professional",
      relationship_strength: body.relationship_strength || "new",
      tags: body.tags || [],
      how_we_met: body.how_we_met?.trim() || null,
      first_met_date: body.first_met_date || null,
      location: body.location?.trim() || null,
      timezone: body.timezone || null,
      skills: body.skills || [],
      interests: body.interests || [],
      can_help_with: body.can_help_with || [],
      looking_for: body.looking_for || [],
      custom_fields: body.custom_fields || {},
    };

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert(contactData)
      .select()
      .single();

    if (error) {
      console.error("Contact creation error:", error);
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Contacts POST error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
