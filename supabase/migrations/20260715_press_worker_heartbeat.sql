-- Fail-closed operational signal for Press media workers.
-- The browser never writes or reads this table directly; authenticated users
-- receive only a coarse ready/offline status through the Press API.

CREATE TABLE IF NOT EXISTS public.press_worker_heartbeats (
  worker_id       text PRIMARY KEY CHECK (char_length(worker_id) BETWEEN 3 AND 120),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  current_job_id  uuid REFERENCES public.press_jobs(id) ON DELETE SET NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object')
);

ALTER TABLE public.press_worker_heartbeats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.press_worker_heartbeats FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_worker_heartbeats TO service_role;

COMMENT ON TABLE public.press_worker_heartbeats IS
  'Service-role-only liveness records used to prevent Press uploads when no worker is online.';
