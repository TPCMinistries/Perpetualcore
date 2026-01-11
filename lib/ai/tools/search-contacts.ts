/**
 * Search Contacts Tool
 * Allows the AI to search and find relevant contacts based on various criteria
 */

import { Tool, ToolExecutionContext } from "./schema";
import { createClient } from "@/lib/supabase/server";

export interface SearchContactsInput {
  query?: string;           // Free text search across name, company, job title
  company?: string;         // Filter by company name
  industry?: string;        // Filter by industry
  tags?: string[];          // Filter by tags
  relationship_strength?: "inner_circle" | "close" | "connected" | "acquaintance" | "new";
  lead_status?: string;     // Filter by lead status
  needs_followup?: boolean; // Filter to contacts needing follow-up
  limit?: number;           // Max results (default 5)
}

export const searchContactsTool: Tool = {
  name: "search_contacts",
  description: `Search the user's contacts to find relevant people based on various criteria. Use this tool when:
- The user asks about contacts in a specific company or industry
- The user wants to find someone with specific skills or role
- The user needs suggestions for who to reach out to
- The user asks about relationship status or follow-ups
- You want to proactively suggest relevant contacts based on the conversation context

Returns contact details including name, role, company, relationship strength, and communication history.`,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Free text search across name, email, company, and job title"
      },
      company: {
        type: "string",
        description: "Filter contacts by company name (partial match)"
      },
      industry: {
        type: "string",
        description: "Filter contacts by industry"
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter contacts that have any of these tags"
      },
      relationship_strength: {
        type: "string",
        enum: ["inner_circle", "close", "connected", "acquaintance", "new"],
        description: "Filter by relationship strength level"
      },
      lead_status: {
        type: "string",
        description: "Filter by lead status (e.g., 'qualified', 'prospect', 'customer')"
      },
      needs_followup: {
        type: "boolean",
        description: "If true, only return contacts with overdue or upcoming follow-ups"
      },
      limit: {
        type: "number",
        description: "Maximum number of contacts to return (default 5, max 10)"
      }
    },
    required: []
  }
};

export async function executeSearchContacts(
  params: SearchContactsInput,
  context: ToolExecutionContext
): Promise<string> {
  const supabase = await createClient();
  const limit = Math.min(params.limit || 5, 10);

  // Build query
  let query = supabase
    .from("contacts")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      company,
      job_title,
      industry,
      city,
      state,
      country,
      relationship_strength,
      relationship_status,
      lead_status,
      lead_score,
      tags,
      bio,
      notes,
      last_contacted_at,
      next_followup_date
    `)
    .eq("user_id", context.userId)
    .eq("is_archived", false)
    .order("relationship_strength", { ascending: false })
    .limit(limit);

  // Apply text search
  if (params.query) {
    query = query.or(
      `first_name.ilike.%${params.query}%,last_name.ilike.%${params.query}%,email.ilike.%${params.query}%,company.ilike.%${params.query}%,job_title.ilike.%${params.query}%`
    );
  }

  // Apply company filter
  if (params.company) {
    query = query.ilike("company", `%${params.company}%`);
  }

  // Apply industry filter
  if (params.industry) {
    query = query.ilike("industry", `%${params.industry}%`);
  }

  // Apply tags filter
  if (params.tags && params.tags.length > 0) {
    query = query.overlaps("tags", params.tags);
  }

  // Apply relationship strength filter
  if (params.relationship_strength) {
    const strengthRanges: Record<string, [number, number]> = {
      'inner_circle': [80, 100],
      'close': [60, 79],
      'connected': [40, 59],
      'acquaintance': [20, 39],
      'new': [0, 19],
    };
    const [min, max] = strengthRanges[params.relationship_strength] || [0, 100];
    query = query.gte("relationship_strength", min).lte("relationship_strength", max);
  }

  // Apply lead status filter
  if (params.lead_status) {
    query = query.eq("lead_status", params.lead_status);
  }

  // Apply follow-up filter
  if (params.needs_followup) {
    const today = new Date().toISOString().split("T")[0];
    query = query.lte("next_followup_date", today);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error("Error searching contacts:", error);
    return `Error searching contacts: ${error.message}`;
  }

  if (!contacts || contacts.length === 0) {
    return "No contacts found matching your criteria.";
  }

  // Format contacts for AI response
  const formattedContacts = contacts.map((contact: any, index: number) => {
    const fullName = `${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}`;
    const parts = [`${index + 1}. **${fullName}**`];

    if (contact.job_title && contact.company) {
      parts.push(`   Role: ${contact.job_title} at ${contact.company}`);
    } else if (contact.job_title) {
      parts.push(`   Role: ${contact.job_title}`);
    } else if (contact.company) {
      parts.push(`   Company: ${contact.company}`);
    }

    if (contact.industry) {
      parts.push(`   Industry: ${contact.industry}`);
    }

    if (contact.email) {
      parts.push(`   Email: ${contact.email}`);
    }

    // Relationship strength
    if (contact.relationship_strength !== null && contact.relationship_strength !== undefined) {
      let strengthLabel = "New";
      if (contact.relationship_strength >= 80) strengthLabel = "Inner Circle";
      else if (contact.relationship_strength >= 60) strengthLabel = "Close";
      else if (contact.relationship_strength >= 40) strengthLabel = "Connected";
      else if (contact.relationship_strength >= 20) strengthLabel = "Acquaintance";
      parts.push(`   Relationship: ${strengthLabel} (${contact.relationship_strength}/100)`);
    }

    if (contact.lead_status) {
      parts.push(`   Lead Status: ${contact.lead_status} (Score: ${contact.lead_score || 0})`);
    }

    // Communication history
    if (contact.last_contacted_at) {
      const lastContact = new Date(contact.last_contacted_at);
      const daysSince = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      parts.push(`   Last Contact: ${daysSince} days ago`);
    }

    if (contact.next_followup_date) {
      const followup = new Date(contact.next_followup_date);
      const daysUntil = Math.floor((followup.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        parts.push(`   ⚠️ Follow-up Overdue: ${Math.abs(daysUntil)} days`);
      } else if (daysUntil === 0) {
        parts.push(`   📅 Follow-up Due Today`);
      } else if (daysUntil <= 7) {
        parts.push(`   📅 Follow-up: in ${daysUntil} days`);
      }
    }

    if (contact.tags && contact.tags.length > 0) {
      parts.push(`   Tags: ${contact.tags.join(", ")}`);
    }

    if (contact.city || contact.state) {
      const location = [contact.city, contact.state].filter(Boolean).join(", ");
      parts.push(`   Location: ${location}`);
    }

    return parts.join("\n");
  });

  let response = `Found ${contacts.length} contact${contacts.length > 1 ? 's' : ''}:\n\n`;
  response += formattedContacts.join("\n\n");

  // Add follow-up recommendations if there are overdue contacts
  const overdueContacts = contacts.filter((c: any) => {
    if (!c.next_followup_date) return false;
    const followup = new Date(c.next_followup_date);
    return followup.getTime() < Date.now();
  });

  if (overdueContacts.length > 0) {
    response += `\n\n💡 **Recommendation**: ${overdueContacts.length} contact${overdueContacts.length > 1 ? 's have' : ' has'} overdue follow-ups. Consider reaching out soon to maintain relationships.`;
  }

  return response;
}
