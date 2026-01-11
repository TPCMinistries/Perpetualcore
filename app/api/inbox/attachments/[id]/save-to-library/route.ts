import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadGmailAttachment } from "@/lib/email/gmail";
import { logActivity } from "@/lib/activity-logger";

// POST /api/inbox/attachments/[id]/save-to-library - Save attachment to document library
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for organization_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const organizationId = profile?.organization_id || user.id;

    // Get attachment metadata
    const { data: attachment, error: attachmentError } = await supabase
      .from("email_attachments")
      .select("*, emails(subject, from_email)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    if (attachment.document_id) {
      return NextResponse.json(
        { error: "Already saved to library", document_id: attachment.document_id },
        { status: 400 }
      );
    }

    // Download from Gmail
    const result = await downloadGmailAttachment(
      user.id,
      attachment.message_id,
      attachment.provider_attachment_id
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to download" },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = attachment.filename.split(".").pop();
    const uniqueFilename = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(uniqueFilename, result.data, {
        contentType: attachment.mime_type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload to storage" },
        { status: 500 }
      );
    }

    // Create document record
    const emailInfo = attachment.emails as { subject?: string; from_email?: string } | null;
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        title: attachment.filename,
        content: "",
        file_url: uploadData.path,
        file_type: attachment.mime_type,
        file_size: attachment.size_bytes,
        status: "processing",
        metadata: {
          source: "email_attachment",
          email_subject: emailInfo?.subject || null,
          email_from: emailInfo?.from_email || null,
          attachment_id: attachment.id,
        },
      })
      .select()
      .single();

    if (docError) {
      console.error("Document creation error:", docError);
      await supabase.storage.from("documents").remove([uniqueFilename]);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    // Update attachment record with document reference
    await supabase
      .from("email_attachments")
      .update({
        document_id: document.id,
        saved_to_library_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Process document (async - don't wait)
    try {
      const { processAndStoreDocument } = await import("@/lib/documents/processor");
      processAndStoreDocument(document.id).catch(console.error);
    } catch (e) {
      // Processing is optional
    }

    // Log activity
    await logActivity({
      supabase,
      userId: user.id,
      action: "uploaded",
      entityType: "document",
      entityId: document.id,
      entityName: document.title,
      metadata: {
        source: "email_attachment",
        fileType: attachment.mime_type,
        fileSize: attachment.size_bytes,
      },
    });

    return NextResponse.json({
      success: true,
      document_id: document.id,
      message: "Attachment saved to library",
    });
  } catch (error) {
    console.error("Save to library error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
