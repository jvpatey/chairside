-- Managers can accept/decline worker interview counters (was clinic_id = auth.uid()).

create or replace function public.clinic_can_manage_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.job_posts j on j.id = a.job_post_id
    where a.id = p_application_id
      and (
        j.clinic_id = auth.uid()
        or public.is_clinic_org_member(coalesce(j.organization_id, j.clinic_id))
      )
    union all
    select 1
    from public.applications a
    join public.shift_posts s on s.id = a.shift_post_id
    where a.id = p_application_id
      and (
        s.clinic_id = auth.uid()
        or public.is_clinic_org_member(coalesce(s.organization_id, s.clinic_id))
      )
  );
$$;

revoke all on function public.clinic_can_manage_application(uuid) from public;
grant execute on function public.clinic_can_manage_application(uuid) to authenticated;

create or replace function public.accept_application_interview_update(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_proposed_by text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select interview_proposed_by, status
  into v_proposed_by, v_status
  from public.applications
  where id = application_id
    and status in ('interview_offered', 'interview_scheduled')
    and interview_proposed_at is not null;

  if v_proposed_by is null then
    raise exception 'No pending interview change';
  end if;

  if v_proposed_by = 'clinic' and not exists (
    select 1 from public.applications a
    where a.id = application_id and a.worker_id = auth.uid()
  ) then
    raise exception 'Not authorized to accept this change';
  end if;

  if v_proposed_by = 'worker' and not public.clinic_can_manage_application(application_id) then
    raise exception 'Not authorized to accept this change';
  end if;

  -- Pending invite + worker counter: confirm at the suggested time.
  if v_status = 'interview_offered' then
    if v_proposed_by <> 'worker' then
      raise exception 'No pending interview change';
    end if;

    update public.applications
    set
      status = 'interview_scheduled',
      interview_at = interview_proposed_at,
      interview_duration_minutes = interview_proposed_duration_minutes,
      interview_details = interview_proposed_details,
      interview_proposed_at = null,
      interview_proposed_duration_minutes = null,
      interview_proposed_details = null,
      interview_proposed_by = null,
      updated_at = now()
    where id = application_id
      and status = 'interview_offered'
      and interview_proposed_at is not null
      and interview_proposed_by = 'worker'
    returning * into v_row;
  else
    update public.applications
    set
      interview_at = interview_proposed_at,
      interview_duration_minutes = interview_proposed_duration_minutes,
      interview_details = interview_proposed_details,
      interview_proposed_at = null,
      interview_proposed_duration_minutes = null,
      interview_proposed_details = null,
      interview_proposed_by = null,
      updated_at = now()
    where id = application_id
      and status = 'interview_scheduled'
      and interview_proposed_at is not null
    returning * into v_row;
  end if;

  if not found then
    raise exception 'No pending interview change';
  end if;

  return v_row;
end;
$$;

create or replace function public.decline_application_interview_update(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_proposed_by text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select interview_proposed_by into v_proposed_by
  from public.applications
  where id = application_id
    and status in ('interview_offered', 'interview_scheduled')
    and interview_proposed_at is not null;

  if v_proposed_by is null then
    raise exception 'No pending interview change';
  end if;

  if v_proposed_by = 'clinic' and not exists (
    select 1 from public.applications a
    where a.id = application_id and a.worker_id = auth.uid()
  ) then
    raise exception 'Not authorized to decline this change';
  end if;

  if v_proposed_by = 'worker' and not public.clinic_can_manage_application(application_id) then
    raise exception 'Not authorized to decline this change';
  end if;

  -- Clears the counter/reschedule proposal; original invite or confirmed time stays.
  update public.applications
  set
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = now()
  where id = application_id
    and status in ('interview_offered', 'interview_scheduled')
    and interview_proposed_at is not null
  returning * into v_row;

  if not found then
    raise exception 'No pending interview change';
  end if;

  return v_row;
end;
$$;

revoke all on function public.accept_application_interview_update(uuid) from public;
revoke all on function public.decline_application_interview_update(uuid) from public;
grant execute on function public.accept_application_interview_update(uuid) to authenticated;
grant execute on function public.decline_application_interview_update(uuid) to authenticated;
