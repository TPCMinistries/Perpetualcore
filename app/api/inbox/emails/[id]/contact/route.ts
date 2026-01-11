import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inbox/emails/[id]/contact - Get contact linked to email
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get email with contact info
    const { data: email, error } = await supabase
      .from("emails")
      .select(`
        id,
        from_email,
        from_name,
        contact_id,
        contacts (
          id,
          full_name,
          email,
          company,
          job_title,
          avatar_url,
          relationship_strength
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // If no contact linked, try to find matching contacts by email address
    let suggestedContacts: any[] = [];
    if (!email.contact_id) {
      const { data: matches } = await supabase
        .from("contacts")
        .select("id, full_name, email, company, avatar_url")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .ilike("email", email.from_email)
        .limit(5);

      suggestedContacts = matches || [];
    }

    return NextResponse.json({
      email_id: email.id,
      from_email: email.from_email,
      from_name: email.from_name,
      contact: email.contacts || null,
      suggested_contacts: suggestedContacts,
    });
  } catch (error) {
    console.error("Get email contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/inbox/emails/[id]/contact - Link email to contact
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contact_id } = body;

    if (!contact_id) {
      return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
    }

    // Verify contact belongs to user
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contact_id)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Update email with contact link
    const { data: email, error } = await supabase
      .from("emails")
      .update({ contact_id })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(`
        id,
        contact_id,
        contacts (
          id,
          full_name,
          email,
          company
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ email, message: "Contact linked successfully" });
  } catch (error) {
    console.error("Link email to contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inbox/emails/[id]/contact - Unlink email from contact
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("emails")
      .update({ contact_id: null })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Contact unlinked" });
  } catch (error) {
    console.error("Unlink email from contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
