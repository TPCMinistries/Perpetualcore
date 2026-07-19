-- Perpetual Core Human Development Intelligence foundation
--
-- Control-plane boundary:
--   * Stores consent state, deidentified session metadata, derived evidence,
--     commitments, model provenance, and human-review decisions.
--   * Does not store raw transcripts or media in LDC Brain AI.
--   * Workforce identifiable content remains in the Workforce project.
--   * Child/family content requires a separate guardian-controlled vault.
--
-- Deliberately excluded:
--   deception/integrity scores, diagnosis, emotion recognition, cultural-fit
--   scores, accent grading, protected-trait inference, and automated hiring
--   recommendations.

begin;

create table if not exists public.hdi_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  lens text not null check (lens in (
    'enterprise_meeting',
    'interview_coaching',
    'interviewer_quality',
    'leadership_coaching'
  )),
  source_type text not null check (source_type in (
    'transcript_paste',
    'meeting_import',
    'workforce_envelope'
  )),
  source_locator text,
  source_hash text not null,
  participant_labels jsonb not null default '[]'::jsonb
    check (jsonb_typeof(participant_labels) = 'array'),
  consent_status text not null check (consent_status in (
    'confirmed', 'withdrawn', 'expired'
  )),
  raw_content_stored boolean not null default false
    check (raw_content_stored = false),
  status text not null default 'queued' check (status in (
    'queued', 'processing', 'review_ready', 'failed', 'archived'
  )),
  occurred_at timestamptz not null default now(),
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  constraint hdi_sessions_retention_order
    check (retention_until is null or retention_until >= occurred_at)
);

create index if not exists idx_hdi_sessions_source_hash_org
  on public.hdi_sessions (organization_id, source_hash);
create index if not exists idx_hdi_sessions_review_queue
  on public.hdi_sessions (organization_id, status, created_at desc);
create index if not exists idx_hdi_sessions_lens
  on public.hdi_sessions (organization_id, lens, occurred_at desc);

create table if not exists public.hdi_subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  opaque_external_ref text not null,
  subject_type text not null check (subject_type in (
    'adult_employee', 'adult_candidate', 'adult_participant', 'leader'
  )),
  display_label text not null check (char_length(btrim(display_label)) between 1 and 80),
  baseline_policy text not null default 'self_longitudinal'
    check (baseline_policy = 'self_longitudinal'),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, opaque_external_ref)
);

create table if not exists public.hdi_session_subjects (
  session_id uuid not null,
  subject_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  participant_label text not null,
  role text,
  created_at timestamptz not null default now(),
  primary key (session_id, subject_id),
  foreign key (session_id, organization_id)
    references public.hdi_sessions(id, organization_id) on delete restrict,
  foreign key (subject_id, organization_id)
    references public.hdi_subjects(id, organization_id) on delete restrict
);

create table if not exists public.hdi_consent_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  session_id uuid,
  subject_id uuid,
  actor_id uuid references auth.users(id) on delete restrict,
  event_type text not null check (event_type in (
    'granted', 'refused', 'withdrawn', 'expired', 'verified'
  )),
  scope text not null check (scope in (
    'recording', 'transcription', 'development_analysis', 'human_review', 'longitudinal_tracking'
  )),
  policy_version text not null,
  evidence jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence) = 'object'),
  occurred_at timestamptz not null default now(),
  foreign key (session_id, organization_id)
    references public.hdi_sessions(id, organization_id) on delete restrict,
  foreign key (subject_id, organization_id)
    references public.hdi_subjects(id, organization_id) on delete restrict
);

create index if not exists idx_hdi_consent_latest
  on public.hdi_consent_events (
    organization_id, session_id, subject_id, scope, occurred_at desc
  );

create table if not exists public.hdi_rubrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  rubric_key text not null,
  name text not null,
  lens text not null check (lens in (
    'enterprise_meeting',
    'interview_coaching',
    'interviewer_quality',
    'leadership_coaching'
  )),
  purpose text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, rubric_key)
);

create table if not exists public.hdi_rubric_versions (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid not null references public.hdi_rubrics(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  version integer not null check (version > 0),
  criteria jsonb not null check (jsonb_typeof(criteria) = 'array'),
  guardrails jsonb not null default '[]'::jsonb
    check (jsonb_typeof(guardrails) = 'array'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (rubric_id, version),
  foreign key (rubric_id, organization_id)
    references public.hdi_rubrics(id, organization_id) on delete restrict
);

create table if not exists public.hdi_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  session_id uuid not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  rubric_key text not null,
  rubric_version integer not null check (rubric_version > 0),
  model text not null,
  model_response_id text,
  prompt_version text not null,
  schema_version text not null,
  status text not null default 'processing' check (status in (
    'processing', 'review_ready', 'failed', 'superseded'
  )),
  summary text not null,
  strengths jsonb not null default '[]'::jsonb check (jsonb_typeof(strengths) = 'array'),
  growth_areas jsonb not null default '[]'::jsonb check (jsonb_typeof(growth_areas) = 'array'),
  limitations jsonb not null default '[]'::jsonb check (jsonb_typeof(limitations) = 'array'),
  safety_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(safety_flags) = 'array'),
  processing_duration_ms integer check (processing_duration_ms is null or processing_duration_ms >= 0),
  human_review_status text not null default 'pending' check (human_review_status in (
    'pending', 'approved', 'needs_revision', 'rejected'
  )),
  human_review_note text,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (session_id, organization_id)
    references public.hdi_sessions(id, organization_id) on delete restrict,
  constraint hdi_analysis_review_pair check (
    (human_review_status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (
      human_review_status <> 'pending'
      and reviewed_at is not null
      and reviewed_by is not null
      and (
        human_review_status = 'approved'
        or nullif(btrim(human_review_note), '') is not null
      )
    )
  )
);

create index if not exists idx_hdi_analyses_review_queue
  on public.hdi_analyses (organization_id, human_review_status, created_at desc);
create index if not exists idx_hdi_analyses_session
  on public.hdi_analyses (session_id, created_at desc);

create table if not exists public.hdi_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  analysis_id uuid not null,
  subject_id uuid,
  criterion_key text not null,
  criterion_label text not null,
  evidence_level text not null check (evidence_level in (
    'demonstrated', 'emerging', 'not_observed'
  )),
  observation text not null,
  evidence_quote text not null,
  speaker_label text,
  start_ms integer check (start_ms is null or start_ms >= 0),
  end_ms integer check (end_ms is null or end_ms >= 0),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  developmental_action text not null,
  created_at timestamptz not null default now(),
  unique (id, analysis_id, organization_id),
  foreign key (analysis_id, organization_id)
    references public.hdi_analyses(id, organization_id) on delete restrict,
  foreign key (subject_id, organization_id)
    references public.hdi_subjects(id, organization_id) on delete restrict,
  constraint hdi_evidence_time_order
    check (end_ms is null or start_ms is null or end_ms >= start_ms)
);

create index if not exists idx_hdi_evidence_analysis
  on public.hdi_evidence (analysis_id, criterion_key);
create index if not exists idx_hdi_evidence_subject
  on public.hdi_evidence (subject_id, created_at desc)
  where subject_id is not null;

create table if not exists public.hdi_profile_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  subject_id uuid not null,
  analysis_id uuid not null,
  evidence_id uuid not null,
  metric_key text not null,
  evidence_level text not null check (evidence_level in (
    'demonstrated', 'emerging', 'not_observed'
  )),
  baseline_policy text not null default 'self_longitudinal'
    check (baseline_policy = 'self_longitudinal'),
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (subject_id, organization_id)
    references public.hdi_subjects(id, organization_id) on delete restrict,
  foreign key (analysis_id, organization_id)
    references public.hdi_analyses(id, organization_id) on delete restrict,
  foreign key (evidence_id, analysis_id, organization_id)
    references public.hdi_evidence(id, analysis_id, organization_id) on delete restrict
);

create index if not exists idx_hdi_profile_observations_trend
  on public.hdi_profile_observations (subject_id, metric_key, observed_at);

create table if not exists public.hdi_commitments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  analysis_id uuid not null,
  subject_id uuid,
  statement text not null,
  owner_label text,
  due_date date,
  evidence_quote text not null,
  status text not null default 'open' check (status in (
    'open', 'completed', 'changed', 'cancelled', 'unverified'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  ,unique (id, organization_id)
  ,foreign key (analysis_id, organization_id)
    references public.hdi_analyses(id, organization_id) on delete restrict
  ,foreign key (subject_id, organization_id)
    references public.hdi_subjects(id, organization_id) on delete restrict
);

create index if not exists idx_hdi_commitments_open
  on public.hdi_commitments (organization_id, status, due_date)
  where status in ('open', 'unverified');

create table if not exists public.hdi_commitment_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  commitment_id uuid not null,
  actor_id uuid references auth.users(id) on delete restrict,
  event_type text not null check (event_type in (
    'created', 'confirmed', 'changed', 'completed', 'cancelled', 'evidence_added'
  )),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  occurred_at timestamptz not null default now(),
  foreign key (commitment_id, organization_id)
    references public.hdi_commitments(id, organization_id) on delete restrict
);

create table if not exists public.hdi_audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict,
  event_type text not null,
  resource_type text not null,
  resource_id text,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object'),
  occurred_at timestamptz not null default now()
);

create index if not exists idx_hdi_audit_events_org_time
  on public.hdi_audit_events (organization_id, occurred_at desc);

create or replace function public.hdi_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.hdi_reject_ledger_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'HDI ledger rows are append-only';
end;
$$;

create or replace function public.hdi_begin_session(
  p_organization_id uuid,
  p_requested_by uuid,
  p_session jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_requested_by
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI access denied';
  end if;

  insert into public.hdi_sessions (
    organization_id, created_by, title, lens, source_type, source_hash,
    participant_labels, consent_status, raw_content_stored, occurred_at, status
  ) values (
    p_organization_id,
    p_requested_by,
    p_session->>'title',
    p_session->>'lens',
    p_session->>'source_type',
    p_session->>'source_hash',
    coalesce(p_session->'participant_labels', '[]'::jsonb),
    'confirmed',
    false,
    (p_session->>'occurred_at')::timestamptz,
    'queued'
  ) returning id into v_session_id;

  insert into public.hdi_consent_events (
    organization_id, session_id, actor_id, event_type, scope,
    policy_version, evidence
  ) values
    (p_organization_id, v_session_id, p_requested_by, 'verified',
     'development_analysis', 'hdi-consent-v1',
     jsonb_build_object('attestation', 'client_confirmation')),
    (p_organization_id, v_session_id, p_requested_by, 'verified',
     'human_review', 'hdi-consent-v1',
     jsonb_build_object('attestation', 'client_confirmation'));

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_requested_by, 'session.consent_verified',
    'hdi_session', v_session_id::text,
    jsonb_build_object('policy_version', 'hdi-consent-v1')
  );

  return v_session_id;
end;
$$;

create or replace function public.hdi_persist_analysis(
  p_organization_id uuid,
  p_requested_by uuid,
  p_session_id uuid,
  p_analysis jsonb,
  p_observations jsonb,
  p_commitments jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_analysis_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_requested_by
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI access denied';
  end if;

  if not exists (
    select 1 from public.hdi_sessions s
    where s.id = p_session_id
      and s.organization_id = p_organization_id
      and s.created_by = p_requested_by
      and s.status = 'queued'
      and s.consent_status = 'confirmed'
      and exists (
        select 1 from public.hdi_consent_events c
        where c.session_id = s.id
          and c.organization_id = s.organization_id
          and c.scope = 'development_analysis'
          and c.event_type in ('granted', 'verified')
      )
  ) then
    raise exception 'HDI session is not eligible for analysis';
  end if;

  insert into public.hdi_analyses (
    organization_id, session_id, requested_by, rubric_key, rubric_version,
    model, model_response_id, prompt_version, schema_version, status, summary,
    strengths, growth_areas, limitations, safety_flags, processing_duration_ms,
    human_review_status
  ) values (
    p_organization_id, p_session_id, p_requested_by,
    p_analysis->>'rubric_key', (p_analysis->>'rubric_version')::integer,
    p_analysis->>'model', p_analysis->>'model_response_id',
    p_analysis->>'prompt_version', p_analysis->>'schema_version',
    'review_ready', p_analysis->>'summary',
    coalesce(p_analysis->'strengths', '[]'::jsonb),
    coalesce(p_analysis->'growth_areas', '[]'::jsonb),
    coalesce(p_analysis->'limitations', '[]'::jsonb),
    coalesce(p_analysis->'safety_flags', '[]'::jsonb),
    (p_analysis->>'processing_duration_ms')::integer,
    'pending'
  ) returning id into v_analysis_id;

  insert into public.hdi_evidence (
    organization_id, analysis_id, criterion_key, criterion_label,
    evidence_level, observation, evidence_quote, speaker_label, start_ms,
    end_ms, confidence, developmental_action
  )
  select
    p_organization_id, v_analysis_id,
    item->>'criterion_key', item->>'criterion_label', item->>'evidence_level',
    item->>'observation', item->>'evidence_quote', item->>'speaker_label',
    nullif(item->>'start_ms', '')::integer,
    nullif(item->>'end_ms', '')::integer,
    (item->>'confidence')::numeric,
    item->>'developmental_action'
  from jsonb_array_elements(coalesce(p_observations, '[]'::jsonb)) item;

  with inserted as (
    insert into public.hdi_commitments (
      organization_id, analysis_id, statement, owner_label, due_date,
      evidence_quote, status
    )
    select
      p_organization_id, v_analysis_id, item->>'statement',
      item->>'owner_label', nullif(item->>'due_date', '')::date,
      item->>'evidence_quote', 'open'
    from jsonb_array_elements(coalesce(p_commitments, '[]'::jsonb)) item
    returning id
  )
  insert into public.hdi_commitment_events (
    organization_id, commitment_id, actor_id, event_type, evidence
  )
  select p_organization_id, id, p_requested_by, 'created', '{}'::jsonb
  from inserted;

  update public.hdi_sessions
  set status = 'review_ready'
  where id = p_session_id and organization_id = p_organization_id;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_requested_by, 'analysis.created', 'hdi_analysis',
    v_analysis_id::text,
    jsonb_build_object(
      'model', p_analysis->>'model',
      'evidence_count', jsonb_array_length(coalesce(p_observations, '[]'::jsonb)),
      'raw_content_stored', false
    )
  );

  return v_analysis_id;
end;
$$;

create or replace function public.hdi_fail_session(
  p_organization_id uuid,
  p_requested_by uuid,
  p_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.hdi_sessions
  set status = 'failed'
  where id = p_session_id
    and organization_id = p_organization_id
    and created_by = p_requested_by
    and status = 'queued';

  if not found then
    raise exception 'HDI session not found';
  end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id
  ) values (
    p_organization_id, p_requested_by, 'analysis.failed',
    'hdi_session', p_session_id::text
  );
end;
$$;

create or replace function public.hdi_review_analysis(
  p_organization_id uuid,
  p_reviewer_id uuid,
  p_analysis_id uuid,
  p_status text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('approved', 'needs_revision', 'rejected') then
    raise exception 'Invalid HDI review status';
  end if;
  if p_status in ('needs_revision', 'rejected') and nullif(btrim(p_note), '') is null then
    raise exception 'A review note is required for this status';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_reviewer_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI review access denied';
  end if;

  update public.hdi_analyses
  set human_review_status = p_status,
      human_review_note = nullif(btrim(p_note), ''),
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  where id = p_analysis_id
    and organization_id = p_organization_id
    and status = 'review_ready';

  if not found then
    raise exception 'HDI analysis not found';
  end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_reviewer_id, 'analysis.reviewed', 'hdi_analysis',
    p_analysis_id::text, jsonb_build_object('status', p_status, 'note', p_note)
  );
end;
$$;

drop trigger if exists hdi_sessions_set_updated_at on public.hdi_sessions;
create trigger hdi_sessions_set_updated_at
  before update on public.hdi_sessions
  for each row execute function public.hdi_set_updated_at();

drop trigger if exists hdi_subjects_set_updated_at on public.hdi_subjects;
create trigger hdi_subjects_set_updated_at
  before update on public.hdi_subjects
  for each row execute function public.hdi_set_updated_at();

drop trigger if exists hdi_analyses_set_updated_at on public.hdi_analyses;
create trigger hdi_analyses_set_updated_at
  before update on public.hdi_analyses
  for each row execute function public.hdi_set_updated_at();

drop trigger if exists hdi_commitments_set_updated_at on public.hdi_commitments;
create trigger hdi_commitments_set_updated_at
  before update on public.hdi_commitments
  for each row execute function public.hdi_set_updated_at();

drop trigger if exists hdi_consent_events_append_only on public.hdi_consent_events;
create trigger hdi_consent_events_append_only
  before update or delete on public.hdi_consent_events
  for each row execute function public.hdi_reject_ledger_mutation();

drop trigger if exists hdi_commitment_events_append_only on public.hdi_commitment_events;
create trigger hdi_commitment_events_append_only
  before update or delete on public.hdi_commitment_events
  for each row execute function public.hdi_reject_ledger_mutation();

drop trigger if exists hdi_audit_events_append_only on public.hdi_audit_events;
create trigger hdi_audit_events_append_only
  before update or delete on public.hdi_audit_events
  for each row execute function public.hdi_reject_ledger_mutation();

alter table public.hdi_sessions enable row level security;
alter table public.hdi_subjects enable row level security;
alter table public.hdi_session_subjects enable row level security;
alter table public.hdi_consent_events enable row level security;
alter table public.hdi_rubrics enable row level security;
alter table public.hdi_rubric_versions enable row level security;
alter table public.hdi_analyses enable row level security;
alter table public.hdi_evidence enable row level security;
alter table public.hdi_profile_observations enable row level security;
alter table public.hdi_commitments enable row level security;
alter table public.hdi_commitment_events enable row level security;
alter table public.hdi_audit_events enable row level security;

revoke all on public.hdi_sessions from anon, authenticated;
revoke all on public.hdi_subjects from anon, authenticated;
revoke all on public.hdi_session_subjects from anon, authenticated;
revoke all on public.hdi_consent_events from anon, authenticated;
revoke all on public.hdi_rubrics from anon, authenticated;
revoke all on public.hdi_rubric_versions from anon, authenticated;
revoke all on public.hdi_analyses from anon, authenticated;
revoke all on public.hdi_evidence from anon, authenticated;
revoke all on public.hdi_profile_observations from anon, authenticated;
revoke all on public.hdi_commitments from anon, authenticated;
revoke all on public.hdi_commitment_events from anon, authenticated;
revoke all on public.hdi_audit_events from anon, authenticated;

revoke all on public.hdi_sessions from service_role;
revoke all on public.hdi_subjects from service_role;
revoke all on public.hdi_session_subjects from service_role;
revoke all on public.hdi_consent_events from service_role;
revoke all on public.hdi_rubrics from service_role;
revoke all on public.hdi_rubric_versions from service_role;
revoke all on public.hdi_analyses from service_role;
revoke all on public.hdi_evidence from service_role;
revoke all on public.hdi_profile_observations from service_role;
revoke all on public.hdi_commitments from service_role;
revoke all on public.hdi_commitment_events from service_role;
revoke all on public.hdi_audit_events from service_role;

grant select, insert, update on public.hdi_sessions to service_role;
grant select, insert, update on public.hdi_subjects to service_role;
grant select, insert on public.hdi_session_subjects to service_role;
grant select, insert on public.hdi_consent_events to service_role;
grant select, insert, update on public.hdi_rubrics to service_role;
grant select, insert on public.hdi_rubric_versions to service_role;
grant select, insert, update on public.hdi_analyses to service_role;
grant select, insert on public.hdi_evidence to service_role;
grant select, insert on public.hdi_profile_observations to service_role;
grant select, insert, update on public.hdi_commitments to service_role;
grant select, insert on public.hdi_commitment_events to service_role;
grant select, insert on public.hdi_audit_events to service_role;
grant usage, select on sequence public.hdi_consent_events_id_seq to service_role;
grant usage, select on sequence public.hdi_commitment_events_id_seq to service_role;
grant usage, select on sequence public.hdi_audit_events_id_seq to service_role;

revoke all on function public.hdi_set_updated_at() from public, anon, authenticated;
revoke all on function public.hdi_reject_ledger_mutation() from public, anon, authenticated;
revoke all on function public.hdi_begin_session(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.hdi_persist_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.hdi_fail_session(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.hdi_review_analysis(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.hdi_begin_session(uuid, uuid, jsonb) to service_role;
grant execute on function public.hdi_persist_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.hdi_fail_session(uuid, uuid, uuid) to service_role;
grant execute on function public.hdi_review_analysis(uuid, uuid, uuid, text, text) to service_role;

create policy "service_role_hdi_sessions"
  on public.hdi_sessions for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_subjects"
  on public.hdi_subjects for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_session_subjects"
  on public.hdi_session_subjects for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_consent_events"
  on public.hdi_consent_events for select to service_role using (true);
create policy "service_role_hdi_consent_events_insert"
  on public.hdi_consent_events for insert to service_role with check (true);
create policy "service_role_hdi_rubrics"
  on public.hdi_rubrics for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_rubric_versions"
  on public.hdi_rubric_versions for select to service_role using (true);
create policy "service_role_hdi_rubric_versions_insert"
  on public.hdi_rubric_versions for insert to service_role with check (true);
create policy "service_role_hdi_analyses"
  on public.hdi_analyses for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_evidence"
  on public.hdi_evidence for select to service_role using (true);
create policy "service_role_hdi_evidence_insert"
  on public.hdi_evidence for insert to service_role with check (true);
create policy "service_role_hdi_profile_observations"
  on public.hdi_profile_observations for select to service_role using (true);
create policy "service_role_hdi_profile_observations_insert"
  on public.hdi_profile_observations for insert to service_role with check (true);
create policy "service_role_hdi_commitments"
  on public.hdi_commitments for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_commitment_events"
  on public.hdi_commitment_events for select to service_role using (true);
create policy "service_role_hdi_commitment_events_insert"
  on public.hdi_commitment_events for insert to service_role with check (true);
create policy "service_role_hdi_audit_events"
  on public.hdi_audit_events for select to service_role using (true);
create policy "service_role_hdi_audit_events_insert"
  on public.hdi_audit_events for insert to service_role with check (true);

comment on table public.hdi_sessions is
  'Deidentified HDI session control records. Raw transcripts and media are prohibited in this database.';
comment on table public.hdi_consent_events is
  'Append-only consent ledger for HDI processing scopes.';
comment on table public.hdi_analyses is
  'Evidence-first AI analysis with model provenance and mandatory human-review state.';
comment on table public.hdi_evidence is
  'Timestamp-capable transcript-grounded observations tied to rubric criteria.';
comment on table public.hdi_profile_observations is
  'Longitudinal observations measured only against the same subject baseline.';
comment on table public.hdi_commitments is
  'Explicit stated commitments and factual follow-through status, not character inference.';
comment on table public.hdi_audit_events is
  'Append-only HDI access, processing, review, export, consent, and deletion audit history.';

commit;
