-- Follow-up kept separate because Phase 2 was activated through the guarded
-- manual workflow before migration history reconciliation.

begin;

update storage.buckets set allowed_mime_types = array[
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav',
  'audio/x-wav', 'audio/webm', 'video/mp4', 'video/webm'
]::text[]
where id = 'hdi-media-staging';

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

revoke all on function public.hdi_list_expired_media_ingestions(integer)
  from public, anon, authenticated;
grant execute on function public.hdi_list_expired_media_ingestions(integer)
  to service_role;

commit;
