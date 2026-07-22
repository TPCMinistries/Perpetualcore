-- Governed longitudinal profile operations for Human Development Intelligence.
--
-- These operations preserve the tenant boundary, require an owner/admin actor,
-- use the append-only consent and audit ledgers, and never store raw media or
-- transcript content in the control plane.

begin;

create or replace function public.hdi_create_subject(
  p_organization_id uuid,
  p_actor_id uuid,
  p_subject jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subject_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI profile access denied';
  end if;

  if coalesce((p_subject->>'consent_confirmed')::boolean, false) is not true then
    raise exception 'HDI longitudinal consent is required';
  end if;
  if coalesce(p_subject->>'consent_basis', 'participant_attestation')
     not in ('participant_attestation', 'written_authorization') then
    raise exception 'Invalid HDI consent basis';
  end if;

  insert into public.hdi_subjects (
    organization_id, opaque_external_ref, subject_type, display_label,
    baseline_policy, status
  ) values (
    p_organization_id,
    p_subject->>'opaque_external_ref',
    p_subject->>'subject_type',
    p_subject->>'display_label',
    'self_longitudinal',
    'active'
  ) returning id into v_subject_id;

  insert into public.hdi_consent_events (
    organization_id, subject_id, actor_id, event_type, scope,
    policy_version, evidence
  ) values (
    p_organization_id, v_subject_id, p_actor_id, 'verified',
    'longitudinal_tracking', 'hdi-longitudinal-v1',
    jsonb_build_object(
      'attestation', 'client_confirmation',
      'consent_basis', coalesce(
        nullif(p_subject->>'consent_basis', ''),
        'participant_attestation'
      )
    )
  );

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'subject.created', 'hdi_subject',
    v_subject_id::text,
    jsonb_build_object(
      'subject_type', p_subject->>'subject_type',
      'baseline_policy', 'self_longitudinal',
      'consent_policy_version', 'hdi-longitudinal-v1'
    )
  );

  return v_subject_id;
end;
$$;

create or replace function public.hdi_update_subject(
  p_organization_id uuid,
  p_actor_id uuid,
  p_subject_id uuid,
  p_changes jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI profile access denied';
  end if;

  if p_changes->>'status' = 'active' and not exists (
    select 1
    from public.hdi_consent_events c
    where c.organization_id = p_organization_id
      and c.subject_id = p_subject_id
      and c.scope = 'longitudinal_tracking'
      and c.event_type in ('granted', 'verified')
      and not exists (
        select 1
        from public.hdi_consent_events newer
        where newer.organization_id = c.organization_id
          and newer.subject_id = c.subject_id
          and newer.scope = c.scope
          and (newer.occurred_at, newer.id) > (c.occurred_at, c.id)
      )
  ) then
    raise exception 'HDI longitudinal consent is not active';
  end if;

  update public.hdi_subjects
  set display_label = case
        when p_changes ? 'display_label' then p_changes->>'display_label'
        else display_label
      end,
      status = case
        when p_changes ? 'status' then p_changes->>'status'
        else status
      end
  where id = p_subject_id
    and organization_id = p_organization_id;

  if not found then
    raise exception 'HDI subject not found';
  end if;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'subject.updated', 'hdi_subject',
    p_subject_id::text,
    jsonb_build_object(
      'display_label_changed', p_changes ? 'display_label',
      'status', p_changes->>'status'
    )
  );
end;
$$;

create or replace function public.hdi_withdraw_longitudinal_consent(
  p_organization_id uuid,
  p_actor_id uuid,
  p_subject_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_latest_event text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI profile access denied';
  end if;

  if not exists (
    select 1 from public.hdi_subjects
    where id = p_subject_id and organization_id = p_organization_id
  ) then
    raise exception 'HDI subject not found';
  end if;

  select event_type into v_latest_event
  from public.hdi_consent_events
  where organization_id = p_organization_id
    and subject_id = p_subject_id
    and scope = 'longitudinal_tracking'
  order by occurred_at desc, id desc
  limit 1;

  -- Withdrawal is idempotent while retaining the original append-only event.
  if v_latest_event <> 'withdrawn' or v_latest_event is null then
    insert into public.hdi_consent_events (
      organization_id, subject_id, actor_id, event_type, scope,
      policy_version, evidence
    ) values (
      p_organization_id, p_subject_id, p_actor_id, 'withdrawn',
      'longitudinal_tracking', 'hdi-longitudinal-v1',
      case
        when nullif(btrim(p_reason), '') is null then '{}'::jsonb
        else jsonb_build_object('reason', btrim(p_reason))
      end
    );

    insert into public.hdi_audit_events (
      organization_id, actor_id, event_type, resource_type, resource_id, detail
    ) values (
      p_organization_id, p_actor_id, 'subject.consent_withdrawn',
      'hdi_subject', p_subject_id::text,
      jsonb_build_object('scope', 'longitudinal_tracking')
    );
  end if;

  update public.hdi_subjects
  set status = 'archived'
  where id = p_subject_id and organization_id = p_organization_id;
end;
$$;

create or replace function public.hdi_link_session_subject(
  p_organization_id uuid,
  p_actor_id uuid,
  p_subject_id uuid,
  p_session_id uuid,
  p_participant_label text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_latest_event text;
  v_evidence_count integer := 0;
  v_commitment_count integer := 0;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI profile access denied';
  end if;

  if not exists (
    select 1 from public.hdi_subjects
    where id = p_subject_id
      and organization_id = p_organization_id
      and status = 'active'
  ) then
    raise exception 'HDI active subject not found';
  end if;

  select event_type into v_latest_event
  from public.hdi_consent_events
  where organization_id = p_organization_id
    and subject_id = p_subject_id
    and scope = 'longitudinal_tracking'
  order by occurred_at desc, id desc
  limit 1;

  if v_latest_event is distinct from 'granted'
     and v_latest_event is distinct from 'verified' then
    raise exception 'HDI longitudinal consent is not active';
  end if;

  if not exists (
    select 1 from public.hdi_sessions
    where id = p_session_id
      and organization_id = p_organization_id
      and consent_status = 'confirmed'
      and status in ('review_ready', 'archived')
  ) then
    raise exception 'HDI eligible session not found';
  end if;

  -- Provisional model output must never enter a longitudinal profile. Only a
  -- human-approved analysis can establish profile observations or commitments.
  if not exists (
    select 1 from public.hdi_analyses
    where session_id = p_session_id
      and organization_id = p_organization_id
      and status = 'review_ready'
      and human_review_status = 'approved'
  ) then
    raise exception 'HDI approved analysis is required before profile linking';
  end if;

  if not exists (
    select 1
    from public.hdi_sessions s
    where s.id = p_session_id
      and s.organization_id = p_organization_id
      and (
        s.participant_labels @> jsonb_build_array(btrim(p_participant_label))
        or exists (
          select 1
          from public.hdi_analyses a
          join public.hdi_evidence e
            on e.analysis_id = a.id and e.organization_id = a.organization_id
          where a.session_id = s.id
            and a.organization_id = s.organization_id
            and a.human_review_status = 'approved'
            and e.speaker_label = btrim(p_participant_label)
        )
        or exists (
          select 1
          from public.hdi_analyses a
          join public.hdi_commitments c
            on c.analysis_id = a.id and c.organization_id = a.organization_id
          where a.session_id = s.id
            and a.organization_id = s.organization_id
            and a.human_review_status = 'approved'
            and c.owner_label = btrim(p_participant_label)
        )
      )
  ) then
    raise exception 'HDI participant label not found in session';
  end if;

  insert into public.hdi_session_subjects (
    session_id, subject_id, organization_id, participant_label, role
  ) values (
    p_session_id, p_subject_id, p_organization_id,
    btrim(p_participant_label), nullif(btrim(p_role), '')
  );

  with linked_evidence as (
    update public.hdi_evidence e
    set subject_id = p_subject_id
    from public.hdi_analyses a
    where a.id = e.analysis_id
      and a.organization_id = e.organization_id
      and a.session_id = p_session_id
      and a.human_review_status = 'approved'
      and e.organization_id = p_organization_id
      and e.subject_id is null
      and e.speaker_label = btrim(p_participant_label)
    returning e.id, e.analysis_id, e.criterion_key, e.evidence_level
  ), inserted_observations as (
    insert into public.hdi_profile_observations (
      organization_id, subject_id, analysis_id, evidence_id, metric_key,
      evidence_level, baseline_policy, observed_at
    )
    select
      p_organization_id, p_subject_id, le.analysis_id, le.id,
      le.criterion_key, le.evidence_level, 'self_longitudinal', s.occurred_at
    from linked_evidence le
    join public.hdi_analyses a
      on a.id = le.analysis_id and a.organization_id = p_organization_id
    join public.hdi_sessions s
      on s.id = a.session_id and s.organization_id = p_organization_id
    returning id
  )
  select count(*)::integer into v_evidence_count from inserted_observations;

  with linked_commitments as (
    update public.hdi_commitments c
    set subject_id = p_subject_id
    from public.hdi_analyses a
    where a.id = c.analysis_id
      and a.organization_id = c.organization_id
      and a.session_id = p_session_id
      and a.human_review_status = 'approved'
      and c.organization_id = p_organization_id
      and c.subject_id is null
      and c.owner_label = btrim(p_participant_label)
    returning c.id
  )
  select count(*)::integer into v_commitment_count from linked_commitments;

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'subject.session_linked', 'hdi_subject',
    p_subject_id::text,
    jsonb_build_object(
      'session_id', p_session_id,
      'participant_label', btrim(p_participant_label),
      'linked_evidence_count', v_evidence_count,
      'linked_commitment_count', v_commitment_count
    )
  );

  return jsonb_build_object(
    'linked_evidence_count', v_evidence_count,
    'linked_commitment_count', v_commitment_count
  );
exception
  when unique_violation then
    raise exception 'HDI subject is already linked to this session';
end;
$$;

create or replace function public.hdi_update_commitment_status(
  p_organization_id uuid,
  p_actor_id uuid,
  p_commitment_id uuid,
  p_status text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_type text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and organization_id = p_organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'HDI commitment access denied';
  end if;

  if p_status not in ('open', 'completed', 'changed', 'cancelled', 'unverified') then
    raise exception 'Invalid HDI commitment status';
  end if;

  if p_status in ('changed', 'cancelled', 'unverified')
     and nullif(btrim(p_note), '') is null then
    raise exception 'A note is required for this commitment status';
  end if;

  v_event_type := case p_status
    when 'completed' then 'completed'
    when 'changed' then 'changed'
    when 'cancelled' then 'cancelled'
    when 'unverified' then 'evidence_added'
    else 'confirmed'
  end;

  update public.hdi_commitments
  set status = p_status
  where id = p_commitment_id
    and organization_id = p_organization_id;

  if not found then
    raise exception 'HDI commitment not found';
  end if;

  insert into public.hdi_commitment_events (
    organization_id, commitment_id, actor_id, event_type, evidence
  ) values (
    p_organization_id, p_commitment_id, p_actor_id, v_event_type,
    case
      when nullif(btrim(p_note), '') is null then '{}'::jsonb
      else jsonb_build_object('note', btrim(p_note))
    end
  );

  insert into public.hdi_audit_events (
    organization_id, actor_id, event_type, resource_type, resource_id, detail
  ) values (
    p_organization_id, p_actor_id, 'commitment.status_updated',
    'hdi_commitment', p_commitment_id::text,
    jsonb_build_object('status', p_status)
  );
end;
$$;

revoke all on function public.hdi_create_subject(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_update_subject(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.hdi_withdraw_longitudinal_consent(uuid, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.hdi_link_session_subject(uuid, uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.hdi_update_commitment_status(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.hdi_create_subject(uuid, uuid, jsonb)
  to service_role;
grant execute on function public.hdi_update_subject(uuid, uuid, uuid, jsonb)
  to service_role;
grant execute on function public.hdi_withdraw_longitudinal_consent(uuid, uuid, uuid, text)
  to service_role;
grant execute on function public.hdi_link_session_subject(uuid, uuid, uuid, uuid, text, text)
  to service_role;
grant execute on function public.hdi_update_commitment_status(uuid, uuid, uuid, text, text)
  to service_role;

comment on function public.hdi_link_session_subject(uuid, uuid, uuid, uuid, text, text) is
  'Links a consented subject to one session and derives same-subject longitudinal observations from exact speaker-label matches.';

commit;
