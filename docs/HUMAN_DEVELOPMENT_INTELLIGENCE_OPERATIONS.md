# Development Intelligence Operations Guide

This guide defines how Perpetual Core Development Intelligence should be run as
an evidence-first, human-reviewed pilot. It is an operating control, not a claim
that the model is accurate, fair, clinically valid, or suitable for automated
decisions.

## Current capabilities

Organization owners and admins can:

- analyze an authorized pasted transcript or supported audio/video file
- use enterprise meeting, interview coaching, interviewer practice, or
  leadership conversation rubrics
- inspect short evidence quotes, neutral speaker labels, and media timestamps
- review model confidence as a support signal rather than a correctness score
- approve, request revision, or reject a report with a reviewer note
- see an actionable review queue ordered to surface safety flags
- inspect organization-level evidence movement by coaching lens
- monitor evidence coverage, quote traceability, review completion, confidence
  distribution, and persisted safety flags

Direct uploads support MP3, MP4, M4A, WAV, and WebM files up to 25 MB. Media is
placed in a purpose-isolated private staging bucket, processed, and removed
before the evidence report is persisted. Pasted transcripts and complete media
content are not durably stored in the LDC Brain AI Postgres database. Persisted
reports can contain short source excerpts and must still be treated as
confidential person data.

The Quality page describes the operational sample that exists in Perpetual
Core. It does not measure accuracy, inter-rater agreement, subgroup performance,
construct validity, or developmental outcomes.

## Pilot operating sequence

1. Confirm the organization's approved purpose and authorized reviewer.
2. Give every participant the approved notice before recording or analysis.
3. Confirm that recording, transcription, development analysis, human review,
   and any longitudinal use are within the consented scope.
4. Submit only the minimum source material required for the selected rubric.
5. Open the Review workspace and inspect every evidence item against its quote
   and, for media, its timestamp.
6. Check the report for prohibited inference, irrelevant employment criteria,
   unsupported generalization, missing context, and identity assumptions.
7. Approve only supported, appropriately limited findings. Otherwise request a
   documented revision or reject the report.
8. Use an approved report for coaching conversation preparation. Never use it
   as an automatic decision or as the sole basis for a consequential action.
9. Review Quality indicators at an agreed cadence and investigate safety flags,
   low-support evidence, missing quotes, and an incomplete review queue.

## Meeting-export workflow

Provider OAuth imports are not active. Use the meeting provider's normal export
or download feature instead:

1. In Zoom, Microsoft Teams, Google Meet, or the recording system of record,
   verify that participant notice and recording authorization were completed.
2. Export an audio/video recording in a supported format, or export/copy the
   provider transcript.
3. Remove unrelated pre-meeting, post-meeting, or sensitive content when it is
   not necessary for the coaching purpose.
4. If the recording is over 25 MB, use an authorized shorter excerpt or paste
   the relevant transcript. Do not upload it to an unapproved converter.
5. In `/dashboard/development`, choose the correct coaching lens, provide
   neutral participant labels, confirm consent, and upload the file or paste the
   transcript.
6. After processing, open the report from the Review workspace and verify
   speaker labels, evidence quotes, and timestamps before recording a decision.
7. Delete local exports according to the organization's approved source-system
   retention policy. Perpetual Core's staging cleanup is not a substitute for
   managing copies elsewhere.

Provider-generated transcripts can contain diarization, spelling, and timing
errors. The reviewer must compare material findings to the authorized source
when the provider transcript is uncertain.

## Pilot acceptance criteria

The following are minimum release gates for a real-person pilot:

### Access, consent, and retention

- Only the intended organization owner/admin roles can access reports, review,
  and quality pages.
- Tenant isolation is verified with two test organizations, including negative
  access tests.
- Approved participant notice and consent language names the actual purpose,
  source type, reviewers, retention, and withdrawal path.
- Media staging expiration and cleanup are monitored with non-personal test
  files; abandoned objects do not survive the approved retention window.
- The organization has a documented process for access, correction, withdrawal,
  deletion, legal hold, and incident response.

### Evidence and human review

- Every material observation has a non-empty exact quote; media observations
  also have a valid diarized-segment timestamp.
- Every report receives a human decision before it is used for coaching or
  shared with a participant.
- Revision and rejection decisions include a meaningful reviewer note.
- Safety flags are visible in the Review workspace and handled before approval.
- Reviewers complete calibration examples and can explain confidence as model
  support, not probability of truth.

### Evaluation

- A consented, de-identified where feasible benchmark set is independently
  labeled by qualified reviewers before any accuracy statement is made.
- The pilot owner predefines task-specific measures, acceptable thresholds, and
  failure actions rather than choosing them after seeing results.
- Evaluation includes evidence grounding, material omission, prohibited
  inference, reviewer disagreement, subgroup analysis where lawful and
  appropriate, and source-transcription error.
- False positive and false negative examples are reviewed qualitatively; one
  aggregate score cannot conceal a harmful failure mode.
- Model, prompt, schema, and rubric versions are recorded so changes trigger a
  new evaluation rather than inheriting old results.

### Operational readiness

- Synthetic transcript and media flows pass in production without exposing raw
  source content in application logs.
- Failure paths leave no report represented as complete and do not strand media
  beyond the approved staging window.
- The review queue, report detail, quality indicators, and audit receipts are
  usable on mobile and desktop with keyboard navigation.
- An owner is named for daily pilot monitoring, participant questions, safety
  escalation, and stop-work authority.

## Prohibited uses

Development Intelligence must not:

- infer honesty, integrity, deception, personality, intention, or hidden emotion
- diagnose medical, developmental, psychological, speech, or language conditions
- infer protected characteristics or use proxies for protected characteristics
- grade accent, dialect, eye contact, cultural style, or disability indicators
- rank people against one another using model confidence or evidence levels
- issue or automate hiring, rejection, promotion, discipline, treatment,
  placement, compensation, or eligibility decisions
- present missing transcript evidence as proof that a person lacks an ability
- be used for covert surveillance or analysis outside the participant notice
- substitute for a licensed clinician, qualified evaluator, or accountable
  human decision-maker

Child or family speech data must not enter this product. That use requires a
separate guardian-controlled vault, age-appropriate notice and assent, deletion
controls, clinical-advisor review, and a distinct legal and security assessment.

## Explicit external blockers

These items cannot be completed by application code alone and remain owner or
partner actions:

- approve participant notice, consent, correction, withdrawal, deletion, and
  retention language with qualified legal/privacy review
- approve the OpenAI and meeting-provider data-processing posture for each
  participating organization
- establish reviewer qualifications, training, calibration, escalation, and
  stop-work procedures
- create and independently label the evaluation benchmark; define acceptance
  thresholds and document subgroup/fairness methodology
- approve source-system retention and secure local-export handling
- obtain provider applications, credentials, scopes, security review, tenant
  admin approval, and webhook operations before any Zoom, Teams, or Meet OAuth
  integration
- design and approve the separate child/family architecture before any minor's
  source material is collected
- approve acoustic-feature definitions and validation; pace or turn-taking can
  only be coaching signals and must never become emotion, accent, integrity,
  diagnostic, or employment scores

Until these blockers are cleared, use provider exports, keep the pilot
owner/admin-only, use synthetic or explicitly authorized material, and avoid
claims of accuracy, diagnosis, prediction, or decision suitability.
