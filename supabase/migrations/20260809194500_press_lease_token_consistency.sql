ALTER TABLE public.press_jobs
  DROP CONSTRAINT IF EXISTS press_jobs_lease_token_consistency;
ALTER TABLE public.press_jobs
  ADD CONSTRAINT press_jobs_lease_token_consistency
  CHECK ((lease_owner IS NULL) = (lease_token IS NULL));
