-- Signed Workforce -> Perpetual Core derived-envelope ingestion.
-- The contract intentionally excludes raw media, full transcripts, student PII,
-- source storage paths, and automated employment recommendations.

begin;

create unique index if not exists hdi_sessions_source_locator_unique
  on public.hdi_sessions (organization_id, source_type, source_locator)
  where source_locator is not null;

create or replace function public.hdi_ingest_workforce_envelope(
  p_organization_id uuid,
  p_actor_id uuid,
  p_envelope jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_subject_id uuid;
  v_analysis_id uuid;
  v_existing_analysis_id uuid;
  v_evidence_id uuid;
  v_observation jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI workforce receiver access denied';
  end if;

  if p_envelope->>'sourceType' <> 'workforce_envelope'
    or p_envelope->>'lens' <> 'interview_coaching'
    or coalesce((p_envelope->>'rawContentStored')::boolean, true) then
    raise exception 'Invalid HDI workforce envelope boundary';
  end if;

  select a.id into v_existing_analysis_id
  from public.hdi_sessions s
  join public.hdi_analyses a
    on a.session_id = s.id and a.organization_id = s.organization_id
  where s.organization_id = p_organization_id
    and s.source_type = 'workforce_envelope'
    and s.source_locator = p_envelope->>'eventId'
  limit 1;
  if found then return v_existing_analysis_id; end if;

  insert into public.hdi_subjects (
    organization_id, opaque_external_ref, subject_type, display_label,
    baseline_policy, status
  ) values (
    p_organization_id, p_envelope->>'opaqueSubjectRef', 'adult_candidate',
    'Workforce participant', 'self_longitudinal', 'active'
  )
  on conflict (organization_id, opaque_external_ref) do nothing;

  select id into v_subject_id from public.hdi_subjects
  where organization_id = p_organization_id
    and opaque_external_ref = p_envelope->>'opaqueSubjectRef';

  insert into public.hdi_sessions (
    organization_id, created_by, title, lens, source_type, source_locator,
    source_hash, participant_labels, consent_status, raw_content_stored,
    status, occurred_at
  ) values (
    p_organization_id, p_actor_id, p_envelope->>'sessionTitle',
    'interview_coaching', 'workforce_envelope', p_envelope->>'eventId',
    p_envelope->>'sourceHash', '["Candidate"]'::jsonb, 'confirmed', false,
    'processing', (p_envelope->>'occurredAt')::timestamptz
  ) returning id into v_session_id;

  insert into public.hdi_session_subjects (
    session_id, subject_id, organization_id, participant_label, role
  ) values (
    v_session_id, v_subject_id, p_organization_id, 'Candidate',
    p_envelope->>'roleCategory'
  );

  insert into public.hdi_consent_events (
    organization_id, session_id, subject_id, actor_id, event_type, scope,
    policy_version, evidence, occurred_at
  ) values
    (p_organization_id, v_session_id, v_subject_id, null, 'verified',
     'development_analysis', p_envelope#>>'{consent,policyVersion}',
     jsonb_build_object('source', 'uplift_workforce', 'event_id', p_envelope->>'eventId'),
     (p_envelope#>>'{consent,verifiedAt}')::timestamptz),
    (p_organization_id, v_session_id, v_subject_id, null, 'verified',
     'human_review', p_envelope#>>'{consent,policyVersion}',
     jsonb_build_object('source', 'uplift_workforce', 'event_id', p_envelope->>'eventId'),
     (p_envelope#>>'{consent,verifiedAt}')::timestamptz),
    (p_organization_id, v_session_id, v_subject_id, null, 'verified',
     'longitudinal_tracking', p_envelope#>>'{consent,policyVersion}',
     jsonb_build_object('source', 'uplift_workforce', 'event_id', p_envelope->>'eventId'),
     (p_envelope#>>'{consent,verifiedAt}')::timestamptz);

  insert into public.hdi_analyses (
    organization_id, session_id, requested_by, rubric_key, rubric_version,
    model, model_response_id, prompt_version, schema_version, status, summary,
    strengths, growth_areas, limitations, safety_flags, human_review_status
  ) values (
    p_organization_id, v_session_id, p_actor_id,
    p_envelope#>>'{provenance,rubricKey}',
    (p_envelope#>>'{provenance,rubricVersion}')::integer,
    p_envelope#>>'{provenance,model}', p_envelope->>'eventId',
    p_envelope#>>'{provenance,promptVersion}', p_envelope->>'schemaVersion',
    'review_ready', p_envelope->>'summary',
    coalesce(p_envelope->'strengths', '[]'::jsonb),
    coalesce(p_envelope->'growthAreas', '[]'::jsonb),
    coalesce(p_envelope->'limitations', '[]'::jsonb),
    coalesce(p_envelope->'safetyFlags', '[]'::jsonb), 'pending'
  ) returning id into v_analysis_id;

  for v_observation in
    select value from jsonb_array_elements(p_envelope->'observations')
  loop
    insert into public.hdi_evidence (
      organization_id, analysis_id, subject_id, criterion_key,
      criterion_label, evidence_level, observation, evidence_quote,
      speaker_label, start_ms, end_ms, confidence, developmental_action
    ) values (
      p_organization_id, v_analysis_id, v_subject_id,
      v_observation->>'criterionKey', v_observation->>'criterionLabel',
      v_observation->>'evidenceLevel', v_observation->>'observation',
      v_observation->>'evidenceQuote', v_observation->>'speakerLabel',
      nullif(v_observation->>'startMs', '')::integer,
      nullif(v_observation->>'endMs', '')::integer,
      (v_observation->>'confidence')::numeric,
      v_observation->>'developmentalAction'
    ) returning id into v_evidence_id;

    insert into public.hdi_profile_observations (
      organization_id, subject_id, analysis_id, evidence_id, metric_key,
      evidence_level, baseline_policy, observed_at
    ) values (
      p_organization_id, v_subject_id, v_analysis_id, v_evidence_id,
      v_observation->>'criterionKey', v_observation->>'evidenceLevel',
      'self_longitudinal', (p_envelope->>'occurredAt')::timestamptz
    );
  end loop;

  update public.hdi_sessions set status = 'review_ready'
  where id = v_session_id and organization_id = p_organization_id;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'workforce_envelope.accepted',
    'hdi_analysis', v_analysis_id::text,
    jsonb_build_object(
      'event_id', p_envelope->>'eventId',
      'evidence_count', jsonb_array_length(p_envelope->'observations'),
      'raw_content_stored', false,
      'source_system', 'uplift_workforce'
    )
  );

  return v_analysis_id;
exception
  when unique_violation then
    select a.id into v_existing_analysis_id
    from public.hdi_sessions s
    join public.hdi_analyses a
      on a.session_id = s.id and a.organization_id = s.organization_id
    where s.organization_id = p_organization_id
      and s.source_type = 'workforce_envelope'
      and s.source_locator = p_envelope->>'eventId'
    limit 1;
    if v_existing_analysis_id is not null then return v_existing_analysis_id; end if;
    raise;
end;
$$;

revoke all on function public.hdi_ingest_workforce_envelope(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.hdi_ingest_workforce_envelope(uuid, uuid, jsonb)
  to service_role;

comment on function public.hdi_ingest_workforce_envelope(uuid, uuid, jsonb) is
  'Idempotently persists a signed, pseudonymous Workforce coaching envelope without raw media or transcript.';

commit;
