# Press Console operations

Press converts an organization-owned long-form recording into an editable transcript, reviewed clip candidates, captioned exports, and an auditable delivery record. The application fails closed at tenant access, media-rights attestation, clip approval, render completion, and provider scheduling.

## Production activation checklist

The Press slice is code-complete for deployment review, but the console is not operational until every required checkpoint below is complete.

Completed on 2026-07-15:

- applied `20260715_press_foundation.sql` to Supabase project `hgxxxmtfmvguotkowxbu`;
- backfilled the two existing profile-to-organization relationships into explicit memberships with `20260715_press_membership_backfill.sql`;
- regenerated `lib/supabase/database.types.ts` from the live schema and removed the temporary database compatibility boundary;
- applied `20260715_press_worker_heartbeat.sql` and `20260715_press_generation_studio.sql`;
- added the Generation Studio with durable, tenant-scoped generation runs and an atomic Authentic Clip Pack queue operation.
- deployed the Press console to Vercel production (`dpl_GC6qbcHfXDPqWktAbCQ9o8No9qXZ`);
- configured `PRESS_WORKER_SECRET` in Vercel production and macOS Keychain;
- installed the private worker as the `com.perpetualcore.press-worker` launch agent, verified its live heartbeat, and cached the Whisper `small` model.

Still required before enabling broad customer access:

1. Run an organization-isolation test with two real test workspaces before enabling customer access.
2. Run one consented sample through upload, transcript correction, clip-boundary adjustment, approval, all three render formats, manual export, and cleanup.
3. Move the worker from the supervised Mac launch agent to an always-on private cloud host before promising 24/7 processing. The current worker is available while Lorenzo's Mac user session is running and online.

## Product boundary

Press currently replaces the core long-form-to-short production handoff: private ingest, transcription, deterministic clip proposals, timing/title/hook adjustment, human approval, captioned multi-ratio renders, secure download, and an auditable delivery record.

Generation Studio Phase A is real and deliberately narrow. `Authentic Clip Pack` queues the existing private scoring pipeline against a completed transcript, applies the requested clip count, duration range, formats, goals, and editorial brief, and persists the run through review. It does not silently call a paid provider. `Avatar Explainer` and `Narrated Visual Essay` are visible as roadmap recipes but remain disabled until their server-side adapters, consent checks, and credentials are configured.

It does not yet replace:

- a full nonlinear editor for multi-track timelines, color grading, motion graphics, audio mixing, or multicamera work;
- a remote recording studio;
- avatar generation, voice cloning, dubbing, or lip sync;
- a mature digital-asset manager with review annotations and retention automation;
- direct social scheduling/publishing, engagement inboxes, or social listening;
- automatic B-roll, music licensing, thumbnails, or advanced animated caption design.

## Generation providers

Provider capabilities fail closed and are reported independently:

- `internal`: available only while the private media worker heartbeat is healthy;
- `heygen`: disabled until a reviewed server-side avatar adapter and avatar consent evidence exist;
- `elevenlabs`: disabled until a reviewed voice adapter and voice consent evidence exist;
- `chatterbox`: reserved for a private open-source voice deployment; disabled until the model service and consent gate are operating.

Do not place provider keys in the browser, database rows, source files, or chat transcripts. Add restricted keys to the private worker environment only after the adapter exists. Paid generation jobs must not automatically retry after a provider accepts a request; reconcile the provider job ID first to avoid duplicate charges.

## Environment

The web runtime needs the existing Supabase server variables plus:

```bash
PRESS_WORKER_SECRET=<long-random-server-only-value>
PRESS_PUBLISH_ADAPTERS=
```

The worker uses the variables documented in `scripts/press/.env.example`. Keep `PRESS_PUBLISH_ADAPTERS` empty until a provider adapter has been reviewed and its target row is explicitly marked `adapter_configured = true`. The current product records schedules and manual exports; it does not claim to post directly to a social platform.

## Media pipeline

The durable job sequence is:

```text
probe_media -> transcribe_media -> score_clips -> human approval -> render_clip
```

The worker:

- receives short-lived source and output URLs, never Supabase service-role credentials;
- probes media before transcription;
- creates timestamped Whisper segments;
- proposes bounded, non-overlapping clip windows with visible component scores;
- renders 9:16, 1:1, and 16:9 MP4 output with optional burned captions;
- reports progress and validated results through the worker API;
- removes its private temporary directory after success or failure.

Clip scores are deterministic editorial heuristics, not a claim of autonomous editorial judgment. A person must approve a candidate before rendering.

## Publishing and analytics

Manual export is available for a completed render without a social connection. Scheduling requires:

- organization owner or admin role;
- an active tenant-scoped publish target;
- `adapter_configured = true` on that target; and
- the provider name in `PRESS_PUBLISH_ADAPTERS`.

Even then, the current implementation records a schedule only. Direct provider posting remains disabled until a reviewed adapter and credential-rotation procedure exist. Analytics displays only provider events actually stored in `press_analytics_events`; it never fabricates projections.

## Human checkpoints

- Confirm the live membership role/status values before migration.
- Review RLS and Storage policies in a non-production Supabase project.
- Verify releases/consent language with counsel for the actual customer workflow.
- Review subtitle readability and safe areas on physical phones for every output ratio.
- Decide retention and deletion windows for source media, transcripts, renders, and consent evidence.
- Complete provider-specific OAuth/security review before enabling direct publishing.

## Rollback

Disable the worker first, clear `PRESS_PUBLISH_ADAPTERS`, and remove Press navigation access if a production issue occurs. Preserve job, consent, and publication records for audit. Do not drop the Press tables or buckets as an incident-response shortcut; use a reviewed data-retention procedure.
