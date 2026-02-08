/**
 * Contact Checker
 *
 * Checks contacts that need attention: overdue follow-ups,
 * cooling relationships, birthdays, and important dates.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { CheckResult, CheckItem } from "../types";

/**
 * Check contacts for items needing attention.
 *
 * @param userId - The Perpetual Core user ID
 * @returns CheckResult with contacts requiring follow-up or attention
 */
export async function checkContacts(userId: string): Promise<CheckResult> {
  const supabase = createAdminClient();
  const items: CheckItem[] = [];

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Check for overdue follow-ups
    const { data: overdueFollowups } = await supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, company, job_title, next_followup_date, relationship_strength, last_contacted_at"
      )
      .eq("user_id", userId)
      .eq("is_archived", false)
      .lt("next_followup_date", todayStr)
      .not("next_followup_date", "is", null)
      .order("next_followup_date", { ascending: true })
      .limit(10);

    if (overdueFollowups && overdueFollowups.length > 0) {
      for (const contact of overdueFollowups) {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(contact.next_followup_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const name = formatContactName(contact);

        items.push({
          title: `Follow-up overdue (${daysOverdue}d): ${name}`,
          description: buildContactDescription(contact),
          urgency: daysOverdue > 7 ? "high" : "medium",
          category: "followup_overdue",
          metadata: {
            contactId: contact.id,
            contactName: name,
            followupDate: contact.next_followup_date,
            daysOverdue,
            relationshipStrength: contact.relationship_strength,
          },
        });
      }
    }

    // Check for follow-ups due today
    const { data: todayFollowups } = await supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, company, job_title, next_followup_date, relationship_strength"
      )
      .eq("user_id", userId)
      .eq("is_archived", false)
      .eq("next_followup_date", todayStr)
      .limit(10);

    if (todayFollowups && todayFollowups.length > 0) {
      for (const contact of todayFollowups) {
        const name = formatContactName(contact);

        items.push({
          title: `Follow-up due today: ${name}`,
          description: buildContactDescription(contact),
          urgency: "medium",
          category: "followup_today",
          metadata: {
            contactId: contact.id,
            contactName: name,
            followupDate: contact.next_followup_date,
            relationshipStrength: contact.relationship_strength,
          },
        });
      }
    }

    // Check for cooling relationships (high-value contacts not contacted in 30+ days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: coolingContacts } = await supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, company, job_title, last_contacted_at, relationship_strength"
      )
      .eq("user_id", userId)
      .eq("is_archived", false)
      .gte("relationship_strength", 60)
      .lt("last_contacted_at", thirtyDaysAgo.toISOString())
      .order("relationship_strength", { ascending: false })
      .limit(5);

    if (coolingContacts && coolingContacts.length > 0) {
      for (const contact of coolingContacts) {
        const daysSinceContact = Math.floor(
          (now.getTime() - new Date(contact.last_contacted_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const name = formatContactName(contact);

        items.push({
          title: `Relationship cooling: ${name} (${daysSinceContact}d ago)`,
          description: `${buildContactDescription(contact)} - Last contacted ${daysSinceContact} days ago. Relationship strength: ${contact.relationship_strength}/100.`,
          urgency: daysSinceContact > 60 ? "high" : "medium",
          category: "relationship_cooling",
          metadata: {
            contactId: contact.id,
            contactName: name,
            daysSinceContact,
            relationshipStrength: contact.relationship_strength,
            lastContactedAt: contact.last_contacted_at,
          },
        });
      }
    }

    // Check for upcoming birthdays (next 7 days)
    const birthdayItems = await checkBirthdays(supabase, userId, now);
    items.push(...birthdayItems);

    // Determine overall urgency
    const overdueCount = items.filter(
      (i) => i.category === "followup_overdue"
    ).length;
    const coolingCount = items.filter(
      (i) => i.category === "relationship_cooling"
    ).length;

    let overallUrgency: CheckResult["urgency"] = "low";
    if (overdueCount > 0) overallUrgency = "high";
    else if (coolingCount > 0 || todayFollowups?.length) overallUrgency = "medium";

    let summary = "";
    if (overdueCount > 0) summary += `${overdueCount} overdue follow-up(s). `;
    if (todayFollowups?.length) summary += `${todayFollowups.length} follow-up(s) due today. `;
    if (coolingCount > 0) summary += `${coolingCount} relationship(s) cooling. `;
    if (birthdayItems.length > 0) summary += `${birthdayItems.length} upcoming birthday(s). `;
    if (!summary) summary = "No contacts need attention right now.";

    return {
      type: "contacts",
      items,
      summary: summary.trim(),
      urgency: overallUrgency,
    };
  } catch (error: any) {
    console.error("[ContactChecker] Error checking contacts:", error);
    return {
      type: "contacts",
      items: [],
      summary: `Error checking contacts: ${error.message}`,
      urgency: "low",
    };
  }
}

/**
 * Check for contacts with upcoming birthdays in the next 7 days.
 */
async function checkBirthdays(
  supabase: any,
  userId: string,
  now: Date
): Promise<CheckItem[]> {
  const items: CheckItem[] = [];

  try {
    // Query contacts with birthday field
    // We need to compare month-day regardless of year
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, company, birthday")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .not("birthday", "is", null)
      .limit(100);

    if (!contacts) return items;

    const today = now.getTime();
    const sevenDaysLater = today + 7 * 24 * 60 * 60 * 1000;

    for (const contact of contacts) {
      if (!contact.birthday) continue;

      const birthday = new Date(contact.birthday);
      // Set birthday to this year for comparison
      const thisYearBirthday = new Date(
        now.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );

      const birthdayTime = thisYearBirthday.getTime();

      if (birthdayTime >= today && birthdayTime <= sevenDaysLater) {
        const daysUntil = Math.floor(
          (birthdayTime - today) / (1000 * 60 * 60 * 24)
        );
        const name = formatContactName(contact);

        items.push({
          title: daysUntil === 0
            ? `Birthday today: ${name}!`
            : `Birthday in ${daysUntil} day(s): ${name}`,
          description: `${name}${contact.company ? ` at ${contact.company}` : ""} has a birthday ${daysUntil === 0 ? "today" : `in ${daysUntil} day(s)`}.`,
          urgency: daysUntil <= 1 ? "medium" : "low",
          category: "birthday",
          metadata: {
            contactId: contact.id,
            contactName: name,
            birthday: contact.birthday,
            daysUntil,
          },
        });
      }
    }
  } catch (error) {
    console.debug("[ContactChecker] Birthday check skipped:", error);
  }

  return items;
}

/**
 * Format a contact's full name.
 */
function formatContactName(contact: {
  first_name: string;
  last_name?: string;
}): string {
  return `${contact.first_name}${contact.last_name ? " " + contact.last_name : ""}`;
}

/**
 * Build a brief description for a contact.
 */
function buildContactDescription(contact: {
  first_name: string;
  last_name?: string;
  company?: string;
  job_title?: string;
}): string {
  const parts: string[] = [];
  const name = formatContactName(contact);
  parts.push(name);

  if (contact.job_title && contact.company) {
    parts.push(`${contact.job_title} at ${contact.company}`);
  } else if (contact.company) {
    parts.push(contact.company);
  } else if (contact.job_title) {
    parts.push(contact.job_title);
  }

  return parts.join(" - ");
}
