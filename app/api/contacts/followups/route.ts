import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { FollowupContact, FollowupUrgency } from "@/types/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch contacts that need follow-up
 * Query params:
 *   - urgency: 'urgent' | 'overdue' | 'due_soon' | 'all' (default: 'all')
 *   - limit: number (default: 20)
 *   - include_snoozed: boolean (default: false)
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

    const searchParams = req.nextUrl.searchParams;
    const urgencyFilter = searchParams.get("urgency") || "all";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const includeSnoozed = searchParams.get("include_snoozed") === "true";

    // Call the database function to get contacts needing follow-up
    const { data: contacts, error } = await supabase.rpc(
      "get_contacts_needing_followup",
      {
        for_user_id: user.id,
        include_snoozed: includeSnoozed,
        max_results: limit,
      }
    );

    if (error) {
      console.error("Error fetching follow-up contacts:", error);
      // If the function doesn't exist yet, fall back to a manual query
      if (error.message.includes("function") || error.message.includes("does not exist")) {
        return await fallbackQuery(supabase, user.id, urgencyFilter, limit, includeSnoozed);
      }
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    // Filter by urgency if specified
    let filteredContacts = contacts || [];
    if (urgencyFilter !== "all") {
      filteredContacts = filteredContacts.filter(
        (c: FollowupContact) => c.urgency === urgencyFilter
      );
    }

    // Count by urgency
    const counts = {
      urgent: (contacts || []).filter((c: FollowupContact) => c.urgency === "urgent").length,
      overdue: (contacts || []).filter((c: FollowupContact) => c.urgency === "overdue").length,
      due_soon: (contacts || []).filter((c: FollowupContact) => c.urgency === "due_soon").length,
      total: (contacts || []).length,
    };

    return NextResponse.json({
      contacts: filteredContacts,
      counts,
    });
  } catch (error) {
    console.error("Followups GET error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

// Fallback query if the database function doesn't exist yet
async function fallbackQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  urgencyFilter: string,
  limit: number,
  includeSnoozed: boolean
) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Query contacts that might need follow-up
  let query = supabase
    .from("contacts")
    .select(`
      id,
      full_name,
      company,
      email,
      avatar_url,
      relationship_strength,
      last_interaction_at,
      next_followup_date,
      reminder_enabled,
      reminder_snoozed_until
    `)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .eq("reminder_enabled", true)
    .order("last_interaction_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  // Filter out snoozed contacts unless requested
  if (!includeSnoozed) {
    query = query.or(`reminder_snoozed_until.is.null,reminder_snoozed_until.lte.${now.toISOString().split('T')[0]}`);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error("Fallback query error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }

  // Calculate urgency for each contact
  const relationshipDays: Record<string, number> = {
    inner_circle: 14,
    close: 30,
    connected: 60,
    acquaintance: 90,
    new: 7,
  };

  const processedContacts: FollowupContact[] = (contacts || [])
    .map((c) => {
      const lastInteraction = c.last_interaction_at ? new Date(c.last_interaction_at) : null;
      const followupDate = c.next_followup_date ? new Date(c.next_followup_date) : null;

      // Calculate expected follow-up date if not set
      let expectedDate: Date;
      if (followupDate) {
        expectedDate = followupDate;
      } else if (lastInteraction) {
        const days = relationshipDays[c.relationship_strength] || 30;
        expectedDate = new Date(lastInteraction.getTime() + days * 24 * 60 * 60 * 1000);
      } else {
        // No interaction, consider overdue
        expectedDate = sevenDaysAgo;
      }

      const daysOverdue = Math.max(0, Math.floor((now.getTime() - expectedDate.getTime()) / (24 * 60 * 60 * 1000)));

      let urgency: FollowupUrgency;
      if (expectedDate <= sevenDaysAgo) {
        urgency = "urgent";
      } else if (expectedDate <= now) {
        urgency = "overdue";
      } else if (expectedDate <= sevenDaysFromNow) {
        urgency = "due_soon";
      } else {
        urgency = "upcoming";
      }

      return {
        contact_id: c.id,
        full_name: c.full_name,
        company: c.company,
        email: c.email,
        avatar_url: c.avatar_url,
        relationship_strength: c.relationship_strength,
        last_interaction_at: c.last_interaction_at,
        next_followup_date: c.next_followup_date,
        days_overdue: daysOverdue,
        urgency,
      };
    })
    .filter((c) => c.urgency !== "upcoming") // Only show contacts needing attention
    .sort((a, b) => {
      // Sort by urgency, then by days overdue
      const urgencyOrder = { urgent: 1, overdue: 2, due_soon: 3, upcoming: 4 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.days_overdue - a.days_overdue;
    });

  // Filter by urgency if specified
  let filteredContacts = processedContacts;
  if (urgencyFilter !== "all") {
    filteredContacts = processedContacts.filter((c) => c.urgency === urgencyFilter);
  }

  // Count by urgency
  const counts = {
    urgent: processedContacts.filter((c) => c.urgency === "urgent").length,
    overdue: processedContacts.filter((c) => c.urgency === "overdue").length,
    due_soon: processedContacts.filter((c) => c.urgency === "due_soon").length,
    total: processedContacts.length,
  };

  return NextResponse.json({
    contacts: filteredContacts.slice(0, limit),
    counts,
  });
}
