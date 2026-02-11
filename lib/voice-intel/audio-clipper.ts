// Audio Clipping Service for Voice Intelligence
// Serverless-compatible: uses timestamp markers + signed URLs instead of ffmpeg
import { createAdminClient } from "@/lib/supabase/server";
import {
  parseSrt,
  findClipMarkers,
  findKeyMoments,
  type AudioClipMarker,
} from "@/lib/voice-intel/srt-parser";

/**
 * Generate a URL to the clips API endpoint with query params.
 * Frontend uses this to request clip metadata or a signed audio URL.
 */
export function generateClipUrl(
  memoId: string,
  startMs: number,
  endMs: number
): string {
  return `/api/voice-intel/clips?memo=${encodeURIComponent(memoId)}&start=${startMs}&end=${endMs}`;
}

/**
 * Get all audio clip markers for a voice memo.
 * Parses SRT transcript and matches against prophetic words + action items.
 */
export async function getClipMarkersForMemo(
  memoId: string,
  userId: string
): Promise<AudioClipMarker[]> {
  const supabase = createAdminClient();

  // 1. Fetch the voice memo's SRT transcript
  const { data: memo, error: memoError } = await supabase
    .from("voice_memos")
    .select("srt_transcript")
    .eq("id", memoId)
    .eq("user_id", userId)
    .single();

  if (memoError || !memo?.srt_transcript) {
    return [];
  }

  // 2. Fetch classification for this memo
  const { data: classification, error: classError } = await supabase
    .from("voice_intel_classifications")
    .select("prophetic_words, action_items")
    .eq("voice_memo_id", memoId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (classError || !classification) {
    return [];
  }

  // 3. Parse SRT
  const srtEntries = parseSrt(memo.srt_transcript);
  if (srtEntries.length === 0) return [];

  // 4. Find prophetic word clips
  const propheticClips = findClipMarkers(
    srtEntries,
    classification.prophetic_words || []
  );

  // 5. Find key moment clips (red-tier action items)
  const keyMomentClips = findKeyMoments(
    srtEntries,
    classification.action_items || []
  );

  // 6. Combine and sort by start time
  const allClips = [...propheticClips, ...keyMomentClips].sort(
    (a, b) => a.startMs - b.startMs
  );

  return allClips;
}

/**
 * Auto-generate clip markers for a memo and store them in the classification metadata.
 */
export async function autoGenerateClipMarkers(
  memoId: string,
  userId: string
): Promise<void> {
  const markers = await getClipMarkersForMemo(memoId, userId);

  if (markers.length === 0) {
    console.log(`Audio clipper: no clip markers found for memo ${memoId}`);
    return;
  }

  const supabase = createAdminClient();

  // Fetch current brain_raw_output to merge clip_markers into it
  const { data: classification } = await supabase
    .from("voice_intel_classifications")
    .select("id, brain_raw_output")
    .eq("voice_memo_id", memoId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!classification) return;

  const updatedOutput = {
    ...(classification.brain_raw_output as Record<string, unknown>),
    clip_markers: markers,
  };

  await supabase
    .from("voice_intel_classifications")
    .update({ brain_raw_output: updatedOutput })
    .eq("id", classification.id);

  console.log(
    `Audio clipper: generated ${markers.length} clip markers for memo ${memoId}`
  );
}
