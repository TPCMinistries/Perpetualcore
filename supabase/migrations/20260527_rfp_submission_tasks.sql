-- Persistent submission workroom tasks for proposal closeout.
-- Turns generated readiness artifacts into assignable operational work.

create table if not exists public.rfp_submission_tasks (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.rfp_proposals(id) on delete cascade,
  source_type text not null check (
    source_type in ('verify_marker', 'compliance', 'packet', 'reviewer', 'manual')
  ),
  source_id text not null,
  title text not null,
  detail text not null default '',
  owner_label text not null default 'Unassigned',
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'blocked', 'resolved', 'waived')
  ),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'critical')
  ),
  due_date date,
  notes text not null default '',
  evidence text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposal_id, source_type, source_id)
);

create index if not exists rfp_submission_tasks_proposal_idx
  on public.rfp_submission_tasks (proposal_id, status, priority);

drop trigger if exists rfp_submission_tasks_set_updated_at on public.rfp_submission_tasks;

create trigger rfp_submission_tasks_set_updated_at
  before update on public.rfp_submission_tasks
  for each row
  execute function public.rfp_set_updated_at();

alter table public.rfp_submission_tasks enable row level security;

drop policy if exists rfp_submission_tasks_select on public.rfp_submission_tasks;
drop policy if exists rfp_submission_tasks_insert on public.rfp_submission_tasks;
drop policy if exists rfp_submission_tasks_update on public.rfp_submission_tasks;
drop policy if exists rfp_submission_tasks_delete on public.rfp_submission_tasks;

create policy rfp_submission_tasks_select on public.rfp_submission_tasks
  for select using (
    proposal_id in (
      select id from public.rfp_proposals
      where org_id = any(public.rfp_my_org_ids())
    )
  );

create policy rfp_submission_tasks_insert on public.rfp_submission_tasks
  for insert with check (
    proposal_id in (
      select id from public.rfp_proposals
      where org_id = any(public.rfp_my_org_ids_with_role(array['owner','writer','reviewer']))
    )
  );

create policy rfp_submission_tasks_update on public.rfp_submission_tasks
  for update using (
    proposal_id in (
      select id from public.rfp_proposals
      where org_id = any(public.rfp_my_org_ids_with_role(array['owner','writer','reviewer']))
    )
  ) with check (
    proposal_id in (
      select id from public.rfp_proposals
      where org_id = any(public.rfp_my_org_ids_with_role(array['owner','writer','reviewer']))
    )
  );

create policy rfp_submission_tasks_delete on public.rfp_submission_tasks
  for delete using (
    proposal_id in (
      select id from public.rfp_proposals
      where org_id = any(public.rfp_my_org_ids_with_role(array['owner']))
    )
  );
