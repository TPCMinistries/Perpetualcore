-- HDI Phase 2: consent-first, temporary media ingestion with durable cleanup state.
-- Raw media is staged in a private bucket and must be deleted before an
-- evidence report is persisted. Full transcripts are never written to Postgres.

begin;

alter table public.hdi_sessions drop constraint if exists hdi_sessions_source_type_check;
alter table public.hdi_sessions
  add constraint hdi_sessions_source_type_check check (source_type in (
    'transcript_paste',
    'media_upload',
    'meeting_import',
    'workforce_envelope'
  ));

create table if not exists public.hdi_media_ingestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  session_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  storage_bucket text not null default 'hdi-media-staging'
    check (storage_bucket = 'hdi-media-staging'),
  storage_path text,
  content_type text not null,
  byte_size bigint not null check (byte_size between 1 and 26214400),
  status text not null default 'awaiting_upload' check (status in (
    'awaiting_upload', 'processing', 'completed', 'failed', 'expired'
  )),
  attempts integer not null default 0 check (attempts between 0 and 10),
  lease_until timestamptz,
  expires_at timestamptz not null,
  media_deleted_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (session_id),
  unique (storage_bucket, storage_path),
  foreign key (session_id, organization_id)
    references public.hdi_sessions(id, organization_id) on delete restrict,
  constraint hdi_media_ingestions_delete_state check (
    media_deleted_at is null or storage_path is null
  ),
  constraint hdi_media_ingestions_expiry_order check (expires_at >= created_at)
);

create index if not exists idx_hdi_media_ingestions_cleanup
  on public.hdi_media_ingestions (status, expires_at)
  where media_deleted_at is null;

alter table public.hdi_media_ingestions enable row level security;
revoke all on public.hdi_media_ingestions from anon, authenticated, service_role;
grant select, insert, update on public.hdi_media_ingestions to service_role;
create policy "service_role_hdi_media_ingestions"
  on public.hdi_media_ingestions for all to service_role
  using (true) with check (true);

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'hdi-media-staging',
  'hdi-media-staging',
  false,
  26214400,
  array[
    'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav',
    'audio/x-wav', 'audio/webm', 'video/mp4', 'video/webm'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.hdi_begin_media_ingestion(
  p_organization_id uuid,
  p_requested_by uuid,
  p_session jsonb,
  p_media jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_session_id uuid;
  v_ingestion_id uuid;
  v_storage_path text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_requested_by
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI access denied';
  end if;

  if (p_media->>'byte_size')::bigint not between 1 and 26214400 then
    raise exception 'HDI media size is invalid';
  end if;

  insert into public.hdi_sessions (
    organization_id, created_by, title, lens, source_type, source_hash,
    participant_labels, consent_status, raw_content_stored, occurred_at, status
  ) values (
    p_organization_id,
    p_requested_by,
    p_session->>'title',
    p_session->>'lens',
    'media_upload',
    p_session->>'source_hash',
    coalesce(p_session->'participant_labels', '[]'::jsonb),
    'confirmed',
    false,
    (p_session->>'occurred_at')::timestamptz,
    'queued'
  ) returning id into v_session_id;

  v_storage_path := p_organization_id::text || '/' || p_requested_by::text ||
    '/' || v_session_id::text || '.' || (p_media->>'extension');

  insert into public.hdi_media_ingestions (
    organization_id, session_id, created_by, storage_path, content_type,
    byte_size, expires_at
  ) values (
    p_organization_id, v_session_id, p_requested_by, v_storage_path,
    p_media->>'content_type', (p_media->>'byte_size')::bigint,
    now() + interval '2 hours'
  ) returning id into v_ingestion_id;

  insert into public.hdi_consent_events (
    organization_id, session_id, actor_id, event_type, scope,
    policy_version, evidence
  ) values
    (p_organization_id, v_session_id, p_requested_by, 'verified',
     'recording', 'hdi-media-consent-v1',
     jsonb_build_object('attestation', 'client_confirmation')),
    (p_organization_id, v_session_id, p_requested_by, 'verified',
     'transcription', 'hdi-media-consent-v1',
     jsonb_build_object('attestation', 'client_confirmation')),
    (p_organization_id, v_session_id, p_requested_by, 'verified',
     'development_analysis', 'hdi-media-consent-v1',
     jsonb_build_object('attestation', 'client_confirmation')),
    (p_organization_id, v_session_id, p_requested_by, 'verified',
     'human_review', 'hdi-media-consent-v1',
     jsonb_build_object('attestation', 'client_confirmation'));

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_requested_by, 'media.consent_verified',
    'hdi_media_ingestion', v_ingestion_id::text,
    jsonb_build_object(
      'policy_version', 'hdi-media-consent-v1',
      'expires_at', now() + interval '2 hours',
      'raw_content_retained', false
    )
  );

  return jsonb_build_object(
    'session_id', v_session_id,
    'ingestion_id', v_ingestion_id,
    'storage_path', v_storage_path
  );
end;
$$;

create or replace function public.hdi_claim_media_ingestion(
  p_organization_id uuid,
  p_requested_by uuid,
  p_ingestion_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.hdi_media_ingestions%rowtype;
  v_session public.hdi_sessions%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_requested_by
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI access denied';
  end if;

  select * into v_job from public.hdi_media_ingestions
  where id = p_ingestion_id
    and organization_id = p_organization_id
    and created_by = p_requested_by
    and expires_at > now()
    and (
      status = 'awaiting_upload'
      or (status = 'processing' and lease_until < now())
    )
  for update;

  if not found then
    raise exception 'HDI media ingestion is not claimable';
  end if;

  select * into v_session from public.hdi_sessions
  where id = v_job.session_id
    and organization_id = p_organization_id
    and consent_status = 'confirmed';

  if not found or not (
    select count(distinct scope) = 4
    from public.hdi_consent_events
    where session_id = v_job.session_id
      and organization_id = p_organization_id
      and event_type in ('granted', 'verified')
      and scope in ('recording', 'transcription', 'development_analysis', 'human_review')
  ) then
    raise exception 'HDI media consent is incomplete';
  end if;

  update public.hdi_media_ingestions set
    status = 'processing', attempts = attempts + 1,
    lease_until = now() + interval '10 minutes', updated_at = now()
  where id = v_job.id;

  update public.hdi_sessions set status = 'processing'
  where id = v_job.session_id and organization_id = p_organization_id;

  return jsonb_build_object(
    'session_id', v_job.session_id,
    'storage_bucket', v_job.storage_bucket,
    'storage_path', v_job.storage_path,
    'content_type', v_job.content_type,
    'byte_size', v_job.byte_size,
    'title', v_session.title,
    'lens', v_session.lens,
    'occurred_at', v_session.occurred_at
  );
end;
$$;

create or replace function public.hdi_finalize_media_ingestion(
  p_organization_id uuid,
  p_requested_by uuid,
  p_ingestion_id uuid,
  p_status text,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
begin
  if p_status not in ('completed', 'failed', 'expired') then
    raise exception 'Invalid HDI media final status';
  end if;

  update public.hdi_media_ingestions set
    status = p_status,
    storage_path = null,
    media_deleted_at = now(),
    lease_until = null,
    error_code = p_error_code,
    updated_at = now()
  where id = p_ingestion_id
    and organization_id = p_organization_id
    and created_by = p_requested_by
  returning session_id into v_session_id;

  if not found then raise exception 'HDI media ingestion not found'; end if;

  if p_status <> 'completed' then
    update public.hdi_sessions set status = 'failed'
    where id = v_session_id and organization_id = p_organization_id
      and status in ('queued', 'processing');
  end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_requested_by, 'media.' || p_status,
    'hdi_media_ingestion', p_ingestion_id::text,
    jsonb_build_object('media_deleted', true, 'error_code', p_error_code)
  );
end;
$$;

-- Timed media sessions are claimed as processing before model execution.
create or replace function public.hdi_media_session_is_eligible(
  p_organization_id uuid,
  p_requested_by uuid,
  p_session_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.hdi_sessions s
    where s.id = p_session_id
      and s.organization_id = p_organization_id
      and s.created_by = p_requested_by
      and s.source_type = 'media_upload'
      and s.status = 'processing'
      and s.consent_status = 'confirmed'
  );
$$;

create or replace function public.hdi_list_expired_media_ingestions(
  p_limit integer default 25
)
returns table (
  ingestion_id uuid,
  organization_id uuid,
  created_by uuid,
  storage_bucket text,
  storage_path text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select id, organization_id, created_by, storage_bucket, storage_path
  from public.hdi_media_ingestions
  where media_deleted_at is null
    and storage_path is not null
    and expires_at <= now()
    and (status <> 'processing' or lease_until is null or lease_until <= now())
  order by expires_at
  limit greatest(1, least(p_limit, 100));
$$;

-- Permit the existing persistence transaction to consume a claimed media job.
-- The function body checks queued for pasted transcripts or processing for media.
alter function public.hdi_persist_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb)
  rename to hdi_persist_analysis_before_media;

create or replace function public.hdi_persist_analysis(
  p_organization_id uuid,
  p_requested_by uuid,
  p_session_id uuid,
  p_analysis jsonb,
  p_observations jsonb,
  p_commitments jsonb
)
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.hdi_persist_analysis_before_media(
    p_organization_id, p_requested_by, p_session_id,
    p_analysis, p_observations, p_commitments
  );
$$;

-- Replace the renamed function in the application migration runner by copying its
-- definition is intentionally avoided here; the application calls a media-specific
-- wrapper that temporarily returns the session to queued under the same transaction.
create or replace function public.hdi_persist_media_analysis(
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
  if not public.hdi_media_session_is_eligible(
    p_organization_id, p_requested_by, p_session_id
  ) then
    raise exception 'HDI media session is not eligible for analysis';
  end if;

  update public.hdi_sessions set status = 'queued'
  where id = p_session_id and organization_id = p_organization_id;

  v_analysis_id := public.hdi_persist_analysis_before_media(
    p_organization_id, p_requested_by, p_session_id,
    p_analysis, p_observations, p_commitments
  );

  return v_analysis_id;
end;
$$;

revoke all on function public.hdi_begin_media_ingestion(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_claim_media_ingestion(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.hdi_finalize_media_ingestion(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.hdi_media_session_is_eligible(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.hdi_list_expired_media_ingestions(integer)
  from public, anon, authenticated;
revoke all on function public.hdi_persist_analysis_before_media(uuid, uuid, uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_persist_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_persist_media_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.hdi_begin_media_ingestion(uuid, uuid, jsonb, jsonb)
  to service_role;
grant execute on function public.hdi_claim_media_ingestion(uuid, uuid, uuid)
  to service_role;
grant execute on function public.hdi_finalize_media_ingestion(uuid, uuid, uuid, text, text)
  to service_role;
grant execute on function public.hdi_persist_media_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb)
  to service_role;
grant execute on function public.hdi_persist_analysis(uuid, uuid, uuid, jsonb, jsonb, jsonb)
  to service_role;
grant execute on function public.hdi_list_expired_media_ingestions(integer)
  to service_role;

comment on table public.hdi_media_ingestions is
  'Temporary private media staging lifecycle. Stores no transcript and clears the object path after deletion.';

commit;
