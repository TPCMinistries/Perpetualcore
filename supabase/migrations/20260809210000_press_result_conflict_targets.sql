-- PostgREST's `on_conflict=source_job_id,source_position` inference cannot use
-- the original partial unique index. NULL values already remain distinct in a
-- regular unique index, so making these indexes non-partial preserves legacy
-- rows while giving idempotent worker result upserts a valid conflict target.

DROP INDEX IF EXISTS public.press_transcripts_source_job_uidx;
CREATE UNIQUE INDEX press_transcripts_source_job_uidx
  ON public.press_transcripts (source_job_id);

DROP INDEX IF EXISTS public.press_clips_source_job_position_uidx;
CREATE UNIQUE INDEX press_clips_source_job_position_uidx
  ON public.press_clips (source_job_id, source_position);

COMMENT ON INDEX public.press_clips_source_job_position_uidx IS
  'Non-partial conflict target for idempotent clip result upserts by source job and position.';
