-- Governed review queue operations for agentic HDI runs.
-- Review decisions are explicit, tenant-scoped, immutable, and audited.

begin;

alter table public.hdi_agent_runs
  add column if not exists human_review_note text;

alter table public.hdi_agent_runs
  drop constraint if exists hdi_agent_run_review_pair;

alter table public.hdi_agent_runs
  add constraint hdi_agent_run_review_pair check (
    (
      human_review_status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
      and human_review_note is null
    )
    or (
      human_review_status <> 'pending'
      and reviewed_by is not null
      and reviewed_at is not null
      and (
        human_review_status = 'approved'
        or nullif(btrim(human_review_note), '') is not null
      )
    )
  );

create or replace function public.hdi_review_agent_run(
  p_organization_id uuid,
  p_reviewer_id uuid,
  p_run_id uuid,
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
    raise exception 'Invalid HDI agent run review status';
  end if;
  if char_length(coalesce(p_note, '')) > 2000 then
    raise exception 'HDI agent run review note is too long';
  end if;
  if p_status in ('needs_revision', 'rejected')
     and nullif(btrim(p_note), '') is null then
    raise exception 'A review note is required for this status';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_reviewer_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI agent run review access denied';
  end if;

  update public.hdi_agent_runs
  set human_review_status = p_status,
      human_review_note = nullif(btrim(p_note), ''),
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  where id = p_run_id
    and organization_id = p_organization_id
    and status = 'review_ready'
    and human_review_status = 'pending';

  if not found then
    raise exception 'HDI agent run is not pending review';
  end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id,
    p_reviewer_id,
    'agent_run.reviewed',
    'hdi_agent_run',
    p_run_id::text,
    jsonb_build_object(
      'status', p_status,
      'note', nullif(btrim(p_note), ''),
      'human_decision', true,
      'raw_content_stored', false
    )
  );
end;
$$;

create or replace function public.hdi_agent_run_summary(
  p_organization_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_summary jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI agent run summary access denied';
  end if;

  select jsonb_build_object(
    'total', count(*),
    'planned', count(*) filter (where status = 'planned'),
    'running', count(*) filter (where status = 'running'),
    'review_ready', count(*) filter (where status = 'review_ready'),
    'failed', count(*) filter (where status = 'failed'),
    'pending', count(*) filter (
      where status = 'review_ready' and human_review_status = 'pending'
    ),
    'approved', count(*) filter (where human_review_status = 'approved'),
    'needs_revision', count(*) filter (where human_review_status = 'needs_revision'),
    'rejected', count(*) filter (where human_review_status = 'rejected')
  ) into v_summary
  from public.hdi_agent_runs
  where organization_id = p_organization_id;

  return v_summary;
end;
$$;

revoke all on function public.hdi_review_agent_run(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.hdi_agent_run_summary(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.hdi_review_agent_run(uuid, uuid, uuid, text, text)
  to service_role;
grant execute on function public.hdi_agent_run_summary(uuid, uuid)
  to service_role;

comment on column public.hdi_agent_runs.human_review_note is
  'Bounded reviewer feedback about minimized results; raw transcript or media content is prohibited.';

commit;
