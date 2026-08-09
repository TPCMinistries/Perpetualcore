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
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { createCanvas } from "canvas";

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
  leaseToken: string;
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
const pollMs = Number(process.env.PRESS_WORKER_POLL_MS ?? "60000");
const processTimeoutMs = Number(process.env.PRESS_WORKER_PROCESS_TIMEOUT_MS ?? String(30 * 60_000));
const maxDownloadBytes = Number(process.env.PRESS_WORKER_MAX_DOWNLOAD_BYTES ?? String(512 * 1024 * 1024));
const once = process.argv.includes("--once");

function run(command: string, args: string[], cwd?: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), processTimeoutMs);
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      signal: controller.signal,
      killSignal: "SIGKILL",
    });
    let stdout = "";
    let stderr = "";
    const appendBounded = (current: string, chunk: Buffer) =>
      (current + chunk.toString()).slice(-2_000_000);
    child.stdout.on("data", (chunk: Buffer) => (stdout = appendBounded(stdout, chunk)));
    child.stderr.on("data", (chunk: Buffer) => (stderr = appendBounded(stderr, chunk)));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
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
  job: Pick<ClaimedJob, "id" | "leaseToken">,
  body: Record<string, unknown>,
): Promise<void> {
  await api(`/api/press/worker/jobs/${encodeURIComponent(job.id)}/report`, {
    workerId,
    leaseToken: job.leaseToken,
    ...body,
  });
}

async function downloadSource(url: string, target: string): Promise<void> {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15 * 60_000) });
  if (!response.ok || !response.body) throw new Error(`Source download failed (${response.status})`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxDownloadBytes) {
    throw new Error("Source exceeds the worker download limit");
  }
  let receivedBytes = 0;
  const byteLimit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      receivedBytes += chunk.length;
      if (receivedBytes > maxDownloadBytes) {
        callback(new Error("Source exceeds the worker download limit"));
        return;
      }
      callback(null, chunk);
    },
  });
  await pipeline(
    Readable.fromWeb(response.body as import("node:stream/web").ReadableStream),
    byteLimit,
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
  const configuredGoals = Array.isArray(generation?.config.goals)
    ? generation.config.goals.filter((goal): goal is string => typeof goal === "string")
    : [];
  const goalSignals: Record<string, RegExp> = {
    teach: /\b(how|why|step|learn|because|lesson|method)\b/i,
    inspire: /\b(can|believe|imagine|possible|change|hope|future)\b/i,
    announce: /\b(new|introducing|launch|today|now|announce|available)\b/i,
    demonstrate: /\b(show|watch|here|example|demo|look|see)\b/i,
    story: /\b(when|remember|then|felt|story|happened|realized)\b/i,
  };
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
    const matchedGoals = configuredGoals.filter((goal) => goalSignals[goal]?.test(text)).length;
    const goalAlignment = configuredGoals.length
      ? Math.min(100, 40 + (matchedGoals / configuredGoals.length) * 60)
      : 70;
    const scores = {
      hook: Math.round(hook),
      duration_fit: Math.round(durationFit),
      clarity: Math.round(clarity),
      standalone,
      transcript_confidence: confidence,
      editorial_relevance: editorialRelevance,
      goal_alignment: Math.round(goalAlignment),
    };
    const score = Math.round(
      scores.hook * 0.2 + scores.duration_fit * 0.18 + scores.clarity * 0.14
      + scores.standalone * 0.15 + scores.transcript_confidence * 0.1
      + scores.editorial_relevance * 0.13 + scores.goal_alignment * 0.1,
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
    await report(job, { status: "processing", progress: 10 });

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
      const captionOverlays: Array<{ path: string; startSeconds: number; endSeconds: number }> = [];
      if (captionSegments.length && render.captionStyle !== "none") {
        for (const [index, segment] of captionSegments.entries()) {
          const clean = segment.text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          if (!clean) continue;
          const captionPath = join(workDir, `caption-${index}.png`);
          await writeCaptionOverlay({
            path: captionPath,
            text: clean,
            width: target.width,
            height: target.height,
            style: render.captionStyle ?? "minimal",
            position: captionPosition,
          });
          captionOverlays.push({
            path: captionPath,
            startSeconds: (Math.max(segment.startMs, clip.startMs) - clip.startMs) / 1000,
            endSeconds: (Math.min(segment.endMs, clip.endMs) - clip.startMs) / 1000,
          });
        }
      }
      const outputPath = join(workDir, "render.mp4");
      const durationSeconds = (clip.endMs - clip.startMs) / 1000;
      const captionInputs = captionOverlays.flatMap((overlay) => ["-loop", "1", "-i", overlay.path]);
      const videoFilterArgs = captionOverlays.length
        ? buildCaptionFilterArgs(filters, captionOverlays)
        : ["-map", "0:v:0", "-vf", filters.join(",")];
      await run("ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-y",
        "-ss", String(clip.startMs / 1000), "-i", sourcePath,
        ...captionInputs,
        "-t", String(durationSeconds),
        ...videoFilterArgs, "-map", "0:a?",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outputPath,
      ], workDir);
      await report(job, { status: "processing", progress: 85 });
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

function buildCaptionFilterArgs(
  baseFilters: string[],
  overlays: Array<{ startSeconds: number; endSeconds: number }>,
): string[] {
  const chains = [`[0:v]${baseFilters.join(",")}[caption-base]`];
  overlays.forEach((overlay, index) => {
    const inputLabel = index === 0 ? "caption-base" : `caption-${index - 1}`;
    const outputLabel = index === overlays.length - 1 ? "press-video" : `caption-${index}`;
    const enable = `between(t\\,${overlay.startSeconds.toFixed(3)}\\,${overlay.endSeconds.toFixed(3)})`;
    chains.push(`[${inputLabel}][${index + 1}:v]overlay=0:0:enable='${enable}'[${outputLabel}]`);
  });
  return ["-filter_complex", chains.join(";"), "-map", "[press-video]"];
}

function wrapCaptionText(
  measureText: (value: string) => number,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measureText(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const usedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (usedWords < words.length && lines.length) {
    let finalLine = lines[lines.length - 1];
    while (finalLine && measureText(`${finalLine}…`) > maxWidth) {
      finalLine = finalLine.split(" ").slice(0, -1).join(" ");
    }
    lines[lines.length - 1] = `${finalLine || words[usedWords - 1] || ""}…`;
  }
  return lines;
}

async function writeCaptionOverlay(input: {
  path: string;
  text: string;
  width: number;
  height: number;
  style: string;
  position: "top" | "center" | "bottom";
}): Promise<void> {
  const canvas = createCanvas(input.width, input.height);
  const context = canvas.getContext("2d");
  const fontSize = Math.max(42, Math.round(Math.min(input.width, input.height) * 0.055));
  const isBold = input.style === "bold" || input.style === "brand";
  context.font = `${isBold ? "700" : "600"} ${fontSize}px Arial, sans-serif`;
  const maxWidth = input.width * 0.82;
  const lines = wrapCaptionText((value) => context.measureText(value).width, input.text, maxWidth);
  const lineHeight = Math.round(fontSize * 1.24);
  const horizontalPadding = Math.round(fontSize * 0.55);
  const verticalPadding = Math.round(fontSize * 0.42);
  const contentWidth = Math.max(...lines.map((line) => context.measureText(line).width), fontSize * 2);
  const boxWidth = Math.min(input.width * 0.92, contentWidth + horizontalPadding * 2);
  const boxHeight = lines.length * lineHeight + verticalPadding * 2;
  const boxX = (input.width - boxWidth) / 2;
  const boxY = input.position === "top"
    ? input.height * 0.1
    : input.position === "center"
      ? (input.height - boxHeight) / 2
      : input.height - boxHeight - input.height * 0.1;
  const radius = Math.max(18, Math.round(fontSize * 0.35));

  context.beginPath();
  context.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
  context.fillStyle = input.style === "brand" ? "rgba(157, 62, 22, 0.94)" : "rgba(10, 10, 10, 0.82)";
  context.fill();
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = Math.round(fontSize * 0.12);
  lines.forEach((line, index) => {
    const y = boxY + verticalPadding + lineHeight * (index + 0.5);
    context.fillText(line, input.width / 2, y, maxWidth);
  });
  await writeFile(input.path, canvas.toBuffer("image/png"), { mode: 0o600 });
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
    void report(response.job!, { status: "processing", progress: lastProgress })
      .catch((error: unknown) => {
        process.stderr.write(`Press job heartbeat failed: ${String(error)}\n`);
      });
  }, 120_000);
  try {
    const result = await processJob(response.job);
    lastProgress = 95;
    clearInterval(heartbeat);
    await report(response.job, { status: "completed", progress: 100, result });
  } catch (error) {
    clearInterval(heartbeat);
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Press job ${response.job.id} failed: ${message.slice(0, 2000)}\n`);
    await report(response.job, {
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
  if (!Number.isFinite(processTimeoutMs) || processTimeoutMs < 60_000) {
    throw new Error("PRESS_WORKER_PROCESS_TIMEOUT_MS must be >= 60000");
  }
  if (!Number.isFinite(maxDownloadBytes) || maxDownloadBytes < 1024 * 1024) {
    throw new Error("PRESS_WORKER_MAX_DOWNLOAD_BYTES must be >= 1048576");
  }
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
