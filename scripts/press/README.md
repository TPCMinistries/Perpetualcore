# Press local media worker

This worker prepares media locally without touching Supabase or any external API. It produces a 16 kHz mono WAV, a review proxy and poster for video, Whisper JSON, and a hash/probe manifest.

## Prerequisites

- FFmpeg and FFprobe on `PATH`
- Python OpenAI Whisper's `whisper` CLI on `PATH` (unless using `--skip-transcribe`)
- Node dependencies installed (`tsx` is already a repository dev dependency)

On macOS:

```bash
brew install ffmpeg
python3 -m pip install -U openai-whisper
```

## Run

```bash
npx tsx scripts/press/media-worker.ts \
  --input /absolute/path/to/recording.mp4 \
  --output-dir /absolute/path/to/private-output \
  --model small \
  --language en
```

For FFmpeg-only preparation:

```bash
npx tsx scripts/press/media-worker.ts \
  --input /absolute/path/to/recording.mp4 \
  --output-dir /absolute/path/to/private-output \
  --skip-transcribe
```

The worker never builds shell command strings; every argument is passed directly to the child process. Still, treat its output as confidential: transcripts, proxies, and posters contain customer media. Use a private directory, do not commit outputs, and delete them after upload and verification.

## Queue integration contract

The production queue consumer should:

1. Claim a `press_jobs` row using a short lease and service-role client.
2. Download the source only after confirming the asset, project, job, and storage path share the same `organization_id`.
3. Run this worker in a per-job temporary directory with CPU, memory, disk, and wall-time limits.
4. Validate `manifest.json`, upload outputs under `<org-id>/<project-id>/<random-name>`, and persist transcript segments in one transaction.
5. Mark the job complete only after uploads and database writes succeed. On failure, remove partial local files and allow retry until `max_attempts`; then mark the job `dead`.

Never pass OAuth tokens, the Supabase service-role key, or arbitrary FFmpeg filter strings into this process.

## Queue consumer

The queue consumer uses only the worker HTTP contract and `PRESS_WORKER_SECRET`; it never receives the Supabase service-role key. It handles all four MVP jobs: media probing, Whisper transcription, deterministic clip scoring, and FFmpeg rendering/upload. Clip scores expose their component scores (`hook`, `duration_fit`, `clarity`, `standalone`, and `transcript_confidence`) instead of presenting the heuristic as an opaque AI judgment.

Run one job and exit:

```bash
PRESS_API_BASE_URL=https://perpetualcore.com \
PRESS_WORKER_SECRET='set-in-the-shell-not-a-file' \
npx tsx scripts/press/queue-worker.ts --once
```

Run continuously under a process supervisor:

```bash
npx tsx scripts/press/queue-worker.ts
```

The consumer downloads the signed source before its 15-minute expiry, sends a progress heartbeat, processes in a mode-`0600` temporary directory, reports a schema-validated result, and removes the directory in `finally`. A production supervisor should add host-level CPU/memory/disk limits and restart backoff.

### Current production worker

The production worker is launched by `scripts/press/run-production-worker.sh` through the user LaunchAgent `com.perpetualcore.press-worker`. Its shared secret is read from the macOS Keychain service `com.perpetualcore.press-worker`; the launch file and repository contain no secret. Logs are written to `~/Library/Logs/perpetual-core-press-worker.log` and `~/Library/Logs/perpetual-core-press-worker.error.log`.

Useful operator commands:

```bash
launchctl print gui/$(id -u)/com.perpetualcore.press-worker
launchctl kickstart -k gui/$(id -u)/com.perpetualcore.press-worker
```
