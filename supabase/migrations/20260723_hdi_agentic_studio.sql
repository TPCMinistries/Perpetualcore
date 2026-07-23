-- Agentic Playbook Studio for Perpetual Core Human Development Intelligence.
--
-- This additive control-plane schema persists inspectable plans, versioned
-- playbooks, minimized run results, and model provenance. Raw transcripts,
-- recordings, and video are prohibited from these records. Every result stays
-- pending until an owner/admin completes human review.

begin;

create table if not exists public.hdi_agent_playbooks (
  id uuid primary key default gen_random_uuid(),
  playbook_key uuid not null default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  name text not null check (char_length(btrim(name)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 8 and 800),
  goal_template text not null check (char_length(btrim(goal_template)) between 10 and 1500),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  activated_by uuid references auth.users(id) on delete restrict,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, playbook_key, version),
  constraint hdi_agent_playbook_activation_pair check (
    (status = 'active' and activated_by is not null and activated_at is not null)
    or status <> 'active'
  ),
  constraint hdi_agent_playbook_no_raw_content check (
    not (plan ?| array['transcript', 'rawTranscript', 'sourceText', 'recording', 'video'])
  )
);

create unique index if not exists idx_hdi_agent_playbooks_active
  on public.hdi_agent_playbooks (organization_id, playbook_key)
  where status = 'active';
create index if not exists idx_hdi_agent_playbooks_org_updated
  on public.hdi_agent_playbooks (organization_id, updated_at desc);

create table if not exists public.hdi_agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  playbook_id uuid,
  goal text not null check (char_length(btrim(goal)) between 10 and 1500),
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  synthesis jsonb not null default '{}'::jsonb check (jsonb_typeof(synthesis) = 'object'),
  status text not null default 'planned' check (status in (
    'planned', 'running', 'review_ready', 'failed'
  )),
  model text not null,
  model_response_id text,
  prompt_version text not null,
  schema_version text not null,
  processing_duration_ms integer check (
    processing_duration_ms is null or processing_duration_ms >= 0
  ),
  raw_content_stored boolean not null default false check (raw_content_stored = false),
  human_review_status text not null default 'pending' check (human_review_status in (
    'pending', 'approved', 'needs_revision', 'rejected'
  )),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (playbook_id, organization_id)
    references public.hdi_agent_playbooks(id, organization_id) on delete restrict,
  constraint hdi_agent_run_no_raw_content check (
    not (context ?| array['transcript', 'rawTranscript', 'sourceText', 'recording', 'video'])
    and not (plan ?| array['transcript', 'rawTranscript', 'sourceText', 'recording', 'video'])
    and not (synthesis ?| array['transcript', 'rawTranscript', 'sourceText', 'recording', 'video'])
  ),
  constraint hdi_agent_run_review_pair check (
    (human_review_status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (human_review_status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index if not exists idx_hdi_agent_runs_org_status
  on public.hdi_agent_runs (organization_id, status, created_at desc);
create index if not exists idx_hdi_agent_runs_review
  on public.hdi_agent_runs (organization_id, human_review_status, created_at desc);

create or replace function public.hdi_create_agent_playbook(
  p_organization_id uuid,
  p_actor_id uuid,
  p_playbook jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI agent playbook access denied';
  end if;

  insert into public.hdi_agent_playbooks (
    organization_id, name, description, goal_template, plan, created_by
  ) values (
    p_organization_id,
    p_playbook->>'name',
    p_playbook->>'description',
    p_playbook->>'goal_template',
    p_playbook->'plan',
    p_actor_id
  ) returning id into v_id;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_playbook.created',
    'hdi_agent_playbook', v_id::text,
    jsonb_build_object('version', 1, 'status', 'draft', 'raw_content_stored', false)
  );

  return v_id;
end;
$$;

create or replace function public.hdi_version_agent_playbook(
  p_organization_id uuid,
  p_actor_id uuid,
  p_source_id uuid,
  p_playbook jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source public.hdi_agent_playbooks%rowtype;
  v_id uuid;
  v_version integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI agent playbook access denied';
  end if;

  select * into v_source
  from public.hdi_agent_playbooks
  where id = p_source_id and organization_id = p_organization_id;
  if not found then raise exception 'HDI agent playbook not found'; end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.hdi_agent_playbooks
  where organization_id = p_organization_id
    and playbook_key = v_source.playbook_key;

  insert into public.hdi_agent_playbooks (
    playbook_key, organization_id, version, name, description,
    goal_template, plan, created_by
  ) values (
    v_source.playbook_key,
    p_organization_id,
    v_version,
    coalesce(nullif(p_playbook->>'name', ''), v_source.name),
    coalesce(nullif(p_playbook->>'description', ''), v_source.description),
    coalesce(nullif(p_playbook->>'goal_template', ''), v_source.goal_template),
    coalesce(p_playbook->'plan', v_source.plan),
    p_actor_id
  ) returning id into v_id;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_playbook.versioned',
    'hdi_agent_playbook', v_id::text,
    jsonb_build_object('source_id', p_source_id, 'version', v_version)
  );

  return v_id;
end;
$$;

create or replace function public.hdi_activate_agent_playbook(
  p_organization_id uuid,
  p_actor_id uuid,
  p_playbook_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_key uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI agent playbook access denied';
  end if;

  select playbook_key into v_key
  from public.hdi_agent_playbooks
  where id = p_playbook_id and organization_id = p_organization_id;
  if not found then raise exception 'HDI agent playbook not found'; end if;

  update public.hdi_agent_playbooks
  set status = 'archived'
  where organization_id = p_organization_id
    and playbook_key = v_key
    and status = 'active'
    and id <> p_playbook_id;

  update public.hdi_agent_playbooks
  set status = 'active', activated_by = p_actor_id, activated_at = now()
  where id = p_playbook_id and organization_id = p_organization_id;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_playbook.activated',
    'hdi_agent_playbook', p_playbook_id::text,
    jsonb_build_object('human_activation', true)
  );
end;
$$;

create or replace function public.hdi_create_agent_run(
  p_organization_id uuid,
  p_actor_id uuid,
  p_run jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_playbook_id uuid := nullif(p_run->>'playbook_id', '')::uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI agent run access denied';
  end if;
  if v_playbook_id is not null and not exists (
    select 1 from public.hdi_agent_playbooks
    where id = v_playbook_id and organization_id = p_organization_id
  ) then
    raise exception 'HDI agent playbook not found';
  end if;

  insert into public.hdi_agent_runs (
    organization_id, requested_by, playbook_id, goal, context, plan,
    model, model_response_id, prompt_version, schema_version,
    processing_duration_ms
  ) values (
    p_organization_id, p_actor_id, v_playbook_id, p_run->>'goal',
    coalesce(p_run->'context', '{}'::jsonb), p_run->'plan',
    p_run->>'model', p_run->>'model_response_id',
    p_run->>'prompt_version', p_run->>'schema_version',
    nullif(p_run->>'processing_duration_ms', '')::integer
  ) returning id into v_id;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_run.planned', 'hdi_agent_run',
    v_id::text,
    jsonb_build_object(
      'playbook_id', v_playbook_id,
      'model', p_run->>'model',
      'raw_content_stored', false,
      'human_review_required', true
    )
  );

  return v_id;
end;
$$;

create or replace function public.hdi_complete_agent_run(
  p_organization_id uuid,
  p_actor_id uuid,
  p_run_id uuid,
  p_synthesis jsonb,
  p_processing_duration_ms integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(p_synthesis) <> 'object' then
    raise exception 'HDI agent synthesis must be an object';
  end if;
  if octet_length(p_synthesis::text) > 100000 then
    raise exception 'HDI agent synthesis exceeds the minimized result limit';
  end if;

  update public.hdi_agent_runs
  set synthesis = p_synthesis,
      status = 'review_ready',
      processing_duration_ms = p_processing_duration_ms
  where id = p_run_id
    and organization_id = p_organization_id
    and requested_by = p_actor_id
    and status in ('planned', 'running');
  if not found then raise exception 'HDI agent run not found'; end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_run.review_ready', 'hdi_agent_run',
    p_run_id::text,
    jsonb_build_object('raw_content_stored', false, 'human_review_status', 'pending')
  );
end;
$$;

create or replace function public.hdi_start_agent_run(
  p_organization_id uuid,
  p_actor_id uuid,
  p_run_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.hdi_agent_runs
  set status = 'running'
  where id = p_run_id
    and organization_id = p_organization_id
    and requested_by = p_actor_id
    and status = 'planned';
  if not found then raise exception 'HDI planned agent run not found'; end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_run.started', 'hdi_agent_run',
    p_run_id::text, jsonb_build_object('raw_content_stored', false)
  );
end;
$$;

create or replace function public.hdi_fail_agent_run(
  p_organization_id uuid,
  p_actor_id uuid,
  p_run_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.hdi_agent_runs
  set status = 'failed'
  where id = p_run_id
    and organization_id = p_organization_id
    and requested_by = p_actor_id
    and status in ('planned', 'running');
  if not found then raise exception 'HDI active agent run not found'; end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'agent_run.failed', 'hdi_agent_run',
    p_run_id::text, jsonb_build_object('raw_content_stored', false)
  );
end;
$$;

drop trigger if exists hdi_agent_playbooks_set_updated_at on public.hdi_agent_playbooks;
create trigger hdi_agent_playbooks_set_updated_at
  before update on public.hdi_agent_playbooks
  for each row execute function public.hdi_set_updated_at();

drop trigger if exists hdi_agent_runs_set_updated_at on public.hdi_agent_runs;
create trigger hdi_agent_runs_set_updated_at
  before update on public.hdi_agent_runs
  for each row execute function public.hdi_set_updated_at();

alter table public.hdi_agent_playbooks enable row level security;
alter table public.hdi_agent_runs enable row level security;

revoke all on public.hdi_agent_playbooks from anon, authenticated, service_role;
revoke all on public.hdi_agent_runs from anon, authenticated, service_role;
grant select, insert, update on public.hdi_agent_playbooks to service_role;
grant select, insert, update on public.hdi_agent_runs to service_role;

revoke all on function public.hdi_create_agent_playbook(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_version_agent_playbook(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_activate_agent_playbook(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.hdi_create_agent_run(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_complete_agent_run(uuid, uuid, uuid, jsonb, integer)
  from public, anon, authenticated;
revoke all on function public.hdi_start_agent_run(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.hdi_fail_agent_run(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.hdi_create_agent_playbook(uuid, uuid, jsonb) to service_role;
grant execute on function public.hdi_version_agent_playbook(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.hdi_activate_agent_playbook(uuid, uuid, uuid) to service_role;
grant execute on function public.hdi_create_agent_run(uuid, uuid, jsonb) to service_role;
grant execute on function public.hdi_complete_agent_run(uuid, uuid, uuid, jsonb, integer) to service_role;
grant execute on function public.hdi_start_agent_run(uuid, uuid, uuid) to service_role;
grant execute on function public.hdi_fail_agent_run(uuid, uuid, uuid) to service_role;

create policy "service_role_hdi_agent_playbooks"
  on public.hdi_agent_playbooks for all to service_role
  using (true) with check (true);
create policy "service_role_hdi_agent_runs"
  on public.hdi_agent_runs for all to service_role
  using (true) with check (true);

comment on table public.hdi_agent_playbooks is
  'Versioned, inspectable HDI agent plans. Raw transcripts and media are prohibited.';
comment on table public.hdi_agent_runs is
  'Agentic HDI run provenance and minimized synthesis, always pending human review.';

commit;
