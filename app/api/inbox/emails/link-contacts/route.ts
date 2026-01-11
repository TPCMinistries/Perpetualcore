import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/inbox/emails/link-contacts - Bulk link emails to contacts by email address
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the bulk link function
    const { data, error } = await supabase.rpc("bulk_link_emails_to_contacts", {
      for_user_id: user.id,
    });

    if (error) {
      // If function doesn't exist, do it manually
      if (error.code === "42883") {
        // Manual bulk update
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id, email")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .not("email", "is", null);

        if (!contacts || contacts.length === 0) {
          return NextResponse.json({
            linked_count: 0,
            message: "No contacts with emails found",
          });
        }

        let linkedCount = 0;
        for (const contact of contacts) {
          const { count } = await supabase
            .from("emails")
            .update({ contact_id: contact.id })
            .eq("user_id", user.id)
            .is("contact_id", null)
            .eq("from_email", contact.email)
            .select("id", { count: "exact", head: true });

          linkedCount += count || 0;
        }

        return NextResponse.json({
          linked_count: linkedCount,
          message: `Linked ${linkedCount} emails to contacts`,
        });
      }
      throw error;
    }

    return NextResponse.json({
      linked_count: data || 0,
      message: `Linked ${data || 0} emails to contacts`,
    });
  } catch (error) {
    console.error("Bulk link contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/inbox/emails/link-contacts - Get stats on unlinked emails
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count emails without contact links
    const { count: unlinkedCount } = await supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("contact_id", null);

    // Count emails with contact links
    const { count: linkedCount } = await supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("contact_id", "is", null);

    // Count unique senders that could be matched to contacts
    const { data: matchableEmails } = await supabase
      .from("emails")
      .select("from_email")
      .eq("user_id", user.id)
      .is("contact_id", null);

    const { data: contacts } = await supabase
      .from("contacts")
      .select("email")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .not("email", "is", null);

    const contactEmails = new Set(contacts?.map((c) => c.email?.toLowerCase()) || []);
    const matchableCount = new Set(
      matchableEmails
        ?.filter((e) => contactEmails.has(e.from_email?.toLowerCase()))
        .map((e) => e.from_email?.toLowerCase())
    ).size;

    return NextResponse.json({
      unlinked_emails: unlinkedCount || 0,
      linked_emails: linkedCount || 0,
      matchable_senders: matchableCount,
    });
  } catch (error) {
    console.error("Get link stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
