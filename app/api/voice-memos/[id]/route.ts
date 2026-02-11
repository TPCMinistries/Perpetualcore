import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch a single voice memo
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: memo, error } = await supabase
      .from("voice_memos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !memo) {
      return NextResponse.json(
        { error: "Voice memo not found" },
        { status: 404 }
      );
    }

    // Generate signed URL for audio playback
    let audioSignedUrl = null;
    if (memo.audio_url) {
      const { data: signedData } = await supabase.storage
        .from("voice-memos")
        .createSignedUrl(memo.audio_url, 3600); // 1 hour expiry
      audioSignedUrl = signedData?.signedUrl || null;
    }

    return NextResponse.json({
      memo: { ...memo, audio_signed_url: audioSignedUrl },
    });
  } catch (error) {
    console.error("Voice memo GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice memo" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a voice memo (title, project_tags, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Only allow safe fields to be updated
    const allowedFields = [
      "title",
      "project_tags",
      "converted_to_meeting_id",
      "converted_to_task_id",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: memo, error } = await supabase
      .from("voice_memos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Voice memo update error:", error);
      return NextResponse.json(
        { error: "Failed to update voice memo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ memo });
  } catch (error) {
    console.error("Voice memo PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update voice memo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a voice memo and its audio file
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get memo to find audio file path
    const { data: memo } = await supabase
      .from("voice_memos")
      .select("audio_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!memo) {
      return NextResponse.json(
        { error: "Voice memo not found" },
        { status: 404 }
      );
    }

    // Delete audio file from storage
    if (memo.audio_url) {
      await supabase.storage.from("voice-memos").remove([memo.audio_url]);
    }

    // Delete database record
    const { error } = await supabase
      .from("voice_memos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Voice memo delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete voice memo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voice memo DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete voice memo" },
      { status: 500 }
    );
  }
}
