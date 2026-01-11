import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Discover potential contacts from emails (senders with 3+ emails not yet in contacts)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all existing contact emails (lowercase for comparison)
    const { data: contacts } = await supabase
      .from("contacts")
      .select("email")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .not("email", "is", null);

    const existingEmails = new Set(
      (contacts || []).map((c) => c.email?.toLowerCase()).filter(Boolean)
    );

    // Get email senders with counts
    const { data: emailSenders } = await supabase
      .from("emails")
      .select("from_email, from_name")
      .eq("user_id", user.id)
      .eq("is_spam", false)
      .not("from_email", "is", null);

    // Count emails per sender
    const senderCounts: Record<string, { count: number; name: string; emails: string[] }> = {};

    for (const email of emailSenders || []) {
      const senderEmail = email.from_email?.toLowerCase();
      if (!senderEmail) continue;

      // Skip if already a contact
      if (existingEmails.has(senderEmail)) continue;

      // Skip common no-reply addresses
      if (
        senderEmail.includes("noreply") ||
        senderEmail.includes("no-reply") ||
        senderEmail.includes("notifications") ||
        senderEmail.includes("mailer-daemon") ||
        senderEmail.includes("postmaster")
      ) {
        continue;
      }

      if (!senderCounts[senderEmail]) {
        senderCounts[senderEmail] = {
          count: 0,
          name: email.from_name || "",
          emails: [],
        };
      }
      senderCounts[senderEmail].count++;
      if (email.from_name && !senderCounts[senderEmail].name) {
        senderCounts[senderEmail].name = email.from_name;
      }
    }

    // Filter to senders with 1+ emails and sort by count (show all unique senders)
    const suggestions = Object.entries(senderCounts)
      .filter(([_, data]) => data.count >= 1)
      .map(([email, data]) => ({
        email,
        name: data.name,
        email_count: data.count,
        company: email.split("@")[1]?.split(".")[0] || null,
        domain: email.split("@")[1] || null,
      }))
      .sort((a, b) => b.email_count - a.email_count)
      .slice(0, 50);

    // Get first and last email dates for each suggestion
    const suggestionsWithDates = await Promise.all(
      suggestions.map(async (s) => {
        const { data: firstEmail } = await supabase
          .from("emails")
          .select("sent_at")
          .eq("user_id", user.id)
          .ilike("from_email", s.email)
          .order("sent_at", { ascending: true })
          .limit(1)
          .single();

        const { data: lastEmail } = await supabase
          .from("emails")
          .select("sent_at")
          .eq("user_id", user.id)
          .ilike("from_email", s.email)
          .order("sent_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...s,
          first_email_date: firstEmail?.sent_at || null,
          last_email_date: lastEmail?.sent_at || null,
        };
      })
    );

    return NextResponse.json({
      suggestions: suggestionsWithDates,
      total_unique_senders: Object.keys(senderCounts).length,
      existing_contacts: existingEmails.size,
    });
  } catch (error) {
    console.error("Error discovering contacts from emails:", error);
    return NextResponse.json(
      { error: "Failed to discover contacts" },
      { status: 500 }
    );
  }
}

// POST - Create contacts from email senders
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { senders } = body; // Array of { email, name, company? }

    if (!senders || !Array.isArray(senders) || senders.length === 0) {
      return NextResponse.json({ error: "No senders provided" }, { status: 400 });
    }

    const createdContacts = [];
    const errors = [];

    for (const sender of senders) {
      if (!sender.email) continue;

      // Parse name into first/last - use email prefix as fallback
      const nameParts = (sender.name || "").trim().split(" ");
      const firstName = nameParts[0] || sender.email.split("@")[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      try {
        // Minimal insert - just email, user_id, and first_name
        // User can fill in additional details later or use AI enrichment
        const { data: contact, error } = await supabase
          .from("contacts")
          .insert({
            user_id: user.id,
            email: sender.email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            source: "email_discovery",
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            errors.push({ email: sender.email, error: "Contact already exists" });
          } else {
            errors.push({ email: sender.email, error: error.message });
          }
        } else {
          createdContacts.push(contact);

          // Link existing emails to this contact
          await supabase
            .from("emails")
            .update({ contact_id: contact.id })
            .eq("user_id", user.id)
            .ilike("from_email", sender.email)
            .is("contact_id", null);
        }
      } catch (e) {
        errors.push({ email: sender.email, error: "Unknown error" });
      }
    }

    return NextResponse.json({
      created_count: createdContacts.length,
      contacts: createdContacts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error creating contacts from emails:", error);
    return NextResponse.json(
      { error: "Failed to create contacts" },
      { status: 500 }
    );
  }
}
