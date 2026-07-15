-- Perpetual Core HQ execution plane
--
-- Codifies the existing ad hoc hq_queue without replacing data, then adds:
--   1. executable action contracts on queue items
--   2. durable source-level freshness
--   3. action runs plus append-only run events
--   4. outcome metrics tied back to actions and queue items
--
-- This migration is intentionally service-only. The /hq server boundary uses
-- the Supabase service role after its own owner authorization check.

begin;

-- ---------------------------------------------------------------------------
-- 1. Existing HQ decision queue + executable action contract
-- ---------------------------------------------------------------------------

create table if not exists public.hq_queue (
  id text primary key,
  source text not null,
  title text not null,
  detail text,
  severity text not null default 'info',
  status text not null default 'open',
  verdict_note text,
  decided_at timestamptz,
  decided_by text,
  snooze_until timestamptz,
  synced_to_ledger boolean not null default false,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table public.hq_queue
  add column if not exists contract_version smallint not null default 1,
  add column if not exists action_key text,
  add column if not exists idempotency_key text,
  add column if not exists recommended_action text,
  add column if not exists expected_outcome text,
  add column if not exists risk_level text not null default 'medium',
  add column if not exists side_effect_class text not null default 'internal_write',
  add column if not exists approval_required boolean not null default true,
  add column if not exists executor text,
  add column if not exists execution_payload jsonb not null default '{}'::jsonb,
  add column if not exists rollback_plan text,
  add column if not exists execution_state text not null default 'not_ready',
  add column if not exists execution_requested_at timestamptz,
  add column if not exists execution_started_at timestamptz,
  add column if not exists execution_finished_at timestamptz,
  add column if not exists last_execution_error text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_contract_version_positive'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_contract_version_positive
      check (contract_version > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_risk_level_valid'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_risk_level_valid
      check (risk_level in ('low', 'medium', 'high', 'prohibited'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_side_effect_class_valid'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_side_effect_class_valid
      check (side_effect_class in ('read_only', 'internal_write', 'external_write', 'money', 'outbound'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_execution_state_valid'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_execution_state_valid
      check (execution_state in (
        'not_ready', 'ready', 'queued', 'running', 'succeeded', 'failed',
        'blocked', 'cancelled', 'rolled_back'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_payload_is_object'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_payload_is_object
      check (jsonb_typeof(execution_payload) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_ready_contract_complete'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_ready_contract_complete
      check (
        execution_state = 'not_ready'
        or (
          nullif(btrim(action_key), '') is not null
          and nullif(btrim(recommended_action), '') is not null
          and nullif(btrim(expected_outcome), '') is not null
          and nullif(btrim(executor), '') is not null
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_human_gate_for_sensitive_effects'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_human_gate_for_sensitive_effects
      check (
        side_effect_class not in ('money', 'outbound')
        or approval_required
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hq_queue'::regclass
      and conname = 'hq_queue_prohibited_actions_fail_closed'
  ) then
    alter table public.hq_queue
      add constraint hq_queue_prohibited_actions_fail_closed
      check (risk_level <> 'prohibited' or execution_state = 'not_ready');
  end if;
end
$$;

create index if not exists idx_hq_queue_execution_ready
  on public.hq_queue (execution_state, risk_level, last_seen desc)
  where execution_state in ('ready', 'queued', 'blocked', 'failed');

create index if not exists idx_hq_queue_action_key
  on public.hq_queue (action_key)
  where action_key is not null;

create unique index if not exists idx_hq_queue_idempotency_key
  on public.hq_queue (idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 2. Durable freshness for every source feeding HQ
-- ---------------------------------------------------------------------------

create table if not exists public.hq_source_freshness (
  source_key text primary key,
  display_name text not null,
  status text not null default 'unknown'
    check (status in ('unknown', 'fresh', 'stale', 'error')),
  observed_at timestamptz not null default now(),
  source_generated_at timestamptz,
  expires_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,
  error_message text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hq_source_freshness_expiry_order
    check (expires_at is null or source_generated_at is null or expires_at >= source_generated_at)
);

create index if not exists idx_hq_source_freshness_attention
  on public.hq_source_freshness (status, expires_at nulls first, observed_at)
  where status in ('unknown', 'stale', 'error');

-- ---------------------------------------------------------------------------
-- 3. Durable action runs and append-only audit events
-- ---------------------------------------------------------------------------

create table if not exists public.hq_action_runs (
  id uuid primary key default gen_random_uuid(),
  queue_item_id text references public.hq_queue(id) on delete set null,
  action_key text not null,
  contract_version smallint not null default 1 check (contract_version > 0),
  idempotency_key text not null,
  risk_level text not null
    check (risk_level in ('low', 'medium', 'high', 'prohibited')),
  status text not null default 'queued'
    check (status in (
      'queued', 'running', 'succeeded', 'failed', 'blocked', 'cancelled', 'rolled_back'
    )),
  attempt integer not null default 1 check (attempt > 0),
  dry_run boolean not null default true,
  requested_by text not null,
  approved_by text,
  approved_at timestamptz,
  approval_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(approval_snapshot) = 'object'),
  input jsonb not null default '{}'::jsonb
    check (jsonb_typeof(input) = 'object'),
  output jsonb,
  evidence jsonb,
  error_code text,
  error_message text,
  retryable boolean not null default false,
  rollback_of_run_id uuid references public.hq_action_runs(id) on delete set null,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hq_action_runs_idempotency_unique unique (idempotency_key),
  constraint hq_action_runs_time_order check (
    (started_at is null or started_at >= queued_at)
    and (finished_at is null or finished_at >= coalesce(started_at, queued_at))
  ),
  constraint hq_action_runs_approval_pair check (
    (approved_at is null and approved_by is null)
    or (approved_at is not null and nullif(btrim(approved_by), '') is not null)
  ),
  constraint hq_action_runs_output_is_object check (
    output is null or jsonb_typeof(output) = 'object'
  ),
  constraint hq_action_runs_evidence_is_object check (
    evidence is null or jsonb_typeof(evidence) = 'object'
  ),
  constraint hq_action_runs_prohibited_actions_fail_closed check (
    risk_level <> 'prohibited' or status = 'blocked'
  )
);

create index if not exists idx_hq_action_runs_queue_item
  on public.hq_action_runs (queue_item_id, created_at desc);

create index if not exists idx_hq_action_runs_dispatch
  on public.hq_action_runs (status, queued_at)
  where status in ('queued', 'blocked');

create index if not exists idx_hq_action_runs_action_key
  on public.hq_action_runs (action_key, created_at desc);

create table if not exists public.hq_action_run_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.hq_action_runs(id) on delete restrict,
  event_type text not null,
  from_status text,
  to_status text,
  actor_type text not null default 'system'
    check (actor_type in ('owner', 'agent', 'system', 'worker')),
  actor_id text,
  message text,
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint hq_action_run_events_from_status_valid check (
    from_status is null or from_status in (
      'queued', 'running', 'succeeded', 'failed', 'blocked', 'cancelled', 'rolled_back'
    )
  ),
  constraint hq_action_run_events_to_status_valid check (
    to_status is null or to_status in (
      'queued', 'running', 'succeeded', 'failed', 'blocked', 'cancelled', 'rolled_back'
    )
  )
);

create index if not exists idx_hq_action_run_events_timeline
  on public.hq_action_run_events (run_id, occurred_at, id);

-- ---------------------------------------------------------------------------
-- 4. Outcome metrics: business results, not activity counts
-- ---------------------------------------------------------------------------

create table if not exists public.hq_outcome_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_name text not null,
  value numeric not null,
  unit text not null,
  direction text not null default 'neutral'
    check (direction in ('increase', 'decrease', 'neutral')),
  baseline_value numeric,
  target_value numeric,
  engine_key text,
  source_key text references public.hq_source_freshness(source_key) on delete set null,
  queue_item_id text references public.hq_queue(id) on delete set null,
  action_run_id uuid references public.hq_action_runs(id) on delete set null,
  measured_at timestamptz not null default now(),
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint hq_outcome_metrics_period_order
    check (period_end is null or period_start is null or period_end >= period_start),
  constraint hq_outcome_metrics_observation_unique
    unique nulls not distinct (metric_key, measured_at, engine_key, action_run_id)
);

create index if not exists idx_hq_outcome_metrics_series
  on public.hq_outcome_metrics (metric_key, measured_at desc);

create index if not exists idx_hq_outcome_metrics_engine
  on public.hq_outcome_metrics (engine_key, measured_at desc)
  where engine_key is not null;

create index if not exists idx_hq_outcome_metrics_action_run
  on public.hq_outcome_metrics (action_run_id)
  where action_run_id is not null;

-- ---------------------------------------------------------------------------
-- 5. updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.hq_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hq_queue_set_updated_at on public.hq_queue;
create trigger hq_queue_set_updated_at
  before update on public.hq_queue
  for each row execute function public.hq_set_updated_at();

drop trigger if exists hq_source_freshness_set_updated_at on public.hq_source_freshness;
create trigger hq_source_freshness_set_updated_at
  before update on public.hq_source_freshness
  for each row execute function public.hq_set_updated_at();

drop trigger if exists hq_action_runs_set_updated_at on public.hq_action_runs;
create trigger hq_action_runs_set_updated_at
  before update on public.hq_action_runs
  for each row execute function public.hq_set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. RLS: deny browser clients; allow the existing owner-gated service boundary
-- ---------------------------------------------------------------------------

alter table public.hq_queue enable row level security;
alter table public.hq_source_freshness enable row level security;
alter table public.hq_action_runs enable row level security;
alter table public.hq_action_run_events enable row level security;
alter table public.hq_outcome_metrics enable row level security;

revoke all on table public.hq_queue from anon, authenticated;
revoke all on table public.hq_source_freshness from anon, authenticated;
revoke all on table public.hq_action_runs from anon, authenticated;
revoke all on table public.hq_action_run_events from anon, authenticated;
revoke all on table public.hq_outcome_metrics from anon, authenticated;

revoke all on table public.hq_queue from service_role;
revoke all on table public.hq_source_freshness from service_role;
revoke all on table public.hq_action_runs from service_role;
revoke all on table public.hq_action_run_events from service_role;
revoke all on table public.hq_outcome_metrics from service_role;

grant select, insert, update on table public.hq_queue to service_role;
grant select, insert, update on table public.hq_source_freshness to service_role;
grant select, insert, update on table public.hq_action_runs to service_role;
grant select, insert on table public.hq_action_run_events to service_role;
grant select, insert, update on table public.hq_outcome_metrics to service_role;
grant usage, select on sequence public.hq_action_run_events_id_seq to service_role;

revoke execute on function public.hq_set_updated_at() from public, anon, authenticated;
grant execute on function public.hq_set_updated_at() to service_role;

drop policy if exists hq_queue_service_role_select on public.hq_queue;
create policy hq_queue_service_role_select on public.hq_queue
  for select to service_role
  using (true);
drop policy if exists hq_queue_service_role_insert on public.hq_queue;
create policy hq_queue_service_role_insert on public.hq_queue
  for insert to service_role
  with check (true);
drop policy if exists hq_queue_service_role_update on public.hq_queue;
create policy hq_queue_service_role_update on public.hq_queue
  for update to service_role
  using (true)
  with check (true);

drop policy if exists hq_source_freshness_service_role_select on public.hq_source_freshness;
create policy hq_source_freshness_service_role_select on public.hq_source_freshness
  for select to service_role
  using (true);
drop policy if exists hq_source_freshness_service_role_insert on public.hq_source_freshness;
create policy hq_source_freshness_service_role_insert on public.hq_source_freshness
  for insert to service_role
  with check (true);
drop policy if exists hq_source_freshness_service_role_update on public.hq_source_freshness;
create policy hq_source_freshness_service_role_update on public.hq_source_freshness
  for update to service_role
  using (true)
  with check (true);

drop policy if exists hq_action_runs_service_role_select on public.hq_action_runs;
create policy hq_action_runs_service_role_select on public.hq_action_runs
  for select to service_role
  using (true);
drop policy if exists hq_action_runs_service_role_insert on public.hq_action_runs;
create policy hq_action_runs_service_role_insert on public.hq_action_runs
  for insert to service_role
  with check (true);
drop policy if exists hq_action_runs_service_role_update on public.hq_action_runs;
create policy hq_action_runs_service_role_update on public.hq_action_runs
  for update to service_role
  using (true)
  with check (true);

drop policy if exists hq_action_run_events_service_role_read on public.hq_action_run_events;
create policy hq_action_run_events_service_role_read on public.hq_action_run_events
  for select to service_role
  using (true);

drop policy if exists hq_action_run_events_service_role_insert on public.hq_action_run_events;
create policy hq_action_run_events_service_role_insert on public.hq_action_run_events
  for insert to service_role
  with check (true);

drop policy if exists hq_outcome_metrics_service_role_select on public.hq_outcome_metrics;
create policy hq_outcome_metrics_service_role_select on public.hq_outcome_metrics
  for select to service_role
  using (true);
drop policy if exists hq_outcome_metrics_service_role_insert on public.hq_outcome_metrics;
create policy hq_outcome_metrics_service_role_insert on public.hq_outcome_metrics
  for insert to service_role
  with check (true);
drop policy if exists hq_outcome_metrics_service_role_update on public.hq_outcome_metrics;
create policy hq_outcome_metrics_service_role_update on public.hq_outcome_metrics
  for update to service_role
  using (true)
  with check (true);

comment on table public.hq_queue is
  'HQ decision queue with executable action contracts; legacy verdict status remains separate from execution_state.';
comment on table public.hq_source_freshness is
  'Latest durable freshness observation for each source feeding the HQ operating brief.';
comment on table public.hq_action_runs is
  'Idempotent execution attempts for approved HQ action contracts.';
comment on table public.hq_action_run_events is
  'Append-only audit timeline for HQ action runs.';
comment on table public.hq_outcome_metrics is
  'Business outcome observations attributable to HQ actions, engines, and sources.';

commit;
