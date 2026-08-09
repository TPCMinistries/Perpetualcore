import { NextRequest, NextResponse } from "next/server";
import { PressHttpError } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { updateTranscriptSchema } from "@/lib/press/schemas";
import { requireProject, rows } from "@/lib/press/service";
import type { PressTranscript, PressTranscriptSegment } from "@/lib/press/types";

export const runtime = "nodejs";

async function loadTranscript(projectId: string): Promise<PressTranscript | null> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_transcripts").select("*")
    .eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const transcript = data as unknown as PressTranscript;
  const { data: segmentData, error: segmentError } = await admin.from("press_transcript_segments")
    .select("*").eq("transcript_id", transcript.id).order("start_ms", { ascending: true });
  if (segmentError) throw segmentError;
  transcript.segments = rows<PressTranscriptSegment>(segmentData);
  return transcript;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const transcript = await loadTranscript(project.id);
    if (!transcript) throw new PressHttpError(404, "Transcript not found");
    return NextResponse.json({ transcript });
  } catch (error) { return pressErrorResponse(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const input = updateTranscriptSchema.parse(await request.json());
    const current = await loadTranscript(project.id);
    if (!current) throw new PressHttpError(404, "Transcript not found");
    if (current.version !== input.version) {
      return NextResponse.json({ error: "Transcript changed", currentVersion: current.version }, { status: 409 });
    }
    const admin = createPressAdminClient();
    const { data: updatedRows, error: updateError } = await admin.rpc("press_update_transcript", {
      p_transcript_id: current.id,
      p_expected_version: input.version,
      p_full_text: input.fullText,
      p_segments: input.segments,
    });
    if (updateError) throw updateError;
    if (!updatedRows?.[0]) return NextResponse.json({ error: "Transcript changed" }, { status: 409 });
    return NextResponse.json({ transcript: await loadTranscript(project.id) });
  } catch (error) { return pressErrorResponse(error); }
}
