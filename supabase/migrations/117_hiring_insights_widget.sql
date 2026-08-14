-- Hiring insights widget: richer snapshot metrics for the Pro dashboard.

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
  v_interviews_open int := 0;
  v_hired_count int := 0;
  v_pending_fill_in_requests int := 0;
  v_new_applicants_7d int := 0;
  v_avg_days numeric;
  v_avg_days_to_hire numeric;
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

  select count(*) into v_interviews_open
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where jp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and a.status in ('interview_offered', 'interview_scheduled')
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  select count(*) into v_hired_count
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where jp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and a.status = 'hired'
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  select count(*) into v_pending_fill_in_requests
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where sp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and a.status = 'applied'
    and (not v_has_scope or sp.location_id = any(p_location_ids));

  select count(*) into v_new_applicants_7d
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where jp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and a.created_at >= (now() - interval '7 days')
    and (not v_has_scope or jp.location_id = any(p_location_ids));

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

  select round(avg(extract(epoch from (a.updated_at - a.created_at)) / 86400.0)::numeric, 1)
  into v_avg_days_to_hire
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where jp.clinic_id = p_clinic_id
    and a.clinic_hidden_at is null
    and a.status = 'hired'
    and (not v_has_scope or jp.location_id = any(p_location_ids));

  return jsonb_build_object(
    'open_roles', v_open_roles,
    'live_fill_ins', v_live_fill_ins,
    'total_applicants', v_total_applicants,
    'new_applicants', v_new_applicants,
    'pipeline', v_pipeline,
    'outreach_threads', v_outreach_threads,
    'confirmed_fill_ins', v_confirmed_fill_ins,
    'avg_days_to_first_applicant', v_avg_days,
    'interviews_open', v_interviews_open,
    'hired_count', v_hired_count,
    'avg_days_to_hire', v_avg_days_to_hire,
    'pending_fill_in_requests', v_pending_fill_in_requests,
    'new_applicants_7d', v_new_applicants_7d
  );
end;
$$;

revoke all on function public.compute_clinic_hiring_insights_snapshot(uuid, uuid[]) from public;
grant execute on function public.compute_clinic_hiring_insights_snapshot(uuid, uuid[]) to authenticated;
