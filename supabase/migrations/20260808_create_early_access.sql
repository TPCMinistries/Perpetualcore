-- Create public.early_access — the table /api/early-access has always written to
-- and which has never existed.
--
-- The route inserts every waitlist signup here, ignores the failure, and returns
-- "You're on the list." Its own comment said the address would be "captured in
-- server logs for Lorenzo to backfill later", but that log was gated on
-- NODE_ENV === "development", so in production the signup was written to no
-- table and no log. Every early-access signup ever made was discarded silently.
--
-- Same family as the contact-sales and package-intake failures: a public intake
-- path that reports success while storing nothing.
--
-- RLS is enabled with NO policies. That is deliberate and is the correct
-- least-privilege posture here: the route writes via createAdminClient()
-- (service_role, which bypasses RLS), and nothing else should read or write
-- this table. Grants to anon/authenticated are revoked explicitly because RLS
-- does not filter TRUNCATE — a known hole across this ecosystem.

CREATE TABLE IF NOT EXISTS public.early_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS early_access_email_idx ON public.early_access (email);
CREATE INDEX IF NOT EXISTS early_access_created_at_idx ON public.early_access (created_at DESC);

ALTER TABLE public.early_access ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.early_access FROM anon, authenticated;
