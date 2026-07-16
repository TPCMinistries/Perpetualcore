#!/usr/bin/env tsx

/**
 * Press queue consumer for probing, transcription, clip scoring, and rendering.
 * The API leases one job at a time and supplies only short-lived, job-scoped
 * source and output URLs. Progress and validated results return through the
 * worker report endpoint; this process never receives Supabase credentials.
 */

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

type SupportedJobType = "probe_media" | "transcribe_media" | "score_clips" | "render_clip";

interface InputSegment {
  id?: string;
  startMs: number;
  endMs: number;
  speaker?: string | null;
  text: string;
  confidence?: number | null;
}

interface ClaimedJob {
  id: string;
  job_type: SupportedJobType;
  input: {
    sourceUrl: string | null;
    sourceExpiresAt: string | null;
    transcript?: { id: string; fullText: string; language: string | null; version: number; segments: InputSegment[] } | null;
    generation?: {
      id: string;
      recipe: "authentic_clip_pack";
      provider: "internal";
      title: string;
      brief: string;
      config: Record<string, unknown>;
    } | null;
    transcriptSegments?: InputSegment[];
    clip?: { id: string; startMs: number; endMs: number; title: string; hook?: string | null; summary?: string | null } | null;
    render?: { id: string; aspectRatio: "9:16" | "1:1" | "16:9"; template?: string | null; captionStyle?: string | null; settings?: Record<string, unknown> } | null;
    outputUpload: { bucket: string; path: string; token: string; uploadUrl: string } | null;
    artifactUploads?: Array<{
      assetId: string;
      kind: "proxy" | "poster" | "waveform";
      bucket: string;
      path: string;
      uploadUrl: string;
      mimeType: string;
    }>;
  };
}

interface WhisperJson {
  text?: string;
  language?: string;
  segments?: Array<{
    start?: number;
    end?: number;
    text?: string;
  }>;
}

const apiBase = (process.env.PRESS_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const workerSecret = process.env.PRESS_WORKER_SECRET ?? "";
const workerId = process.env.PRESS_WORKER_ID ?? `press-local-${process.pid}`;
const pollMs = Number(process.env.PRESS_WORKER_POLL_MS ?? "5000");
const once = process.argv.includes("--once");

function run(command: string, args: string[], cwd?: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise(stdout);
      else reject(new Error(`${basename(command)} exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

async function api<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${workerSecret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    throw new Error(`Press API ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

async function report(
  jobId: string,
  body: Record<string, unknown>,
): Promise<void> {
  await api(`/api/press/worker/jobs/${encodeURIComponent(jobId)}/report`, {
    workerId,
    ...body,
  });
}

async function downloadSource(url: string, target: string): Promise<void> {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15 * 60_000) });
  if (!response.ok || !response.body) throw new Error(`Source download failed (${response.status})`);
  await pipeline(
    Readable.fromWeb(response.body as import("node:stream/web").ReadableStream),
    createWriteStream(target, { mode: 0o600 }),
  );
}

function scoreTranscript(
  segments: InputSegment[],
  generation?: ClaimedJob["input"]["generation"],
): Array<Record<string, unknown>> {
  const configuredMin = Number(generation?.config.targetMinSeconds);
  const configuredMax = Number(generation?.config.targetMaxSeconds);
  const configuredCount = Number(generation?.config.clipCount);
  const minDurationMs = Number.isFinite(configuredMin) ? Math.max(10, configuredMin) * 1000 : 18_000;
  const maxDurationMs = Number.isFinite(configuredMax) ? Math.min(120, configuredMax) * 1000 : 60_000;
  const maxClips = Number.isFinite(configuredCount) ? Math.min(12, Math.max(3, configuredCount)) : 10;
  const briefKeywords = (generation?.brief ?? "").toLowerCase().match(/[a-z0-9]{5,}/g)?.slice(0, 20) ?? [];
  const candidates: InputSegment[][] = [];
  for (let start = 0; start < segments.length; start += 1) {
    const group: InputSegment[] = [];
    for (let index = start; index < segments.length; index += 1) {
      group.push(segments[index]);
      const duration = segments[index].endMs - segments[start].startMs;
      if (duration >= minDurationMs) {
        if (duration <= maxDurationMs) candidates.push(group.slice());
        break;
      }
      if (duration > maxDurationMs) break;
    }
  }
  if (!candidates.length && segments.length) candidates.push(segments.slice(0, 20));

  const scored = candidates.map((group) => {
    const text = group.map((segment) => segment.text.trim()).join(" ").trim();
    const durationSeconds = (group[group.length - 1].endMs - group[0].startMs) / 1000;
    const hookSignals = [/[?!]/, /\b(how|why|what|secret|mistake|never|best|first)\b/i, /\d/]
      .filter((pattern) => pattern.test(text)).length;
    const hook = Math.min(100, 40 + hookSignals * 20);
    const durationFit = Math.max(0, 100 - Math.abs(durationSeconds - 32) * 3);
    const words = text.split(/\s+/).filter(Boolean).length;
    const clarity = Math.min(100, Math.max(0, 100 - Math.abs(words / durationSeconds - 2.4) * 35));
    const standalone = /^[A-Z0-9]/.test(text) && /[.!?]$/.test(text) ? 100 : 65;
    const confidenceValues = group
      .map((segment) => segment.confidence)
      .filter((value): value is number => typeof value === "number");
    const confidence = confidenceValues.length
      ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length * 100)
      : 70;
    const normalizedText = text.toLowerCase();
    const keywordMatches = briefKeywords.filter((keyword) => normalizedText.includes(keyword)).length;
    const editorialRelevance = briefKeywords.length
      ? Math.min(100, 45 + keywordMatches * 15)
      : 70;
    const scores = {
      hook: Math.round(hook),
      duration_fit: Math.round(durationFit),
      clarity: Math.round(clarity),
      standalone,
      transcript_confidence: confidence,
      editorial_relevance: editorialRelevance,
    };
    const score = Math.round(
      scores.hook * 0.25 + scores.duration_fit * 0.2 + scores.clarity * 0.15
      + scores.standalone * 0.15 + scores.transcript_confidence * 0.1
      + scores.editorial_relevance * 0.15,
    );
    const firstSentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
    return {
      startMs: group[0].startMs,
      endMs: group[group.length - 1].endMs,
      title: firstSentence.slice(0, 180),
      hook: firstSentence.slice(0, 500),
      summary: text.slice(0, 2000),
      score,
      scores,
    };
  }).sort((left, right) => Number(right.score) - Number(left.score));

  const selected: Array<Record<string, unknown>> = [];
  for (const candidate of scored) {
    const overlaps = selected.some((existing) =>
      Number(candidate.startMs) < Number(existing.endMs)
      && Number(candidate.endMs) > Number(existing.startMs));
    if (!overlaps) selected.push(candidate);
    if (selected.length === maxClips) break;
  }
  return selected;
}

function srtTime(milliseconds: number): string {
  const safe = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const millis = safe % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

async function uploadFile(url: string, path: string, contentType: string): Promise<void> {
  const body = Readable.toWeb(createReadStream(path)) as BodyInit;
  const init: RequestInit & { duplex: "half" } = {
    method: "PUT",
    headers: { "content-type": contentType, "x-upsert": "true" },
    body,
    duplex: "half",
    signal: AbortSignal.timeout(15 * 60_000),
  };
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Artifact upload failed (${response.status})`);
}

async function sha256(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function processJob(job: ClaimedJob): Promise<Record<string, unknown>> {
  if (job.job_type === "score_clips") {
    if (!job.input.transcript) throw new Error("Claim did not include transcript input");
    return { clips: scoreTranscript(job.input.transcript.segments, job.input.generation) };
  }
  if (!job.input.sourceUrl) throw new Error("Claim did not include a signed source URL");
  const workDir = await mkdtemp(join(tmpdir(), `press-${job.id}-`));
  try {
    const sourcePath = join(workDir, "source-media");
    await downloadSource(job.input.sourceUrl, sourcePath);
    await report(job.id, { status: "processing", progress: 10 });

    const probeRaw = await run("ffprobe", [
      "-v", "error", "-show_format", "-show_streams", "-of", "json", sourcePath,
    ]);
    const probe = JSON.parse(probeRaw) as {
      format?: { duration?: string; format_name?: string };
      streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }>;
    };
    const video = probe.streams?.find((stream) => stream.codec_type === "video");
    const audio = probe.streams?.find((stream) => stream.codec_type === "audio");
    if (job.job_type === "probe_media") {
      return {
        durationSeconds: Number(probe.format?.duration ?? 0) || undefined,
        width: video?.width,
        height: video?.height,
        codec: video?.codec_name ?? audio?.codec_name,
        metadata: { format: probe.format?.format_name ?? null },
      };
    }

    if (job.job_type === "render_clip") {
      if (!job.input.clip || !job.input.render || !job.input.outputUpload) {
        throw new Error("Render claim is missing clip, render, or output upload input");
      }
      const { clip, render, outputUpload } = job.input;
      const target = render.aspectRatio === "9:16"
        ? { width: 1080, height: 1920 }
        : render.aspectRatio === "1:1"
          ? { width: 1080, height: 1080 }
          : { width: 1920, height: 1080 };
      const filters: string[] = [];
      const focalPoint = {
        x: clampNumber(render.settings?.focalPoint, "x", 0.5),
        y: clampNumber(render.settings?.focalPoint, "y", 0.5),
      };
      const captionPosition = render.settings?.captionPosition === "top"
        ? "top"
        : render.settings?.captionPosition === "center"
          ? "center"
          : "bottom";
      const captionSegments = (job.input.transcriptSegments ?? []).filter(
        (segment) => segment.endMs > clip.startMs && segment.startMs < clip.endMs,
      );
      filters.push(
        `scale=${target.width}:${target.height}:force_original_aspect_ratio=increase`,
        `crop=${target.width}:${target.height}:(iw-ow)*${focalPoint.x.toFixed(3)}:(ih-oh)*${focalPoint.y.toFixed(3)}`,
      );
      if (captionSegments.length && render.captionStyle !== "none") {
        const srt = captionSegments.map((segment, index) => {
          const start = Math.max(segment.startMs, clip.startMs) - clip.startMs;
          const end = Math.min(segment.endMs, clip.endMs) - clip.startMs;
          const clean = segment.text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          return `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${clean}\n`;
        }).join("\n");
        await writeFile(join(workDir, "captions.srt"), srt, { encoding: "utf8", mode: 0o600 });
        const style = captionAssStyle(render.captionStyle ?? "minimal", captionPosition);
        filters.push(`subtitles=captions.srt:force_style='${style}'`);
      }
      const outputPath = join(workDir, "render.mp4");
      await run("ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-y",
        "-ss", String(clip.startMs / 1000), "-i", sourcePath,
        "-t", String((clip.endMs - clip.startMs) / 1000),
        "-map", "0:v:0", "-map", "0:a?", "-vf", filters.join(","),
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outputPath,
      ], workDir);
      await report(job.id, { status: "processing", progress: 85 });
      await uploadFile(outputUpload.uploadUrl, outputPath, "video/mp4");
      return { outputBucket: outputUpload.bucket, outputPath: outputUpload.path };
    }

    const preparedDir = join(workDir, "prepared");
    const tsx = join(process.cwd(), "node_modules", ".bin", "tsx");
    await run(tsx, [
      "scripts/press/media-worker.ts",
      "--input", sourcePath,
      "--output-dir", preparedDir,
      "--model", process.env.PRESS_WHISPER_MODEL ?? "small",
      ...(process.env.PRESS_WHISPER_LANGUAGE
        ? ["--language", process.env.PRESS_WHISPER_LANGUAGE]
        : []),
    ]);
    const whisper = JSON.parse(
      await readFile(join(preparedDir, "audio-16k-mono.json"), "utf8"),
    ) as WhisperJson;
    const manifest = JSON.parse(
      await readFile(join(preparedDir, "manifest.json"), "utf8"),
    ) as {
      artifacts?: {
        review_proxy?: string | null;
        poster?: string | null;
        waveform?: string | null;
      };
    };
    const artifactFiles = {
      proxy: manifest.artifacts?.review_proxy ?? null,
      poster: manifest.artifacts?.poster ?? null,
      waveform: manifest.artifacts?.waveform ?? null,
    } as const;
    const derivedArtifacts: Array<Record<string, unknown>> = [];
    for (const upload of job.input.artifactUploads ?? []) {
      const fileName = artifactFiles[upload.kind];
      if (!fileName) continue;
      const artifactPath = join(preparedDir, fileName);
      await uploadFile(upload.uploadUrl, artifactPath, upload.mimeType);
      const file = await stat(artifactPath);
      derivedArtifacts.push({
        assetId: upload.assetId,
        kind: upload.kind,
        bucket: upload.bucket,
        path: upload.path,
        mimeType: upload.mimeType,
        fileSize: file.size,
        checksum: await sha256(artifactPath),
      });
    }
    return {
      fullText: whisper.text ?? "",
      language: whisper.language,
      segments: (whisper.segments ?? []).map((segment) => ({
        startMs: Math.max(0, Math.round((segment.start ?? 0) * 1000)),
        endMs: Math.max(1, Math.round((segment.end ?? 0) * 1000)),
        text: (segment.text ?? "").trim(),
      })).filter((segment) => segment.text && segment.endMs > segment.startMs),
      derivedArtifacts,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function clampNumber(value: unknown, key: string, fallback: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? Math.min(1, Math.max(0, candidate))
    : fallback;
}

function captionAssStyle(style: string, position: "top" | "center" | "bottom") {
  const alignment = position === "top" ? 8 : position === "center" ? 5 : 2;
  const preset = style === "bold"
    ? "FontName=Arial,FontSize=28,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=90"
    : style === "brand"
      ? "FontName=Arial,FontSize=24,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00A13B12,BorderStyle=1,Outline=4,Shadow=1,MarginV=90"
      : "FontName=Arial,FontSize=22,Bold=0,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=70";
  return `${preset},Alignment=${alignment}`;
}

async function tick(): Promise<boolean> {
  const response = await api<{ job: ClaimedJob | null }>("/api/press/worker/jobs/claim", {
    workerId,
    jobTypes: ["probe_media", "transcribe_media", "score_clips", "render_clip"],
    leaseSeconds: 900,
  });
  if (!response.job) return false;

  let lastProgress = 5;
  const heartbeat = setInterval(() => {
    void report(response.job!.id, { status: "processing", progress: lastProgress })
      .catch((error: unknown) => {
        process.stderr.write(`Press job heartbeat failed: ${String(error)}\n`);
      });
  }, 120_000);
  try {
    const result = await processJob(response.job);
    lastProgress = 95;
    clearInterval(heartbeat);
    await report(response.job.id, { status: "completed", progress: 100, result });
  } catch (error) {
    clearInterval(heartbeat);
    const message = error instanceof Error ? error.message : String(error);
    await report(response.job.id, {
      status: "failed",
      errorMessage: message.slice(0, 4000),
    }).catch((reportError: unknown) => {
      process.stderr.write(`Unable to report job failure: ${String(reportError)}\n`);
    });
  } finally {
    clearInterval(heartbeat);
  }
  return true;
}

async function main(): Promise<void> {
  if (!workerSecret) throw new Error("PRESS_WORKER_SECRET is required");
  if (!Number.isFinite(pollMs) || pollMs < 1000) throw new Error("PRESS_WORKER_POLL_MS must be >= 1000");
  do {
    const worked = await tick();
    if (once) return;
    if (!worked) await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
  } while (true);
}

main().catch((error: unknown) => {
  process.stderr.write(`Press queue worker stopped: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
