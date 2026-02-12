import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { classifyVoiceMemo } from "@/lib/voice-intel/classifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Resolve user ID from either cookie auth or API key (for Zapier/external)
 */
async function resolveUserId(req: NextRequest): Promise<string | null> {
  // Check for API key auth (Zapier, external integrations)
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const apiKey = process.env.VOICE_INTEL_API_KEY;
    if (apiKey && token === apiKey) {
      // API key auth — use LORENZO_USER_ID
      return process.env.LORENZO_USER_ID || null;
    }
  }

  // Fall back to cookie-based auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * POST - Upload a transcript directly (paste or .txt file) and classify it
 * Supports cookie auth (dashboard) or Bearer token (Zapier/external)
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let transcript: string;
    let title: string | undefined;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // FormData with .txt file
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      transcript = await file.text();
    } else {
      // JSON body
      const body = await req.json();
      transcript = body.transcript;
      title = body.title;
    }

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript text is required" },
        { status: 400 }
      );
    }

    // Create voice memo record with admin client for reliability
    const adminSupabase = createAdminClient();
    const memoTitle = title || `Transcript ${new Date().toLocaleString()}`;

    const { data: memo, error: insertError } = await adminSupabase
      .from("voice_memos")
      .insert({
        user_id: userId,
        title: memoTitle,
        transcript: transcript.trim(),
        source: "transcript_paste",
        processing_status: "completed",
        classification_status: "pending",
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !memo) {
      console.error("Upload transcript: insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create voice memo" },
        { status: 500 }
      );
    }

    // Run Brain classification immediately
    const result = await classifyVoiceMemo(
      memo.id,
      userId,
      transcript.trim(),
      memoTitle
    );

    // Fetch updated memo
    const { data: updatedMemo } = await adminSupabase
      .from("voice_memos")
      .select("*")
      .eq("id", memo.id)
      .single();

    return NextResponse.json(
      {
        memo: updatedMemo || memo,
        classification: result.classification,
        actions: result.actions,
        discoveries: result.discoveries,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload transcript error:", error);
    return NextResponse.json(
      { error: "Failed to process transcript" },
      { status: 500 }
    );
  }
}
