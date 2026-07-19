# Human Development Intelligence

Human Development Intelligence (HDI) is Perpetual Core's evidence-first
conversation development layer.

## Active first-release lenses

- Enterprise meeting effectiveness
- Workforce interview coaching
- Interviewer quality
- Leadership communication coaching

Family and child speech development is intentionally not active in this
database. It requires a separate guardian-controlled data vault, child-specific
consent and deletion controls, and clinical-advisor review.

## Data boundary

Perpetual Core stores:

- minimized session metadata
- consent and audit events
- rubric and model provenance
- evidence-linked observations with short verbatim excerpts (up to 240 characters)
- coaching actions
- explicit commitments
- human-review decisions
- longitudinal self-baseline observations

Perpetual Core does not durably retain a full raw transcript or media in the LDC
Brain AI database. Pasted transcripts are processed transiently. Direct media
uploads go from the browser to a purpose-isolated private staging bucket using a
two-hour signed upload token; the object is deleted before the evidence report
is persisted. An hourly cleanup removes abandoned or expired uploads. Full
transcripts are never written to Postgres. The analyzer uses OpenAI response
storage disabled, stores a derived personal-data envelope including short
evidence excerpts, and discards the full request content. Evidence envelopes are
not automatically anonymous and must be handled as confidential person data.

Workforce candidate and student recordings remain in the Uplift Workforce
Supabase project. Perpetual Core may receive minimized derived result envelopes
only.

## Current product boundary

This release analyzes authorized pasted transcripts and direct audio/video files
up to 25 MB in supported MP3, MP4, M4A, WAV, or WebM formats. Media is transcribed
with speaker diarization and segment timestamps; evidence timestamps must match
one returned speaker segment exactly. Speaker labels remain neutral unless a
human reviewer separately verifies identity.

Acoustic features, meeting-platform imports, longitudinal subject profiles,
consent withdrawal, and the separate child/family vault remain later activation
phases. Acoustic measures must remain coaching signals (for example pace and
turn-taking), never emotion, integrity, deception, diagnostic, accent, or
employment-decision scores.

## Prohibited use

HDI must not:

- infer honesty, integrity, deception, personality, intention, or hidden emotion
- diagnose medical, developmental, psychological, or speech conditions
- infer protected characteristics
- grade accents, dialects, eye contact, cultural style, or disability indicators
- issue automatic hire, reject, promotion, discipline, treatment, or placement decisions
- present absence of transcript evidence as proof that a person lacks an ability

Every material observation must be tied to a rubric criterion and transcript
evidence. Every report remains provisional until human review.

## Activation

1. Review `supabase/migrations/20260716_hdi_foundation.sql` and
   `supabase/migrations/20260719_hdi_media_ingestion.sql`.
2. Apply only those reviewed migrations through the guarded database workflow.
3. Regenerate Supabase types with `npm run types:supabase`.
4. Configure `OPENAI_API_KEY` and a unique 32+ character `HDI_SOURCE_HASH_SECRET`.
5. Optionally set `HDI_ANALYSIS_MODEL`; the default is `gpt-5.6-terra`.
6. Verify pasted transcript and synthetic media upload flows at
   `/dashboard/development`, then verify the aggregate `/hq#development` section.

The feature is restricted to organization owners and admins in this release.
Before real-person production use, approve the consent language, retention and
deletion workflow, provider data-processing posture, and organization access
policy.

Do not use a broad database push until local and remote migration history have
been reconciled.
