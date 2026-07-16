#!/usr/bin/env tsx

/**
 * Local Press media preparation worker.
 *
 * This deliberately has no Supabase or network access. It turns one local media
 * file into deterministic worker artifacts that a trusted queue consumer can
 * upload later: normalized audio, optional proxy/poster, Whisper JSON, and a
 * manifest containing hashes and probe metadata.
 */

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

interface Options {
  input: string;
  outputDir: string;
  model: string;
  language?: string;
  whisperCommand: string;
  skipTranscribe: boolean;
}

interface ProbeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
}

interface ProbeResult {
  format?: { duration?: string; format_name?: string; size?: string };
  streams?: ProbeStream[];
}

function usage(): never {
  process.stderr.write(
    [
      "Usage: tsx scripts/press/media-worker.ts --input <file> --output-dir <dir>",
      "       [--model small] [--language en] [--whisper-command whisper]",
      "       [--skip-transcribe]",
      "",
      "Required local commands: ffmpeg, ffprobe, and (unless skipped) whisper.",
    ].join("\n") + "\n",
  );
  process.exit(2);
}

function parseArgs(argv: string[]): Options {
  const values = new Map<string, string>();
  let skipTranscribe = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--skip-transcribe") {
      skipTranscribe = true;
      continue;
    }
    if (!token.startsWith("--")) usage();
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) usage();
    values.set(token, value);
    index += 1;
  }

  const input = values.get("--input");
  const outputDir = values.get("--output-dir");
  if (!input || !outputDir) usage();
  return {
    input: resolve(input),
    outputDir: resolve(outputDir),
    model: values.get("--model") ?? process.env.PRESS_WHISPER_MODEL ?? "small",
    language: values.get("--language") ?? process.env.PRESS_WHISPER_LANGUAGE,
    whisperCommand:
      values.get("--whisper-command") ?? process.env.PRESS_WHISPER_COMMAND ?? "whisper",
    skipTranscribe,
  };
}

function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise(stdout);
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

function sha256(path: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolvePromise(hash.digest("hex")));
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await mkdir(options.outputDir, { recursive: true });

  const probeRaw = await run("ffprobe", [
    "-v", "error", "-show_format", "-show_streams", "-of", "json", options.input,
  ]);
  const probe = JSON.parse(probeRaw) as ProbeResult;
  const hasVideo = probe.streams?.some((stream) => stream.codec_type === "video") ?? false;
  const sourceStem = basename(options.input, extname(options.input));
  const audioPath = join(options.outputDir, "audio-16k-mono.wav");

  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-i", options.input,
    "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", audioPath,
  ]);
  const waveformPath = join(options.outputDir, "waveform.json");
  await writeFile(
    waveformPath,
    JSON.stringify(await waveformFromPcmWav(audioPath), null, 2) + "\n",
    { encoding: "utf8", mode: 0o600 },
  );

  let proxyPath: string | null = null;
  let posterPath: string | null = null;
  if (hasVideo) {
    proxyPath = join(options.outputDir, "review-proxy.mp4");
    posterPath = join(options.outputDir, "poster.jpg");
    await run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", options.input,
      "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "veryfast",
      "-crf", "24", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", proxyPath,
    ]);
    await run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-ss", "1", "-i", options.input,
      "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", posterPath,
    ]);
  }

  let transcriptPath: string | null = null;
  if (!options.skipTranscribe) {
    const whisperArgs = [
      audioPath,
      "--model", options.model,
      "--output_format", "json",
      "--output_dir", options.outputDir,
      "--verbose", "False",
    ];
    if (options.language) whisperArgs.push("--language", options.language);
    await run(options.whisperCommand, whisperArgs);
    transcriptPath = join(options.outputDir, "audio-16k-mono.json");
    // Fail clearly if a different Whisper CLI ignored the requested output path.
    await readFile(transcriptPath, "utf8");
  }

  const manifest = {
    schema: "press-local-worker-v1",
    created_at: new Date().toISOString(),
    source: {
      filename: basename(options.input),
      sha256: await sha256(options.input),
      format: probe.format?.format_name ?? null,
      duration_seconds: Number(probe.format?.duration ?? 0) || null,
      size_bytes: Number(probe.format?.size ?? 0) || null,
      streams: probe.streams ?? [],
    },
    artifacts: {
      normalized_audio: basename(audioPath),
      waveform: basename(waveformPath),
      review_proxy: proxyPath ? basename(proxyPath) : null,
      poster: posterPath ? basename(posterPath) : null,
      transcript_json: transcriptPath ? basename(transcriptPath) : null,
    },
    transcription: options.skipTranscribe
      ? { skipped: true }
      : { skipped: false, command: basename(options.whisperCommand), model: options.model, language: options.language ?? null },
    source_stem: sourceStem,
  };
  await writeFile(
    join(options.outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { encoding: "utf8", mode: 0o600 },
  );
  process.stdout.write(`${join(options.outputDir, "manifest.json")}\n`);
}

async function waveformFromPcmWav(path: string) {
  const wav = await readFile(path);
  const dataOffset = findWavDataOffset(wav);
  const sampleCount = Math.floor((wav.length - dataOffset) / 2);
  const bucketCount = Math.min(1_200, Math.max(120, Math.ceil(sampleCount / 1_600)));
  const samplesPerBucket = Math.max(1, Math.ceil(sampleCount / bucketCount));
  const peaks: number[] = [];
  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = bucket * samplesPerBucket;
    const end = Math.min(sampleCount, start + samplesPerBucket);
    let peak = 0;
    for (let index = start; index < end; index += 1) {
      peak = Math.max(peak, Math.abs(wav.readInt16LE(dataOffset + index * 2)) / 32768);
    }
    peaks.push(Number(peak.toFixed(4)));
  }
  return {
    schema: "press-waveform-v1",
    sample_rate: 16_000,
    channels: 1,
    duration_seconds: sampleCount / 16_000,
    peaks,
  };
}

function findWavDataOffset(wav: Buffer) {
  let offset = 12;
  while (offset + 8 <= wav.length) {
    const id = wav.toString("ascii", offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === "data") return offset + 8;
    offset += 8 + size + (size % 2);
  }
  throw new Error("Normalized WAV has no data chunk");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Press worker failed: ${message}\n`);
  process.exitCode = 1;
});
