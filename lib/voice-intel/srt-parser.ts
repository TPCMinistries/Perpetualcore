// SRT (SubRip Subtitle) format parser for Voice Intelligence audio clipping
import type { PropheticWord, BrainActionItem } from "@/lib/voice-intel/types";

// ============================================================
// Types
// ============================================================

export interface SrtEntry {
  index: number;
  startTime: string; // "00:01:23,456"
  endTime: string; // "00:01:45,789"
  startMs: number;
  endMs: number;
  text: string;
}

export interface AudioClipMarker {
  label: string;
  startMs: number;
  endMs: number;
  startTime: string;
  endTime: string;
  text: string;
  type: "prophetic_word" | "key_moment" | "action_item";
}

// ============================================================
// Time Conversion
// ============================================================

/** Convert "HH:MM:SS,mmm" to milliseconds */
export function timeToMs(time: string): number {
  const [hms, ms] = time.split(",");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600000 + m * 60000 + s * 1000 + Number(ms || 0);
}

/** Convert milliseconds to "HH:MM:SS,mmm" format */
export function msToTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "," +
    String(millis).padStart(3, "0")
  );
}

// ============================================================
// SRT Parser
// ============================================================

/** Parse standard SRT format into structured entries */
export function parseSrt(srtContent: string): SrtEntry[] {
  const entries: SrtEntry[] = [];
  // Split on double newline (blank line separates entries), normalize line endings
  const blocks = srtContent.replace(/\r\n/g, "\n").trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1];
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
    );
    if (!timeMatch) continue;

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];
    const text = lines.slice(2).join("\n").trim();

    entries.push({
      index,
      startTime,
      endTime,
      startMs: timeToMs(startTime),
      endMs: timeToMs(endTime),
      text,
    });
  }

  return entries;
}

// ============================================================
// Fuzzy Text Matching
// ============================================================

/** Extract significant words (3+ chars, lowercased) */
function extractWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
}

/** Calculate word overlap ratio between two texts */
function wordOverlap(textA: string, textB: string): number {
  const wordsA = extractWords(textA);
  const wordsB = extractWords(textB);
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let matches = 0;
  Array.from(wordsA).forEach((word) => {
    if (wordsB.has(word)) matches++;
  });

  // Overlap relative to the smaller set
  return matches / Math.min(wordsA.size, wordsB.size);
}

// ============================================================
// Clip Marker Finders
// ============================================================

const CLIP_PADDING_MS = 3000; // 3 seconds before/after
const MATCH_THRESHOLD = 0.4; // 40% word overlap required

/** Merge overlapping clip markers into continuous clips */
function mergeOverlapping(markers: AudioClipMarker[]): AudioClipMarker[] {
  if (markers.length <= 1) return markers;

  const sorted = [...markers].sort((a, b) => a.startMs - b.startMs);
  const merged: AudioClipMarker[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = merged[merged.length - 1];

    if (current.startMs <= prev.endMs) {
      // Overlapping — merge
      prev.endMs = Math.max(prev.endMs, current.endMs);
      prev.endTime = msToTime(prev.endMs);
      prev.text += "\n\n" + current.text;
      prev.label += " + " + current.label;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Find audio clip markers for prophetic words by matching SRT text
 */
export function findClipMarkers(
  srtEntries: SrtEntry[],
  propheticWords: PropheticWord[]
): AudioClipMarker[] {
  const markers: AudioClipMarker[] = [];

  for (const pw of propheticWords) {
    // If the prophetic word has explicit SRT timestamps, use them
    if (pw.srt_start && pw.srt_end) {
      const startMs = Math.max(0, timeToMs(pw.srt_start) - CLIP_PADDING_MS);
      const endMs = timeToMs(pw.srt_end) + CLIP_PADDING_MS;
      markers.push({
        label: `Prophetic word for ${pw.recipient}`,
        startMs,
        endMs,
        startTime: msToTime(startMs),
        endTime: msToTime(endMs),
        text: pw.content,
        type: "prophetic_word",
      });
      continue;
    }

    // Fuzzy match — find SRT entries that match the prophetic content
    let bestScore = 0;
    let bestEntryIdx = -1;

    for (let i = 0; i < srtEntries.length; i++) {
      const score = wordOverlap(pw.content, srtEntries[i].text);
      if (score > bestScore) {
        bestScore = score;
        bestEntryIdx = i;
      }
    }

    if (bestScore >= MATCH_THRESHOLD && bestEntryIdx >= 0) {
      const entry = srtEntries[bestEntryIdx];
      const startMs = Math.max(0, entry.startMs - CLIP_PADDING_MS);
      const endMs = entry.endMs + CLIP_PADDING_MS;

      markers.push({
        label: `Prophetic word for ${pw.recipient}`,
        startMs,
        endMs,
        startTime: msToTime(startMs),
        endTime: msToTime(endMs),
        text: entry.text,
        type: "prophetic_word",
      });
    }
  }

  return mergeOverlapping(markers);
}

/**
 * Find key moments in SRT entries matching red-tier action items
 */
export function findKeyMoments(
  srtEntries: SrtEntry[],
  actionItems: BrainActionItem[]
): AudioClipMarker[] {
  const markers: AudioClipMarker[] = [];
  const redItems = actionItems.filter((item) => item.tier === "red");

  for (const item of redItems) {
    let bestScore = 0;
    let bestEntryIdx = -1;

    for (let i = 0; i < srtEntries.length; i++) {
      const score = wordOverlap(item.title, srtEntries[i].text);
      if (score > bestScore) {
        bestScore = score;
        bestEntryIdx = i;
      }
    }

    if (bestScore >= MATCH_THRESHOLD && bestEntryIdx >= 0) {
      const entry = srtEntries[bestEntryIdx];
      const startMs = Math.max(0, entry.startMs - CLIP_PADDING_MS);
      const endMs = entry.endMs + CLIP_PADDING_MS;

      markers.push({
        label: `Action: ${item.title}`,
        startMs,
        endMs,
        startTime: msToTime(startMs),
        endTime: msToTime(endMs),
        text: entry.text,
        type: "action_item",
      });
    }
  }

  return mergeOverlapping(markers);
}
