-- Persist private worker derivatives that previously disappeared with the
-- worker's temporary directory.

alter table public.press_assets
  drop constraint if exists press_assets_kind_check;

alter table public.press_assets
  add constraint press_assets_kind_check
  check (kind in (
    'source','source_video','source_audio','image','logo','font','caption',
    'proxy','poster','waveform','other'
  ));

update storage.buckets
set allowed_mime_types = array(
  select distinct mime
  from unnest(coalesce(allowed_mime_types, '{}'::text[]) || array['application/json']) as mime
)
where id = 'press-assets';
