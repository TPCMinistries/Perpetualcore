-- Press jobs remain the durable queue. This single-row latch carries no job,
-- customer, project, media, count, or timestamp data; it only wakes the
-- outbound-only worker so idle queue polling can be reduced to a recovery sweep.
CREATE TABLE IF NOT EXISTS public.press_worker_wakeups (
  queue_name text PRIMARY KEY CHECK (queue_name = 'media'),
  wake_token uuid NOT NULL DEFAULT gen_random_uuid()
);

INSERT INTO public.press_worker_wakeups (queue_name)
VALUES ('media')
ON CONFLICT (queue_name) DO NOTHING;

ALTER TABLE public.press_worker_wakeups ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.press_worker_wakeups FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.press_worker_wakeups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_worker_wakeups TO service_role;

DROP POLICY IF EXISTS press_worker_wakeups_select ON public.press_worker_wakeups;
CREATE POLICY press_worker_wakeups_select
ON public.press_worker_wakeups
FOR SELECT
TO anon
USING (queue_name = 'media');

CREATE OR REPLACE FUNCTION public.press_signal_worker_wakeup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  should_wake boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    should_wake := NEW.status IN ('pending', 'failed') AND NEW.attempts < NEW.max_attempts;
  ELSIF TG_OP = 'UPDATE' THEN
    should_wake :=
      NEW.status IN ('pending', 'failed')
      AND NEW.attempts < NEW.max_attempts
      AND OLD.status IS DISTINCT FROM NEW.status;
  END IF;

  IF should_wake THEN
    UPDATE public.press_worker_wakeups
    SET wake_token = gen_random_uuid()
    WHERE queue_name = 'media';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.press_signal_worker_wakeup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_signal_worker_wakeup() TO service_role;

DROP TRIGGER IF EXISTS press_jobs_signal_worker_wakeup ON public.press_jobs;
CREATE TRIGGER press_jobs_signal_worker_wakeup
AFTER INSERT OR UPDATE OF status ON public.press_jobs
FOR EACH ROW
EXECUTE FUNCTION public.press_signal_worker_wakeup();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'press_worker_wakeups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.press_worker_wakeups;
  END IF;
END
$$;
