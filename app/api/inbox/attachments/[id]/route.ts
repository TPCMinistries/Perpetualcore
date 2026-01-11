import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadGmailAttachment } from "@/lib/email/gmail";

// GET /api/inbox/attachments/[id] - Download attachment
export async function GET(
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

    // Get attachment metadata
    const { data: attachment, error: attachmentError } = await supabase
      .from("email_attachments")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
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

    // Return file as download
    return new Response(result.data, {
      headers: {
        "Content-Type": attachment.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": result.data.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download attachment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
