import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmailDraft, sendGmailMessage } from "@/lib/email/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch user's drafts
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = supabase
      .from("email_drafts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: drafts, error } = await query;

    if (error) {
      console.error("Drafts fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch drafts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ drafts: drafts || [], count: drafts?.length || 0 });
  } catch (error) {
    console.error("Drafts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate new draft with AI or send existing draft
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

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

    const { data: emailAccount } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .single();

    if (!emailAccount) {
      return NextResponse.json(
        { error: "No email account connected" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Check if this is a send request
    if (body.action === "send" && body.draftId) {
      // Fetch draft
      const { data: draft } = await supabase
        .from("email_drafts")
        .select("*")
        .eq("id", body.draftId)
        .eq("user_id", user.id)
        .single();

      if (!draft) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }

      // Send email
      const result = await sendGmailMessage(user.id, {
        to: draft.to_emails,
        cc: draft.cc_emails,
        bcc: draft.bcc_emails,
        subject: draft.subject,
        body: draft.body_text,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send" },
          { status: 500 }
        );
      }

      // Update draft status
      await supabase
        .from("email_drafts")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", body.draftId);

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    }

    // Generate new draft with AI
    const { prompt, recipient, inReplyToEmailId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get context from reply-to email if provided
    let context: any = { recipient };

    if (inReplyToEmailId) {
      const { data: originalEmail } = await supabase
        .from("emails")
        .select("*")
        .eq("id", inReplyToEmailId)
        .single();

      if (originalEmail) {
        context.inReplyTo = originalEmail.body_text || originalEmail.snippet;
        context.subject = `Re: ${originalEmail.subject}`;
        context.recipient = originalEmail.from_email;
      }
    }

    // Generate draft with AI
    const generated = await generateEmailDraft(prompt, context);

    // Save draft to database
    const { data: draft, error: draftError } = await supabase
      .from("email_drafts")
      .insert({
        email_account_id: emailAccount.id,
        organization_id: profile.organization_id,
        user_id: user.id,
        in_reply_to_email_id: inReplyToEmailId || null,
        to_emails: recipient ? [recipient] : [],
        subject: generated.subject,
        body_text: generated.body_text,
        body_html: generated.body_html,
        ai_generated: true,
        ai_prompt: prompt,
        ai_model: "gpt-4o",
        status: "draft",
      })
      .select()
      .single();

    if (draftError) {
      console.error("Error saving draft:", draftError);
      return NextResponse.json(
        { error: "Failed to save draft" },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Drafts POST error:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update draft
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Draft ID required" },
        { status: 400 }
      );
    }

    // Handle approval
    if (updates.status === "approved") {
      updates.approved_at = new Date().toISOString();
    }

    const { data: draft, error } = await supabase
      .from("email_drafts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Draft update error:", error);
      return NextResponse.json(
        { error: "Failed to update draft" },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Drafts PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete draft
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Draft ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("email_drafts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Draft delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete draft" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Drafts DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
