-- 20260520_rfp_email_enrollments.sql
-- Wave 5 of "Best-Site Plan" — RFP-specific nurture sequences.
--
-- Parallel to the legacy email_sequences schema (which is keyed on
-- leads + consultation_bookings/enterprise_demo_requests for the legacy
-- Perpetual Core SaaS). RFP's nurture loop reads from rfp_orgs / auth.users
-- directly and needs its own enrollment tracker.

create table if not exists rfp_email_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  org_id uuid references rfp_orgs(id) on delete cascade,
  email text not null,
  sequence_key text not null,          -- 'trial-onboarding' | 'lead-capture' | ...
  current_step int not null default 0, -- 0-indexed into the sequence's steps array
  next_send_at timestamptz,            -- when the cron should next send
  completed_at timestamptz,            -- set when current_step exceeds last step
  unsubscribed_at timestamptz,         -- user opt-out
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (email, sequence_key)
);

create index if not exists rfp_email_enrollments_due
  on rfp_email_enrollments (next_send_at)
  where completed_at is null and unsubscribed_at is null;

create table if not exists rfp_email_log (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references rfp_email_enrollments(id) on delete cascade,
  step int not null,
  resend_email_id text,
  status text not null,                -- 'sent' | 'failed'
  error_message text,
  sent_at timestamptz not null default now()
);

create index if not exists rfp_email_log_enrollment
  on rfp_email_log (enrollment_id, sent_at desc);

-- RLS: tenants do not read their own enrollment rows in v1 (no
-- "manage subscriptions" UI yet). Service role only.
alter table rfp_email_enrollments enable row level security;
alter table rfp_email_log enable row level security;

create policy "rfp_email_enrollments_service_role"
  on rfp_email_enrollments for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "rfp_email_log_service_role"
  on rfp_email_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
