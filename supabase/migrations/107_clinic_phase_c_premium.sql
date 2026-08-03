-- Phase C: custom screening cap enforcement, hiring insights RPC, bulk fill-in outreach.

-- ---------------------------------------------------------------------------
-- 1. Custom screening question cap (Starter / Group Starter = 5)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_screening_questions_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_plan text;
  v_limit int;
  v_custom_count int;
begin
  select jp.clinic_id into v_clinic_id
  from public.job_posts jp
  where jp.id = new.job_post_id;

  if v_clinic_id is null then
    raise exception 'Job post not found for screening questions';
  end if;

  perform public.assert_clinic_can_use_feature(v_clinic_id, 'screening_questions');

  if new.custom_prompt is not null and trim(new.custom_prompt) <> '' then
    v_plan := public.get_clinic_plan(v_clinic_id);
    v_limit := public.clinic_custom_screening_limit(v_plan);

    select count(*) into v_custom_count
    from public.job_post_screening_questions q
    where q.job_post_id = new.job_post_id
      and q.custom_prompt is not null
      and trim(q.custom_prompt) <> '';

    if v_custom_count >= v_limit then
      raise exception 'Custom screening question limit reached. Upgrade to Pro for unlimited custom questions.';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Hiring insights snapshot helper
-- ---------------------------------------------------------------------------

create or replace function public.compute_clinic_hiring_insights_snapshot(
  p_clinic_id uuid,
  p_location_ids uuid[] default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_open_roles int := 0;
  v_live_fill_ins int := 0;
  v_total_applicants int := 0;
  v_new_applicants int := 0;
  v_outreach_threads int := 0;
  v_confirmed_fill_ins int := 0;
  v_avg_days numeric;
  v_pipeline jsonb := '{}'::jsonb;
  v_has_scope boolean := p_location_ids is not null and coalesce(array_length(p_location_ids, 1), 0) > 0;
begin
  select count(*) into v_open_roles
  from public.job_posts jp
  where jp.clinic_id = p_clinic_id
    and jp.status = 'live'
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  select count(*) into v_live_fill_ins
  from public.shift_posts sp
  where sp.clinic_id = p_clinic_id
    and sp.status = 'live'
    and sp.shift_date >= v_today
    and (not v_has_scope or sp.location_id = any(p_location_ids));

  select count(*) into v_total_applicants
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where jp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  select count(*) into v_new_applicants
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where jp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and a.status in ('applied', 'screening_submitted')
    and (
      a.clinic_last_seen_at is null
      or (
        a.clinic_attention_at is not null
        and a.clinic_attention_at > a.clinic_last_seen_at
      )
    )
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb) into v_pipeline
  from (
    select a.status, count(*)::int as cnt
    from public.applications a
    join public.job_posts jp on jp.id = a.job_post_id
    where jp.clinic_id = p_clinic_id
      and a.clinic_hidden_at is null
      and (not v_has_scope or jp.location_id = any(p_location_ids))
    group by a.status
  ) status_counts;

  select count(*) into v_outreach_threads
  from public.conversations c
  where c.clinic_id = p_clinic_id
    and c.conversation_type = 'outreach';

  select count(*) into v_confirmed_fill_ins
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where sp.clinic_id = p_clinic_id
    and a.status = 'hired'
    and a.clinic_hidden_at is null
    and (not v_has_scope or sp.location_id = any(p_location_ids));

  select round(avg(extract(epoch from (first_app - jp.created_at)) / 86400.0)::numeric, 1)
  into v_avg_days
  from public.job_posts jp
  join lateral (
    select min(a.created_at) as first_app
    from public.applications a
    where a.job_post_id = jp.id
      and a.clinic_hidden_at is null
  ) fa on fa.first_app is not null
  where jp.clinic_id = p_clinic_id
    and jp.status = 'live'
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  return jsonb_build_object(
    'open_roles', v_open_roles,
    'live_fill_ins', v_live_fill_ins,
    'total_applicants', v_total_applicants,
    'new_applicants', v_new_applicants,
    'pipeline', v_pipeline,
    'outreach_threads', v_outreach_threads,
    'confirmed_fill_ins', v_confirmed_fill_ins,
    'avg_days_to_first_applicant', v_avg_days
  );
end;
$$;

create or replace function public.get_clinic_hiring_insights(
  p_clinic_id uuid default auth.uid(),
  p_location_ids uuid[] default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_result jsonb;
  v_by_location jsonb := '[]'::jsonb;
begin
  if p_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.clinic_can_use_feature(p_clinic_id, 'hiring_insights') then
    raise exception 'Hiring insights require a Pro plan.';
  end if;

  v_plan := public.get_clinic_plan(p_clinic_id);
  v_result := public.compute_clinic_hiring_insights_snapshot(p_clinic_id, p_location_ids);

  if v_plan = 'group_pro' then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'location_id', cl.id,
          'location_name', cl.name,
          'metrics', public.compute_clinic_hiring_insights_snapshot(p_clinic_id, array[cl.id])
        )
        order by cl.name
      ),
      '[]'::jsonb
    )
    into v_by_location
    from public.clinic_locations cl
    where cl.clinic_id = p_clinic_id
      and cl.status = 'active'
      and (
        p_location_ids is null
        or coalesce(array_length(p_location_ids, 1), 0) = 0
        or cl.id = any(p_location_ids)
      );
  end if;

  return v_result || jsonb_build_object('by_location', v_by_location);
end;
$$;

revoke all on function public.compute_clinic_hiring_insights_snapshot(uuid, uuid[]) from public;
grant execute on function public.compute_clinic_hiring_insights_snapshot(uuid, uuid[]) to authenticated;

revoke all on function public.get_clinic_hiring_insights(uuid, uuid[]) from public;
grant execute on function public.get_clinic_hiring_insights(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Bulk fill-in outreach (Pro / Group Pro)
-- ---------------------------------------------------------------------------

create or replace function public.start_clinic_fill_in_outreach_bulk(
  p_worker_ids uuid[],
  p_message text,
  p_role_type text default null,
  p_shift_date date default null,
  p_start_time time default null,
  p_end_time time default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid := auth.uid();
  v_worker_id uuid;
  v_conversation_id uuid;
  v_successes jsonb := '[]'::jsonb;
  v_failures jsonb := '[]'::jsonb;
  v_count int;
begin
  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.clinic_can_use_feature(v_clinic_id, 'bulk_outreach') then
    raise exception 'Bulk fill-in outreach requires a Pro plan.';
  end if;

  v_count := coalesce(array_length(p_worker_ids, 1), 0);
  if v_count = 0 then
    raise exception 'Select at least one worker';
  end if;

  if v_count > 25 then
    raise exception 'You can message up to 25 workers at once';
  end if;

  foreach v_worker_id in array p_worker_ids loop
    begin
      v_conversation_id := public.start_clinic_fill_in_outreach(
        v_worker_id,
        p_message,
        p_role_type,
        p_shift_date,
        p_start_time,
        p_end_time,
        false
      );
      v_successes := v_successes || jsonb_build_array(
        jsonb_build_object(
          'worker_id', v_worker_id,
          'conversation_id', v_conversation_id
        )
      );
    exception
      when others then
        v_failures := v_failures || jsonb_build_array(
          jsonb_build_object(
            'worker_id', v_worker_id,
            'error', sqlerrm
          )
        );
    end;
  end loop;

  return jsonb_build_object(
    'successes', v_successes,
    'failures', v_failures
  );
end;
$$;

revoke all on function public.start_clinic_fill_in_outreach_bulk(uuid[], text, text, date, time, time) from public;
grant execute on function public.start_clinic_fill_in_outreach_bulk(uuid[], text, text, date, time, time) to authenticated;
